# ⚖️ e-Metrology | National Legal Metrology Verification System

A unified digital platform for the **Department of Legal Metrology** to manage commercial instrument registrations, verification workflows, on-site field inspections, automated QR-coded digital certificates, and instant public verification across **Web and Mobile (Android + PWA)**.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Role-Based Portals & Workflows](#-role-based-portals--workflows)
- [System Architecture & Tech Stack](#-system-architecture--tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start: Web Setup](#-quick-start-web-setup)
- [📱 Mobile App: Android Studio & APK Guide](#-mobile-app-android-studio--apk-guide)
  - [1. Opening in Android Studio](#1-opening-in-android-studio)
  - [2. Running on Android Emulator](#2-running-on-android-emulator)
  - [3. Running on a Physical Phone](#3-running-on-a-physical-phone)
  - [4. Generating the Installable APK](#4-generating-the-installable-apk)
  - [5. Continuous Development Sync](#5-continuous-development-sync)
- [🌐 Progressive Web App (PWA)](#-progressive-web-app-pwa)
- [🔐 Pre-Seeded Demo Credentials](#-pre-seeded-demo-credentials)
- [🔄 End-to-End Verification Lifecycle](#-end-to-end-verification-lifecycle)
- [📁 Project Directory Structure](#-project-directory-structure)
- [📡 API Reference](#-api-reference)
- [🔒 Security & Production Guidelines](#-security--production-guidelines)

---

## 🌟 Overview

The **National Legal Metrology Verification Portal (e-Metrology)** digitizes the end-to-end statutory verification and stamping lifecycle for commercial weights and measures under the *Legal Metrology Act, 2009*.

It provides modern role-based workspaces for **Traders/Manufacturers**, **Legal Metrology Officers (LMO)**, **Government Approved Test Centres (GATC)**, and **Administrators**, coupled with on-site mobile inspection tools, official government-grade PDF certificate issuance, and public QR verification.

---

## 🚀 Key Features

* **Modern Design System**: Clean light UI with responsive metrics, status-coded cards, and micro-interactions.
* **4 Role-Based Workspaces**: Tailored dashboards for Applicants, LMO Officers, GATC Test Labs, and Administrators.
* **Mobile-First Responsive Drawer**: Slide-out navigation drawer with safe-area notch insets for iOS and Android devices.
* **Cross-Platform Mobile App**: Fully packaged native Android application powered by **Capacitor** alongside Progressive Web App (PWA) installability.
* **Smart Verifier Assignment**: Workload-balanced allocation engine matching verifiers by district, state, and active queue counts.
* **Field Inspection Suite**: On-site inspection desk with standard vs. observed reading comparison, seal logging, and evidence photo uploads.
* **Official PDF Certificate Generator**: High-resolution bilingual digital certificates rendered with security borders, national seals, validity indicators, and cryptographic QR hashes.
* **Multi-Identifier Public Verification**: Public `/verify` portal allowing instant lookup via **Certificate Number**, **Application Number**, **Instrument Serial Number**, or **QR Token**.
* **Zero-Config Database**: Self-initializing SQLite engine (`better-sqlite3`) running in high-performance Write-Ahead Logging (WAL) mode with auto-seeding.

---

## 👥 Role-Based Portals & Workflows

```text
┌─────────────────┐      Submits Application      ┌──────────────────────┐
│    Applicant    │ ────────────────────────────> │ Admin / Allocator    │
│ (Manufacturer)  │                               └──────────┬───────────┘
└─────────────────┘                                          │ Assigns Inspector
                                                             ▼
┌─────────────────┐      Issues Certificate       ┌──────────────────────┐
│  Public Portal  │ <──────────────────────────── │ Legal Metrology      │
│  (/verify)      │      (Signed PDF + QR Code)   │ Officer / GATC Lab   │
└─────────────────┘                               └──────────────────────┘
```

1. **Applicant Portal (Trader / Manufacturer)**
   - Register commercial weighing and measuring instruments with model and serial numbers.
   - Submit new verification or re-verification applications with preferred scheduling dates.
   - Track progress across a real-time visual 5-stage timeline (`Submitted` ➔ `Assigned` ➔ `Inspection` ➔ `Result` ➔ `Certificate`).
   - Download signed digital PDF certificates for all verified applications.

2. **Legal Metrology Officer (LMO) & GATC Laboratory**
   - View assigned inspection queue and daily scheduled jobs.
   - Perform on-site field inspections with observed vs. standard calibration readings.
   - Upload photographic evidence and log physical seal conditions.
   - Submit inspection findings to automatically generate or reject certificates.

3. **Administrator Portal**
   - Monitor real-time analytics: verification rate, pendency queue, expiring certificates, and area-wise workload.
   - Assign/reassign inspection jobs to officers based on jurisdiction and current workload.
   - Manage user accounts (Officers, GATC centres, Admins) with self-deactivation protection.
   - Review immutable system audit logs.

4. **Public Verification (`/verify`)**
   - Open verification endpoint accessible without login.
   - Scan physical certificate QR codes or search by Certificate Number, Application Number, or Serial Number.

---

## 🛠️ System Architecture & Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5 | Modular SPA with custom responsive design system |
| **Mobile Runtime** | Capacitor 8 | Native Android wrapper and device bridge |
| **Backend** | Node.js, Express (ESM) | REST API with JWT authentication & role-based middleware |
| **Database** | SQLite (`better-sqlite3`) | Fast embedded relational database with WAL mode |
| **Certificate Engine** | `PDFKit`, `QRCode` | Dual-border official PDF rendering with embedded QR code |
| **File Storage** | `Multer` | Secure on-disk storage for evidence images and certificates |

---

## 📋 Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher
- **Android Studio** *(Optional, for Android App / APK build)*: ([Download Android Studio](https://developer.android.com/studio))

---

## ⚡ Quick Start: Web Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd legal-metrology-platform
```

### 2. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
> **Backend URL**: `http://localhost:4000` (Database automatically seeds at `backend/storage/legal-metrology.db`).

### 3. Start Frontend Web App
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
> **Frontend URL**: `http://localhost:5173`

---

## 📱 Mobile App: Android Studio & APK Guide

The project includes an Android application project located in [`frontend/android`](./frontend/android).

### 1. Opening in Android Studio
1. Launch **Android Studio**.
2. Click **Open** and select the **`frontend/android`** folder inside this repository:
   ```text
   frontend/android
   ```
3. Wait for Android Studio to finish **Gradle Sync** (shows *`BUILD SUCCESSFUL`* in the bottom status bar).

### 2. Running on Android Emulator
1. Open **Device Manager** in Android Studio (top-right toolbar) and create/launch a virtual device (e.g. *Pixel 7 / Android 14*).
2. Ensure your backend is running (`npm run dev` in `backend`).
3. Click the green **▶ Run** button (or press `Shift + F10`).
4. The **e-Metrology** app will install and open in the emulator.
   > **Note**: The app automatically routes API calls to `http://10.0.2.2:4000/api/v1` on Android emulators so no manual IP configuration is required.

### 3. Running on a Physical Phone
1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect your phone to your computer via USB.
3. Select your phone in Android Studio's top device selector and click **▶ Run**.

### 4. Generating the Installable APK
To create a standalone `.apk` file that can be installed on any Android device:
1. In Android Studio's top menu, click:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. When the build completes, click the **locate** link in the popup notification.
3. Your installable APK will be ready at:
   ```text
   frontend/android/app/build/outputs/apk/debug/app-debug.apk
   ```

### 5. Continuous Development Sync
Whenever you modify React UI code in `frontend/src/`, run:
```bash
cd frontend
npm run build:mobile
```
This builds the web bundle and syncs assets into the Android native project.

---

## 🌐 Progressive Web App (PWA)

The web frontend includes a Web App Manifest ([`manifest.json`](./frontend/public/manifest.json)). Mobile users visiting `http://localhost:5173` via mobile Chrome or Safari can tap **Add to Home Screen** / **Install App** to install the application without going through an app store.

---

## 🔐 Pre-Seeded Demo Credentials

The database initializes with test accounts across all roles (all passwords: `Pass@123`):

| Role | Email | Password | Primary Functions |
| :--- | :--- | :--- | :--- |
| **Applicant** | `applicant@example.com` | `Pass@123` | Register instruments, apply for verification, download certificates |
| **LMO Officer** | `officer@metrology.gov` | `Pass@123` | Inspect instruments, upload evidence, issue/reject stamps |
| **GATC Lab** | `gatc@metrology.gov` | `Pass@123` | Authorized third-party test centre inspection desk |
| **Admin** | `admin@metrology.gov` | `Pass@123` | Allocate officers, manage accounts, review audit trails |

---

## 🔄 End-to-End Verification Lifecycle

```text
1. [Applicant] Register instrument (e.g. Weighing Scale ES-10001) -> Submit Application
   └── Generates: Application Number (e.g., VER-2026-0001)

2. [Admin] Review pending queue -> Assign to LMO Officer / GATC with inspection date
   └── Status updates to: ASSIGNED

3. [Officer] Open assigned job -> Record observed reading (10.00 kg) vs standard reading (10.00 kg)
   └── Upload photo evidence -> Submit with PASS result

4. [System] Automatically generates tamper-proof PDF certificate with QR code
   └── Certificate Number (e.g., LMS-2026-0001)

5. [Applicant & Public] Download signed PDF certificate from dashboard or verify via /verify/LMS-2026-0001
```

---

## 📁 Project Directory Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── db.js                 # SQLite schema, tables & automatic seed data
│   │   ├── server.js             # Express API server, routes, CORS & PDF engine
│   │   ├── middleware/           # JWT auth & audit logging middleware
│   │   └── routes/               # Modular route handlers (auth, admin, apps, officer, certs)
│   ├── storage/                  # SQLite database, uploaded photos & generated PDFs
│   └── package.json
├── frontend/
│   ├── android/                  # Native Android Studio Project (Capacitor)
│   │   ├── app/                  # Android app sources, manifest & resources
│   │   └── build.gradle          # Android build configuration
│   ├── public/
│   │   └── manifest.json         # PWA Web App Manifest
│   ├── src/
│   │   ├── components/           # UI components (PageHeader, Modal, StatusTimeline, Icons)
│   │   ├── pages/                # Admin, Officer & Profile views
│   │   ├── services/             # Dynamic API client auto-routing web & mobile
│   │   ├── styles/               # Bento Light theme & mobile drawer responsive CSS
│   │   ├── App.jsx               # Master state, role routing & public verify views
│   │   └── main.jsx
│   ├── capacitor.config.json     # Capacitor mobile container configuration
│   └── package.json
├── docs/
│   └── API-CONTRACT.md           # REST API endpoints & request/response schemas
└── README.md
```

---

## 📡 API Reference

Base URL: `http://localhost:4000/api/v1`

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Login with credentials & receive JWT token |
| `POST` | `/auth/register` | Public | Register a new applicant account |
| `GET` | `/instruments` | Authenticated | List registered instruments |
| `POST` | `/instruments` | Applicant | Register a new weighing / measuring instrument |
| `GET` | `/applications/my` | Applicant | Retrieve user's applications with certificate details |
| `POST` | `/applications` | Applicant | Submit a new verification application |
| `GET` | `/admin/applications` | Admin | List all applications with status & district filters |
| `PATCH`| `/admin/assign/:id` | Admin | Assign verifier and scheduled date |
| `GET` | `/officer/jobs` | Officer / GATC | List assigned inspection jobs |
| `POST` | `/officer/inspection/:id` | Officer / GATC | Submit inspection report and generate certificate |
| `GET` | `/certificates/my` | Applicant | List issued digital verification certificates |
| `GET` | `/certificates/download/:id`| Authenticated | Download official certificate PDF |
| `GET` | `/certificates/verify/:token` | Public | Verify authenticity by Certificate No, App No, Serial No, or QR Token |

Full API documentation available in [`docs/API-CONTRACT.md`](./docs/API-CONTRACT.md).

---

## 🔒 Security & Production Guidelines

1. **Environment Secrets**: Update `JWT_SECRET` in `backend/.env` with a strong cryptographic key before deploying.
2. **CORS & Domain URLs**: Configure `FRONTEND_URL` and `PUBLIC_APP_URL` in `backend/.env` to match your deployed domains.
3. **Data Persistence**: Ensure the `backend/storage/` folder is mounted to a persistent volume when hosting on cloud container providers (e.g. Render, Railway, AWS ECS).
4. **Android Production Signing**: For Google Play Store publishing, generate a release keystore in Android Studio via **Build > Generate Signed Bundle / APK**.
