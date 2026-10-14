# Architecture — Supreme Academy SMS

This document explains **how the app works** end to end: the layers, the
data flow, the auth model, the service pattern, and the reasons behind each
decision. If you're new to the codebase, read this before touching code.

---

## Table of contents

1. [The three layers](#the-three-layers)
2. [The request lifecycle](#the-request-lifecycle)
3. [Authentication & sessions](#authentication--sessions)
4. [Authorization (roles)](#authorization-roles)
5. [The service layer pattern](#the-service-layer-pattern)
6. [The mock vs Supabase divide](#the-mock-vs-supabase-divide)
7. [Feature folder structure](#feature-folder-structure)
8. [The `useList` hook (reusable list state)](#the-uselist-hook-reusable-list-state)
9. [The `useLookup` hook (dropdown data)](#the-uselookup-hook-dropdown-data)
10. [Data shape conventions](#data-shape-conventions)
11. [Row Level Security model](#row-level-security-model)
12. [Edge Functions (server-side operations)](#edge-functions-server-side-operations)
13. [Postgres functions (database-side logic)](#postgres-functions-database-side-logic)
14. [The scratch-card flow (deep dive)](#the-scratch-card-flow-deep-dive)
15. [The grade calculation flow](#the-grade-calculation-flow)
16. [PDF report card generation](#pdf-report-card-generation)
17. [The design system](#the-design-system)
18. [Why certain choices were made](#why-certain-choices-were-made)

---

## The three layers

```
┌───────────────────────────────────────────────────────────────┐
│  UI LAYER                                                     │
│  src/features/**, src/pages/**, src/components/ui/**          │
│  React components. Render only. No data logic.                │
│  Call services for everything.                                │
└───────────────────────────────────────────────────────────────┘
                            ↓ calls
┌───────────────────────────────────────────────────────────────┐
│  SERVICE LAYER                                                │
│  src/services/supabase/**                                     │
│  Thin wrappers around Supabase queries.                       │
│  Transform DB rows → domain types. Throw errors on failure.   │
│  No React. No JSX. No state.                                  │
└───────────────────────────────────────────────────────────────┘
                            ↓ uses
┌───────────────────────────────────────────────────────────────┐
│  DATA LAYER                                                   │
│  Supabase (Postgres + Auth + Edge Functions)                  │
│  RLS enforces access. Functions enforce business rules.       │
│  This layer is the source of truth.                           │
└───────────────────────────────────────────────────────────────┘
```

**Rule of thumb:** if a component is computing something the DB could
compute, it's in the wrong place. Move it to the DB. If a service is
rendering, it's in the wrong place. Move it to a component.

---

## The request lifecycle

A typical user action — say, **a teacher saves marks** — flows like this:

```
1. User types a mark, React updates local state.

2. User clicks "Save draft".
   → MarkEntryPage.tsx handleSave() runs.

3. Component calls scoresService.saveScores({ assessmentId, rows }).
   → src/services/supabase/scores.ts

4. Service builds an upsert payload and calls supabase.from('scores').upsert(...).

5. The request goes to Supabase REST API with the user's JWT in the
   Authorization header.

6. Postgres evaluates RLS policies for `scores`. The policy checks:
   - Is the user a teacher?
   - Does `assessments.teacher_id` match the user's `staff_id`?
   - Is the score status `draft`?
   If any check fails → 403 or empty result.

7. If RLS allows, the upsert runs. Row(s) are inserted/updated.

8. Postgres trigger `scores_recalc` fires on UPDATE. It calls
   `recalculate_score(score_id)`, which:
   - Reads the assessment's max_assessment_score, max_exam_score
   - Reads assessment_weights (40/60)
   - Computes weighted totals
   - Looks up the grade band for the student's division
   - Updates the score row with final_score, grade, grade_label

9. The response returns the refreshed rows.

10. Service maps DB rows → domain Score objects.

11. Component receives the data, updates state, re-renders.

12. React shows updated final scores + grades.
```

**Key insight:** the client never calculates grades. It only displays them.
If a teacher's browser is hacked, they can't send a fake grade — the DB
recomputes it from raw marks every time.

---

## Authentication & sessions

### How Supabase Auth works

Supabase Auth is a JWT-based session system:

1. Client sends email + password to `/auth/v1/token?grant_type=password`
2. Server verifies, returns `access_token` (JWT, ~1h expiry) + `refresh_token`
3. Client stores both in localStorage
4. Every subsequent API call includes `Authorization: Bearer <access_token>`
5. When the access token expires, the client silently exchanges the
   refresh token for a new one

### Where the app hooks in

**`src/lib/supabase.ts`** — creates the client with `persistSession: true`
and `autoRefreshToken: true`. This is the standard setup.

**`src/features/auth/AuthContext.tsx`** — the React wrapper:

```
┌─────────────────────────────────────────────────────────────┐
│  On mount:                                                  │
│    - supabase.auth.getSession()  → initial session          │
│    - subscribe to onAuthStateChange  → live updates          │
│                                                             │
│  For each session:                                          │
│    1. Extract base user from JWT (id, email, role, name)    │
│    2. Load profile from `profiles` table for the extra      │
│       fields we need (must_change_password, student_id, ...) │
│    3. Merge → AuthUser object → setUser                      │
│                                                             │
│  Exposed:                                                   │
│    - user          (AuthUser | null)                        │
│    - loading       (initial boot)                           │
│    - signIn()      (email + password)                       │
│    - signOut()                                              │
│    - refreshUser() (re-read profile from DB)                │
└─────────────────────────────────────────────────────────────┘
```

**Why both JWT and profiles?**

The JWT is a signed, short-lived token that's cheap to verify on the DB
side (RLS reads `auth.jwt() -> 'app_metadata' ->> 'role'`). But it doesn't
carry much else. The `profiles` table has the rest — full name, phone,
must_change_password, student_id, staff_id — and we load it once per session.

**Why does `refreshUser` exist?**

When the user changes their password, the DB sets
`profiles.must_change_password = false`. But `AuthContext.user` still
holds the old value. `refreshUser()` re-reads the profile so the context
updates. Without this, `RequireRole` would redirect the user back to
`/change-password` forever.

---

## Authorization (roles)

Two layers, and they must agree:

### Server side — RLS policies

Every table has policies like:

```sql
create policy students_teacher_read on public.students
  for select to authenticated
  using (
    public.current_user_role() = 'teacher'
    and class_id in (
      select class_id from public.teaching_assignments
      where staff_id = (select staff_id from public.profiles where id = auth.uid())
    )
  );
```

`current_user_role()` reads `app_metadata.role` from the JWT. This is
**the authoritative check** — if RLS denies, the client can't bypass it.

### Client side — `RoleGate` and `RequireRole`

**`src/features/auth/RequireRole.tsx`** — protects entire routes:

```tsx
<Route path="/admin/users" element={
  <RequireRole roles={["super_admin"]}>
    <UserListPage />
  </RequireRole>
} />
```

If the current user's role isn't in the list, redirect to their home.
If they aren't signed in, redirect to `/login`.
If they must change their password, redirect to `/change-password`.

**`src/features/auth/RoleGate.tsx`** — protects individual UI elements:

```tsx
<RoleGate resource="students" action="create">
  <Button>Add student</Button>
</RoleGate>
```

The `resource` + `action` pair is looked up in `src/lib/permissions.ts`,
which mirrors the RLS policies:

```ts
students: {
  super_admin: ["create", "read", "update", "delete", "archive"],
  headmaster: ["read"],
  teacher: ["read"],
  secretary: ["create", "read", "update"],
  student: ["read"],
},
```

**Why duplicate the matrix?**

Because the server's RLS is **the security boundary**, and the client's
`permissions.ts` is **the UX boundary**. You hide buttons the user can't
use so they don't hit a wall. But even if a hacker flips the client check
off, RLS still blocks the write. Duplication is intentional and safe —
the server never trusts the client.

---

## The service layer pattern

Every service follows the same structure:

```ts
// 1. Define the DB row shape (what Postgres returns)
type DbStudent = {
  id: string;
  admission_number: string;
  first_name: string;
  // ...snake_case
};

// 2. Define a mapper (DB row → domain object)
function toDomain(row: DbStudent): Student {
  return {
    id: row.id,
    admissionNumber: row.admission_number,
    firstName: row.first_name,
    // ...camelCase
  };
}

// 3. Export an object with async methods
export const studentsService = {
  async list(filters, page, pageSize): Promise<Paginated<Student>> {
    const supabase = requireSupabase();
    const query = supabase.from("students").select("*", { count: "exact" });
    // ...apply filters, pagination
    const { data, count, error } = await query;
    if (error) throw new Error(error.message);
    return {
      data: (data as DbStudent[]).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },
  async get(id) { /* ... */ },
  async create(values) { /* ... */ },
  async update(id, values) { /* ... */ },
  async remove(id) { /* ... */ },
};
```

### Rules

1. **No React in services.** No hooks, no JSX, no state.
2. **Always throw on error.** Let the caller decide how to display it.
3. **Always map.** Components never see raw DB rows.
4. **Always use `requireSupabase()`** — it throws if env vars are missing.
5. **Pagination is explicit.** Every list function takes `page` and `pageSize`.

### Why this pattern

- **Testable** — you can call `studentsService.list()` in a unit test without rendering anything.
- **Swappable** — when we moved from mock to Supabase, only the service files changed. Components were untouched.
- **Type-safe** — the domain types are the contract. If a service returns the wrong shape, TS catches it.
- **Cache-friendly** — later, we could add a caching layer inside a service without touching components.

---

## The mock vs Supabase divide

Right now `src/services/` contains:

```
src/services/
├── supabase/          ← all live services
│   ├── students.ts
│   ├── staff.ts
│   ├── classes.ts
│   └── ...
├── finance-dashboard.ts   ← live (uses supabase/* internally)
└── report-card.ts         ← live (uses supabase/* internally)
```

The mock services and their data folder have been removed. Components
import only from `src/services/supabase/*`.

If you ever need to add a new service:

1. Create `src/services/supabase/<name>.ts`
2. Follow the mapper pattern above
3. Import it into a component
4. Never import from mock folders (they no longer exist)

---

## Feature folder structure

Every business domain gets its own folder under `src/features/`:

```
src/features/students/
├── StudentListPage.tsx      ← the list screen
├── StudentDetailPage.tsx    ← the detail screen
├── StudentFormPage.tsx      ← create + edit
├── StudentImportPage.tsx    ← CSV bulk import
└── (any child components the page needs)
```

**Rule:** a feature folder contains **pages** and **feature-specific
components**. Shared components go in `src/components/ui/`.

If a component is used by more than one feature, move it up to
`src/components/ui/` or `src/components/shared/`.

---

## The `useList` hook (reusable list state)

Almost every list page needs the same four things:

1. Fetch data
2. Filter it
3. Paginate it
4. Show loading/empty states

`useList` (in `src/hooks/useList.ts`) handles all of that:

```tsx
const list = useList<Student, StudentFilters>({
  fetcher: (f, p, ps) => studentsService.list(f, p, ps),
  initialFilters: { search: "", division: "all", status: "all" },
  pageSize: 10,
});

// list.data       — current page of items
// list.total      — total count across all pages
// list.page       — current page number
// list.loading    — boolean
// list.error      — error string | null
// list.filters    — current filter object
// list.setFilters — update filters (triggers refetch)
// list.setPage    — change page
// list.reload()   — refetch current page
```

### How it avoids infinite loops

React's standard gotcha: an effect depends on an object, the object is
recreated on every render, the effect re-fires, state updates, and you're
in a loop.

`useList` avoids this by:

- Serializing filters to a **string** (`filterKey(filters)`) and using
  that string as the effect dependency. Strings compare by value.
- Keeping `fetcher` in a ref, not a dependency.
- Using primitive-only dependencies: `debouncedKey` (string), `page`
  (number), `pageSize` (number).

**Rule:** if you write a hook that fetches based on object state, use
this pattern or copy `useList`.

---

## The `useLookup` hook (dropdown data)

Simple pattern for populating `<select>` options from a service:

```tsx
const { data: classes } = useLookup(async () => {
  const res = await classesService.list({}, 1, 200);
  return res.data;
});
```

Returns:

```ts
{ data: T[], loading: boolean, error: string | null }
```

**Use `useLookup` when:** you need a list of options that don't change
during the form's lifetime — classes, subjects, academic years, staff.

**Use `useList` when:** the list itself is the page content, with filters
and pagination.

---

## Data shape conventions

Three layers, three naming styles:

| Layer | Example | Convention |
|---|---|---|
| DB column | `admission_number` | snake_case |
| DB row type | `DbStudent` with `admission_number` | snake_case |
| Domain type | `Student.admissionNumber` | camelCase |
| UI usage | `student.admissionNumber` | camelCase |

The service's `toDomain()` is the **only place** this translation happens.
Nothing else in the codebase writes `admission_number`.

### Why bother?

- Domain types are stable. If you rename a DB column, only the service changes.
- Components read naturally. `student.firstName` is cleaner than `row.first_name`.
- Types give you error messages you can act on.

---

## Row Level Security model

Every table has RLS enabled. There are no unprotected tables in `public`.

### Reading the policy

```sql
create policy students_teacher_read on public.students
  for select to authenticated
  using (
    public.current_user_role() = 'teacher'
    and class_id in (
      select class_id from public.teaching_assignments
      where staff_id = (select staff_id from public.profiles where id = auth.uid())
    )
  );
```

Decoded:

- **`for select`** — applies to reads only
- **`to authenticated`** — must be signed in
- **`using (...)`** — the condition that must be true

The `using` clause says: "Allow this row if the current user is a teacher
AND the student's class is one of the classes they teach."

### Common patterns

| Pattern | Policy fragment |
|---|---|
| Public read | `using (true)` |
| Own row only | `using (id = auth.uid())` |
| Role-based | `using (public.current_user_role() = 'super_admin')` |
| Relationship-based | `using (class_id in (select ...))` |
| Write-restricted | `for insert` / `for update` with `with check (...)` |

### Verifying RLS is on

```sql
select relname
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relrowsecurity = false;
```

**Should return nothing.** If it returns a table name, RLS is off for
that table and the whole thing is wide open to anyone with the anon key.

### Testing a policy

Sign in as the role in question, then run a query from the app. The
Supabase Logs → API section will show you the exact SQL, whether it
succeeded, and how many rows it returned. If you get `0 rows` when you
expect data, RLS is filtering.

To test from SQL Editor as a specific user:

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub": "user-uuid", "app_metadata": {"role": "teacher"}}';
select * from public.students limit 5;
```

---

## Edge Functions (server-side operations)

Some operations can't be done from the client — creating auth users,
deleting users, hashing PINs, atomic redemptions. Those go through Edge
Functions.

An Edge Function is a **Deno script** deployed to Supabase that runs
server-side with the service-role key.

### The pattern

Every function:

1. Reads `Authorization: Bearer <jwt>` from the request
2. Validates the JWT via `supabase.auth.getUser(jwt)`
3. Checks `caller.app_metadata.role`
4. Parses the request body
5. Validates inputs
6. Uses the admin client (service role) for privileged operations
7. Writes to `audit_log` for traceability
8. Returns `{ ok: true, ... }` or `{ ok: false, reason: "..." }`

### Current functions

| Function | Purpose |
|---|---|
| `provision-user` | Create a staff account with real email |
| `verify-student-login` | Verify student admission + code |
| `mint-student-session` | Exchange proof token for session |
| `student-activate-verify` | Verify student identity for activation |
| `student-activate-set-code` | Set student code, create auth user |
| `generate-scratch-cards` | Batch generate cards with hashed PINs |
| `reset-staff-password` | Force reset to `Password1` |
| `delete-staff` | Delete staff record + optional login |

### When to create a new Edge Function

Ask: **does this require the service-role key?**

- Creating or deleting `auth.users` → yes, Edge Function
- Reading/writing data the user can access via RLS → no, service method
- Operations that must be atomic across multiple tables → yes
- Operations that need to verify the caller's role beyond RLS → yes

---

## Postgres functions (database-side logic)

Same idea as Edge Functions, but running **inside the database**. Used
when the logic needs to be atomic, or when a trigger needs to fire it.

### Types of functions

| Type | Purpose | Example |
|---|---|---|
| `stable` | Read-only, returns a value | `current_user_role()` |
| `volatile` | Has side effects, can write | `redeem_scratch_card()` |
| Trigger | Fires automatically on DML | `tg_set_updated_at()` |
| SECURITY DEFINER | Runs with elevated privileges | `next_admission_number()` |

### Why SECURITY DEFINER matters

A normal function runs as the caller. So `next_admission_number()` called
by a teacher would have the teacher's permissions. But a teacher shouldn't
be able to read all students just to compute the next number.

`SECURITY DEFINER` makes the function run as the **owner** (usually
`postgres`), so it can read what it needs without granting those
permissions to the caller.

**Safety rules for SECURITY DEFINER:**

1. **Always set `search_path`** — `set search_path = public, extensions, pg_temp`
   prevents search-path injection attacks.
2. **Minimal grants** — revoke default access, grant only to specific roles.
3. **Validate inputs** — never trust arguments just because the function is privileged.
4. **Explicit role checks** — inside the function, verify the caller has permission.

Our functions all follow this pattern.

### Postgres function list

See the [README's Postgres functions section](./README.md#postgres-functions).

---

## The scratch-card flow (deep dive)

### Why this is hard

The requirement: a scratch card can be redeemed at most 3 times. Two
simultaneous requests must never result in a 4th use.

If you did this in JavaScript:

```js
const card = await getCard(pin);
if (card.uses_remaining > 0) {
  card.uses_remaining--;
  await updateCard(card);
}
```

Two requests arriving at the same moment would both read
`uses_remaining = 3`, both decrement to 2, and both write 2. **Result: 4
uses went through on a card that should only allow 3.**

### The fix — a single atomic Postgres function

```sql
create or replace function public.redeem_scratch_card(
  p_pin text,
  p_student_id uuid,
  p_term_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_card record;
  v_uses integer;
begin
  select * into v_card
  from public.scratch_cards
  where pin_hash = crypt(p_pin, pin_hash)
    and term_id = p_term_id
    and invalidated_at is null
    and uses_remaining > 0
    and (issued_to_student_id is null or issued_to_student_id = p_student_id)
  for update;       -- ← THE KEY LINE: row lock

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'Invalid card');
  end if;

  update public.scratch_cards
  set uses_remaining = uses_remaining - 1,
      status = case when uses_remaining - 1 = 0 then 'exhausted'
                    else 'partially_used' end,
      updated_at = now()
  where id = v_card.id
  returning uses_remaining into v_uses;

  insert into public.scratch_card_usages (card_id, student_id, term_id)
  values (v_card.id, p_student_id, p_term_id);

  return jsonb_build_object('ok', true, 'uses_remaining', v_uses);
end;
$$;
```

**`FOR UPDATE`** locks the row for the duration of the transaction. A
second concurrent call blocks at `SELECT ... FOR UPDATE` until the first
commits. Then it re-reads `uses_remaining`, sees the decremented value,
and either proceeds (if > 0) or returns "invalid card."

This is **the only correct way** to enforce the limit. Do not implement
scratch-card redemption in JavaScript.

---

## The grade calculation flow

Same principle: business logic in the DB, not the client.

### The trigger

```sql
create trigger scores_recalc
  after update on public.scores
  for each row execute function public.tg_recalc_score();
```

Whenever a score row is updated, the trigger fires.

### The recalculation function

```sql
create or replace function public.recalculate_score(p_score_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_score record;
  v_assessment record;
  v_weights record;
  v_student record;
  v_final numeric(5,2);
  v_grade text;
  v_label text;
begin
  select * into v_score from public.scores where id = p_score_id;
  select * into v_assessment from public.assessments where id = v_score.assessment_id;
  select * into v_weights from public.assessment_weights where id = 1;
  select * into v_student from public.students where id = v_score.student_id;

  -- Weighted formula
  v_final :=
    (coalesce(v_score.assessment_raw, 0)::numeric / v_assessment.max_assessment_score) * v_weights.assessment_percent
    + (coalesce(v_score.exam_raw, 0)::numeric / v_assessment.max_exam_score) * v_weights.exam_percent;

  -- Look up the grade band
  select grade, label into v_grade, v_label
  from public.lookup_grade(v_student.division, v_final);

  update public.scores
  set assessment_weighted = ...,
      exam_weighted = ...,
      final_score = v_final,
      grade = v_grade,
      grade_label = v_label,
      updated_at = now()
  where id = p_score_id;
end;
$$;
```

### What this gives you

- **Consistency** — every score is calculated the same way
- **Tamper-proof** — the client can't send a fake `grade`
- **Configurable** — change the weights in the settings UI, and new
  scores use the new weights automatically
- **Auditable** — the change log captures the exact before/after

### Note on existing scores

Changing the assessment weights does **not** retroactively recompute
existing published scores. That's deliberate — once a result is
published, it's frozen. To recalculate, you'd have to manually run
`recalculate_score()` on each row, which is a deliberate admin action.

---

## PDF report card generation

### Where it lives

- `src/features/results/ReportCardPDF.tsx` — the PDF component
- `src/features/results/StudentReportCardPage.tsx` — the page that renders it

### The library

We use **`@react-pdf/renderer`**. It lets you write React components that
compile to a PDF document. Same JSX pattern as the rest of the app, but
the "DOM" is a PDF page.

```tsx
<Document>
  <Page size="A4" style={styles.page}>
    <Text style={styles.title}>Terminal Report Card</Text>
    <View style={styles.table}>
      {rows.map(r => <Row key={r.id} {...r} />)}
    </View>
  </Page>
</Document>
```

### Where the data comes from

`reportCardService.buildForStudent(studentId, termId)` in
`src/services/report-card.ts` assembles everything:

- Student info
- Term + academic year
- All assessments for the student's class + term
- The student's score for each assessment
- Totals, average, class position
- Remarks (teacher + headmaster)

Returns a single `ReportCardData` object that the PDF component consumes.

### Download flow

```tsx
<PDFDownloadLink
  document={<ReportCardPDF data={report} />}
  fileName={`report-card-${student.admissionNumber}.pdf`}
>
  {({ loading }) => <Button disabled={loading}>
    {loading ? "Preparing…" : "Download PDF"}
  </Button>}
</PDFDownloadLink>
```

The PDF renders entirely in the browser. No server round-trip.

### Why client-side

- No serverless cold starts
- No temporary files stored anywhere
- The PDF generation code is the same in dev and prod
- Instant downloads

The trade-off: a very large report card (30+ pages) could be slow to
render in a low-end phone browser. For a typical student report (1–2
pages), it's fine.

---

## The design system

All UI primitives live in `src/components/ui/`. They're built on
Tailwind v4 with custom theme tokens defined in `src/styles/index.css`.

### Tokens

```
--color-brand-*      Blue primary (buttons, links, focus rings)
--color-ink-*        Neutral greys (text, borders, backgrounds)
--radius-card        0.875rem (used by Card)
--shadow-card        Subtle elevation
--font-sans          Inter with system fallbacks
```

### The primitives

| Component | Purpose |
|---|---|
| `Button` | Primary, secondary, ghost, danger + sizes |
| `Input` | Text input with error state |
| `PasswordInput` | Input + show/hide toggle |
| `Select` | Dropdown with error state |
| `Textarea` | Multi-line input |
| `FormField` | Label + hint + error wrapper |
| `Card` / `CardHeader` / `CardBody` | Panel container |
| `Table` / `THead` / `TBody` / `TR` / `TH` / `TD` | Data table |
| `Badge` | Small status pill with tone |
| `Dialog` | Modal dialog |
| `ConfirmDialog` | Yes/no confirmation |
| `SuccessDialog` | Green checkmark + OK |
| `StatCard` | Number + icon + hint |
| `EmptyState` | Illustration + message + action |
| `Pagination` | Prev/next + page indicator |
| `RoleGate` | Conditional render by role |

### Rules

1. **Never write raw Tailwind in a feature page** — use a primitive.
2. **Never add a new color** — extend the theme in `index.css` if needed.
3. **Never use arbitrary values** like `style={{ padding: '13px' }}` — use the spacing scale.
4. **Spacing rhythm:** 2, 4, 6, 8 (px). `4` is the standard gap inside components, `6` between sections.

---

## Why certain choices were made

### Why Supabase and not a custom backend?

- Postgres is the right database for this
- Auth, RLS, and edge functions are all in one place
- No servers to patch
- Pricing fits a single-school deployment
- RLS is a first-class feature, not an add-on

### Why React Query / SWR / TanStack Query were not used?

For this app's scale, `useList` + `useEffect` is simpler. If the app grows
to hundreds of concurrent users with heavy refetching needs, we'd revisit.
For now, plain hooks work and are easier to debug.

### Why no state management library (Redux, Zustand)?

The only global state is `AuthContext`. Everything else is component-local
or fetched per page. Introducing a state library would be over-engineering.

### Why React Hook Form + Zod?

- RHF is the lightest performant form library
- Zod schemas are the same whether used in forms, CSV import, or edge functions
- They compose well with the service layer's type safety

### Why report cards render client-side?

- No file storage needed
- No cold-start latency
- No cleanup of temp files
- The PDF is generated on demand, in-memory, from live data

### Why is grading done in the DB and not the client?

Because grades are **the most valuable data in a school**. If they're
computed on the client:
- A determined user could send fake grades
- Changes to weights wouldn't propagate consistently
- Audit trails would miss the actual computation

Doing it in Postgres via triggers means the calculation is
**deterministic, auditable, and tamper-proof**.

### Why doesn't the app have a "dark mode"?

Not a requirement, not asked for, and adding one is nontrivial with a
custom design system. If the school asks, it's a one-week task.

### Why no real-time updates (websockets)?

Supabase supports it, but:
- Only useful for collaborative editing, which this app doesn't do
- Adds complexity
- The data changes rarely enough that refetch-on-focus is fine

If two secretaries edit the same student record simultaneously, the
second save wins. That's acceptable for a school's scale.

### Why are scratch cards pricier for JHS?

That was your call, and it matches the real-world model. The prices are
editable in **Settings** if they need to change.

### Why `Password1` as the default?

- Easy for the Super Admin to remember when handing it out
- Forces a change on first login, so the weakness doesn't persist
- Simple enough that a teacher can't mishear it over the phone

If you want to change it, update:
- `provision-user` Edge Function (`password` default)
- `StaffFormPage.tsx` (display)
- `reset-staff-password` Edge Function (`DEFAULT_PASSWORD`)

---

## Where to go next

- **Adding a feature?** Start in `src/features/<domain>/`, add a route in `App.tsx`, add a service in `src/services/supabase/`.
- **Fixing a security issue?** Check RLS policies first, then Edge Functions.
- **Changing DB schema?** Add a migration, don't edit existing ones — keep history.
- **Debugging?** Open DevTools → Network, look for the failing request to `/rest/v1/` or `/functions/v1/`. Check the response body for the Postgres error message.

Good luck.