"""
NEETHI AI — Seed Data
Adds minimal realistic Karnataka tender data for demo purposes.
"""
from datetime import datetime, timezone, timedelta
from app.core.database import engine, SessionLocal, Base
from app.models.models import *


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(Tender).count() > 0:
        print("Database already has data. Skipping seed.")
        db.close()
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
        Criterion(tender_id=t1.id, name="Similar Work Experience", description="Must have completed at least 2 similar SWD works of value ≥ ₹1 Crore each in last 5 years", category=CriterionCategory.EXPERIENCE, is_mandatory=True, threshold_value="2", threshold_unit="projects", threshold_operator=">="),
        Criterion(tender_id=t1.id, name="Valid GST Registration", description="Must possess valid GST registration certificate", category=CriterionCategory.COMPLIANCE, is_mandatory=True, threshold_value="", threshold_unit="boolean", threshold_operator="exists"),
        Criterion(tender_id=t1.id, name="PAN Card", description="Must submit valid PAN card", category=CriterionCategory.COMPLIANCE, is_mandatory=True, threshold_value="", threshold_unit="boolean", threshold_operator="exists"),
        Criterion(tender_id=t1.id, name="EMD Submission", description="EMD of ₹4,25,000 must be submitted", category=CriterionCategory.FINANCIAL, is_mandatory=True, threshold_value="425000", threshold_unit="INR", threshold_operator="=="),
        Criterion(tender_id=t1.id, name="ISO 9001 Certification", description="ISO 9001:2015 Quality Management System certification preferred", category=CriterionCategory.CERTIFICATION, is_mandatory=False, threshold_value="", threshold_unit="boolean", threshold_operator="exists"),
    ]
    db.add_all(criteria_t1)

    # Tender 2: PWD Bridge Work
    t2 = Tender(
        title="Repair and Rehabilitation of Bridge on SH-17 at Km 42+600 near Ramanagara",
        reference_number="PWD/CE/SB/2025-26/BR-0039",
        department="PWD - Public Works Department",
        district="Ramanagara",
        estimated_value=185000000,
        published_date=now - timedelta(days=5),
        closing_date=now + timedelta(days=30),
        status=TenderStatus.ACCEPTING_BIDS,
        raw_text="Tender for bridge repair and rehabilitation work.",
    )
    db.add(t2)
    db.flush()

    criteria_t2 = [
        Criterion(tender_id=t2.id, name="KPWD Registration (Class 1)", description="Must hold KPWD Class 1 registration for bridge works", category=CriterionCategory.CERTIFICATION, is_mandatory=True, threshold_value="Class 1", threshold_unit="class", threshold_operator=">="),
        Criterion(tender_id=t2.id, name="Minimum Annual Turnover", description="Average annual turnover ≥ ₹10 Crore for last 3 financial years", category=CriterionCategory.FINANCIAL, is_mandatory=True, threshold_value="100000000", threshold_unit="INR", threshold_operator=">="),
        Criterion(tender_id=t2.id, name="Bridge Work Experience", description="Minimum 3 completed bridge works of ≥ ₹5 Crore each", category=CriterionCategory.EXPERIENCE, is_mandatory=True, threshold_value="3", threshold_unit="projects", threshold_operator=">="),
        Criterion(tender_id=t2.id, name="Structural Engineer on Staff", description="Must have qualified structural engineer on payroll", category=CriterionCategory.TECHNICAL, is_mandatory=True, threshold_value="1", threshold_unit="number", threshold_operator=">="),
        Criterion(tender_id=t2.id, name="SC/ST Sub-contracting", description="Must sub-contract 10% of work to SC/ST category contractors per KTPP Act", category=CriterionCategory.COMPLIANCE, is_mandatory=True, threshold_value="10", threshold_unit="percent", threshold_operator=">="),
    ]
    db.add_all(criteria_t2)

    # Tender 3: ZP Water Supply
    t3 = Tender(
        title="Providing Pure Drinking Water Supply to Villages in Dharwad Taluk under JJM",
        reference_number="ZP/DHARWAD/EE/WS/2025-26/JJM-0215",
        department="Zilla Panchayat - Dharwad",
        district="Dharwad",
        estimated_value=28000000,
        published_date=now - timedelta(days=15),
        closing_date=now + timedelta(days=5),
        status=TenderStatus.EVALUATED,
        raw_text="Jal Jeevan Mission tender for drinking water supply.",
    )
    db.add(t3)
    db.flush()

    criteria_t3 = [
        Criterion(tender_id=t3.id, name="KPWD Registration (Class 3 or above)", description="Valid KPWD registration, Class 3 minimum for water supply works", category=CriterionCategory.CERTIFICATION, is_mandatory=True, threshold_value="Class 3", threshold_unit="class", threshold_operator=">="),
        Criterion(tender_id=t3.id, name="Similar JJM/Water Supply Work", description="Must have completed at least 1 JJM or rural water supply work in Karnataka", category=CriterionCategory.EXPERIENCE, is_mandatory=True, threshold_value="1", threshold_unit="projects", threshold_operator=">="),
        Criterion(tender_id=t3.id, name="Minimum Turnover", description="Annual turnover ≥ ₹1 Crore for last 2 years", category=CriterionCategory.FINANCIAL, is_mandatory=True, threshold_value="10000000", threshold_unit="INR", threshold_operator=">="),
    ]
    db.add_all(criteria_t3)

    # Add sample bidders for T3 (evaluated tender)
    b1 = Bidder(tender_id=t3.id, company_name="Sri Vinayaka Constructions", contact_person="Ramesh Gowda", category=BidderCategory.GENERAL, status=BidderStatus.ELIGIBLE, overall_score=100.0)
    b2 = Bidder(tender_id=t3.id, company_name="ಹೊಸ ಯುಗ ಇನ್‌ಫ್ರಾ (Hosa Yuga Infra)", contact_person="Suresh Patil", category=BidderCategory.CAT_2A, status=BidderStatus.MANUAL_REVIEW, overall_score=66.7)
    b3 = Bidder(tender_id=t3.id, company_name="Kaveri Infrastructure Pvt Ltd", contact_person="Anand Kumar", category=BidderCategory.GENERAL, status=BidderStatus.NOT_ELIGIBLE, overall_score=33.3)
    db.add_all([b1, b2, b3])
    db.flush()

    # Add verdicts for T3
    for criterion in criteria_t3:
        # B1: all eligible
        db.add(Verdict(bidder_id=b1.id, criterion_id=criterion.id, status=VerdictStatus.ELIGIBLE, extracted_value="Meets requirement", reasoning="Document clearly shows compliance.", confidence_score=0.95))
        # B2: mixed
        if criterion.name.startswith("KPWD"):
            db.add(Verdict(bidder_id=b2.id, criterion_id=criterion.id, status=VerdictStatus.ELIGIBLE, extracted_value="Class 3 KPWD", reasoning="KPWD certificate submitted in Kannada, verified.", confidence_score=0.88))
        elif criterion.name.startswith("Similar"):
            db.add(Verdict(bidder_id=b2.id, criterion_id=criterion.id, status=VerdictStatus.MANUAL_REVIEW, extracted_value="ಅನುಭವ ಪ್ರಮಾಣಪತ್ರ (Experience certificate)", reasoning="Experience certificate is in Kannada with handwritten annotations. OCR confidence is 62%. The GP resolution number is partially illegible. Manual verification of project value needed.", confidence_score=0.62))
        else:
            db.add(Verdict(bidder_id=b2.id, criterion_id=criterion.id, status=VerdictStatus.ELIGIBLE, extracted_value="₹1.2 Crore avg", reasoning="Financial statements show compliance.", confidence_score=0.91))
        # B3: mostly not eligible
        if criterion.name.startswith("Minimum"):
            db.add(Verdict(bidder_id=b3.id, criterion_id=criterion.id, status=VerdictStatus.NOT_ELIGIBLE, extracted_value="₹45 Lakhs", reasoning="Annual turnover ₹45 Lakhs is below the ₹1 Crore threshold.", confidence_score=0.94))
        else:
            db.add(Verdict(bidder_id=b3.id, criterion_id=criterion.id, status=VerdictStatus.ELIGIBLE, extracted_value="Meets requirement", reasoning="Document shows compliance.", confidence_score=0.89))

    # Audit logs
    db.add_all([
        AuditLog(tender_id=t1.id, action="tender_created", entity_type="tender", entity_id=t1.id, details={"title": t1.title}, performed_by="system"),
        AuditLog(tender_id=t1.id, action="criteria_extracted", entity_type="tender", entity_id=t1.id, details={"criteria_count": 7}, performed_by="system"),
        AuditLog(tender_id=t2.id, action="tender_created", entity_type="tender", entity_id=t2.id, details={"title": t2.title}, performed_by="system"),
        AuditLog(tender_id=t3.id, action="tender_created", entity_type="tender", entity_id=t3.id, details={"title": t3.title}, performed_by="system"),
        AuditLog(tender_id=t3.id, action="tender_evaluated", entity_type="tender", entity_id=t3.id, details={"bidders_evaluated": 3}, performed_by="system"),
    ])

    db.commit()
    db.close()
    print("Seed data created successfully!")
    print(f"  - 3 tenders")
    print(f"  - 15 criteria")
    print(f"  - 3 bidders (for Dharwad tender)")
    print(f"  - 9 verdicts")


if __name__ == "__main__":
    seed()
