"""
NEETHI AI — Auto-Seed Logic
Ensures the database is never empty on deployment.
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.models import *

def seed_db(db: Session):
    # Check if already seeded
    if db.query(Tender).count() > 0:
        return

    now = datetime.now(timezone.utc)

    # Tender 1: BBMP Road Construction
    t1 = Tender(
        title="Construction of Storm Water Drain and Road Work at Mahadevapura Zone",
        reference_number="BBMP/EE/MDP/2025-26/WK-0147",
        department="BBMP - Bruhat Bengaluru Mahanagara Palike",
        district="Bengaluru Urban",
        estimated_value=42500000,
        published_date=now - timedelta(days=10),
        closing_date=now + timedelta(days=20),
        status=TenderStatus.CRITERIA_EXTRACTED,
        raw_text="Sample tender text for BBMP storm water drain construction project.",
    )
    db.add(t1)
    db.flush()

    # Criteria for T1
    criteria_t1 = [
        Criterion(tender_id=t1.id, name="KPWD Registration (Class 2 or above)", description="Bidder must hold valid KPWD contractor registration of Class 2 or higher", category=CriterionCategory.CERTIFICATION, is_mandatory=True, threshold_value="Class 2", threshold_unit="class", threshold_operator=">="),
        Criterion(tender_id=t1.id, name="Minimum Annual Turnover", description="Average annual turnover of last 3 years must be ≥ ₹2 Crore", category=CriterionCategory.FINANCIAL, is_mandatory=True, threshold_value="20000000", threshold_unit="INR", threshold_operator=">="),
        Criterion(tender_id=t1.id, name="Valid GST Registration", description="Must possess valid GST registration certificate", category=CriterionCategory.COMPLIANCE, is_mandatory=True, threshold_value="", threshold_unit="boolean", threshold_operator="exists"),
    ]
    db.add_all(criteria_t1)

    # Tender 3: ZP Water Supply (Closed/Awarded)
    t3 = Tender(
        title="Providing Pure Drinking Water Supply to Villages in Dharwad Taluk under JJM",
        reference_number="ZP/DHARWAD/EE/WS/2025-26/JJM-0215",
        department="Zilla Panchayat - Dharwad",
        district="Dharwad",
        estimated_value=28000000,
        published_date=now - timedelta(days=15),
        closing_date=now + timedelta(days=5),
        status=TenderStatus.CLOSED,
        raw_text="Jal Jeevan Mission tender for drinking water supply.",
    )
    db.add(t3)
    db.flush()

    criteria_t3 = [
        Criterion(tender_id=t3.id, name="KPWD Registration (Class 3 or above)", description="Valid KPWD registration", category=CriterionCategory.CERTIFICATION, is_mandatory=True, threshold_value="Class 3", threshold_unit="class", threshold_operator=">="),
        Criterion(tender_id=t3.id, name="Minimum Turnover", description="Annual turnover ≥ ₹1 Crore", category=CriterionCategory.FINANCIAL, is_mandatory=True, threshold_value="10000000", threshold_unit="INR", threshold_operator=">="),
    ]
    db.add_all(criteria_t3)

    # Tender 5: Tribal Welfare Construction (SC/ST focus)
    t5 = Tender(
        title="Construction of Post-Matric Boys Hostel at Kolar under Tribal Sub-Plan",
        reference_number="TWD/EE/KLR/2025/442",
        department="Tribal Welfare Department",
        district="Kolar",
        estimated_value=35000000,
        published_date=now - timedelta(days=25),
        closing_date=now - timedelta(days=2),
        status=TenderStatus.EVALUATED,
        raw_text="Construction project reserved for SC/ST category contractors.",
    )
    db.add(t5)
    db.flush()

    db.add(Criterion(tender_id=t5.id, name="SC/ST Category Certificate", description="Must provide valid SC/ST contractor certificate", category=CriterionCategory.COMPLIANCE, is_mandatory=True, threshold_value="", threshold_unit="boolean", threshold_operator="exists"))

    # Bidders for T3
    b1 = Bidder(tender_id=t3.id, company_name="Sri Vinayaka Constructions", category=BidderCategory.GENERAL, status=BidderStatus.ELIGIBLE, overall_score=100.0, is_awarded=True)
    b2 = Bidder(tender_id=t3.id, company_name="ಹೊಸ ಯುಗ ಇನ್‌ಫ್ರಾ (Hosa Yuga Infra)", category=BidderCategory.CAT_2A, status=BidderStatus.MANUAL_REVIEW, overall_score=66.7)
    db.add_all([b1, b2])
    db.flush()

    # Verdicts for B1 (Winner)
    for c in criteria_t3:
        db.add(Verdict(bidder_id=b1.id, criterion_id=c.id, status=VerdictStatus.ELIGIBLE, extracted_value="Meets requirement", reasoning="Document clearly shows compliance with all KTPP norms.", confidence_score=0.98))

    # Audit logs
    db.add_all([
        AuditLog(tender_id=t3.id, action="tender_awarded", entity_type="bidder", entity_id=b1.id, details={"awarded_to": b1.company_name}, performed_by="officer"),
        AuditLog(tender_id=t5.id, action="tender_evaluated", entity_type="tender", entity_id=t5.id, details={"bidders_evaluated": 2}, performed_by="system"),
    ])

    db.commit()

def run_auto_seed():
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
