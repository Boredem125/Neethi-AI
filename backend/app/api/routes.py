"""
NEETHI AI — API Routes
All REST endpoints for tenders, bidders, evaluation, review, audit, and dashboard.
"""
import os
import shutil
import logging
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.core.config import settings
from app.models.models import (
    Tender, Criterion, Bidder, BidDocument, Verdict, AuditLog,
    TenderStatus, VerdictStatus, BidderStatus,
)
from app.schemas.schemas import (
    TenderCreate, TenderOut, TenderDetailOut, CriterionOut,
    BidderCreate, BidderOut, BidderDetailOut, BidDocumentOut,
    VerdictOut, VerdictReview, AuditLogOut, DashboardStats,
)
from app.services.evaluation_service import evaluation_service
from app.services.document_parser import document_parser
from app.services.groq_service import groq_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Health & Status ────────────────────────────────────────────────────

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "NEETHI AI — ನೀತಿ",
        "version": settings.APP_VERSION,
        "groq_configured": groq_service.is_available(),
    }


# ── Dashboard ──────────────────────────────────────────────────────────

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_tenders = db.query(func.count(Tender.id)).scalar() or 0
    active = db.query(func.count(Tender.id)).filter(
        Tender.status.in_([TenderStatus.CRITERIA_EXTRACTED, TenderStatus.ACCEPTING_BIDS, TenderStatus.EVALUATING])
    ).scalar() or 0
    total_bidders = db.query(func.count(Bidder.id)).scalar() or 0
    total_verdicts = db.query(func.count(Verdict.id)).scalar() or 0

    eligible = db.query(func.count(Verdict.id)).filter(Verdict.status == VerdictStatus.ELIGIBLE).scalar() or 0
    not_eligible = db.query(func.count(Verdict.id)).filter(Verdict.status == VerdictStatus.NOT_ELIGIBLE).scalar() or 0
    manual_review = db.query(func.count(Verdict.id)).filter(Verdict.status == VerdictStatus.MANUAL_REVIEW).scalar() or 0
    reviewed = db.query(func.count(Verdict.id)).filter(
        Verdict.status.in_([VerdictStatus.REVIEWED_ELIGIBLE, VerdictStatus.REVIEWED_NOT_ELIGIBLE])
    ).scalar() or 0

    avg_conf = db.query(func.avg(Verdict.confidence_score)).scalar() or 0.0
    total_docs = db.query(func.count(BidDocument.id)).scalar() or 0

    # Tenders by department
    dept_rows = db.query(Tender.department, func.count(Tender.id)).group_by(Tender.department).all()
    by_dept = {row[0]: row[1] for row in dept_rows}

    # Tenders by status
    status_rows = db.query(Tender.status, func.count(Tender.id)).group_by(Tender.status).all()
    by_status = {row[0].value if hasattr(row[0], 'value') else str(row[0]): row[1] for row in status_rows}

    # Recent activity
    recent = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(10).all()

    return DashboardStats(
        total_tenders=total_tenders, active_tenders=active,
        total_bidders=total_bidders, total_verdicts=total_verdicts,
        eligible_count=eligible, not_eligible_count=not_eligible,
        manual_review_count=manual_review, reviewed_count=reviewed,
        avg_confidence=round(avg_conf, 2), total_documents_processed=total_docs,
        tenders_by_department=by_dept, tenders_by_status=by_status,
        recent_activity=[AuditLogOut.model_validate(a) for a in recent],
    )


# ── Tenders ────────────────────────────────────────────────────────────

@router.get("/tenders", response_model=List[TenderOut])
async def list_tenders(
    status: str = Query(None),
    department: str = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Tender)
    if status:
        query = query.filter(Tender.status == status)
    if department:
        query = query.filter(Tender.department.ilike(f"%{department}%"))
    tenders = query.order_by(desc(Tender.created_at)).all()

    result = []
    for t in tenders:
        out = TenderOut.model_validate(t)
        out.criteria_count = db.query(func.count(Criterion.id)).filter(Criterion.tender_id == t.id).scalar() or 0
        out.bidder_count = db.query(func.count(Bidder.id)).filter(Bidder.tender_id == t.id).scalar() or 0
        result.append(out)
    return result


