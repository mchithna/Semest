# UniScore Track — Project Specification & Build Plan

> This document is the single source of truth for building UniScore Track from scratch.
> The context sections (stack, schema, design, features) should be read before each phase.
> The build phases section is the step-by-step execution plan.

---

## Product Overview

UniScore Track is a web application for university students to calculate, persist, and
visualize their weighted GPA / Z-score performance across semesters and degrees.

**Core features:**

- **Live Calculator** — Students enter modules with credit values and letter grades;
  the weighted score recomputes in real time.
- **Degrees** — A degree groups related semesters together. Users create one degree per
  academic programme they are enrolled in (e.g. "BSc Computer Science").
- **Semester Persistence** — Signed-in users save semesters inside a degree and view
  cumulative performance on a dashboard.
- **Trend Visualization** — A line chart plots semester-by-semester GPA.
- **PDF Export** — Users export a clean PDF of their full academic history for a degree.
- **Grade Scales** — Every degree references a grade scale (e.g. Standard 4.0,
  Sri Lankan UGC Z-Score). Users can also define custom scales for their institution.
- **Preset System** — Any user can create a preset: a reusable degree template with
  semesters, module names, and credit values — but no grades. Presets get a unique
  6-character share code (e.g. `A3F9K2`). Batchmates share a link like `/presets/A3F9K2`;
  recipients open it, see the full structure, and click "Use this preset" to have their
  semesters and modules pre-filled. They only need to enter their own grades.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Build tool | Vite |
| UI framework | React 18 + TypeScript |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3 |
| Component library | shadcn/ui |
| Icons | lucide-react |
| Backend + Auth | Supabase (PostgreSQL + Auth) |
| Server state / caching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PDF Export | html2pdf.js |
| Confetti | canvas-confetti |
| Toasts | Sonner |

**Architecture:** Plain SPA — React calls Supabase directly from the client.
No custom server layer. Supabase RLS enforces all data access rules.
All auth is via Supabase Auth (email + password). Sessions are stored in `localStorage`.

---

## Database Schema

All tables live in the `public` schema and are protected by Row Level Security (RLS)
scoped to `auth.uid()`.

### Entity Relationship

```
auth.users (managed by Supabase)
    │
    ├──► profiles (1:1)
    │       id, display_name, onboarded_at
    │
    ├──► grade_scales (1:many, nullable user_id for system scales)
    │       id, user_id (null = system), label, is_system, grades (JSONB), created_at
    │
    ├──► degrees (1:many)
    │       id, user_id, title, institution, grade_scale_id, started_year,
    │       created_at, updated_at
    │
    ├──► semesters (1:many via degrees)
    │       id, degree_id, user_id (redundant for fast RLS), title, term,
    │       sem_index, created_at, updated_at
    │
    ├──► modules (1:many via semesters)
    │       id, semester_id, user_id (redundant for fast RLS), name,
    │       credits (NUMERIC), grade (TEXT), position, created_at
    │
    ├──► presets (1:many)
    │       id, code (UNIQUE, 6-char), creator_id, title, description,
    │       institution, grade_scale_id, is_public, use_count, created_at, updated_at
    │
    ├──► preset_semesters (1:many via presets)
    │       id, preset_id, title, sem_index, position
    │
    └──► preset_modules (1:many via preset_semesters)
            id, preset_semester_id, name, credits (NUMERIC), position
```

### Full SQL

