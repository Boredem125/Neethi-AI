"""
NEETHI AI — Evaluation Service
Orchestrates the full evaluation pipeline:
tender parsing → document analysis → criterion matching → verdict generation.
"""
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import (
    Tender, Criterion, Bidder, BidDocument, Verdict, AuditLog,
    TenderStatus, VerdictStatus, BidderStatus, CriterionCategory,
)
from app.services.groq_service import groq_service
from app.services.document_parser import document_parser

logger = logging.getLogger(__name__)


class EvaluationService:
    """Core evaluation engine — the heart of NEETHI AI."""

    async def process_tender(self, tender_id: int, db: Session) -> Dict[str, Any]:
        """Extract criteria from a tender document using Groq LLM."""
        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        if not tender:
            return {"error": "Tender not found"}

        # Extract text if not already done
        if not tender.raw_text and tender.file_path:
            result = await document_parser.parse(tender.file_path)
            tender.raw_text = result["text"]

        if not tender.raw_text:
            return {"error": "No text content in tender document"}

        # Extract criteria via Groq
        criteria_data = await groq_service.extract_criteria(tender.raw_text)

        # Clear existing criteria and verdicts if any
        db.query(Criterion).filter(Criterion.tender_id == tender_id).delete()
        db.commit()

        # Save criteria to database
        category_map = {
            "technical": CriterionCategory.TECHNICAL,
            "financial": CriterionCategory.FINANCIAL,
            "compliance": CriterionCategory.COMPLIANCE,
            "certification": CriterionCategory.CERTIFICATION,
            "experience": CriterionCategory.EXPERIENCE,
        }

        created = 0
        for c in criteria_data:
            cat_str = c.get("category", "technical").lower()
            criterion = Criterion(
                tender_id=tender.id,
                name=c.get("name", "Unnamed Criterion"),
                description=c.get("description", ""),
                category=category_map.get(cat_str, CriterionCategory.TECHNICAL),
                is_mandatory=c.get("is_mandatory", True),
                threshold_value=str(c.get("threshold_value", "")),
                threshold_unit=c.get("threshold_unit", ""),
                threshold_operator=c.get("threshold_operator", ">="),
                extracted_from=c.get("extracted_from", ""),
            )
            db.add(criterion)
            created += 1

        tender.status = TenderStatus.CRITERIA_EXTRACTED
        tender.criteria_json = criteria_data

        # Audit log
        db.add(AuditLog(
            tender_id=tender.id, action="criteria_extracted",
            entity_type="tender", entity_id=tender.id,
            details={"criteria_count": created}, performed_by="system",
        ))

        db.commit()
        return {"criteria_extracted": created, "tender_id": tender.id}

    async def process_bidder_documents(self, bidder_id: int, db: Session) -> Dict[str, Any]:
        """Process all documents for a bidder — OCR + text extraction + LLM analysis."""
        bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
        if not bidder:
            return {"error": "Bidder not found"}

        documents = db.query(BidDocument).filter(BidDocument.bidder_id == bidder_id).all()
        processed = 0

        for doc in documents:
            if doc.processing_status == "completed":
                continue

            doc.processing_status = "processing"
            db.commit()

            # Parse the document
            result = await document_parser.parse(doc.file_path)
            doc.ocr_text = result["text"]
            doc.ocr_confidence = result["confidence"]
            doc.language_detected = result["language"]

            # Analyze with Groq for structured extraction
            if result["text"]:
                extracted = await groq_service.analyze_document(result["text"])
                doc.extracted_data = extracted
            else:
                doc.extracted_data = []

            doc.processing_status = "completed"
            processed += 1

        bidder.status = BidderStatus.UNDER_EVALUATION

        db.add(AuditLog(
            tender_id=bidder.tender_id, action="documents_processed",
            entity_type="bidder", entity_id=bidder.id,
            details={"documents_processed": processed}, performed_by="system",
        ))
        db.commit()
        return {"documents_processed": processed, "bidder_id": bidder.id}

    async def evaluate_bidder(self, bidder_id: int, db: Session) -> Dict[str, Any]:
        """Evaluate a bidder against all criteria for their tender."""
        bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
        if not bidder:
            return {"error": "Bidder not found"}

        criteria = db.query(Criterion).filter(Criterion.tender_id == bidder.tender_id).all()
        documents = db.query(BidDocument).filter(BidDocument.bidder_id == bidder_id).all()

        # Clear existing verdicts for this bidder
        db.query(Verdict).filter(Verdict.bidder_id == bidder_id).delete()
        db.commit()

        # Aggregate all extracted data and text
        all_extracted = []
        all_text = ""
        best_doc_map = {}

        for doc in documents:
            if doc.extracted_data:
                all_extracted.extend(doc.extracted_data if isinstance(doc.extracted_data, list) else [])
            all_text += f"\n--- {doc.filename} ---\n{doc.ocr_text or ''}"
            best_doc_map[doc.id] = doc

        verdicts_created = 0
        eligible = 0
        not_eligible = 0
        manual_review = 0

        for criterion in criteria:
            crit_dict = {
                "name": criterion.name,
                "description": criterion.description,
                "category": criterion.category.value if hasattr(criterion.category, 'value') else criterion.category,
                "is_mandatory": criterion.is_mandatory,
                "threshold_value": criterion.threshold_value,
                "threshold_unit": criterion.threshold_unit,
                "threshold_operator": criterion.threshold_operator,
            }

            # Evaluate via Groq
            result = await groq_service.evaluate_criterion(crit_dict, all_extracted, all_text)

            status_map = {
                "eligible": VerdictStatus.ELIGIBLE,
                "not_eligible": VerdictStatus.NOT_ELIGIBLE,
                "manual_review": VerdictStatus.MANUAL_REVIEW,
            }

            verdict = Verdict(
                bidder_id=bidder.id,
                criterion_id=criterion.id,
                evidence_document_id=documents[0].id if documents else None,
                status=status_map.get(result["status"], VerdictStatus.MANUAL_REVIEW),
                extracted_value=result.get("extracted_value", ""),
                reasoning=result.get("reasoning", ""),
                confidence_score=result.get("confidence_score", 0.0),
            )
            db.add(verdict)
            verdicts_created += 1

            if result["status"] == "eligible":
                eligible += 1
            elif result["status"] == "not_eligible":
                not_eligible += 1
            else:
                manual_review += 1

        # Determine overall bidder status
        if not_eligible > 0:
            bidder.status = BidderStatus.NOT_ELIGIBLE
        elif manual_review > 0:
            bidder.status = BidderStatus.MANUAL_REVIEW
        else:
            bidder.status = BidderStatus.ELIGIBLE

        # Score = % of eligible verdicts
        bidder.overall_score = round((eligible / len(criteria) * 100) if criteria else 0, 1)

        db.add(AuditLog(
            tender_id=bidder.tender_id, action="bidder_evaluated",
            entity_type="bidder", entity_id=bidder.id,
            details={
                "verdicts": verdicts_created, "eligible": eligible,
                "not_eligible": not_eligible, "manual_review": manual_review,
                "overall_score": bidder.overall_score,
            },
            performed_by="system",
        ))
        db.commit()

        return {
            "bidder_id": bidder.id, "verdicts_created": verdicts_created,
            "eligible": eligible, "not_eligible": not_eligible,
            "manual_review": manual_review, "overall_score": bidder.overall_score,
        }

    async def evaluate_tender(self, tender_id: int, db: Session) -> Dict[str, Any]:
        """Evaluate ALL bidders for a tender."""
        tender = db.query(Tender).filter(Tender.id == tender_id).first()
        if not tender:
            return {"error": "Tender not found"}

        tender.status = TenderStatus.EVALUATING
        db.commit()

        bidders = db.query(Bidder).filter(Bidder.tender_id == tender_id).all()
        results = []

        for bidder in bidders:
            # Process documents first
            await self.process_bidder_documents(bidder.id, db)
            # Then evaluate
            result = await self.evaluate_bidder(bidder.id, db)
            results.append(result)

        tender.status = TenderStatus.EVALUATED
        db.add(AuditLog(
            tender_id=tender.id, action="tender_evaluated",
            entity_type="tender", entity_id=tender.id,
            details={"bidders_evaluated": len(results)}, performed_by="system",
        ))
        db.commit()

        return {"tender_id": tender_id, "bidders_evaluated": len(results), "results": results}


evaluation_service = EvaluationService()
