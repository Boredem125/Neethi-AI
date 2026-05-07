"""
NEETHI AI — Groq LLM Service
Uses Groq API (LLaMA 3.3 70B) for tender criteria extraction and document analysis.
"""
import json
import logging
from typing import List, Dict, Any
from groq import Groq
from app.core.config import settings

logger = logging.getLogger(__name__)

TENDER_PROMPT = """Analyze this Karnataka government tender and extract ALL evaluation criteria as a JSON array.
Each criterion: {"name":"...", "description":"...", "category":"technical|financial|compliance|certification|experience",
"is_mandatory":true/false, "threshold_value":"...", "threshold_unit":"...", "threshold_operator":">=|<=|==|contains|exists",
"extracted_from":"exact source text"}
Extract EVERY requirement: turnover, experience, certifications, registrations, EMD, specs, compliance.
Return ONLY the JSON array.

TENDER:
---
{tender_text}
---"""

DOC_PROMPT = """Analyze this bidder document (may contain Kannada text) and extract all evaluable data as JSON array.
Each item: {"field_name":"...", "value":"...", "original_text":"...", "confidence":0.0-1.0, "language":"english|kannada|mixed"}
Extract: financial figures, dates, registrations, certifications, experience, company info.
Return ONLY the JSON array.

DOCUMENT:
---
{document_text}
---"""


class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
        self.model = settings.GROQ_MODEL

    def is_available(self) -> bool:
        return self.client is not None and bool(settings.GROQ_API_KEY)

    def _call_llm(self, system: str, user: str, max_tokens: int = 4096) -> dict | list:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.1, max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        parsed = json.loads(resp.choices[0].message.content.strip())
        return parsed

    async def extract_criteria(self, tender_text: str) -> List[Dict[str, Any]]:
        if not self.is_available():
            return []
        try:
            parsed = self._call_llm(
                "You are a Karnataka government tender analysis expert. Respond with valid JSON only.",
                TENDER_PROMPT.format(tender_text=tender_text[:12000])
            )
            criteria = parsed if isinstance(parsed, list) else parsed.get("criteria", parsed.get("data", []))
            logger.info(f"Extracted {len(criteria)} criteria")
            return criteria
        except Exception as e:
            logger.error(f"Criteria extraction error: {e}")
            return []

    async def analyze_document(self, document_text: str) -> List[Dict[str, Any]]:
        if not self.is_available():
            return []
        try:
            parsed = self._call_llm(
                "You are a document analysis expert for Indian government procurement. Respond with valid JSON only.",
                DOC_PROMPT.format(document_text=document_text[:10000])
            )
            fields = parsed if isinstance(parsed, list) else parsed.get("fields", parsed.get("data", []))
            logger.info(f"Extracted {len(fields)} fields from document")
            return fields
        except Exception as e:
            logger.error(f"Document analysis error: {e}")
            return []

    async def evaluate_criterion(self, criterion: Dict, extracted_data: List[Dict], document_text: str) -> Dict:
        if not self.is_available():
            return {"status": "manual_review", "reasoning": "Groq API not configured.", "extracted_value": "", "confidence_score": 0.0}
        try:
            prompt = f"""Evaluate if bidder meets this criterion.
CRITERION: {criterion.get('name','')} — {criterion.get('description','')}
Required: {criterion.get('threshold_value','')} {criterion.get('threshold_unit','')} (operator: {criterion.get('threshold_operator','>=')})
Mandatory: {criterion.get('is_mandatory', True)}

BIDDER DATA: {json.dumps(extracted_data[:20], indent=2, ensure_ascii=False)}
DOC EXCERPT: {document_text[:3000]}

Return JSON: {{"status":"eligible|not_eligible|manual_review","extracted_value":"...","reasoning":"...","confidence_score":0.0-1.0}}
NEVER silently disqualify. When uncertain → manual_review."""

            result = self._call_llm("You are a fair, transparent tender evaluator for Karnataka government.", prompt, 1024)
            if result.get("status") not in {"eligible", "not_eligible", "manual_review"}:
                result["status"] = "manual_review"
            return result
        except Exception as e:
            logger.error(f"Criterion evaluation error: {e}")
            return {"status": "manual_review", "reasoning": f"Evaluation failed: {e}", "extracted_value": "", "confidence_score": 0.0}


groq_service = GroqService()
