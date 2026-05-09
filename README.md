# FixItNow & Loans API

**Tayseer Arabian Company** — Digital Finance Application Platform

Built with **Node.js · TypeScript · Express · TypeORM · MySQL**

---

## Table of Contents

- [Overview](#overview)
- [Finance Products](#finance-products)
- [Application Flow](#application-flow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [External Integrations](#external-integrations)
- [Eligibility Rules](#eligibility-rules)
- [Database](#database)

---

## Overview

A fully digital loan/finance onboarding system that guides applicants through a multi-step flow covering identity verification, employment, income, finance calculation, and final submission.

---

## Finance Products

| Product | Description | Final Step |
|---|---|---|
| **FixItNow** | Maintenance finance — user uploads a maintenance invoice and selects a maintenance center | File upload |
| **DebtPurchase** | Debt purchase finance — user provides IBAN for bank verification | IBAN verification via LeanTech |

---

## Application Flow

```
Step 2 → Identity Verification     (Nafath MFA + Yakeen birthdate)
Step 3 → Contact Verification      (Tahaqq mobile check + OTP + Personal Info)
Step 4 → Job Information           (Sector, job type, region, city)
Step 5 → GOSI / Income             (Dakhli salary data + income & expenses)
Step 6 → Finance Calculator        (Amount, tenure, APR, fees)
Step 7 → Know Us                   (Branch, referral, PEP declaration)
Step 8 → Final Step
         ├── FixItNow     → File upload + maintenance center
         └── DebtPurchase → IBAN verification
Step 9 → Completed
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Language | TypeScript 5 |
| Framework | Express 4 |
| ORM | TypeORM 0.3 |
| Database | MySQL 8 |
| Validation | class-validator + class-transformer |
| Cache | node-cache (in-memory) |
| File Upload | Multer |
| Email | Nodemailer |
| HTTP Client | Axios |

---

## Project Structure

```
fixitnow-api/
├── .env.example
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                     # Express app entry point
    ├── config/
    │   └── database.ts              # TypeORM MySQL DataSource
    ├── entities/                    # TypeORM entities (DB tables)
    │   ├── Applicant.ts
    │   ├── PersonalInformation.ts
    │   ├── JobInformation.ts
    │   ├── IncomeInformation.ts
    │   ├── CalculatorInformation.ts
    │   ├── KnowusInformation.ts
    │   ├── FinalStepInformation.ts
    │   ├── IBANVerification.ts
    │   ├── TermsAndConditions.ts
    │   ├── MaintenanceCenter.ts
    │   ├── NafazRequest.ts / NafazLog.ts
    │   ├── YakeenUserData.ts / YakeenLog.ts
    │   ├── TahaqqRecord.ts / TahaqqLog.ts
    │   ├── GOSIRecord.ts / GOSILog.ts
    │   ├── OtpLog.ts
    │   └── ErrorLog.ts
    ├── dto/
    │   └── index.ts                 # All request DTOs (class-validator)
    ├── middleware/
    │   └── validate.ts              # DTO validation middleware
    ├── services/
    │   ├── nafazService.ts          # Nafath / Absher MFA
    │   ├── yakeenService.ts         # Yakeen ELM (identity data)
    │   ├── tahaqqService.ts         # Tahaqq ELM (mobile ownership)
    │   ├── dakhliService.ts         # Dakhli GOSI + Gov Payslip
    │   ├── leanService.ts           # LeanTech IBAN verification
    │   ├── otpService.ts            # SMS + Email OTP
    │   └── appService.ts            # Core business logic (all steps)
    ├── controllers/
    │   └── fixitController.ts       # All API request handlers
    ├── routes/
    │   └── fixitRoutes.ts           # All route definitions
    └── utils/
        └── helpers.ts               # Response, cache, IP, OTP, dates
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- npm 9+

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-org/fixitnow-api.git
cd fixitnow-api

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# 4. Create the MySQL database
mysql -u root -p -e "CREATE DATABASE fixitnow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 5. Start in development mode (auto-syncs DB schema)
npm run dev
```

The server will start at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values.

```env
# Server
PORT=3000
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fixitnow

# Nafath (Absher MFA)
NAFAZ_URL=
NAFAZ_APP_ID=
NAFAZ_APP_KEY=
NAFAZ_SERVICE=

# Yakeen (ELM)
YAKERN_USERNAME=
YAKERN_PASSWORD=
YAKERN_APP_ID=
YAKERN_APP_KEY=

# Tahaqq (ELM)
TAHAQQ_URL=
TAHAQQ_APP_ID=
TAHAQQ_APP_KEY=
TAHAQQ_SERVICE_KEY=
TAHAQQ_ORGANIZATION_NUMBER=

# Dakhli / GOSI (ELM)
DAKHLI_APP_ID=
DAKHLI_APP_KEY=
DAKHLI_PLATFORM_KEY=
DAKHLI_ORGANIZATION_NUMBER=

# Government Payslip (ELM)
GOV_APP_ID=
GOV_APP_KEY=
GOV_PLATFORM_KEY=
GOV_ORGANIZATION_NUMBER=

# LeanTech IBAN
LEAN_CLIENT_ID=
LEAN_CLIENT_SECRET=
LEAN_APP_TOKEN=

# Email (SMTP)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# SMS
SMS_API_URL=
SMS_API_KEY=
SMS_SENDER=AL-TAYSEER

# File Upload
UPLOAD_DIR=uploads/fixitnow
```

---

## API Endpoints

All routes are prefixed with `/api/fixitnow`

### Step 1 — Terms & Conditions

| Method | URL | Description |
|---|---|---|
| `GET` | `/terms_and_conditions` | Get web T&C list |
| `POST` | `/terms_and_conditions` | Validate selected T&C |
| `GET` | `/terms_and_conditions_mobile` | Get mobile T&C list |
| `POST` | `/terms_and_conditions_mobile` | Validate selected mobile T&C |

### Step 2 — Identity Verification

| Method | URL | Description |
|---|---|---|
| `POST` | `/IDVerification` | Start Nafath (continue existing session) |
| `POST` | `/SendIDVerification` | Start Nafath (force fresh session) |
| `POST` | `/NafathCallback` | Nafath JWT callback webhook |
| `GET` | `/StatusCheck` | Poll Nafath transaction status |
| `POST` | `/Add_Yakeen_data` | Fetch Yakeen identity data |

### Step 3 — Contact Verification & Personal Info

| Method | URL | Description |
|---|---|---|
| `POST` | `/Mobile_Tahaqqaq` | Verify mobile ownership (Tahaqq) |
| `POST` | `/Send_Mobile_SMS` | Send mobile OTP |
| `POST` | `/Confirm_Mobile_OTP` | Confirm mobile OTP |
| `POST` | `/Send_Email_OTP` | Send email OTP |
| `POST` | `/Confirm_Email_OTP` | Confirm email OTP |
| `GET` | `/PersonalInformation` | Get Yakeen user data |
| `POST` | `/PersonalInformation` | Submit personal information |

### Step 4 — Job Information

| Method | URL | Description |
|---|---|---|
| `POST` | `/JobInformation` | Submit job information |

> **Note:** Dropdown data (sectors, regions, cities, job types) is served from Oracle DB via the existing Python layer and is not migrated.

### Step 5 — GOSI & Income

| Method | URL | Description |
|---|---|---|
| `POST` | `/GOSIInformation` | Fetch salary data from Dakhli/GOSI |
| `POST` | `/IncomeInformation` | Submit income & expenses |

### Step 6 — Finance Calculator

| Method | URL | Description |
|---|---|---|
| `POST` | `/CalculatorInformation` | Submit finance calculator data |

### Step 7 — Know Us

| Method | URL | Description |
|---|---|---|
| `POST` | `/KnowUsInformation` | Submit know-us & PEP data |

### Step 8 — Final Step

| Method | URL | Description |
|---|---|---|
| `POST` | `/FinalStepInformation` | FixItNow: upload file + select maintenance center |
| `POST` | `/IBANVerificationView` | DebtPurchase: verify IBAN via LeanTech |

---

## Request / Response Format

All responses follow this structure:

```json
{
  "status": 200,
  "message": "Success",
  "message_ar": "نجاح",
  "data": {},
  "errors": {}
}
```

Error responses:

```json
{
  "status": 400,
  "message": "Bad Request",
  "message_ar": "",
  "data": [],
  "errors": {
    "errors": ["field: error message"]
  }
}
```

---

## External Integrations

| Service | Provider | Purpose |
|---|---|---|
| **Nafath** | Ministry of Interior (NCSC) | Identity MFA via Absher app push |
| **Yakeen** | ELM | Validate ID/Iqama + retrieve full name AR/EN |
| **Tahaqq** | ELM | Verify mobile number is linked to national ID |
| **Dakhli (GOSI)** | ELM | Fetch employment & salary data (private sector) |
| **Government Payslip** | ELM | Salary data fallback for government employees |
| **LeanTech IBAN** | LeanTech | Verify IBAN ownership and account active status |

### Nafath Token Flow

```
Client            Server          Nafath
  │                  │               │
  │──POST /IDVerification──▶         │
  │                  │──POST request─▶
  │                  │◀──{transId}───│
  │◀──{transId}──────│               │
  │                  │               │
  │  (user approves in Absher app)   │
  │                  │◀──callback JWT│
  │                  │  (status=COMPLETED)
  │──GET /StatusCheck▶               │
  │◀──{status: "COMPLETED"}──────────│
```

### Yakeen Token Cache

The Yakeen access token is cached in memory with TTL derived from the token's `expires_on` field, avoiding repeated login calls.

---

## Eligibility Rules

### Pre-verification Checks (Oracle)

- **Blacklist** — national ID must not exist in `CIF_BLACK_LIST`
- **Pending Loan** — no active loan with status `Under Progress`
- **7-Day Cooldown** — cannot apply within 7 days of a completed application

### Age

- Applicant must be **19 years or older**

### Employment Duration

| Nationality | Sector | Minimum |
|---|---|---|
| Saudi | Government / Military | 3 months |
| Saudi | Private | 6 months |
| Non-Saudi | Any | 12 months |

### Minimum Monthly Income

| Nationality | Employment Status | Minimum (SAR) |
|---|---|---|
| Saudi | Employed | 3,800 |
| Saudi | Retired | 7,000 |
| Non-Saudi | Employed | 6,000 |

### Minimum Expenses

| Field | Minimum (SAR) |
|---|---|
| Transportation | 100 |
| Health | 30 |
| Communications | 60 |
| Food | 75 |

---

## Database

TypeORM is configured with `synchronize: true` in development mode, which auto-creates/updates tables from entities.

For production, set `synchronize: false` and use migrations:

```bash
# Generate a migration
npm run typeorm migration:generate -- -n InitialMigration

# Run migrations
npm run typeorm migration:run
```

### Key Tables

| Table | Description |
|---|---|
| `fix_it_now_applicant` | Root application record, tracks current step |
| `fix_it_now_personal_information` | Mobile, email, beneficial owner |
| `fix_it_now_job_information` | Sector, job type, region, city |
| `fix_it_now_income_information` | Salary, expenses, mortgage |
| `fix_it_now_calculator_information` | Finance terms, fees, APR |
| `fix_it_now_knowus_information` | Branch, referral, PEP |
| `fix_it_now_finalstep_information` | File upload + maintenance center |
| `iban_verification` | IBAN + bank details |
| `fix_it_nafaz_request` | Active Nafath sessions |
| `fix_it_now_yakeen_user_data` | Cached identity data from Yakeen |
| `fix_it_now_gosi` | Cached GOSI/salary data |
| `otp_log` | OTP audit trail (mobile + email) |

---

## OTP Behavior

- OTPs are **4-digit**, zero-padded random numbers
- Stored in **memory cache** with 60-second TTL
- Also persisted in `otp_log` as fallback (valid for 2 minutes)
- On successful confirmation: cache key deleted + DB record deleted

---

## Health Check

```
GET /health
→ { "status": "ok" }
```