```sql
-- ─────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  onboarded_at    timestamptz,
  created_at      timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users manage own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────
-- UPDATED_AT TRIGGER (shared)
-- ─────────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────
-- GRADE SCALES
-- ─────────────────────────────────────────────────
create table grade_scales (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  label       text not null,
  is_system   boolean not null default false,
  grades      jsonb not null,   -- [{grade: "A+", points: 4.2}, ...]
  created_at  timestamptz default now()
);

alter table grade_scales enable row level security;

create policy "Anyone can read system scales"
  on grade_scales for select
  using (is_system = true);

create policy "Users manage own scales"
  on grade_scales for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed system scales
insert into grade_scales (user_id, label, is_system, grades) values
(null, 'Standard 4.0', true, '[
  {"grade":"A+","points":4.0},{"grade":"A","points":4.0},{"grade":"A-","points":3.7},
  {"grade":"B+","points":3.3},{"grade":"B","points":3.0},{"grade":"B-","points":2.7},
  {"grade":"C+","points":2.3},{"grade":"C","points":2.0},{"grade":"C-","points":1.7},
  {"grade":"D+","points":1.3},{"grade":"D","points":1.0},{"grade":"F","points":0.0}
]'::jsonb),
(null, 'Sri Lankan UGC (Z-Score)', true, '[
  {"grade":"A+","points":4.2},{"grade":"A","points":4.0},{"grade":"A-","points":3.7},
  {"grade":"B+","points":3.3},{"grade":"B","points":3.0},{"grade":"B-","points":2.7},
  {"grade":"C+","points":2.3},{"grade":"C","points":2.0},{"grade":"C-","points":1.7},
  {"grade":"D+","points":1.3},{"grade":"D","points":1.0},{"grade":"F","points":0.0}
]'::jsonb);

-- ─────────────────────────────────────────────────
-- DEGREES
-- ─────────────────────────────────────────────────
create table degrees (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  institution      text,
  grade_scale_id   uuid references grade_scales(id) on delete set null,
  started_year     int,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table degrees enable row level security;

create policy "Users manage own degrees"
  on degrees for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger touch_updated_at_degrees
  before update on degrees
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────────
-- SEMESTERS
-- ─────────────────────────────────────────────────
create table semesters (
  id          uuid primary key default gen_random_uuid(),
  degree_id   uuid not null references degrees(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  term        text,
  sem_index   int not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table semesters enable row level security;

create policy "Users manage own semesters"
  on semesters for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger touch_updated_at_semesters
  before update on semesters
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────────
-- MODULES
-- ─────────────────────────────────────────────────
create table modules (
  id           uuid primary key default gen_random_uuid(),
  semester_id  uuid not null references semesters(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  credits      numeric(4,1) not null,
  grade        text not null,
  position     int not null default 0,
  created_at   timestamptz default now()
);

alter table modules enable row level security;

create policy "Users manage own modules"
  on modules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────
-- PRESETS
-- ─────────────────────────────────────────────────
create table presets (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  creator_id      uuid references auth.users(id) on delete set null,
  title           text not null,
  description     text,
  institution     text,
  grade_scale_id  uuid references grade_scales(id) on delete set null,
  is_public       boolean not null default true,
  use_count       int not null default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table preset_semesters (
  id          uuid primary key default gen_random_uuid(),
  preset_id   uuid not null references presets(id) on delete cascade,
  title       text not null,
  sem_index   int not null,
  position    int not null default 0
);

create table preset_modules (
  id                  uuid primary key default gen_random_uuid(),
  preset_semester_id  uuid not null references preset_semesters(id) on delete cascade,
  name                text not null,
  credits             numeric(4,1) not null,
  position            int not null default 0
);

alter table presets enable row level security;
alter table preset_semesters enable row level security;
alter table preset_modules enable row level security;

create policy "Public presets are readable"
  on presets for select using (is_public = true);

create policy "Creators manage own presets"
  on presets for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Anyone can read public preset semesters"
  on preset_semesters for select
  using (
    exists (
      select 1 from presets p
      where p.id = preset_semesters.preset_id and p.is_public = true
    )
  );

create policy "Creators manage own preset semesters"
  on preset_semesters for all
  using (
    exists (
      select 1 from presets p
      where p.id = preset_semesters.preset_id and p.creator_id = auth.uid()
    )
  );

create policy "Anyone can read public preset modules"
  on preset_modules for select
  using (
    exists (
      select 1 from preset_semesters ps
      join presets p on p.id = ps.preset_id
      where ps.id = preset_modules.preset_semester_id and p.is_public = true
    )
  );

create policy "Creators manage own preset modules"
  on preset_modules for all
  using (
    exists (
      select 1 from preset_semesters ps
      join presets p on p.id = ps.preset_id
      where ps.id = preset_modules.preset_semester_id and p.creator_id = auth.uid()
    )
  );

create trigger touch_updated_at_presets
  before update on presets
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────────────
-- PRESET CODE GENERATOR (SQL function)
-- ─────────────────────────────────────────────────
-- Generates a unique 6-char uppercase alphanumeric code.
-- Excludes I, O, 0, 1 to avoid visual confusion.
-- Call via supabase.rpc('generate_preset_code') from the app.
create or replace function generate_preset_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text;
  tries int := 0;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from presets where presets.code = code);
    tries := tries + 1;
    if tries > 10 then
      raise exception 'Could not generate unique preset code after 10 attempts';
    end if;
  end loop;
  return code;
end;
$$;
```