@router.get("/tenders/{tender_id}", response_model=TenderDetailOut)
async def get_tender(tender_id: int, db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    out = TenderDetailOut.model_validate(tender)
    out.criteria_count = len(tender.criteria)
    out.bidder_count = len(tender.bidders)
    return out


@router.post("/tenders", response_model=TenderOut)
async def create_tender(tender: TenderCreate, db: Session = Depends(get_db)):
    existing = db.query(Tender).filter(Tender.reference_number == tender.reference_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tender with this reference number already exists")
    
    new_tender = Tender(**tender.model_dump())
    db.add(new_tender)
    db.add(AuditLog(
        action="tender_created", entity_type="tender",
        details={"title": tender.title, "reference": tender.reference_number},
        performed_by="officer",
    ))
    db.commit()
    db.refresh(new_tender)
    return TenderOut.model_validate(new_tender)


@router.post("/tenders/{tender_id}/upload")
async def upload_tender_document(
    tender_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    # Save file
    upload_dir = os.path.join(settings.UPLOAD_DIR, f"tender_{tender_id}")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    tender.file_path = file_path
    tender.original_filename = file.filename

    # Parse the document
    result = await document_parser.parse(file_path)
    tender.raw_text = result["text"]

    db.add(AuditLog(
        tender_id=tender_id, action="tender_document_uploaded",
        entity_type="tender", entity_id=tender_id,
        details={"filename": file.filename, "text_length": len(result["text"]), "method": result["method"]},
        performed_by="officer",
    ))
    db.commit()

    return {
        "message": "Document uploaded and parsed",
        "filename": file.filename,
        "text_length": len(result["text"]),
        "parsing_method": result["method"],
        "language": result.get("language", "unknown"),
    }


@router.post("/tenders/{tender_id}/extract-criteria")
async def extract_criteria(tender_id: int, db: Session = Depends(get_db)):
    if not groq_service.is_available():
        raise HTTPException(status_code=503, detail="Groq API not configured. Set GROQ_API_KEY in .env")
    result = await evaluation_service.process_tender(tender_id, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/tenders/{tender_id}/evaluate")
async def evaluate_tender(tender_id: int, db: Session = Depends(get_db)):
    if not groq_service.is_available():
        raise HTTPException(status_code=503, detail="Groq API not configured. Set GROQ_API_KEY in .env")
    result = await evaluation_service.evaluate_tender(tender_id, db)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ── Bidders ────────────────────────────────────────────────────────────

@router.get("/tenders/{tender_id}/bidders", response_model=List[BidderOut])
async def list_bidders(tender_id: int, db: Session = Depends(get_db)):
    bidders = db.query(Bidder).filter(Bidder.tender_id == tender_id).order_by(desc(Bidder.created_at)).all()
    result = []
    for b in bidders:
        out = BidderOut.model_validate(b)
        out.document_count = db.query(func.count(BidDocument.id)).filter(BidDocument.bidder_id == b.id).scalar() or 0
        result.append(out)
    return result


@router.get("/bidders/{bidder_id}", response_model=BidderDetailOut)
async def get_bidder(bidder_id: int, db: Session = Depends(get_db)):
    bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")
    out = BidderDetailOut.model_validate(bidder)
    out.document_count = len(bidder.documents)
    return out


@router.post("/tenders/{tender_id}/bidders", response_model=BidderOut)
async def create_bidder(tender_id: int, bidder: BidderCreate, db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    from app.models.models import BidderCategory
    cat_map = {"general": BidderCategory.GENERAL, "sc": BidderCategory.SC, "st": BidderCategory.ST,
               "2a": BidderCategory.CAT_2A, "2b": BidderCategory.CAT_2B,
               "3a": BidderCategory.CAT_3A, "3b": BidderCategory.CAT_3B}

    new_bidder = Bidder(
        tender_id=tender_id, company_name=bidder.company_name,
        contact_person=bidder.contact_person, email=bidder.email,
        phone=bidder.phone, category=cat_map.get(bidder.category.lower(), BidderCategory.GENERAL),
    )
    db.add(new_bidder)
    db.add(AuditLog(
        tender_id=tender_id, action="bidder_added",
        entity_type="bidder", details={"company": bidder.company_name},
        performed_by="officer",
    ))
    db.commit()
    db.refresh(new_bidder)
    return BidderOut.model_validate(new_bidder)


@router.post("/bidders/{bidder_id}/documents")
async def upload_bidder_document(
    bidder_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")

    upload_dir = os.path.join(settings.UPLOAD_DIR, f"bidder_{bidder_id}")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    ext = os.path.splitext(file.filename)[1].lower().replace(".", "")
    doc = BidDocument(
        bidder_id=bidder_id, filename=file.filename,
        file_path=file_path, file_type=ext,
        file_size=os.path.getsize(file_path),
    )
    db.add(doc)
    db.add(AuditLog(
        tender_id=bidder.tender_id, action="document_uploaded",
        entity_type="document", details={"filename": file.filename, "bidder": bidder.company_name},
        performed_by="officer",
    ))
    db.commit()
    db.refresh(doc)
    return {"message": "Document uploaded", "document_id": doc.id, "filename": file.filename}


@router.post("/bidders/{bidder_id}/award", response_model=BidderOut)
async def award_bidder(bidder_id: int, db: Session = Depends(get_db)):
    bidder = db.query(Bidder).filter(Bidder.id == bidder_id).first()
    if not bidder:
        raise HTTPException(status_code=404, detail="Bidder not found")
    
    # Check if tender is already closed
    tender = db.query(Tender).filter(Tender.id == bidder.tender_id).first()
    
    # Mark as awarded
    bidder.is_awarded = True
    tender.status = TenderStatus.CLOSED
    
    db.add(AuditLog(
        tender_id=tender.id, action="tender_awarded",
        entity_type="bidder", entity_id=bidder.id,
        details={"awarded_to": bidder.company_name},
        performed_by="officer",
    ))
    db.commit()
    db.refresh(bidder)
    return BidderOut.model_validate(bidder)


# ── Verdicts ───────────────────────────────────────────────────────────

@router.get("/tenders/{tender_id}/verdicts", response_model=List[VerdictOut])
async def get_tender_verdicts(tender_id: int, db: Session = Depends(get_db)):
    bidder_ids = [b.id for b in db.query(Bidder).filter(Bidder.tender_id == tender_id).all()]
    if not bidder_ids:
        return []
    verdicts = db.query(Verdict).filter(Verdict.bidder_id.in_(bidder_ids)).order_by(Verdict.created_at).all()
    result = []
    for v in verdicts:
        out = VerdictOut.model_validate(v)
        if v.criterion:
            out.criterion_name = v.criterion.name
            out.criterion_category = v.criterion.category.value if hasattr(v.criterion.category, 'value') else str(v.criterion.category)
            out.criterion_is_mandatory = v.criterion.is_mandatory
        if v.bidder:
            out.bidder_name = v.bidder.company_name
        if v.evidence_document:
            out.document_filename = v.evidence_document.filename
        result.append(out)
    return result


@router.get("/bidders/{bidder_id}/verdicts", response_model=List[VerdictOut])
async def get_bidder_verdicts(bidder_id: int, db: Session = Depends(get_db)):
    verdicts = db.query(Verdict).filter(Verdict.bidder_id == bidder_id).order_by(Verdict.created_at).all()
    result = []
    for v in verdicts:
        out = VerdictOut.model_validate(v)
        if v.criterion:
            out.criterion_name = v.criterion.name
            out.criterion_category = v.criterion.category.value if hasattr(v.criterion.category, 'value') else str(v.criterion.category)
            out.criterion_is_mandatory = v.criterion.is_mandatory
        if v.bidder:
            out.bidder_name = v.bidder.company_name
        if v.evidence_document:
            out.document_filename = v.evidence_document.filename
        result.append(out)
    return result


# ── Review Queue ───────────────────────────────────────────────────────

@router.get("/review-queue", response_model=List[VerdictOut])
async def get_review_queue(db: Session = Depends(get_db)):
    verdicts = db.query(Verdict).filter(Verdict.status == VerdictStatus.MANUAL_REVIEW).order_by(Verdict.created_at).all()
    result = []
    for v in verdicts:
        out = VerdictOut.model_validate(v)
        if v.criterion:
            out.criterion_name = v.criterion.name
            out.criterion_category = v.criterion.category.value if hasattr(v.criterion.category, 'value') else str(v.criterion.category)
            out.criterion_is_mandatory = v.criterion.is_mandatory
        if v.bidder:
            out.bidder_name = v.bidder.company_name
        if v.evidence_document:
            out.document_filename = v.evidence_document.filename
        result.append(out)
    return result


@router.post("/verdicts/{verdict_id}/review", response_model=VerdictOut)
async def review_verdict(verdict_id: int, review: VerdictReview, db: Session = Depends(get_db)):
    verdict = db.query(Verdict).filter(Verdict.id == verdict_id).first()
    if not verdict:
        raise HTTPException(status_code=404, detail="Verdict not found")

    status_map = {
        "reviewed_eligible": VerdictStatus.REVIEWED_ELIGIBLE,
        "reviewed_not_eligible": VerdictStatus.REVIEWED_NOT_ELIGIBLE,
    }
    verdict.status = status_map[review.status]
    verdict.reviewed_by = review.reviewed_by
    verdict.reviewed_at = datetime.now(timezone.utc)
    verdict.review_notes = review.review_notes

    db.add(AuditLog(
        tender_id=verdict.bidder.tender_id if verdict.bidder else None,
        action="verdict_reviewed", entity_type="verdict", entity_id=verdict_id,
        details={"new_status": review.status, "reviewed_by": review.reviewed_by, "notes": review.review_notes},
        performed_by=review.reviewed_by,
    ))
    db.commit()
    db.refresh(verdict)

    out = VerdictOut.model_validate(verdict)
    if verdict.criterion:
        out.criterion_name = verdict.criterion.name
        out.criterion_category = verdict.criterion.category.value if hasattr(verdict.criterion.category, 'value') else str(verdict.criterion.category)
    if verdict.bidder:
        out.bidder_name = verdict.bidder.company_name
    return out


# ── Audit Log ──────────────────────────────────────────────────────────

@router.get("/audit-log", response_model=List[AuditLogOut])
async def get_audit_log(
    tender_id: int = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if tender_id:
        query = query.filter(AuditLog.tender_id == tender_id)
    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
    return [AuditLogOut.model_validate(log) for log in logs]


@router.post("/seed")
async def manual_seed(db: Session = Depends(get_db)):
    try:
        from app.core.seed import seed_db
        seed_db(db)
        return {"message": "Demo data loaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
