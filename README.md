# NEETHI AI — Smart Tender Evaluation Platform

**Neethi AI** is a specialized procurement intelligence platform designed to automate and audit the tender evaluation process in compliance with the **KTPP Act (Karnataka Transparency in Public Procurements Act)**.

It uses advanced OCR (Tesseract) and LLM-based reasoning (Groq/LLaMA 3) to extract criteria from tender notifications and evaluate bidder documents for technical and financial eligibility.

---

## 🚀 Demonstration Walkthrough

Follow these steps to demonstrate the full power of Neethi AI:

### 1. The Command Center (Dashboard)
*   **Overview**: Show the real-time stats (Tenders Evaluated, Bidders Processed).
*   **Live Audit Ticker**: Point out the scrolling ticker at the bottom—it shows the system's "background" thinking and live audit trails.
*   **Language Toggle**: Click the EN/KN toggle to show the full platform translation in Kannada.

### 2. Tender Ingestion & Extraction
*   **Navigation**: Go to **Evaluations** and click **New Tender**.
*   **Upload**: Upload a Tender Notification PDF.
*   **Extraction**: Click **Extract Criteria**. Watch as the AI parses the legal text to find mandatory technical requirements (Registration Class, Turnover, Experience).
*   **Refinement**: Show how criteria are saved as structured data for the next phase.

### 3. Bidder Evaluation (The Core Engine)
*   **Add Bidders**: In the Tender Detail page, click **Add Bidder**. Upload a bidder's technical document (PDF).
*   **The Run**: Click **Evaluate Bidders**. This triggers the Groq engine to perform a clause-by-clause comparison between the Tender Criteria and the Bidder's Evidence.
*   **Confidence Scores**: Notice the circular "Match Score" rings (85%, 60%, etc.) which visualize the AI's confidence in the bidder's eligibility.

### 4. Human-in-the-loop (Review Queue)
*   **Audit**: If the AI is unsure, it flags the case for **Manual Review**.
*   **Review**: Go to the **Review Queue** to show how an officer can override or confirm an AI verdict with custom notes, ensuring KTPP §14 compliance (non-silent disqualification).

### 5. Awarding & Reporting
*   **Award**: Once satisfied, click **Award Tender to this Bidder** on the winning bidder's card.
*   **Banner**: Show the 🏆 Awarded banner that appears at the top.
*   **PDF Report**: Click **Generate Report** to see the clean, printable audit trail that can be used for official records.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS (Premium Dark Theme).
- **Backend**: FastAPI (Python), SQLAlchemy ORM.
- **Database**: SQLite (Audit-friendly relational schema).
- **AI/ML**: 
  - **Groq (LLaMA 3.3 70B)**: For structured extraction and complex legal reasoning.
  - **Tesseract OCR**: For parsing scanned government documents.
- **Compliance**: Built-in Audit Logs for every system action.

---

## 📦 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Tesseract OCR installed locally

### Backend Setup
1. Navigate to `/backend`.
2. Create a virtual environment: `python -m venv venv`.
3. Activate venv: `.\venv\Scripts\activate`.
4. Install dependencies: `pip install -r requirements.txt`.
5. Create a `.env` file with your `GROQ_API_KEY`.
6. Start server: `python -m uvicorn app.main:app --reload`.

### Frontend Setup
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`.
3. Start development server: `npm run dev`.

---

## 🛡 License
Internal Use - Engineering Platform for Neethi AI.