---

## Score Logic

Implemented in `src/lib/score.ts`. Pure functions, no side effects.

```
computeScore(modules, scale)
  → weighted average of (grade points × credits) / total credits
  → filters out modules where credits <= 0

totalCredits(modules)
  → sum of all module credit values

classify(score)
  → score >= 3.7  : FIRST_CLASS
  → score >= 3.3  : SECOND_UPPER
  → score >= 3.0  : SECOND_LOWER  (note: Sri Lankan UGC uses 2.7)
  → score >= 2.0  : PASS
  → score <  2.0  : BELOW_PASS
```

Classification badge colours: FIRST_CLASS → emerald, SECOND_UPPER → sky,
SECOND_LOWER → amber, PASS → slate, BELOW_PASS → rose.

Confetti fires (via `canvas-confetti`) whenever the live score reaches ≥ 3.7.

---

## Design System

**Theme:** Dark only. Charcoal slate palette with emerald green accent.

| Token | Value |
|---|---|
| Background | `#1e293b` |
| Card surface | `#273449` |
| Accent | `#34d399` (emerald-400) |
| Foreground | `#f1f5f9` |
| Muted | `#334155` |
| Border | `#1e3a5f` |

**Typography:** Inter (body + UI), JetBrains Mono (scores, labels, data values).

**Aesthetic:** Engineering / terminal feel — uppercase tracking-widest labels,
ring-style borders, minimal border-radius (0.125rem), green "live" status indicators.

**Motion:**
- `slideUp` entrance on page load (Tailwind custom keyframe)
- `AnimatedNumber` component — interpolates score over 500ms with ease-out cubic
- Subtle hover lift on primary buttons

**Empty states:** Every list that can be empty (no degrees, no semesters, no presets)
shows an icon, a short directive headline, and a CTA button.

**Onboarding wizard:** First-time sign-up shows a 3-step wizard (pick scale → create
degree → success) before landing on the dashboard. The `profiles.onboarded_at`
timestamp controls whether the wizard is shown again.

---

## Feature Map

```
UniScore Track
├── Auth
│   ├── Sign up / Sign in (email + password, Supabase Auth)
│   └── Onboarding wizard (first-login only, skipped on return)
│
├── Grade Scales  (/settings/scales)
│   ├── System scales — read-only, always visible to all users
│   ├── User custom scales — full CRUD, private to the user
│   └── Scale picker used when creating or editing a degree
│
├── Degrees  (/degrees)
│   ├── Create degree (title, institution, grade scale, start year)
│   ├── Edit / delete degree (cascade deletes all semesters + modules)
│   └── Degree card shows cumulative GPA, classification badge, semester count
│
├── Semesters  (/degrees/:degreeId/semesters)
│   ├── Create semester via Calculator component
│   ├── Edit semester (Calculator pre-filled)
│   └── Delete semester (cascade deletes modules)
│
├── Dashboard  (/dashboard)
│   ├── Degree selector (if user has multiple degrees)
│   ├── Stat cards: Cumulative GPA, Classification, Total Credits, Semester Count
│   ├── Best semester highlight
│   ├── Recharts LineChart — semester-by-semester GPA trend
│   └── PDF export (html2pdf.js, targets a hidden print-layout div)
│
├── Presets  (/presets)
│   ├── Browse public presets — search by title/institution, filter, paginated
│   ├── Preset detail  (/presets/:code)
│   │   ├── Preview: expandable semester/module tree (read-only, no grades shown)
│   │   ├── "Use this preset" → clones structure into a new degree (grades blank)
│   │   └── Share: preset code displayed with a one-click copy-link button
│   ├── Create preset  (/presets/new)  [auth required]
│   │   ├── Metadata: title, institution, description, grade scale, public toggle
│   │   ├── Semester builder: add semesters → add modules with credits (no grades)
│   │   └── On submit: code generated, success screen shows code + copy link
│   └── My presets  (/presets/mine)  [auth required]
│       └── Manage own presets: edit metadata, toggle public/private, delete
│
└── Public landing  (/)
    ├── Hero with a live Calculator (guest, no sign-in required)
    ├── "Save semester" stores draft in sessionStorage, redirects to sign-up
    ├── After sign-up, draft is restored and pre-fills the new semester form
    └── "Browse presets" CTA section
```

