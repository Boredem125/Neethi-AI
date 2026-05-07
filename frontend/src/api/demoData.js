/**
 * NEETHI AI — Embedded Demo Data
 * Used when backend is unreachable (e.g. Vercel static deployment)
 */

const now = new Date().toISOString();
const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();
const future = (days) => new Date(Date.now() + days * 86400000).toISOString();

export const DEMO_TENDERS = [
  {
    id: 1,
    title: "Construction of Storm Water Drain and Road Work at Mahadevapura Zone",
    reference_number: "BBMP/EE/MDP/2025-26/WK-0147",
    department: "BBMP - Bruhat Bengaluru Mahanagara Palike",
    district: "Bengaluru Urban",
    estimated_value: 42500000,
    published_date: ago(10),
    closing_date: future(20),
    status: "criteria_extracted",
    criteria: [
      { id: 1, name: "KPWD Registration (Class 2 or above)", category: "CERTIFICATION", is_mandatory: true, description: "Bidder must hold valid KPWD contractor registration of Class 2 or higher" },
      { id: 2, name: "Minimum Annual Turnover", category: "FINANCIAL", is_mandatory: true, description: "Average annual turnover of last 3 years must be ≥ ₹2 Crore" },
      { id: 3, name: "Similar Work Experience", category: "EXPERIENCE", is_mandatory: true, description: "Must have completed at least 2 similar SWD works of value ≥ ₹1 Crore each" },
      { id: 4, name: "Valid GST Registration", category: "COMPLIANCE", is_mandatory: true, description: "Must possess valid GST registration certificate" },
    ],
    created_at: ago(10),
  },
  {
    id: 2,
    title: "Repair and Rehabilitation of Bridge on SH-17 at Km 42+600 near Ramanagara",
    reference_number: "PWD/CE/SB/2025-26/BR-0039",
    department: "PWD - Public Works Department",
    district: "Ramanagara",
    estimated_value: 185000000,
    published_date: ago(5),
    closing_date: future(30),
    status: "accepting_bids",
    criteria: [],
    created_at: ago(5),
  },
  {
    id: 3,
    title: "Providing Pure Drinking Water Supply to Villages in Dharwad Taluk under JJM",
    reference_number: "ZP/DHARWAD/EE/WS/2025-26/JJM-0215",
    department: "Zilla Panchayat - Dharwad",
    district: "Dharwad",
    estimated_value: 28000000,
    published_date: ago(15),
    closing_date: future(5),
    status: "closed",
    criteria: [
      { id: 5, name: "KPWD Registration (Class 3 or above)", category: "CERTIFICATION", is_mandatory: true, description: "Valid KPWD registration, Class 3 minimum" },
      { id: 6, name: "Similar JJM/Water Supply Work", category: "EXPERIENCE", is_mandatory: true, description: "Must have completed at least 1 JJM or rural water supply work" },
      { id: 7, name: "Minimum Turnover", category: "FINANCIAL", is_mandatory: true, description: "Annual turnover ≥ ₹1 Crore for last 2 years" },
    ],
    created_at: ago(15),
  },
  {
    id: 4,
    title: "Implementation of Integrated Command and Control Center (ICCC) Phase 2",
    reference_number: "BSCL/IT/2025/089",
    department: "Bengaluru Smart City Limited",
    district: "Bengaluru Urban",
    estimated_value: 124000000,
    published_date: ago(2),
    closing_date: future(45),
    status: "accepting_bids",
    criteria: [
      { id: 8, name: "CMMI Level 5 Certification", category: "CERTIFICATION", is_mandatory: true, description: "Company must be CMMI Level 5 certified" },
      { id: 9, name: "Data Center Experience", category: "EXPERIENCE", is_mandatory: true, description: "Must have managed at least 2 Tier-3 Data Centers" },
    ],
    created_at: ago(2),
  },
  {
    id: 5,
    title: "Construction of Post-Matric Boys Hostel at Kolar under Tribal Sub-Plan",
    reference_number: "TWD/EE/KLR/2025/442",
    department: "Tribal Welfare Department",
    district: "Kolar",
    estimated_value: 35000000,
    published_date: ago(25),
    closing_date: ago(2),
    status: "evaluated",
    criteria: [
      { id: 10, name: "SC/ST Category Certificate", category: "COMPLIANCE", is_mandatory: true, description: "Must provide valid SC/ST contractor certificate" },
      { id: 11, name: "Local Experience", category: "EXPERIENCE", is_mandatory: false, description: "At least 1 year of construction experience in Kolar district" },
    ],
    created_at: ago(25),
  },
];

