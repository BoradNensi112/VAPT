# 🛡️ BISAG-N (MeitY) — Centralized VAPT Security Command Center

An enterprise-grade **Vulnerability Assessment and Penetration Testing (VAPT)** platform designed for cybersecurity teams to assess applications, document findings with OWASP/CWE mappings, run live security tooling checks, track remediation posture, and generate standardized Excel and PDF reports.

Branded for **BISAG-N (Bhaskaracharya National Institute for Space Applications and Geo-informatics, Ministry of Electronics and Information Technology, Government of India)**.

---

## 🚀 Quick Start Instructions

### 1-Click Launch (Windows):
Double click `start.bat` in `E:\VAPT` to start both Backend and Frontend simultaneously.

OR manually in two terminals:

#### Terminal 1 — Backend:
```bash
cd E:\VAPT\backend
npm start
```
*Backend API will run at `http://localhost:5000`*

#### Terminal 2 — Frontend:
```bash
cd E:\VAPT\frontend
npm run dev
```
*Frontend Portal will run at `http://localhost:5173`*

---

## 🔑 Default Super Admin Login Credentials

| Field | Value |
| :--- | :--- |
| **Role Selector** | `Admin` |
| **Username / Email** | `admin` |
| **Password** | `Admin@123` |

> *Note: In accordance with cybersecurity compliance, public registration is disabled. Only the Admin can create and assign roles to new security analysts, project managers, and CISOs from the **Users** module.*

---

## 📁 Project Architecture & Directory Layout

```
E:\VAPT\
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # PostgreSQL (pgAdmin) + Embedded Fallback Adapter
│   │   ├── controllers/
│   │   │   ├── authController.js     # Role-based Login & JWT tokens
│   │   │   ├── userController.js     # Admin-only user management
│   │   │   ├── projectController.js  # Project scopes & findings CRUD
│   │   │   ├── kbController.js       # OWASP/CWE Knowledge Base
│   │   │   ├── toolsController.js    # Security testing utilities
│   │   │   ├── reportController.js   # 1-to-1 Excel (.xlsx) Report Builder
│   │   │   └── activityController.js # Audit logs
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT verification guard
│   │   │   └── roleMiddleware.js     # Role permission guard
│   │   ├── db/
│   │   │   ├── schema.sql            # PostgreSQL schema definitions
│   │   │   ├── seedData.js           # Pre-loaded OWASP Top 10 vulnerabilities
│   │   │   └── init.js               # Auto-seeder & DB table initialization
│   │   └── server.js                 # Express server entry point
│   ├── .env                          # DB host, port, credentials & JWT secret
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── assets/
│   │       └── bisag-logo.png        # BISAG-N MeitY Logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # Exact hierarchy matching user design
│   │   │   ├── Navbar.jsx            # System status & user role badge
│   │   │   ├── CyberGlobe.jsx        # 3D Interactive Cyber Globe Canvas
│   │   │   └── ThreatCore3D.jsx      # 3D Security Posture Core
│   │   ├── pages/
│   │   │   ├── Login.jsx             # 3D Cyber Glassmorphic Login with Logo
│   │   │   ├── Dashboard.jsx         # Posture metrics & OWASP charts
│   │   │   ├── Users.jsx             # Admin-only team provisioning
│   │   │   ├── Projects.jsx          # Target applications & assigned scopes
│   │   │   ├── GenerateReport.jsx    # KB auto-fill & Excel export
│   │   │   ├── AnalyzeReport.jsx     # Risk metrics & severity breakdown
│   │   │   ├── CompareReports.jsx    # Audit vs Re-Audit diff analysis
│   │   │   ├── KnowledgeBase.jsx     # Searchable OWASP/CWE catalog
│   │   │   ├── SecurityTools.jsx     # Headers, CORS, Clickjacking, Encoders
│   │   │   ├── ActivityLogs.jsx      # System audit trails
│   │   │   └── Profile.jsx           # User credentials & role
│   │   ├── styles/                   # Pure Modular CSS (No Tailwind)
│   │   └── App.jsx
│   └── vite.config.js
│
└── start.bat                         # 1-Click Launch Script
```

---

## 📊 Exact Excel (.xlsx) Report Template

The generated report matches the required template specifications:
1. **Title**: `Manual Testing Report (VAPT)`
2. **Top Metadata Block (Light Green `#C8E6C9`)**:
   - `Project Name:`
   - `URL:`
   - `Security Analyst:`
   - `Project Manager:`
   - `Additional Director cum CISO:`
3. **Findings Table (Light Blue `#D0E1FD`)**:
   - `S.No` | `Vulnerability Name` | `Description` | `Step to reproduce` | `Remediation` | `Severity` | `Reference` | `OWASP Category – CWE number` | `CWE Reference`
4. **Remarks & Re-Test Section**:
   - `Remarks: 1. Functional Bugs are attached to in the Findings folder Under !`
   - `According to Last Reported Vulnerabilities on Date: <Date>` table with `No`, `Vulnerability Name`, `Status`.

---

## 🛠️ Integrated Security Utilities
* **HTTP Security Headers Analyzer**: Inspects `HSTS`, `CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and provides grades (A+ to F).
* **CORS Misconfiguration Tester**: Tests origin reflections and credentials risks against arbitrary third-party domains.
* **Clickjacking Sandbox**: Checks iframe framing restrictions and provides a live sandbox preview.
* **Encoders & Payload Tools**: Instant Base64, URL, Hex encoding/decoding and MD5/SHA-256 hash generation.
