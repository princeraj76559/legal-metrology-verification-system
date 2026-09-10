# Legal Metrology Verification System

A digital platform for the Department of Legal Metrology to manage instrument registrations, verification workflows, on-site field inspections, automated QR-coded digital certificates, and public verification.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Role-Based Workflows](#-role-based-workflows)
- [System Architecture & Tech Stack](#-system-architecture--tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started (Step-by-Step)](#-getting-started-step-by-step)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Demo Credentials](#-demo-credentials)
- [End-to-End Verification Walkthrough](#-end-to-end-verification-walkthrough)
- [Project Directory Structure](#-project-directory-structure)
- [API Reference](#-api-reference)
- [Security & Production Notes](#-security--production-notes)

---

## 🌟 Overview

The **Legal Metrology Verification System** replaces paper-based workflows with a unified, transparent digital ecosystem. It streamlines the lifecycle of commercial weights and measures verification—from initial application submission by traders and manufacturers to officer assignment, on-site mobile inspections, tamper-evident certificate issuance, and instant public QR validation.

---

## 🚀 Key Features

* **Role-Based Portals**: Dedicated interfaces for Applicants, Legal Metrology Officers, Admins, and Government Approved Test Centres (GATC).
* **Instrument Registry**: Register, track, and manage commercial weighing and measuring instruments with serial numbers, model details, and location data.
* **Smart Workflow & Assignment**: Administrative officer allocation engine filtered by state, district, and workload.
* **Mobile-First Field Inspection Desk**: Optimized UI for field officers to perform inspections, record test results (PASS / REJECT), attach photo proof, and log physical seal numbers.
* **Automated Digital Certificate Generation**: Dynamic PDF certificate issuance via `PDFKit` embedded with a cryptographic QR code.
* **Public QR Verification**: Scan or visit public verification links (`/verify/:token`) without login to verify certificate authenticity, validity dates, and instrument specs.
* **Audit Trail & Logging**: System-wide immutable logging of every action, status change, and inspection event for governance and accountability.
* **Zero-Config Database**: Self-initializing SQLite database (`better-sqlite3`) in WAL mode with auto-seeding for quick onboarding.

---

## 👥 Role-Based Workflows

```
┌──────────────┐      Submits Application      ┌──────────────────┐
│  Applicant   │ ────────────────────────────> │ Admin / Platform │
└──────────────┘                               └─────────┬────────┘
                                                         │ Assigns Officer
                                                         ▼
┌──────────────┐      Generates Certificate    ┌───────────────────┐
│    Public    │ <──────────────────────────── │ Legal Metrology   │
│ Verification │      (QR Code + Signed PDF)   │     Officer/GATC  │
└──────────────┘                               └───────────────────┘
```

1. **Applicant (Trader / Manufacturer)**
   - Register and manage instruments.
   - Submit new verification / re-verification applications with preferred inspection dates.
   - Live visual status timeline tracking (`SUBMITTED` ➔ `ASSIGNED` ➔ `VERIFIED` / `REJECTED`).
   - Download PDF certificates with embedded QR codes.

2. **Legal Metrology Officer / Inspector**
   - View assigned inspection jobs.
   - Conduct on-site inspections with live photo capture/upload.
   - Record test findings, verification fees, remarks, and seal numbers.
   - Issue approvals (generating certificates) or rejections.

3. **Admin / Controller**
   - High-level system statistics (pending applications, active officers, issued certificates).
   - Assign officers to applications based on jurisdiction (state/district).
   - User and officer management (create, update, activate/deactivate accounts).
   - Complete audit trail of system activities.

4. **GATC (Government Approved Test Centre)**
   - Inspection workspace for authorized third-party verification labs.

5. **Public / Enforcement Officers**
   - Instant validation of certificates via camera scan or web verification link.

---

## 🛠️ System Architecture & Tech Stack

- **Frontend**: React 18, Vite, Vanilla CSS Design System, Responsive & Mobile-first.
- **Backend**: Node.js (ES Modules), Express.js REST API.
- **Database**: SQLite via `better-sqlite3` (Write-Ahead Logging enabled).
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing.
- **File & Media Handling**: `multer` for secure on-disk upload of inspection photos.
- **Certificate & QR Engine**: `pdfkit` for vector PDF rendering + `qrcode` for tokenized digital verification.

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher (bundled with Node.js)
- **Git**: For version control

---

## ⚡ Getting Started (Step-by-Step)

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd legal-metrology-platform
```

---

### 2. Backend Setup

Open a terminal in the root directory:

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create your environment configuration file
# On Windows (PowerShell / Command Prompt):
copy .env.example .env
# On Linux / macOS:
# cp .env.example .env

# 3. Install backend dependencies
npm install

# 4. Start the backend development server
npm run dev
```

> **Note:** The backend server will start on `http://localhost:4000`. The SQLite database file will automatically be created and seeded at `backend/storage/legal-metrology.db`.

---

### 3. Frontend Setup

Open a **new terminal** in the root directory:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install frontend dependencies
npm install

# 3. Start the frontend development server
npm run dev
```

> **Note:** The frontend application will start on `http://localhost:5173`. Open this URL in your web browser.

---

## 🔐 Demo Credentials

The database comes pre-seeded with sample accounts for all primary roles (all passwords are `Pass@123`):

| Role | Email | Password | Default Permissions |
| :--- | :--- | :--- | :--- |
| **Applicant** | `applicant@example.com` | `Pass@123` | Register instruments, submit applications, view certificates |
| **Officer** | `officer@metrology.gov` | `Pass@123` | Perform field inspections, approve/reject tests, attach photos |
| **Admin** | `admin@metrology.gov` | `Pass@123` | Manage users, allocate officers, audit logs, view analytics |

---

## 🔄 End-to-End Verification Walkthrough

Follow these steps to experience the complete verification lifecycle:

1. **Submit Application (Applicant Portal)**:
   - Log in as `applicant@example.com` / `Pass@123`.
   - Go to **My Instruments** and register a new instrument (or use the pre-seeded one).
   - Go to **New Application**, select your instrument, set a preferred date, and submit.
   - Note the generated Application Number (e.g., `VER-2026-0001`).

2. **Assign Officer (Admin Portal)**:
   - Log out and log in as `admin@metrology.gov` / `Pass@123`.
   - Go to **Applications**, locate the submitted application, and click **Assign Officer**.
   - Select `Amit Kumar (Officer)` and assign a scheduled date.

3. **Perform Field Inspection (Officer Portal)**:
   - Log out and log in as `officer@metrology.gov` / `Pass@123`.
   - Navigate to **My Jobs** to see the assigned task.
   - Click **Inspect**, select Outcome as **PASS**, enter seal details, remarks, and optionally attach an inspection photo.
   - Click **Submit Inspection Report**.

4. **View Certificate & Public QR (Applicant & Public)**:
   - Log back in as `applicant@example.com`.
   - Navigate to **Certificates** to find your newly generated verification certificate.
   - Click **Download PDF** to inspect the official generated certificate.
   - Click **Verify QR Code** to view the public tamper-proof verification page.

---

## 📂 Project Directory Structure

```text
legal-metrology-platform/
├── backend/
│   ├── src/
│   │   ├── db.js             # SQLite schema, connections, and seed data
│   │   ├── server.js         # Express server, routes, controllers & PDF engine
│   │   └── middleware/       # JWT auth and role validation guards
│   ├── storage/              # (Auto-generated) SQLite DB, uploads & certificate files
│   ├── .env.example          # Environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components (Buttons, Modals, Cards, Badges, Timeline)
│   │   ├── pages/            # Application pages and role views
│   │   ├── services/         # API integration client
│   │   ├── App.jsx           # Master application layout, routing & state
│   │   ├── index.css         # Design system & styles
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── docs/
│   └── API-CONTRACT.md       # Standardized API contract & endpoint schemas
├── .gitignore
└── README.md
```

---

## 📡 API Reference

Base Endpoint: `http://localhost:4000/api/v1`

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticate user & receive JWT token |
| `POST` | `/auth/register` | Public | Register a new applicant account |
| `GET` | `/instruments` | Authenticated | List instruments owned by the applicant |
| `POST` | `/instruments` | Applicant | Register a new weighing/measuring instrument |
| `GET` | `/applications/my` | Applicant | Retrieve current user's applications |
| `POST` | `/applications` | Applicant | Submit a new verification application |
| `GET` | `/applications` | Admin | List all system applications with filters |
| `PATCH`| `/applications/:id/assign` | Admin | Assign an officer and inspection date |
| `GET` | `/officer/jobs` | Officer | List jobs assigned to the logged-in officer |
| `POST` | `/applications/:id/inspection` | Officer | Submit inspection report and issue certificate |
| `GET` | `/certificates/my` | Applicant | List user's valid verification certificates |
| `GET` | `/certificates/:certNumber/pdf` | Authenticated | Download signed digital certificate PDF |
| `GET` | `/public/verify/:qrToken` | Public | Publicly verify certificate validity via QR token |

For full payload contracts, see [`docs/API-CONTRACT.md`](file:///c:/Users/princ/Documents/Codex/2026-09-09/automate/legal-metrology-platform/docs/API-CONTRACT.md).

---

## 🔒 Security & Production Notes

- **JWT Secret**: Change `JWT_SECRET` in `backend/.env` to a cryptographically secure key before deploying.
- **CORS & Public URLs**: Update `FRONTEND_URL` and `PUBLIC_APP_URL` in `backend/.env` to match your production domain.
- **Persistent Storage**: When hosting the backend on platforms like Render or Railway, attach a persistent volume to `backend/storage/` so SQLite databases and uploaded photos persist across server restarts.