---

## Route Map

```
/                                       LandingPage            (public)
/auth                                   AuthPage               (public)
/onboarding                             OnboardingPage         (protected)
/dashboard                              DashboardPage          (protected)
/degrees                                DegreesPage            (protected)
/degrees/:degreeId/semesters            SemestersPage          (protected)
/degrees/:degreeId/semesters/new        NewSemesterPage        (protected)
/degrees/:degreeId/semesters/:id/edit   EditSemesterPage       (protected)
/settings/scales                        ScalesPage             (protected)
/presets                                PresetsPage            (public)
/presets/new                            NewPresetPage          (protected)
/presets/mine                           MyPresetsPage          (protected)
/presets/:code                          PresetDetailPage       (public)
```

---

## Folder Structure

```
src/
├── components/
│   ├── calculator/
│   │   ├── Calculator.tsx          # Reused on landing, new semester, edit semester
│   │   └── ModuleRow.tsx           # Single module input row (name, credits, grade)
│   ├── dashboard/
│   │   ├── TrendChart.tsx
│   │   ├── StatCard.tsx
│   │   └── PdfExport.tsx
│   ├── degrees/
│   │   └── CreateDegreeDialog.tsx
│   ├── layout/
│   │   ├── AppShell.tsx            # Wraps all authenticated pages
│   │   ├── Nav.tsx                 # Sticky top bar
│   │   └── Breadcrumb.tsx          # Degree > Semester hierarchy
│   ├── presets/
│   │   ├── PresetCard.tsx
│   │   ├── PresetSemesterTree.tsx  # Expandable read-only semester/module preview
│   │   └── PresetBuilder.tsx       # Interactive builder used in /presets/new
│   ├── settings/
│   │   └── GradeScaleEditor.tsx    # Editable grade/points rows table
│   └── ui/
│       ├── AnimatedNumber.tsx      # Smooth score interpolation over 500ms
│       ├── ClassificationBadge.tsx # Colored badge from classify() output
│       └── (shadcn generated components)
├── context/
│   └── AuthContext.tsx             # Supabase session, signIn, signUp, signOut
├── hooks/
│   ├── useGradeScales.ts
│   ├── useDegrees.ts
│   └── useSemesters.ts
├── lib/
│   ├── supabase.ts                 # Supabase client (from env vars)
│   ├── queryClient.ts              # TanStack Query client instance
│   ├── score.ts                    # computeScore, totalCredits, classify
│   ├── score.test.ts               # Vitest unit tests
│   └── queries/
│       ├── gradeScales.ts
│       ├── degrees.ts
│       ├── semesters.ts
│       ├── dashboard.ts
│       └── presets.ts
├── pages/
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx
│   ├── OnboardingPage.tsx
│   ├── DashboardPage.tsx
│   ├── DegreesPage.tsx
│   ├── SemestersPage.tsx
│   ├── NewSemesterPage.tsx
│   ├── EditSemesterPage.tsx
│   ├── PresetsPage.tsx
│   ├── PresetDetailPage.tsx
│   ├── NewPresetPage.tsx
│   ├── MyPresetsPage.tsx
│   └── settings/
│       └── ScalesPage.tsx
└── main.tsx                        # BrowserRouter + all route definitions
```

