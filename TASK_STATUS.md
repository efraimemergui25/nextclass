# NextClass Production Hardening & Automation Status

## 📋 Task Checklist

- [x] **Gemini OCR Order Parser Engine** (`api/ocr-order.js`)
  - Integration of Gemini 1.5 Flash Vision.
  - Returns structured JSON from base64 images in Hebrew.
  - Confidence scoring.
- [x] **Admin OCR Interface** (`src/admin/pages/AdminOCR.jsx`)
  - High-fidelity Heaven 2 Apple-tier glassmorphic upload interface.
  - In-place reviewing, editing of parsed client data, items list, and totals.
  - Creation of quotes inside Firestore.
- [x] **Sidebar and Route Registration**
  - Integrated `/admin/ocr` route in `AdminApp.jsx`.
  - Added camera/OCR search button inside the Management group in the Sidebar.
- [ ] **Document Vault Component (כספת מסמכים)** 🔄 *Current Task*
  - Create `/admin/vault` page with Apple Liquid Glass aesthetic.
  - Folder structure ("הסכמי לקוחות", "הצעות מחיר", "חשבוניות וקבלות", "הצעות ספקים").
  - File upload, tag/status classification, and quick actions.
  - Details panel/sheet for document management.
  - Integration with `AdminSidebar` and `AdminApp`.
- [ ] **Transactional Email Manual Approval Gate**
  - Stop automatic emails from `api/send-stage-email.js` and `api/send-quote-email.js`.
  - Flag emails as "Pending Approval" in Firestore.
  - Add approval buttons/dashboard interface in Admin portal to release emails.
- [ ] **Removal of Mock/Synthetic Data**
  - Audit admin dashboard and customer site.
  - Ensure all mock listings, products, or stats are deleted or mapped to live Firestore database.
- [ ] **Verification & Validation**
  - Run terminal checks, linting, and build validation to guarantee no production outage.