export const DEMO_BIDDERS = {
  1: [],
  2: [],
  3: [
    { id: 1, tender_id: 3, company_name: "Sri Vinayaka Constructions", registration_number: "KPWD-BLR-2019-4821", contact_person: "Ramesh Gowda", category: "general", status: "ELIGIBLE", overall_status: "ELIGIBLE", overall_score: 100.0, is_awarded: true },
    { id: 2, tender_id: 3, company_name: "ಹೊಸ ಯುಗ ಇನ್‌ಫ್ರಾ (Hosa Yuga Infra)", registration_number: "KPWD-DHW-2020-1192", contact_person: "Suresh Patil", category: "cat_2a", status: "MANUAL_REVIEW", overall_status: "MANUAL_REVIEW", overall_score: 66.7, is_awarded: false },
    { id: 3, tender_id: 3, company_name: "Kaveri Infrastructure Pvt Ltd", registration_number: "KPWD-MYS-2018-7753", contact_person: "Anand Kumar", category: "general", status: "NOT_ELIGIBLE", overall_status: "NOT_ELIGIBLE", overall_score: 33.3, is_awarded: false },
  ],
  4: [],
  5: [
    { id: 4, tender_id: 5, company_name: "Valmiki Civil Works", registration_number: "KPWD-KLR-2021-0044", contact_person: "Vijay Kumar", category: "st", status: "ELIGIBLE", overall_status: "ELIGIBLE", overall_score: 95.0, is_awarded: false },
    { id: 5, tender_id: 5, company_name: "General Infra Corp", registration_number: "KPWD-BLR-2022-8812", contact_person: "Lokesh", category: "general", status: "NOT_ELIGIBLE", overall_status: "NOT_ELIGIBLE", overall_score: 20.0, is_awarded: false },
  ],
};

export const DEMO_VERDICTS = {
  1: [],
  2: [],
  3: [
    { id: 1, bidder_id: 1, criterion_id: 5, criterion_name: "KPWD Registration (Class 3 or above)", status: "ELIGIBLE", extracted_value: "Class 3 KPWD — Valid", reasoning: "Document clearly shows compliance with all KTPP norms.", confidence_score: 0.98 },
    { id: 2, bidder_id: 1, criterion_id: 6, criterion_name: "Similar JJM/Water Supply Work", status: "ELIGIBLE", extracted_value: "3 JJM projects completed", reasoning: "Three completed JJM works verified from experience certificates.", confidence_score: 0.96 },
    { id: 3, bidder_id: 1, criterion_id: 7, criterion_name: "Minimum Turnover", status: "ELIGIBLE", extracted_value: "₹2.4 Crore avg", reasoning: "Audited financials confirm annual turnover exceeds threshold.", confidence_score: 0.99 },
    { id: 4, bidder_id: 2, criterion_id: 5, criterion_name: "KPWD Registration (Class 3 or above)", status: "ELIGIBLE", extracted_value: "Class 3 KPWD", reasoning: "KPWD certificate submitted in Kannada, verified.", confidence_score: 0.88 },
    { id: 5, bidder_id: 2, criterion_id: 6, criterion_name: "Similar JJM/Water Supply Work", status: "MANUAL_REVIEW", extracted_value: "ಅನುಭವ ಪ್ರಮಾಣಪತ್ರ (Experience certificate)", reasoning: "Experience certificate is in Kannada with handwritten annotations. OCR confidence is 62%. Manual verification needed.", confidence_score: 0.62 },
    { id: 6, bidder_id: 2, criterion_id: 7, criterion_name: "Minimum Turnover", status: "ELIGIBLE", extracted_value: "₹1.2 Crore avg", reasoning: "Financial statements show compliance.", confidence_score: 0.91 },
    { id: 7, bidder_id: 3, criterion_id: 5, criterion_name: "KPWD Registration (Class 3 or above)", status: "ELIGIBLE", extracted_value: "Class 3 KPWD — Valid", reasoning: "Document shows compliance.", confidence_score: 0.89 },
    { id: 8, bidder_id: 3, criterion_id: 6, criterion_name: "Similar JJM/Water Supply Work", status: "ELIGIBLE", extracted_value: "1 JJM project", reasoning: "Document shows compliance.", confidence_score: 0.89 },
    { id: 9, bidder_id: 3, criterion_id: 7, criterion_name: "Minimum Turnover", status: "NOT_ELIGIBLE", extracted_value: "₹45 Lakhs", reasoning: "Annual turnover ₹45 Lakhs is below the ₹1 Crore threshold.", confidence_score: 0.94 },
  ],
  4: [],
  5: [
    { id: 10, bidder_id: 4, criterion_id: 10, criterion_name: "SC/ST Category Certificate", status: "ELIGIBLE", extracted_value: "ST Certificate — Verified", reasoning: "Valid Scheduled Tribe certificate issued by Social Welfare Dept, Kolar.", confidence_score: 0.97 },
    { id: 11, bidder_id: 4, criterion_id: 11, criterion_name: "Local Experience", status: "ELIGIBLE", extracted_value: "3 years in Kolar district", reasoning: "Work completion certificates from ZP Kolar confirm 3 years of local construction experience.", confidence_score: 0.93 },
    { id: 12, bidder_id: 5, criterion_id: 10, criterion_name: "SC/ST Category Certificate", status: "NOT_ELIGIBLE", extracted_value: "General Category", reasoning: "Bidder is General category. This tender is reserved for SC/ST contractors under Tribal Sub-Plan.", confidence_score: 0.99 },
    { id: 13, bidder_id: 5, criterion_id: 11, criterion_name: "Local Experience", status: "NOT_ELIGIBLE", extracted_value: "No Kolar experience", reasoning: "No evidence of prior construction work in Kolar district.", confidence_score: 0.95 },
  ],
};