---

## Build Phases

Each phase = one or more clean commits. Commit prefix style: `feat:`, `db:`, `auth:`, `ui:`, `fix:`, `chore:`.

---

### Phase 0 — Project Scaffold

**Goal:** Bare repo with all tooling wired up, routes defined but empty, Supabase client connected.

**Steps:**
1. `npm create vite@latest uniscore-track -- --template react-ts`
2. Install deps:
   ```bash
   npm i react-router-dom @supabase/supabase-js @tanstack/react-query
   npm i react-hook-form @hookform/resolvers zod
   npm i recharts html2pdf.js canvas-confetti sonner lucide-react
   npm i -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   npx shadcn@latest init
   ```
3. Set up `src/lib/supabase.ts` — create the Supabase client from env vars.
4. Set up `src/lib/queryClient.ts` — create the TanStack Query client.
5. Define all routes in `src/main.tsx` using a `BrowserRouter`.
6. Create stub page components for every route so routing is navigable from day one.
7. Add `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Files created:** `src/lib/supabase.ts`, `src/lib/queryClient.ts`, `src/main.tsx`,
`src/pages/*.tsx` (all stubs), `tailwind.config.ts`, `components.json`

**Commits:**
```
feat: scaffold vite + react-ts project
feat: add tailwind, shadcn, and all runtime deps
feat: wire react-router with stub page routes
feat: add supabase client and tanstack query provider
```

---

### Phase 1 — Database Schema

**Goal:** Apply the full schema to your Supabase project.

**Steps:**
1. Open the Supabase SQL editor.
2. Run the full schema SQL from this document in order:
   - `profiles` table + `handle_new_user` trigger
   - `touch_updated_at` function
   - `grade_scales` table + system scale seed data
   - `degrees` table
   - `semesters` table
   - `modules` table
   - `presets`, `preset_semesters`, `preset_modules` tables
   - `generate_preset_code()` function
   - All RLS policies
   - All `touch_updated_at` triggers
3. Verify in Supabase Table Editor that all tables and RLS policies exist.
4. Save the SQL as `supabase/schema.sql` in the repo.

**Commits:**
```
db: create profiles, grade_scales, degrees, semesters, modules tables
db: create presets, preset_semesters, preset_modules tables
db: add rls policies for all tables
db: add handle_new_user and touch_updated_at triggers
db: add generate_preset_code sql function
db: save schema snapshot to supabase/schema.sql
```

---

### Phase 2 — Auth

**Goal:** Working sign-up, sign-in, sign-out, protected route gating, and the
first-login onboarding flag.

**Steps:**
1. Build `AuthContext` in `src/context/AuthContext.tsx`:
   - Wraps `supabase.auth.onAuthStateChange`
   - Exposes `user`, `session`, `signIn`, `signUp`, `signOut`
2. Build `<ProtectedRoute>` component — redirects to `/auth` if no session.
3. Build `/auth` page:
   - Tab toggle: Sign In / Sign Up
   - React Hook Form + Zod validation
   - Sonner toasts on error
4. Wire redirect logic after sign-in:
   - First-time user (`profiles.onboarded_at` is null) → `/onboarding`
   - Returning user → `/dashboard`
5. Sign-out clears TanStack Query cache and redirects to `/auth`.
6. Stub `/onboarding` page (full content in Phase 5).

**Files:** `src/context/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`,
`src/pages/AuthPage.tsx`

**Commits:**
```
auth: add auth context with supabase session management
auth: build sign-in / sign-up page with validation
auth: add protected route gating and redirect logic
auth: wire sign-out with query cache invalidation
```

---

### Phase 3 — Grade Scales

**Goal:** Users can view system scales and create/edit/delete their own.

**Steps:**
1. Create `src/lib/queries/gradeScales.ts`:
   - `getGradeScales()` — fetches system scales + user's own scales
   - `createGradeScale(label, grades)` — inserts user-owned scale
   - `updateGradeScale(id, label, grades)` — updates
   - `deleteGradeScale(id)` — deletes
2. Build `/settings/scales` page:
   - List system scales (read-only, "System" badge)
   - List user's custom scales with Edit / Delete actions
   - "New Scale" dialog: label input + editable rows table (grade column, points column)
   - Validation: grade names must be unique, points must be 0–4.5
3. Create a `useGradeScales()` hook wrapping `useQuery`.

**Files:** `src/lib/queries/gradeScales.ts`, `src/hooks/useGradeScales.ts`,
`src/pages/settings/ScalesPage.tsx`, `src/components/settings/GradeScaleEditor.tsx`

**Commits:**
```
feat: grade scales query functions and useGradeScales hook
feat: scales settings page — list system scales and manage custom scales
```

---

### Phase 4 — Score Logic

**Goal:** Pure business logic in a tested utility module, plus shared score UI components.

**Steps:**
1. Create `src/lib/score.ts`:
   - `computeScore(modules, scale)` — weighted average
   - `totalCredits(modules)` — sum of credits
   - `classify(score)` → classification string
   - `CLASSIFICATION_META` — map to `{ label, badgeVariant, color }` for each classification
2. Create `src/components/ui/ClassificationBadge.tsx` — renders a colored badge from a classification string.
3. Create `src/components/ui/AnimatedNumber.tsx` — interpolates a number to a new value over 500ms using `requestAnimationFrame` and an ease-out cubic curve.
4. Write unit tests in `src/lib/score.test.ts` with Vitest.

**Files:** `src/lib/score.ts`, `src/lib/score.test.ts`,
`src/components/ui/ClassificationBadge.tsx`, `src/components/ui/AnimatedNumber.tsx`

**Commits:**
```
feat: score computation and classification logic with unit tests
feat: AnimatedNumber and ClassificationBadge UI components
```

---

### Phase 5 — Degrees

**Goal:** Users can create degrees and the onboarding wizard is complete.

**Steps:**
1. Create `src/lib/queries/degrees.ts`:
   - `getDegrees()` — returns degrees with `grade_scales` joined
   - `createDegree(data)` — insert
   - `updateDegree(id, data)` — update
   - `deleteDegree(id)` — delete (cascades to semesters and modules)
2. Build `/degrees` page:
   - Card grid of degrees
   - Each card: title, institution, scale label, semester count, cumulative GPA badge
   - Edit and Delete actions per card
   - "New Degree" button
3. Build `CreateDegreeDialog`:
   - Fields: Title (required), Institution (optional), Start Year (optional)
   - Grade Scale picker populated from `useGradeScales()`
4. Build `/onboarding` page — 3-step wizard:
   - Step 1: Welcome message + pick a grade scale (or create one inline)
   - Step 2: Create first degree (same form as `CreateDegreeDialog`)
   - Step 3: Success screen with "Add your first semester" button
   - On completion, sets `profiles.onboarded_at = now()`

**Files:** `src/lib/queries/degrees.ts`, `src/hooks/useDegrees.ts`,
`src/pages/DegreesPage.tsx`, `src/pages/OnboardingPage.tsx`,
`src/components/degrees/CreateDegreeDialog.tsx`

**Commits:**
```
feat: degrees query functions and useDegrees hook
feat: degrees listing page with create, edit, delete
feat: onboarding wizard — scale pick, first degree, success screen
```

---

### Phase 6 — Calculator & Semesters

**Goal:** The core Calculator UI works and semesters save to a degree.

**Steps:**
1. Build `src/components/calculator/Calculator.tsx`:
   - Props: `degreeId`, `gradeScale`, `initialData?` (for edit mode)
   - Local state: `title` string, `modules[]` array
   - Each module row: Name (text), Credits (number), Grade (select populated from scale)
   - Add row / Remove row buttons
   - Live score display via `computeScore()` with `AnimatedNumber`
   - Confetti fires when score first reaches ≥ 3.7
   - `onSave(title, modules)` callback prop
2. Create `src/lib/queries/semesters.ts`:
   - `getSemestersForDegree(degreeId)` — with modules joined, ordered by `sem_index`
   - `saveSemester(degreeId, title, modules, id?)` — insert if no id, update + replace modules if id provided
   - `deleteSemester(id)`
3. Build `/degrees/:degreeId/semesters` page:
   - Breadcrumb: Degrees > [Degree Title]
   - Semester cards: title, GPA badge, credit count, module count
   - "New Semester" button
4. Build `/degrees/:degreeId/semesters/new` — full-page Calculator.
5. Build `/degrees/:degreeId/semesters/:id/edit` — Calculator pre-filled with existing data.
6. Wire guest draft flow:
   - Landing page Calculator: on "Save", store `{ title, modules }` in `sessionStorage` then redirect to `/auth`
   - `/degrees/:degreeId/semesters/new`: on mount, check sessionStorage, pre-fill Calculator, clear storage

**Files:** `src/components/calculator/Calculator.tsx`,
`src/components/calculator/ModuleRow.tsx`,
`src/lib/queries/semesters.ts`,
`src/pages/SemestersPage.tsx`,
`src/pages/NewSemesterPage.tsx`,
`src/pages/EditSemesterPage.tsx`

**Commits:**
```
feat: Calculator component with live scoring and confetti
feat: semester query functions — save, fetch, delete
feat: semesters page for a degree — list, create, edit, delete
feat: guest draft flow — sessionStorage save and post-signup restore
```

---

### Phase 7 — Dashboard

**Goal:** A single dashboard showing cumulative performance for a chosen degree.

**Steps:**
1. Create `src/lib/queries/dashboard.ts`:
   - `getDashboardData(degreeId)` — fetches degree + all semesters + all modules in parallel
2. Build `/dashboard` page:
   - Degree selector dropdown (if the user has multiple degrees)
   - Stat cards: Cumulative GPA (animated), Classification badge, Total Credits, Semester Count
   - Best semester highlight card
   - Recharts `LineChart` of semester-by-semester GPA (x = semester title, y = GPA)
3. Add PDF export:
   - A hidden `<div ref={printRef}>` contains a clean, print-friendly layout
   - Export button calls `html2pdf().from(printRef.current).save()`

**Files:** `src/pages/DashboardPage.tsx`, `src/lib/queries/dashboard.ts`,
`src/components/dashboard/TrendChart.tsx`, `src/components/dashboard/StatCard.tsx`,
`src/components/dashboard/PdfExport.tsx`

**Commits:**
```
feat: dashboard data query function
feat: dashboard page — stats, classification, trend chart, degree selector
feat: PDF export from dashboard
```

---

### Phase 8 — Preset System

**Goal:** Users can create shareable presets; anyone can discover and use them.

**Steps:**

**8a — Browse & View (no auth needed)**
1. Create `src/lib/queries/presets.ts`:
   - `getPublicPresets(search?, institution?)` — paginated list
   - `getPresetByCode(code)` — full preset with semesters + modules joined
2. Build `/presets` page:
   - Search bar (filters by title or institution)
   - Institution filter dropdown (distinct values from data)
   - Preset cards: title, institution, scale name, semester count, module count, use count
3. Build `/presets/:code` page:
   - Preset metadata header
   - `PresetSemesterTree` — expandable accordion showing semesters and their module names + credits
   - "Use this preset" button (redirects to `/auth` if not signed in)
   - Share section: code displayed prominently + "Copy link" one-click button

**8b — Create Preset (auth required)**
4. Build `/presets/new` page — 2-step flow:
   - Step 1: Metadata form (title, institution, description, grade scale picker, public toggle)
   - Step 2: `PresetBuilder` — add semesters, add modules per semester (name + credits only, no grades)
   - On submit: calls `supabase.rpc('generate_preset_code')`, inserts preset + structure
   - Success screen: shows generated code + copy link CTA
5. Build `/presets/mine` page:
   - List of user's own presets
   - Toggle public/private, edit metadata, delete

**8c — Use Preset**
6. "Use this preset" handler:
   - Creates a new `degree` from preset metadata (title, institution, grade_scale_id)
   - Inserts `semesters` and `modules` from the preset structure (grade field left as empty string)
   - Calls `supabase.rpc('increment_preset_use_count', { preset_id })` (create this RPC)
   - Redirects to the new degree's semesters page

**Files:** `src/lib/queries/presets.ts`,
`src/pages/PresetsPage.tsx`, `src/pages/PresetDetailPage.tsx`,
`src/pages/NewPresetPage.tsx`, `src/pages/MyPresetsPage.tsx`,
`src/components/presets/PresetCard.tsx`,
`src/components/presets/PresetSemesterTree.tsx`,
`src/components/presets/PresetBuilder.tsx`

**Commits:**
```
feat: preset query functions — browse, get by code
feat: presets browse page with search and institution filter
feat: preset detail page — structure preview and share code
feat: create preset flow — metadata, semester builder, success screen
feat: use preset — clone structure into new degree with blank grades
feat: my presets management page
```

---

### Phase 9 — Navigation & Layout

**Goal:** Consistent app shell, breadcrumb navigation, mobile responsiveness.

**Steps:**
1. Build `src/components/layout/AppShell.tsx`:
   - Sticky top `Nav`
   - Max-width content container
2. Build `Nav.tsx`:
   - Authenticated links: Dashboard, Degrees, Presets, Settings
   - User dropdown: email, Sign out
   - Guest links: Browse Presets, Log in, Get started
   - Mobile: collapsible via shadcn `Sheet`
3. Build `Breadcrumb.tsx` — used on `/degrees/:id/semesters` and semester edit pages.
4. Audit every page for mobile layout:
   - Calculator module rows stack vertically on small screens
   - Dashboard stat cards wrap
   - Preset builder is usable on mobile

**Commits:**
```
feat: app shell with sticky nav and max-width layout
feat: breadcrumb navigation for degree and semester pages
feat: mobile nav with sheet drawer
fix: mobile layout on calculator, dashboard, and preset builder
```

---

### Phase 10 — Landing Page & Polish

**Goal:** Compelling public entry point and deploy-ready final state.

**Steps:**
1. Build `/` landing page:
   - Hero section: headline + live Calculator (fully functional for guests)
   - "Save semester" stores draft in sessionStorage then redirects to `/auth`
   - Feature highlights: 3–4 key feature blocks
   - "Browse presets" CTA section
2. Add `slideUp` entrance animation (Tailwind custom keyframe, applied to page containers).
3. Audit all pages for Sonner toast coverage on every success and error action.
4. Add shadcn `Skeleton` loading states on all data-fetching pages.
5. Write proper empty states for: no degrees, no semesters, no presets found in search.
6. Run full end-to-end test of both main flows:
   - Guest → live calc → sign up → onboarding → degree → semester → dashboard → PDF
   - Create preset → copy link → open in incognito → use preset → semesters pre-filled
7. Deploy to Vercel: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars.

**Commits:**
```
feat: landing page with live calculator and feature highlights
feat: loading skeletons on all data-fetching pages
feat: empty states for degrees, semesters, and presets
feat: slideUp entrance animation
chore: deploy to vercel with environment config
```

---

## Phase Checklist

- [ ] **Phase 0** — Project scaffold (Vite, Tailwind, shadcn, React Router, Supabase client)
- [ ] **Phase 1** — Database schema (all tables, RLS, triggers, seed data)
- [ ] **Phase 2** — Auth (sign-up, sign-in, sign-out, route gating)
- [ ] **Phase 3** — Grade Scales (system + user-created, settings page)
- [ ] **Phase 4** — Score Logic (computeScore, classify, AnimatedNumber, badge)
- [ ] **Phase 5** — Degrees (create/edit/delete, onboarding wizard)
- [ ] **Phase 6** — Calculator & Semesters (core feature, guest draft flow)
- [ ] **Phase 7** — Dashboard (stats, trend chart, PDF export)
- [ ] **Phase 8** — Preset System (browse, view, create, use, share)
- [ ] **Phase 9** — Navigation & Layout (shell, breadcrumbs, mobile)
- [ ] **Phase 10** — Landing Page & Polish (deploy-ready)
