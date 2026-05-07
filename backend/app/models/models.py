"""
NEETHI AI — Database Models
SQLAlchemy ORM models for Tenders, Criteria, Bidders, Documents, Verdicts, and AuditLogs.
Designed for KTPP Act compliance with full audit trail support.
"""
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime,
    ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


# ── Enums ──────────────────────────────────────────────────────────────

class TenderStatus(str, enum.Enum):
    DRAFT = "draft"
    CRITERIA_EXTRACTED = "criteria_extracted"
    ACCEPTING_BIDS = "accepting_bids"
    EVALUATING = "evaluating"
    EVALUATED = "evaluated"
    CLOSED = "closed"


class CriterionCategory(str, enum.Enum):
    TECHNICAL = "technical"
    FINANCIAL = "financial"
    COMPLIANCE = "compliance"
    CERTIFICATION = "certification"
    EXPERIENCE = "experience"


class VerdictStatus(str, enum.Enum):
    ELIGIBLE = "eligible"
    NOT_ELIGIBLE = "not_eligible"
    MANUAL_REVIEW = "manual_review"
    REVIEWED_ELIGIBLE = "reviewed_eligible"
    REVIEWED_NOT_ELIGIBLE = "reviewed_not_eligible"


class BidderCategory(str, enum.Enum):
    GENERAL = "general"
    SC = "sc"
    ST = "st"
    CAT_2A = "2a"
    CAT_2B = "2b"
    CAT_3A = "3a"
    CAT_3B = "3b"


class BidderStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_EVALUATION = "under_evaluation"
    ELIGIBLE = "eligible"
    NOT_ELIGIBLE = "not_eligible"
    MANUAL_REVIEW = "manual_review"


# ── Models ─────────────────────────────────────────────────────────────

class Tender(Base):
    """A government tender document uploaded for AI evaluation."""
    __tablename__ = "tenders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    reference_number = Column(String(100), unique=True, index=True)
    department = Column(String(200), nullable=False)
    district = Column(String(100), default="Bengaluru")
    estimated_value = Column(Float, default=0.0)
    published_date = Column(DateTime, nullable=True)
    closing_date = Column(DateTime, nullable=True)
    status = Column(SQLEnum(TenderStatus), default=TenderStatus.DRAFT)
    raw_text = Column(Text, default="")
    file_path = Column(String(500), default="")
    original_filename = Column(String(300), default="")
    criteria_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    criteria = relationship("Criterion", back_populates="tender", cascade="all, delete-orphan")
    bidders = relationship("Bidder", back_populates="tender", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tender", cascade="all, delete-orphan")


class Criterion(Base):
    """An individual evaluation criterion extracted from a tender."""
    __tablename__ = "criteria"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    name = Column(String(300), nullable=False)
    description = Column(Text, default="")
    category = Column(SQLEnum(CriterionCategory), default=CriterionCategory.TECHNICAL)
    is_mandatory = Column(Boolean, default=True)
    threshold_value = Column(String(200), default="")
    threshold_unit = Column(String(100), default="")
    threshold_operator = Column(String(20), default=">=")  # >=, <=, ==, contains
    extracted_from = Column(Text, default="")  # source text from tender
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tender = relationship("Tender", back_populates="criteria")
    verdicts = relationship("Verdict", back_populates="criterion", cascade="all, delete-orphan")


class Bidder(Base):
    """A contractor/company submitting a bid for a tender."""
    __tablename__ = "bidders"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    company_name = Column(String(300), nullable=False)
    contact_person = Column(String(200), default="")
    email = Column(String(200), default="")
    phone = Column(String(20), default="")
    category = Column(SQLEnum(BidderCategory), default=BidderCategory.GENERAL)
    status = Column(SQLEnum(BidderStatus), default=BidderStatus.PENDING)
    overall_score = Column(Float, default=0.0)
    is_awarded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tender = relationship("Tender", back_populates="bidders")
    documents = relationship("BidDocument", back_populates="bidder", cascade="all, delete-orphan")
    verdicts = relationship("Verdict", back_populates="bidder", cascade="all, delete-orphan")


class BidDocument(Base):
    """A document uploaded as part of a bidder's submission."""
    __tablename__ = "bid_documents"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"), nullable=False)
    filename = Column(String(300), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), default="pdf")  # pdf, docx, jpg, png
    file_size = Column(Integer, default=0)
    ocr_text = Column(Text, default="")
    ocr_confidence = Column(Float, default=0.0)
    language_detected = Column(String(50), default="english")
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    extracted_data = Column(JSON, default=dict)  # structured data extracted from document
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    bidder = relationship("Bidder", back_populates="documents")
    verdicts = relationship("Verdict", back_populates="evidence_document")


class Verdict(Base):
    """
    A criterion-level evaluation verdict for a bidder.
    The core of NEETHI's 3-verdict system: ELIGIBLE / NOT_ELIGIBLE / MANUAL_REVIEW.
    Append-only for KTPP Act audit compliance.
    """
    __tablename__ = "verdicts"

    id = Column(Integer, primary_key=True, index=True)
    bidder_id = Column(Integer, ForeignKey("bidders.id"), nullable=False)
    criterion_id = Column(Integer, ForeignKey("criteria.id"), nullable=False)
    evidence_document_id = Column(Integer, ForeignKey("bid_documents.id"), nullable=True)

    status = Column(SQLEnum(VerdictStatus), nullable=False)
    extracted_value = Column(String(500), default="")
    reasoning = Column(Text, default="")
    confidence_score = Column(Float, default=0.0)

    # Officer review fields
    reviewed_by = Column(String(200), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, default="")

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    bidder = relationship("Bidder", back_populates="verdicts")
    criterion = relationship("Criterion", back_populates="verdicts")
    evidence_document = relationship("BidDocument", back_populates="verdicts")


class AuditLog(Base):
    """
    Append-only audit log for KTPP §13/§14 compliance.
    Every action is timestamped and immutable.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), default="")  # tender, bidder, verdict, document
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, default=dict)
    performed_by = Column(String(200), default="system")
    ip_address = Column(String(50), default="")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tender = relationship("Tender", back_populates="audit_logs")
