# Supreme Academy — School Management System

A production-grade school management platform for a single school in Accra, Ghana.
Handles student records, staff, academics, assessments, results, report cards,
fees, scratch-card result access, and role-based portals — all backed by Supabase.

**Live:** https://supremeacademy.netlify.app

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Supabase (Postgres + Auth + Edge Functions)
- **Hosting:** Netlify
- **Currency:** GH₵ (GHS)
- **Timezone:** Africa/Accra

---

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Login model](#login-model)
4. [Roles & permissions](#roles--permissions)
5. [Tech stack](#tech-stack)
6. [Project structure](#project-structure)
7. [Local development](#local-development)
8. [Environment variables](#environment-variables)
9. [Database schema](#database-schema)
10. [Row Level Security](#row-level-security)
11. [Edge Functions](#edge-functions)
12. [Postgres functions](#postgres-functions)
13. [Scratch-card flow](#scratch-card-flow)
14. [Grading model](#grading-model)
15. [Student activation & login](#student-activation--login)
16. [Staff provisioning](#staff-provisioning)
17. [Dashboard & Settings](#dashboard--settings)
18. [Deployment](#deployment)
19. [Backups & recovery](#backups--recovery)
20. [Operational runbook](#operational-runbook)
21. [Testing checklist](#testing-checklist)
22. [Troubleshooting](#troubleshooting)
23. [Roadmap](#roadmap)

---

## Overview

Supreme Academy SMS is a single-school platform. It does **not** support
multi-school tenancy. Everything runs against one Postgres database on one
Supabase project, deployed to Netlify as a static SPA.

**Key design choices:**

- **RLS-first security.** Every sensitive table has Row Level Security enabled.
  The frontend uses only the Supabase anon key. All privileged actions go
  through Edge Functions running with the service role.
- **Server-side grade calculation.** Final scores are computed by a Postgres
  trigger, not the client, so grades can't be forged.
- **Atomic scratch-card redemption.** A single `SECURITY DEFINER` Postgres
  function with `FOR UPDATE` locking guarantees a card can never be redeemed
  more than 3 times, even under concurrent requests.
- **Hashed PINs.** Student login codes are bcrypt-hashed via an Edge Function.
  Scratch-card PINs are hashed with `crypt()` in Postgres. Raw PINs are never
  stored or logged.
- **Synthetic emails.** Staff sign in with a Staff ID (`HEAD001`, `TCH042`,
  `SEC003`) — the app converts that to an internal email address behind the
  scenes. Users never see or type an email.
- **Audit trail.** Role changes, grade edits after submission, publishes,
  locks, scratch-card redemptions, and privileged actions are logged.

---

## Features

### Academic records
- Students (with guardians, photo, status, class assignment)
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
- Payment receipts, ledgers, balances, arrears
- Revenue sharing configuration for scratch-card sales
- Collections dashboard with monthly charts, top debtors, method breakdown

### Scratch cards
- Generate batches with hashed PINs (8 digits)
- Per-division pricing: Nursery ₵10, KG ₵10, Primary ₵15, JHS ₵20 (editable)
- Issue to a specific student or keep as open stock
- Invalidate with reason (damaged/lost/fraud)
- Maximum 3 successful result requests per card
- Valid for one term only — no cross-term reuse
- Usage history and reconciliation

### Student portal
- First-visit activation with admission number + date of birth
- Student chooses a 4-digit code on first visit (bcrypt-hashed server-side)
- Subsequent logins: admission number + 4-digit code
- View published results (gated by scratch card)
- Download PDF report card
- View fees, invoices, and payment history

### Admin
- Role-based access control (5 roles)
- User provisioning from within the app
- Auto-generated Staff IDs (`HEAD###`, `TCH###`, `SEC###`)
- Forced password change on first staff login
- Role history and audit log
- School settings hub with grouped link cards
- Reports (enrollment, finance, performance)

---

## Login model

| Who | Credentials | Notes |
|---|---|---|
| **Super Admin** | Personal email + password | No Staff ID. Created manually in Supabase. |
| **Headmaster** | `HEAD001` + password | Behind the scenes: `head001@supremeacademy.edu.gh` |
| **Teacher** | `TCH001` + password | Behind the scenes: `tch001@supremeacademy.edu.gh` |
| **Secretary** | `SEC001` + password | Behind the scenes: `sec001@supremeacademy.edu.gh` |
| **Student** | `SUAC001` + 4-digit code | Code chosen by student on first visit |

**Staff temporary password:** `Password1`. Every staff member is forced to
change it on their first login.

**Admission numbers:** `SUAC001`, `SUAC002`, … — auto-generated server-side by
a Postgres function.

**Staff IDs:** auto-increment per prefix (`HEAD001`, `HEAD002`, …, `TCH001`, …,
`SEC001`, …).

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
| Audit log | R | – | – | – | – |

`C` = create · `R` = read · `U` = update · `D` = delete

All rules enforced by RLS policies, mirrored in `src/lib/permissions.ts`
for UI gating.

---

## Tech stack

### Frontend
- React 18.3
- TypeScript 6.0 (strict mode)
- Vite 5.4
- Tailwind CSS 4 (beta) with custom theme tokens
- React Router v6
- React Hook Form + Zod
- Recharts for charts
- `@react-pdf/renderer` for report cards
- Lucide React for icons

### Backend
- Supabase Postgres (15.x)
- Supabase Auth (email/password; synthetic emails for staff and students)
- Supabase Edge Functions (Deno)
- Row Level Security on every sensitive table
- pgcrypto for bcrypt hashing

### Hosting & CI
- Netlify (static SPA; auto-deploy on `main` push)
- GitHub source control

---

## Project structure

```
supreme-academy/
├── public/
│   └── SUAC-LOGO.svg               # Official school logo
├── src/
│   ├── components/ui/              # design system primitives
│   ├── features/
│   │   ├── auth/                   # AuthContext, RequireRole, RoleGate
│   │   ├── students/
│   │   ├── staff/
│   │   ├── academics/
│   │   │   ├── academic-years/
│   │   │   ├── grading/
│   │   │   ├── assessment-weight/
│   │   │   ├── assessments/
│   │   │   ├── mark-entry/
│   │   │   ├── assignments/
│   │   │   ├── classes/
│   │   │   └── subjects/
│   │   ├── results/
│   │   ├── finance/
│   │   │   ├── fee-structures/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   ├── ledger/
│   │   │   └── dashboard/
│   │   ├── scratch-cards/
│   │   ├── student-portal/
│   │   ├── users/
│   │   ├── audit/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── dashboard/              # config cards + recent activity
│   │   └── landing/                # splash + role picker
│   ├── hooks/                      # useList, useLookup
│   ├── layouts/                    # AppShell, Sidebar, Topbar
│   ├── lib/                        # supabase, env, permissions, format, pick-one
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── StaffLoginPage.tsx
│   │   ├── ChangePasswordPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── legal/                  # TermsPage, PrivacyPage, LegalLayout
│   │   └── dashboards/
│   ├── services/
│   │   ├── supabase/               # real backend services
│   │   ├── mock/                   # fictional data (dev only)
│   │   └── *.ts                    # legacy mocks — safe to keep
│   ├── styles/index.css
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   ├── migrations/                 # SQL files (also applied via dashboard)
│   ├── functions/                  # Edge Functions
│   └── seed.sql
├── .env.example
├── .gitignore
├── netlify.toml
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## Local development

### Prerequisites
- Node.js 22+ (Supabase SDK requires it)
- npm 10+
- A Supabase project (hosted is fine)
- Git

### Setup

```bash
# 1. Clone
git clone https://github.com/cojojunior/SchManagementSys.git
cd supreme-academy

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 4. Run dev server
npm run dev
# → http://localhost:5173
```

### Available scripts

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check + production build to dist/
npm run preview    # Preview production build locally
npm run typecheck  # Run TypeScript without emitting
npm run format     # Prettier
```

---

## Environment variables

Create `.env.local` (never committed):

```env
VITE_APP_NAME=Supreme Academy
VITE_APP_CURRENCY=GHS
VITE_APP_CURRENCY_SYMBOL=GH₵
VITE_APP_TIMEZONE=Africa/Accra

VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

**Never add:** `SUPABASE_SERVICE_ROLE_KEY` — this must live only in Edge
Functions.

For Netlify, add the same keys under **Site configuration → Environment
variables**.

---

## Database schema

27 tables, grouped:

### Identity
- `profiles` — one row per auth user (role, status, must_change_password)
- `role_history` — every role/status change
- `student_credentials` — bcrypt-hashed student login PINs (legacy)
- `pin_rate_limit`, `pin_verify_tokens` — rate limiting + proof tokens

### School config
- `school_settings` — single-row config
- `academic_years`, `terms`
- `grading_scales`, `grade_bands`
- `assessment_weights` — single-row config

### People
- `students` — including `student_code_hash`, `student_code_unique`,
  `student_code_set_at`
- `guardians`
- `staff`
- `classes`, `subjects`
- `teaching_assignments`

### Academics
- `assessments`
- `scores`
- `remarks`
- `result_publications`
- `result_change_log`

### Finance
- `fee_structures`, `fee_items`
- `invoices`, `invoice_lines`
- `payments`

### Scratch cards
- `scratch_cards`
- `scratch_card_usages`
- `scratch_card_issuances`

### System
- `audit_log`

All tables use `uuid` primary keys (except single-row config tables),
`timestamptz` for timestamps, foreign keys with `ON DELETE` rules, unique
constraints, and indexes on hot query columns.

### Migration history

| # | File | What it does |
|---|---|---|
| 0001 | `extensions.sql` | pgcrypto, enums, helper functions |
| 0002 | `profiles_and_roles.sql` | profiles, role_history, auto-profile trigger |
| 0003 | `school_settings.sql` | single-row school config |
| 0004 | `students_and_guardians.sql` | students, guardians |
| 0005 | `staff.sql` | staff |
| 0006 | `academic_structure.sql` | years, terms, classes, subjects |
| 0007 | `teaching_assignments.sql` | teacher × class × subject × term |
| 0008 | `grading.sql` | grading_scales, grade_bands, assessment_weights |
| 0009 | `assessments.sql` | assessments |
| 0010 | `scores.sql` | scores |
| 0011 | `remarks_and_change_log.sql` | remarks, result_change_log, publications |
| 0012 | `fee_structures.sql` | fee_structures, fee_items |
| 0013 | `invoices_and_payments.sql` | invoices, lines, payments, auto-recalc trigger |
| 0014 | `scratch_cards.sql` | scratch_cards, usages, issuances |
| 0015 | `audit_log.sql` | audit_log |
| 0016 | `rls_policies.sql` | RLS on every table |
| 0017 | `functions.sql` | grade lookup, recalculate_score, redeem_scratch_card |
| 0018 | `student_credentials.sql` | legacy PIN storage + hash function |
| 0019 | `student_auth_helpers.sql` | pin_rate_limit table |
| 0020 | `pin_verify_tokens.sql` | proof token table |
| 0021 | `staff_and_student_login_model.sql` | student_code, next_staff_id |
| 0022 | `student_admission_number.sql` | SUAC### format + next_admission_number |
| 0023 | `must_change_password.sql` | forced first-login password change |

---

## Row Level Security

**Every** table has RLS enabled. Default is deny-all; explicit policies
grant access per role.

Key principles:

1. **Roles come from `app_metadata.role`** in the JWT — set by an Edge
   Function during provisioning, not user-editable.
2. **Students can only read themselves** — enforced by
   `student_id = (select student_id from profiles where id = auth.uid())`.
3. **Teachers can only modify their own classes** — enforced by joining
   through `teaching_assignments`.
4. **Only headmaster+ can publish or lock results** — enforced by role
   check in policy.
5. **Direct writes to sensitive tables are blocked** — those operations
   go through `SECURITY DEFINER` functions.

To verify RLS is on for all tables:

```sql
select relname
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relrowsecurity = false;
```

Should return nothing.

---

## Edge Functions

Deployed via Supabase dashboard → Edge Functions.

| Function | Purpose |
|---|---|
| `provision-user` | Super Admin creates a staff account (returns `HEAD###` / `TCH###` / `SEC###`) |
| `verify-student-login` | Student login: verify admission number + code, issue proof token |
| `mint-student-session` | Exchange proof token for a real session |
| `student-activate-verify` | Activation step 1: verify admission + DOB |
| `student-activate-set-code` | Activation step 2: set code, create auth user, sign in |
| `generate-scratch-cards` | Create N cards with hashed PINs |

All functions:
- Validate the caller's JWT and role server-side
- Return `{ ok: false, reason }` on failure — never leak whether a record exists
- Are idempotent where possible
- Log to `audit_log`

---

## Postgres functions

| Function | Purpose |
|---|---|
| `current_user_role()` | Reads role from JWT |
| `is_super_admin()`, `is_staff()`, `is_headmaster_or_above()` | RLS helpers |
| `next_staff_id(prefix)` | Returns next `HEAD###` / `TCH###` / `SEC###` |
| `next_admission_number()` | Returns next `SUAC###` |
| `lookup_grade(division, score)` | Returns grade/label for a score |
| `recalculate_score(score_id)` | Recomputes weighted score + grade |
| `set_student_code(student, code)` | bcrypt-hashes the code, enforces uniqueness |
| `verify_student_code(student, code)` | Validates a student code |
| `student_code_unique_key(code)` | Deterministic SHA256 key for uniqueness |
| `redeem_scratch_card(pin, student, term)` | Atomic card redemption |
| `verify_scratch_card_pin(pin, student, term)` | Read-only PIN check |
| `hash_scratch_pin(pin)` | bcrypt hash for generated cards |
| `purge_expired_pin_tokens()` | Cleanup (cron) |

All `SECURITY DEFINER` functions use:
- `set search_path = public, extensions, pg_temp`
- Minimal grants
- Input validation
- Explicit role checks

---

## Scratch-card flow

### Generation
1. Super Admin or Secretary opens **Scratch Cards → Generate**
2. Picks division, term, quantity
3. `generate-scratch-cards` Edge Function:
   - Generates an 8-digit random PIN per card
   - Hashes it with `hash_scratch_pin()` (Postgres bcrypt)
   - Inserts into `scratch_cards` with `uses_remaining = 3`
   - Returns the raw PINs to the operator **once**
4. Operator saves/prints the PINs. They are not recoverable afterward.

### Issuance
- Optional: assign a card to a specific student
- Unassigned cards can be redeemed by any student (open stock)

### Redemption
Student enters PIN on `/student/results`:

1. Client calls `scratchCardsService.redeem(pin, studentId, termId)`
2. That calls the Postgres function `redeem_scratch_card`, which:
   - Locks the matching card row (`SELECT ... FOR UPDATE`)
   - Verifies `crypt(pin, pin_hash)` matches
   - Verifies `term_id` matches
   - Verifies `uses_remaining > 0`
   - Decrements `uses_remaining` atomically
   - Logs to `scratch_card_usages`
3. Returns `{ ok, uses_remaining }`

Concurrency-safe: two simultaneous requests can never exceed 3 uses.

**Counting rule:** 1 use = 1 successful PIN verification that unlocks a
specific (student, term). Refreshing the page or downloading the PDF in the
same unlocked session does not consume additional uses.

---

## Grading model

### Assessment weighting
- **Assessment:** 40% (homework, class tests, projects, mid-term)
- **Exam:** 60% (end-of-term)
- Configurable by Super Admin in **Assessment Weights**

Formula:
```
final = (assessment_raw / assessment_max) × assessment_weight
      + (exam_raw / exam_max) × exam_weight
```

### Rounding
Raw weighted score stored to 2 decimals.
Grade lookup uses `round_half_up(final)` — 74.5 → 75.

### Scales

**Primary & JHS (BECE 1–9)**

| Grade | Range | Label |
|---|---|---|
| 1 | 80–100 | Excellent |
| 2 | 70–79 | Very Good |
| 3 | 60–69 | Good |
| 4 | 55–59 | Credit |
| 5 | 50–54 | Pass |
| 6 | 45–49 | Weak Pass |
| 7 | 40–44 | Weak Pass |
| 8 | 35–39 | Fail |
| 9 | 0–34 | Fail |

**Nursery & KG (descriptive)**

| Grade | Range | Label |
|---|---|---|
| E | 80–100 | Excellent |
| VG | 70–79 | Very Good |
| G | 60–69 | Good |
| D | 0–59 | Developing |

All bands are editable by Super Admin — no code changes needed.

---

## Student activation & login

### First visit (activation)
1. Visit `/student/activate`
2. Enter admission number + date of birth
3. `student-activate-verify` Edge Function verifies identity → returns proof
4. Student chooses a 4-digit code
5. `student-activate-set-code`:
   - Validates the proof
   - bcrypt-hashes the code
   - Stores it in `students.student_code_hash` and a deterministic key in
     `students.student_code_unique`
   - Creates the student's `auth.users` row with a synthetic email
     `<studentId>@students.supreme.local`
   - Returns credentials
6. Client signs in → lands on `/student`

### Subsequent logins
1. Visit `/student/login`
2. Enter admission number + 4-digit code
3. `verify-student-login`:
   - Looks up the student
   - Verifies the code via `verify_student_code`
   - Creates a short-lived proof token (60s TTL)
4. Client calls `mint-student-session` with the proof → gets fresh credentials
5. Client signs in

### Security properties
- 4-digit codes are treated as **low-security credentials**
- Recovery is in-person at the school (Secretary or Super Admin resets)
- Generic error messages — never reveals whether a student record exists
- Codes cannot be guessed (no `1234`, `0000`, `1111`)

---

## Staff provisioning

1. Super Admin signs in
2. **Users & Roles → Add staff account**
3. Fill in:
   - Full name
   - Role (`headmaster` / `teacher` / `secretary`)
   - Temporary password: **`Password1`** (fixed, read-only)
4. `provision-user` Edge Function:
   - Calls `next_staff_id(prefix)` → e.g. `TCH001`
   - Creates `auth.users` row with email `tch001@supremeacademy.edu.gh`
   - Sets `app_metadata.role` and `app_metadata.staff_id`
   - Sets `must_change_password = true` on the profile
5. Staff member signs in with Staff ID + `Password1`
6. `RequireRole` intercepts and forces redirect to `/change-password`
7. Staff sets a strong password → flag clears → lands on their dashboard

### Password recovery
If a staff member forgets their password, the Super Admin resets it in the
Supabase dashboard:
- **Authentication → Users → find the user → Reset password**

Future enhancement: a "Reset password" button in the app.

---

## Dashboard & Settings

### Per-role dashboards

**Super Admin**
- Stat cards: total students, active staff, fees collected, cards sold
- Config cards (inline view): Academic Year, Assessment Weights (editable),
  Grading Scales, Fee Structures
- Recent activity from the audit log
- "Manage all →" link to Settings

**Headmaster**
- Stat cards: students, current term, results pipeline
- Read-only config cards: Academic Year, Assessment Weights, Grading Scales
- Recent activity

**Secretary**
- Stat cards: students, staff, fees collected, outstanding
- Read-only config cards: Academic Year, Fee Structures
- Recent activity

**Teacher**
- Stat cards + quick actions (no config)

**Student**
- Current class, scratch card status, fees balance
- Quick actions: view results, report card, fees

### Settings hub (`/admin/settings`)

A grouped grid of link cards:
- **Academic Configuration:** Academic Years, Grading, Assessment Weights,
  Classes, Subjects, Assignments
- **Finance:** Fee Structures, Invoices, Payments
- **Administration:** Users & Roles, Audit Log, Reports

Below the links, editable forms for: School identity, Currency & timezone,
Scratch-card prices, Revenue split.

---

## Deployment

### Netlify

1. Connect the GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables (**Site configuration → Environment variables**)
5. `netlify.toml` handles SPA fallback:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

6. Netlify auto-deploys on every push to `main`

### Supabase Auth URL configuration

**Authentication → URL Configuration**
- **Site URL:** `https://supremeacademy.netlify.app`
- **Redirect URLs:**
  - `https://supremeacademy.netlify.app/**`
  - `http://localhost:5173/**`

### Custom domain
1. Netlify → Domain management → Add domain
2. Point DNS to Netlify's nameservers
3. SSL auto-provisions
4. Update Supabase Auth URLs to include the custom domain

---

## Backups & recovery

### Backups
- Supabase runs daily backups automatically
- Point-in-Time Recovery (PITR) available on Pro plan
- Verify backups weekly: **Database → Backups**

### Manual export
```bash
pg_dump --host=db.YOUR-PROJECT.supabase.co \
        --username=postgres \
        --dbname=postgres \
        --no-owner \
        --format=custom \
        --file=supreme-$(date +%Y%m%d).dump
```

Store offline. Never commit.

### Recovery procedure
1. Do **not** restore directly to production
2. Create a staging Supabase project
3. Restore the backup there
4. Verify the data
5. If correct, apply the missing transactions manually or schedule a
   maintenance window

---

## Operational runbook

### Daily
- Check Netlify latest deploy
- Scan Supabase Logs → Auth for error spikes
- Scan Supabase Logs → Edge Functions for failures

### Weekly
- Verify the last 7 daily backups exist
- Check disk usage (Supabase → Reports)
- Review Netlify deploy history

### Monthly
- Review `audit_log` for unusual actions
- Export a data snapshot
- Rotate any stale test accounts
- Check API error rates (Supabase → Reports → API)

### Emergency: suspected breach
1. Supabase → Authentication → Users → force sign out the affected user
2. Reset their password
3. Review `audit_log` for their actions in the last 24h
4. If role escalation is suspected, check `role_history`

### Emergency: app down
1. Netlify → Deploys → Rollback to last known good
2. Check https://status.supabase.com
3. Check https://www.netlifystatus.com

---

## Testing checklist

### Pre-deploy (every release)
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm run preview` — click through all roles

### RLS verification
- [ ] Student A cannot access Student B's data
- [ ] Teacher can only modify their own classes' scores
- [ ] Secretary cannot edit published results
- [ ] Former staff cannot access the system
- [ ] Anonymous user cannot assign roles

### Scratch cards
- [ ] A card is capped at 3 uses
- [ ] A card from Term 1 does not unlock Term 2
- [ ] Invalidated cards are rejected
- [ ] Cross-division use is rejected

### Student flow
- [ ] Activation succeeds with valid admission + DOB
- [ ] Wrong DOB → generic error
- [ ] Duplicate code → rejected
- [ ] Successful login lands on `/student`

### Staff flow
- [ ] Super Admin provisions a staff member
- [ ] Staff ID is auto-generated (`TCH001`)
- [ ] Staff signs in with `Password1`
- [ ] Redirected to `/change-password`
- [ ] Can sign in with new password

### Grading
- [ ] Weighted score matches manual calculation
- [ ] Rounding is half-up
- [ ] Grade bands are applied correctly

### Finance
- [ ] Invoice generates from the correct fee structure
- [ ] Partial payments update invoice status
- [ ] Ledger balances correctly

---

## Troubleshooting

### Empty lists after sign-in
**Cause:** RLS blocking queries because the JWT lacks `app_metadata.role`.
**Fix:** Sign out fully, then sign back in. If it persists:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'YOUR_ROLE')
where email = 'user@supreme.edu.gh';
```

Then sign out and back in.

### "Cannot find module" for a Supabase service
**Cause:** file wasn't created or has case mismatch.
**Fix:** `dir src\services\supabase` — confirm the file exists with the exact
casing you import.

### Netlify build fails on `ignoreDeprecations`
**Cause:** the TS version differs between local and Netlify.
**Fix:** pin `"typescript": "6.0.3"` in `package.json` (exact, no caret) and
keep `"ignoreDeprecations": "6.0"` in `tsconfig.app.json`.

### Scratch-card PIN is rejected
- Verify the PIN was typed correctly (8 digits)
- Verify the card is for the currently selected term
- Verify the card hasn't been used 3 times
- Check `scratch_cards` row in Supabase for `invalidated_at` or
  `uses_remaining = 0`

### Edge Function returns 401
**Cause:** caller's JWT is stale.
**Fix:** sign out and back in to refresh the token.

### Student can't activate
- Verify admission number matches exactly
- Verify DOB matches the record (ISO format `YYYY-MM-DD`)
- Verify the student's status is `active`
- Check the student hasn't already been activated

### Staff stuck on `/change-password`
**Cause:** `must_change_password` flag failed to clear.
**Fix:**
```sql
update public.profiles
set must_change_password = false
where id = 'USER-ID';
```

### Forced password change loops
**Cause:** The RLS policy blocks the flag update because it's already `false`.
Check with:
```sql
select id, email, must_change_password
from public.profiles
where email like '%tch001%';
```

---

## Roadmap

### Planned
- **Attendance module** (schema exists, UI disabled)
- **Notifications** (in-app + email)
- **Parent portal** (read-only access to their child's data)
- **Bulk student import** (CSV)
- **Photo uploads** (Supabase Storage)
- **Timetable management**
- **Library & inventory**

### Considered
- SMS notifications for fees due
- Integration with Ghana Education Service reporting
- Multi-campus support (would require schema changes)

---

## License

Proprietary — © Supreme Academy. All rights reserved.

For support, contact the school's IT administrator.

---

## Acknowledgements

Built with care for Supreme Academy, Accra, Ghana.