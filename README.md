# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
# Supreme Academy — School Management System

A production-grade school management platform for a single school in Ghana.
Handles student records, staff, academics, assessments, results, report cards,
fees, scratch-card result access, and role-based portals — all backed by
Supabase.

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Supabase (Postgres + Auth + Edge Functions + Storage)
- **Hosting:** Netlify
- **Currency:** GH₵ (GHS) · **Timezone:** Africa/Accra

---

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Roles & permissions](#roles--permissions)
4. [Tech stack](#tech-stack)
5. [Project structure](#project-structure)
6. [Local development](#local-development)
7. [Environment variables](#environment-variables)
8. [Database schema](#database-schema)
9. [Row Level Security](#row-level-security)
10. [Edge Functions](#edge-functions)
11. [Postgres functions](#postgres-functions)
12. [Scratch-card flow](#scratch-card-flow)
13. [Grading model](#grading-model)
14. [Student activation & login](#student-activation--login)
15. [Deployment](#deployment)
16. [Backups & recovery](#backups--recovery)
17. [Operational runbook](#operational-runbook)
18. [Testing checklist](#testing-checklist)
19. [Troubleshooting](#troubleshooting)
20. [Roadmap](#roadmap)

---

## Overview

Supreme Academy SMS is a single-school platform. It does **not** support
multi-school tenancy. Everything runs against one Postgres database on one
Supabase project, deployed to Netlify as a static SPA.

Key design choices:

- **RLS-first security.** Every sensitive table has Row Level Security
  enabled. The frontend uses only the Supabase anon key. All privileged
  actions go through Edge Functions running with the service role.
- **Server-side grade calculation.** Final scores are computed by a
  Postgres trigger, not the client, so grades can't be forged.
- **Atomic scratch-card redemption.** A single `SECURITY DEFINER`
  Postgres function with `FOR UPDATE` locking guarantees a card can never
  be redeemed more than 3 times, even under concurrent requests.
- **Hashed PINs.** Student login PINs are bcrypt-hashed via an Edge
  Function. Scratch-card PINs are hashed with `crypt()` in Postgres.
  Raw PINs are never stored or logged.
- **Audit trail.** Role changes, grade edits after submission, publishes,
  locks, scratch-card redemptions, and privileged actions are logged.

---

## Features

### Academic records
- Students (with guardians, medical notes, photo, status, class assignment)
- Staff (teaching + non-teaching, employment status, contact details)
- Classes (with optional streams; class teacher; capacity)
- Subjects (per division; core/elective)
- Teaching assignments (teacher × class × subject × term)

### Assessments & results
- Assessments per class × subject × term
- Bulk mark entry with live grade calculation
- Configurable assessment weights (default 40% assessment / 60% exam)
- Configurable grading scales (Nursery/KG descriptive, Primary/JHS 1–9)
- Teacher remarks and Headmaster's remarks per student per term
- Result workflow: draft → submitted → approved → published → locked
- Traceable corrections with full change log
- PDF report cards with school branding

### Finance
- Fee structures per division/class/term (line-item based)
- Auto-generated invoices from fee structures
- Payments (cash, MoMo, bank transfer, cheque, POS, other)
- Payment receipts, refunds, ledgers
- Revenue sharing configuration for scratch-card sales
- Collections dashboard with monthly charts, top debtors, method breakdown

### Scratch cards
- Generate batches with hashed PINs (min 8 digits)
- Per-division pricing: Nursery ₵10, KG ₵10, Primary ₵15, JHS ₵20 (editable)
- Issue to a specific student or keep as open stock
- Invalidate with reason (damaged/lost/fraud)
- Maximum 3 successful result requests per card
- Valid for one term only — no cross-term reuse
- Usage history and reconciliation

### Student portal
- First-visit activation with admission number + date of birth
- 4-digit login PIN (bcrypt-hashed server-side)
- Rate limiting and lockout after 5 failed attempts
- View published results (gated by scratch card)
- Download PDF report card
- View fees, invoices, and payment history

### Admin
- Role-based access control (5 roles)
- User provisioning from within the app
- Role history and audit log
- School settings (name, logo, currency, prices, revenue split)
- Reports (enrollment, finance, performance)

---

## Roles & permissions

| Resource | Super Admin | Headmaster | Teacher | Secretary | Student |
|---|---|---|---|---|---|
| School settings | CRUD | R | – | R | – |
| User roles | CRUD | – | – | – | – |
| Students | CRUD | R | R (own classes) | CRU | R (self) |
| Guardians | CRUD | R | – | CRU | – |
| Staff | CRUD | R | – | CRU | – |
| Classes | CRUD | R | R | R | R |
| Subjects | CRUD | R | R | R | R |
| Teaching assignments | CRUD | R | R (own) | – | – |
| Assessments | CRUD | R | CRU (own) | – | – |
| Scores | CRUD | RU (audited) | CRUD (draft, own) | – | R (published) |
| Remarks | CRUD | CRU | CRU (own classes) | – | R (published) |
| Publish/lock results | R | CRU | – | – | – |
| Fee structures | CRUD | R | – | R | – |
| Invoices/payments | CRUD | R | – | CRU | R (self) |
| Scratch cards | CRUD | R | – | CRU | R (own uses) |
| Audit log | R | R (own) | – | – | – |

`C` = create · `R` = read · `U` = update · `D` = delete
`RU` = read + update · `CRU` = create + read + update

All rules enforced by RLS policies, mirrored in `src/lib/permissions.ts`
for UI gating.

---

## Tech stack

### Frontend
- React 18.3
- TypeScript 5.6 (strict mode)
- Vite 5.4
- Tailwind CSS 4 (beta) with custom theme tokens
- React Router v6
- React Hook Form + Zod
- Recharts for charts
- `@react-pdf/renderer` for report cards
- Lucide React for icons

### Backend
- Supabase Postgres (15.x)
- Supabase Auth (email/password for staff)
- Supabase Edge Functions (Deno)
- Supabase Storage (for photo uploads later)
- Row Level Security on every sensitive table
- pgcrypto for bcrypt hashing

### Hosting & CI
- Netlify for the static SPA
- GitHub for source control
- Netlify auto-deploy on `main` branch push

---

## Project structure
supreme-academy/
├── public/
│ └── assets/
│ └── logos/ # school-logo.svg (drop your file here)
├── src/
│ ├── components/ui/ # design system primitives
│ ├── features/
│ │ ├── auth/ # AuthContext, RequireRole, RoleGate
│ │ ├── students/
│ │ ├── staff/
│ │ ├── academics/
│ │ │ ├── academic-years/
│ │ │ ├── grading/
│ │ │ ├── assessment-weight/
│ │ │ ├── assessments/
│ │ │ ├── mark-entry/
│ │ │ ├── assignments/
│ │ │ ├── classes/
│ │ │ └── subjects/
│ │ ├── results/
│ │ ├── finance/
│ │ │ ├── fee-structures/
│ │ │ ├── invoices/
│ │ │ ├── payments/
│ │ │ ├── ledger/
│ │ │ └── dashboard/
│ │ ├── scratch-cards/
│ │ ├── student-portal/
│ │ ├── users/
│ │ ├── audit/
│ │ ├── reports/
│ │ └── settings/
│ ├── hooks/ # useList, useLookup, etc.
│ ├── layouts/ # AppShell, Sidebar, Topbar
│ ├── lib/ # supabase, env, permissions, format
│ ├── pages/
│ │ ├── LoginPage.tsx
│ │ ├── NotFoundPage.tsx
│ │ └── dashboards/
│ ├── routes/
│ ├── services/
│ │ ├── supabase/ # real backend services
│ │ ├── mock/ # fictional data (dev only)
│ │ └── *.ts # legacy mocks — safe to keep
│ ├── styles/index.css
│ ├── types/
│ ├── utils/
│ ├── App.tsx
│ ├── main.tsx
│ └── vite-env.d.ts
├── supabase/
│ ├── migrations/ # SQL files (also applied via dashboard)
│ ├── functions/ # Edge Functions
│ └── seed.sql
├── .env.example
├── .gitignore
├── netlify.toml
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md


---

## Local development

### Prerequisites
- Node.js 20+
- npm 10+
- A Supabase project (hosted is fine)
- Git

### Setup

```bash
# 1. Clone
git clone https://github.com/YOUR-ORG/supreme-academy.git
cd supreme-academy

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# from Supabase → Settings → API

# 4. Run dev server
npm run dev
# → http://localhost:5173

npm run dev        # Start Vite dev server
npm run build      # Type-check + production build to dist/
npm run preview    # Preview production build locally
npm run typecheck  # Run TypeScript without emitting
npm run lint       # ESLint (if configured)
npm run format     # Prettier

Database schema
27 tables. Core groups:

Identity
profiles — one row per auth user, with role + status

role_history — every role/status change

student_credentials — bcrypt-hashed student login PINs

pin_rate_limit, pin_verify_tokens — rate limiting + proof tokens

School config
school_settings — single-row config

academic_years, terms

grading_scales, grade_bands

assessment_weights — single-row config

People
students, guardians

staff

classes, subjects

teaching_assignments

Academics
assessments

scores

remarks

result_publications

result_change_log

Finance
fee_structures, fee_items

invoices, invoice_lines

payments

Scratch cards
scratch_cards

scratch_card_usages

scratch_card_issuances

System
audit_log

All tables use uuid primary keys (except single-row config tables),
timestamptz for timestamps, foreign keys with ON DELETE rules, unique
constraints, and indexes on hot query columns.

Row Level Security
Every table has RLS enabled. Default is deny-all; explicit policies
grant access per role.

Key principles:

Roles come from app_metadata.role in the JWT — set by an Edge
Function during provisioning, not user-editable.

Students can only read themselves — enforced by
student_id = (select student_id from profiles where id = auth.uid()).

Teachers can only modify their own classes — enforced by joining
through teaching_assignments.

Only headmaster+ can publish or lock results — enforced by role
check in policy.

Direct writes to sensitive tables are blocked — those operations
go through SECURITY DEFINER functions.

To verify RLS is on for all tables:

sql
select relname
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relrowsecurity = false;
Should return nothing.

Edge Functions
Deployed via Supabase dashboard → Edge Functions.

Function	Purpose
provision-user	Super Admin creates a staff account
activate-and-mint-student	Student first-visit: verify + create + sign in
verify-student-pin	Student login: verify PIN, issue proof token
mint-student-session	Exchange proof token for a real session
generate-scratch-cards	Create N cards with hashed PINs
ping	(Optional) warming endpoint
All functions:

Validate the caller's JWT and role server-side

Return { ok: false, reason } on failure — never leak whether a record exists

Are idempotent where possible

Log to audit_log

Postgres functions
Function	Purpose
current_user_role()	Reads role from JWT
is_super_admin(), is_staff(), is_headmaster_or_above()	RLS helpers
lookup_grade(division, score)	Returns grade/label for a score
recalculate_score(score_id)	Recomputes weighted score + grade
redeem_scratch_card(pin, student, term)	Atomic card redemption
verify_scratch_card_pin(pin, student, term)	Read-only PIN check
hash_scratch_pin(pin)	bcrypt hash for generated cards
purge_expired_pin_tokens()	Cleanup (cron)
All SECURITY DEFINER functions use:

set search_path = public, extensions, pg_temp

Minimal grants (usually revoke all from public then explicit grant)

Input validation

Explicit role checks

Scratch-card flow
Generation
Super Admin or Secretary opens Scratch Cards → Generate

Picks division, term, quantity

generate-scratch-cards Edge Function:

Generates an 8-digit random PIN per card

Hashes it with hash_scratch_pin() (Postgres bcrypt)

Inserts into scratch_cards with uses_remaining = 3

Returns the raw PINs to the operator once

Operator saves/prints the PINs. They are not recoverable afterward.

Issuance
Optional: assign a card to a specific student

Unassigned cards can be redeemed by any student (open stock)

Redemption
Student enters PIN on /student/results:

Client calls scratchCardsService.redeem(pin, studentId, termId)

That calls the Postgres function redeem_scratch_card, which:

Locks the matching card row (SELECT ... FOR UPDATE)

Verifies crypt(pin, pin_hash) matches

Verifies term_id matches

Verifies uses_remaining > 0

Decrements uses_remaining atomically

Logs to scratch_card_usages

Returns { ok, uses_remaining }

Concurrency-safe: two simultaneous requests can never exceed 3 uses.

Counting rule
1 use = 1 successful PIN verification that unlocks a specific (student, term).
Refreshing the page or downloading the PDF in the same unlocked session
does not consume additional uses.

Grading model
Assessment weighting
Assessment: 40% (homework, class tests, projects, mid-term)

Exam: 60% (end-of-term)

Total: 100%

Configurable by Super Admin in Assessment Weights

Formula:

text
final = (assessment_raw / assessment_max) × assessment_weight
      + (exam_raw / exam_max) × exam_weight
Rounding
Raw weighted score stored to 2 decimals.
Grade lookup uses round_half_up(final) — 74.5 → 75.

Scales
Primary & JHS (BECE 1–9)

Grade	Range	Label
1	80–100	Excellent
2	70–79	Very Good
3	60–69	Good
4	55–59	Credit
5	50–54	Pass
6	45–49	Weak Pass
7	40–44	Weak Pass
8	35–39	Fail
9	0–34	Fail
Nursery & KG (descriptive)

Grade	Range	Label
E	80–100	Excellent
VG	70–79	Very Good
G	60–69	Good
D	0–59	Developing
All bands are editable by Super Admin — no code changes needed.

Student activation & login
First visit (activation)
Visit /student/activate

Enter admission number + date of birth

activate-and-mint-student Edge Function:

Verifies identity (admission + DOB)

Creates an auth.users row with a synthetic email
<studentId>@students.supreme.local

Hashes the chosen 4-digit PIN with bcrypt, stores in student_credentials

Returns credentials

Client signs in with those credentials → real session issued

Subsequent logins
Visit /student/login

Enter admission number + 4-digit PIN

verify-student-pin Edge Function:

Looks up student

Checks lockout (5 failed attempts → 15-minute lockout)

Compares bcrypt.compare(pin, pin_hash)

On success: creates a short-lived proof token (60s TTL)

Client calls mint-student-session with the proof → gets fresh credentials

Client signs in with those credentials

Security properties
4-digit PINs are treated as low-security credentials

Recovery is in-person at the school (Secretary or Super Admin resets)

Generic error messages — never reveals whether a student record exists

Rate limiting enforced at the Edge Function + pin_rate_limit table

Deployment
Netlify (recommended)
Connect the GitHub repo to Netlify

Build command: npm run build

Publish directory: dist

Add environment variables (see Environment variables)

Add netlify.toml for SPA fallback (already in repo):

toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
Netlify auto-deploys on every push to main

Custom domain
Netlify → Domain management → Add domain

Point DNS to Netlify's nameservers

SSL auto-provisions via Let's Encrypt

Update Supabase Auth URLs to include the custom domain

Supabase Auth URL configuration
Authentication → URL Configuration

Site URL: https://supremeacademy.netlify.app

Redirect URLs:

https://supremeacademy.netlify.app/**

http://localhost:5173/**

Backups & recovery
Backups
Supabase runs daily backups automatically

Point-in-Time Recovery (PITR) available on Pro plan

Verify backups weekly: Database → Backups

Manual export
bash
# from a machine with psql installed
pg_dump --host=db.YOUR-PROJECT.supabase.co \
        --username=postgres \
        --dbname=postgres \
        --no-owner \
        --format=custom \
        --file=supreme-$(date +%Y%m%d).dump
Store offline. Never commit.

Recovery procedure
Do not restore directly to production

Create a staging Supabase project

Restore the backup there

Verify the data

If correct, apply the missing transactions to production manually (or
schedule a maintenance window to swap)

Operational runbook
Daily
Check Netlify latest deploy

Scan Supabase Logs → Auth for error spikes

Scan Supabase Logs → Edge Functions for failures

Weekly
Verify the last 7 daily backups exist

Check disk usage (Supabase → Reports)

Review Netlify deploy history

Monthly
Review audit_log for unusual actions

Export a data snapshot

Rotate any stale test accounts

Check API error rates (Supabase → Reports → API)

Emergency: suspected breach
Supabase → Authentication → Users → force sign out the affected user

Reset their password

Review audit_log for their actions in the last 24h

If role escalation is suspected, check role_history

Emergency: app down
Netlify → Deploys → Rollback to last known good

Check https://status.supabase.com

Check https://www.netlifystatus.com

Testing checklist
Pre-deploy (every release)
□ npm run typecheck passes
□ npm run build passes
□ npm run preview — open the built app and click through all roles
RLS verification
□ Student A cannot access Student B's data
□ Teacher can only modify their own classes' scores
□ Secretary cannot edit published results
□ Former staff cannot access the system
□ Anonymous user cannot assign roles
Scratch cards
□ A card is capped at 3 uses
□ A card from Term 1 does not unlock Term 2
□ Invalidated cards are rejected
□ Cross-division use is rejected
□ Two concurrent redemptions cannot exceed the limit
Student flow
□ Activation succeeds with valid admission + DOB
□ Wrong DOB → generic error
□ 5 wrong PIN attempts → lockout
□ Locked account is rejected until lockout expires
□ Successful login lands on /student
Grading
□ Weighted score matches manual calculation
□ Rounding is half-up
□ Grade bands are applied correctly
□ Changing grading scale affects new scores only
Finance
□ Invoice generates from the correct fee structure
□ Partial payments update invoice status
□ Full payment marks invoice paid
□ Ledger balances correctly
□ Payment methods appear in reports
Troubleshooting
Empty lists after sign-in
Cause: RLS blocking queries because the JWT lacks app_metadata.role.
Fix: Sign out fully, then sign back in. If it persists:

sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'YOUR_ROLE')
where email = 'user@supreme.edu.gh';
Then sign out and back in.

"Cannot find module" for a Supabase service
Cause: file wasn't created or has case mismatch.
Fix: dir src\services\supabase — confirm the file exists with the exact
casing you import.

Netlify build fails on ignoreDeprecations
Cause: tsconfig.app.json contains an invalid value.
Fix: delete the ignoreDeprecations line.

Scratch-card PIN is rejected
Verify the PIN was typed correctly (8 digits)

Verify the card is for the currently selected term

Verify the card hasn't been used 3 times

Check scratch_cards row in Supabase for invalidated_at or uses_remaining = 0

Edge Function returns 401
Cause: caller's JWT is stale.
Fix: sign out and back in to refresh the token.

Student can't activate
Verify admission number matches exactly (case-insensitive)

Verify DOB matches the record (ISO format YYYY-MM-DD)

Verify the student's status is active

Check the student hasn't already been activated

Roadmap
Planned
Attendance module (schema exists, UI disabled)

Notifications (in-app + email)

Parent portal (read-only access to their child's data)

Bulk student import (CSV)

Photo uploads (Supabase Storage)

Timetable management

Library & inventory

Considered
SMS notifications for fees due

Integration with Ghana Education Service reporting

Multi-campus support (would require schema changes)

License
Proprietary — © Supreme Academy. All rights reserved.

For support, contact the school's IT administrator.

Acknowledgements
Built with care for Supreme Academy, Accra, Ghana.

text

---

## Now — Terms & Conditions and Privacy Policy

Before I write these, I need decisions on **legal/operational facts**. These aren't optional — a T&C that's wrong is worse than no T&C.

### Questions for you

**1. Legal entity**
- Is Supreme Academy a registered business, a sole proprietorship, a limited company, or a school board?
- If registered, what's the entity name and registration number?
- Who is the "data controller" — the school, the proprietor, or a specific individual?

**2. Jurisdiction**
- Ghana only?
- Which court has jurisdiction (Accra High Court, or a specific district)?

**3. Data Protection Act**
- Ghana's **Data Protection Act, 2012 (Act 843)** requires registration with the **Data Protection Commission** for any organization processing personal data.
- Have you registered? If not, I'll draft the policy with a "registration pending" placeholder.

**4. Age of students**
- The app handles data on minors. Ghana's Act 843 doesn't have a specific children's-data provision like GDPR Article 8, but the policy should still:
  - Explain that guardians provide consent
  - Explain what data is collected on minors and why
  - Give guardians a way to request access/deletion
- Who holds guardian consent — the school, or your app?

**5. Data retention**
- How long after a student leaves does the school keep records? (Ghana Education Service usually expects 5–10 years.)
- After that period, are records destroyed or anonymized?

**6. Third parties who will see the data**
Check which of these apply:
- Supabase (hosting + database — US-based)
- Netlify (hosting — US-based)
- Any payment gateway (if you integrate one — Paystack, Hubtel, MTN MoMo API?)
- Any email provider (for confirmation emails)
- Any SMS provider

**7. Money**
- Fee amounts are stored — is any actual money moved through the app, or is it just a record-keeping tool?
- If money moves through the app: who is the merchant of record? Which processor?
- If it's only record-keeping: say so explicitly, because that removes a huge liability category.

**8. User obligations**
- What happens if a teacher shares their login? Suspend the account?
- What happens if a student shares their scratch-card PIN?
- What happens if a user uploads false information?

**9. Liability cap**
- Do you want to cap damages at, say, GH₵1,000, or exclude all liability except what Ghanaian law forbids excluding?

**10. Contact details for the policy**
- Email address for privacy requests?
- Physical address for legal notices?
- Phone number?

**11. Effective date**
- What date do you want these documents to take effect?

**12. Versioning**
- Will you notify users when the policy changes? How?

---

### What I'll draft once you answer

**A. Terms & Conditions** (~2,000 words)
- Acceptance
- Eligibility (staff accounts, student accounts, guardian consent)
- Account security (PINs, passwords, sharing)
- Acceptable use
- Intellectual property
- Fees and payment (only if relevant)
- Availability and changes to the service
- Termination
- Disclaimers
- Limitation of liability
- Indemnity
- Dispute resolution & governing law
- Changes to these terms
- Contact

**B. Privacy Policy** (~2,500 words)
- Introduction and scope
- Data controller
- What data we collect (staff, students, guardians)
- Children's data and guardian consent
- How we use the data
- Legal bases (contract, consent, legitimate interest, legal obligation)
- Data sharing (Supabase, Netlify, others)
- International transfers
- Data retention
- Your rights (access, correction, deletion, portability, objection)
- How to exercise rights
- Security measures
- Breach notification
- Cookies and tracking
- Changes to this policy
- Contact for privacy queries (Data Protection Officer, if applicable)

---

### Reply with

Answer each of the 12 questions above with as much detail as you can. If something doesn't apply yet (like a payment gateway), say "not applicable yet."

Once I have answers, I'll draft both documents in the same style as the README — production-grade, not template filler — and give you a place to put them in the app (`/terms`, `/privacy` public routes) plus plaintext copies for the school's records.

