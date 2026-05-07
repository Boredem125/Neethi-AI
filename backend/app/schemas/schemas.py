"""
NEETHI AI — Pydantic Schemas
Request/response validation schemas for the FastAPI endpoints.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ── Tender Schemas ─────────────────────────────────────────────────────

class CriterionOut(BaseModel):
    id: int
    tender_id: int
    name: str
    description: str
    category: str
    is_mandatory: bool
    threshold_value: str
    threshold_unit: str
    threshold_operator: str
    extracted_from: str
    created_at: datetime

    class Config:
        from_attributes = True


class TenderCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    reference_number: str = Field(..., min_length=3, max_length=100)
    department: str = Field(..., min_length=2, max_length=200)
    district: str = Field(default="Bengaluru", max_length=100)
    estimated_value: float = Field(default=0.0, ge=0)
    published_date: Optional[datetime] = None
    closing_date: Optional[datetime] = None


class TenderOut(BaseModel):
    id: int
    title: str
    reference_number: str
    department: str
    district: str
    estimated_value: float
    published_date: Optional[datetime]
    closing_date: Optional[datetime]
    status: str
    original_filename: str
    criteria_count: int = 0
    bidder_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TenderDetailOut(TenderOut):
    raw_text: str
    criteria: List[CriterionOut] = []
    criteria_json: list = []

    class Config:
        from_attributes = True


# ── Bidder Schemas ─────────────────────────────────────────────────────

class BidDocumentOut(BaseModel):
    id: int
    bidder_id: int
    filename: str
    file_type: str
    file_size: int
    ocr_confidence: float
    language_detected: str
    processing_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class BidderCreate(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=300)
    contact_person: str = Field(default="", max_length=200)
    email: str = Field(default="", max_length=200)
    phone: str = Field(default="", max_length=20)
    category: str = Field(default="general")


class BidderOut(BaseModel):
    id: int
    tender_id: int
    company_name: str
    contact_person: str
    email: str
    phone: str
    category: str
    status: str
    overall_score: float
    is_awarded: bool = False
    document_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class BidderDetailOut(BidderOut):
    documents: List[BidDocumentOut] = []

    class Config:
        from_attributes = True


# ── Verdict Schemas ────────────────────────────────────────────────────

class VerdictOut(BaseModel):
    id: int
    bidder_id: int
    criterion_id: int
    evidence_document_id: Optional[int]
    status: str
    extracted_value: str
    reasoning: str
    confidence_score: float
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    review_notes: str
    created_at: datetime

    # Denormalized fields for display
    criterion_name: str = ""
    criterion_category: str = ""
    criterion_is_mandatory: bool = True
    bidder_name: str = ""
    document_filename: str = ""

    class Config:
        from_attributes = True


class VerdictReview(BaseModel):
    status: str = Field(..., pattern="^(reviewed_eligible|reviewed_not_eligible)$")
    review_notes: str = Field(default="", max_length=2000)
    reviewed_by: str = Field(default="Officer", max_length=200)


# ── Audit Log Schemas ──────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    tender_id: Optional[int]
    action: str
    entity_type: str
    entity_id: Optional[int]
    details: dict
    performed_by: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Dashboard Schemas ──────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_tenders: int = 0
    active_tenders: int = 0
    total_bidders: int = 0
    total_verdicts: int = 0
    eligible_count: int = 0
    not_eligible_count: int = 0
    manual_review_count: int = 0
    reviewed_count: int = 0
    avg_confidence: float = 0.0
    total_documents_processed: int = 0
    tenders_by_department: dict = {}
    tenders_by_status: dict = {}
    recent_activity: List[AuditLogOut] = []
