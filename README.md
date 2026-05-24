# DocuReview AI

**Intelligent QA Document Review Platform for Medical Device Industry**

> Purpose-built for ISO 13485, EU MDR 2017/745, and FDA 21 CFR Part 820 document review.

---

## Stack

- **Next.js 14** (App Router)
- **React 18**
- **mammoth** — DOCX text extraction
- **JSZip** — DOCX comment injection
- **pdf.js** — PDF text extraction (loaded from CDN)

---

## Getting Started

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── layout.js          # Root layout, fonts, metadata
│   ├── page.js            # Main page — composes all components
│   └── globals.css        # All styles (CSS variables + components)
├── components/
│   ├── Chrome.jsx         # Top navigation bar
│   ├── Sidebar.jsx        # Source Library panel
│   ├── FindingsPanel.jsx  # Right panel — finding cards, filters, disposition
│   └── modals/
│       ├── SourceModal.jsx    # Add source document
│       └── Modals.jsx         # Settings, History, Report modals
├── hooks/
│   └── useReview.js       # Central state — all review logic
└── lib/
    ├── api.js             # AI engine API call + prompt builder
    ├── docx.js            # DOCX comment + track change injection
    ├── fileReader.js      # mammoth / pdf.js / txt reader
    ├── utils.js           # Helpers: format, export, report builder
    └── constants.js       # Finding types, severity, localStorage keys
```

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect GitHub repo to [vercel.com](https://vercel.com) for automatic deploys.

---

## Features

| Feature | Details |
|---|---|
| **Finding Types** | GRAMMAR · LOGIC · QA_GAP · TRACEABILITY · EVIDENCE · SCOPE · OBSERVATION · OFI |
| **Severity** | Critical · Major · Minor · Observation · OFI |
| **Regulatory Pathways** | ISO 13485 · EU MDR · FDA 21 CFR · All |
| **Tone** | Formal Audit · Simple · Friendly |
| **Output** | Reviewed `.docx` with Word Comments + Track Changes |
| **Export** | QA Review Report (print/PDF) · CSV findings export |
| **Source Library** | Persistent reference document storage |
| **Disposition** | Accept / Reject / Defer per finding + reviewer notes |
| **History** | Automatic review session logging |
| **Privacy** | No server storage · API key in session only · GDPR compatible |

---

## Supported Formats

- `.docx` — Microsoft Word (full comment injection)
- `.pdf` — Text-based PDFs
- `.txt` — Plain text

---

## Privacy & Security

- No data stored on any server
- API key in browser session memory only (cleared on tab close)
- Source Library in browser localStorage (never leaves device)
- No user accounts, no registration, no telemetry
- GDPR / KVKK compatible

---

## Documentation

| Document | Language |
|---|---|
| [User Manual](docs/DocuReviewAI_UserManual_EN.pdf) | English |
| [Kullanım Kılavuzu](docs/DocuReviewAI_KullanimKilavuzu_TR.pdf) | Turkish |

---

*DocuReview AI — Intelligent QA Document Review Platform*