export const DEMO_STATS = {
  total_tenders: 5,
  total_bidders: 5,
  total_verdicts: 13,
  eligible_count: 8,
  not_eligible_count: 3,
  manual_review_count: 1,
  pending_review: 1,
};

export const DEMO_REVIEW_QUEUE = [
  { id: 5, bidder_id: 2, criterion_id: 6, criterion_name: "Similar JJM/Water Supply Work", status: "MANUAL_REVIEW", extracted_value: "ಅನುಭವ ಪ್ರಮಾಣಪತ್ರ (Experience certificate)", reasoning: "Experience certificate is in Kannada with handwritten annotations. OCR confidence is 62%. Manual verification needed.", confidence_score: 0.62, bidder_name: "ಹೊಸ ಯುಗ ಇನ್‌ಫ್ರಾ (Hosa Yuga Infra)", tender_title: "Providing Pure Drinking Water Supply to Villages in Dharwad Taluk under JJM" },
];

export const DEMO_AUDIT_LOGS = [
  { id: 1, tender_id: 1, action: "tender_created", entity_type: "tender", entity_id: 1, details: { title: "Construction of Storm Water Drain and Road Work at Mahadevapura Zone" }, performed_by: "system", timestamp: ago(10) },
  { id: 2, tender_id: 1, action: "criteria_extracted", entity_type: "tender", entity_id: 1, details: { criteria_count: 4 }, performed_by: "system", timestamp: ago(9) },
  { id: 3, tender_id: 3, action: "tender_created", entity_type: "tender", entity_id: 3, details: { title: "Providing Pure Drinking Water Supply to Villages in Dharwad Taluk under JJM" }, performed_by: "system", timestamp: ago(15) },
  { id: 4, tender_id: 3, action: "tender_evaluated", entity_type: "tender", entity_id: 3, details: { bidders_evaluated: 3 }, performed_by: "system", timestamp: ago(8) },
  { id: 5, tender_id: 3, action: "tender_awarded", entity_type: "bidder", entity_id: 1, details: { awarded_to: "Sri Vinayaka Constructions" }, performed_by: "officer", timestamp: ago(6) },
  { id: 6, tender_id: 5, action: "tender_created", entity_type: "tender", entity_id: 5, details: { title: "Construction of Post-Matric Boys Hostel at Kolar under Tribal Sub-Plan" }, performed_by: "system", timestamp: ago(25) },
  { id: 7, tender_id: 5, action: "bidder_registered", entity_type: "bidder", entity_id: 4, details: { company: "Valmiki Civil Works", category: "ST" }, performed_by: "system", timestamp: ago(20) },
  { id: 8, tender_id: 5, action: "tender_evaluated", entity_type: "tender", entity_id: 5, details: { bidders_evaluated: 2 }, performed_by: "system", timestamp: ago(3) },
  { id: 9, tender_id: 4, action: "tender_created", entity_type: "tender", entity_id: 4, details: { title: "Implementation of Integrated Command and Control Center (ICCC) Phase 2" }, performed_by: "system", timestamp: ago(2) },
];

// Check if demo mode is active
export const isDemoMode = () => localStorage.getItem('neethi_demo') === 'true';
export const enableDemo = () => localStorage.setItem('neethi_demo', 'true');
export const disableDemo = () => localStorage.removeItem('neethi_demo');
