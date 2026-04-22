# Product Requirements Document (PRD)

## HackQube — Internal AI Innovation Sprint Platform

**Version:** 1.0  
**Status:** Draft  
**Owner:** QubeSense Internal  
**Last Updated:** April 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background & Problem Statement](#2-background--problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Scope & Sprint Structure](#4-scope--sprint-structure)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Core Feature Specifications](#6-core-feature-specifications)
   - 6.1 Authentication & Access Control
   - 6.2 Dashboard (Home)
   - 6.3 Presentation Calendar
   - 6.4 Voting System
   - 6.5 Leaderboard
   - 6.6 Idea Submission & Archive
   - 6.7 Admin Panel
   - 6.8 Notifications
7. [Advanced & Future Features](#7-advanced--future-features)
8. [Technical Architecture](#8-technical-architecture)
9. [Data Models](#9-data-models)
10. [API Contract Overview](#10-api-contract-overview)
11. [UX & Design Principles](#11-ux--design-principles)
12. [Security & Compliance](#12-security--compliance)
13. [MVP Scope](#13-mvp-scope)
14. [Build Timeline](#14-build-timeline)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Open Questions](#16-open-questions)

---

## 1. Executive Summary

**HackQube** is a 16-day, gamified, internal AI innovation sprint platform built for QubeSense. Each working day, one employee presents a small but practical AI-driven solution to a real business or product problem. After each presentation, a tightly controlled 2-minute voting window opens where all other employees rate the presentation across four categories on a 1–5 star scale. Scores are computed via a weighted formula and surfaced on a live leaderboard.

HackQube is **not a traditional hackathon platform**. It is a structured, repeatable, daily innovation ritual that builds an AI-first culture through peer accountability, gamification, and visible output — ultimately feeding a searchable archive of practical AI ideas that can be tracked through to production implementation.

---

## 2. Background & Problem Statement

### Context

QubeSense operates in a domain (field service / oilfield tech) where AI adoption can drive significant operational leverage — from predictive maintenance to field ticket automation. However, broad AI adoption across non-technical roles is slow without a structured nudge.

### Problem

- Employees are unaware of practical AI tools relevant to their daily work
- There is no systematic way to surface, evaluate, or archive internal AI ideas
- Good ideas die in Slack threads or one-off conversations
- No visibility into who is experimenting with AI or what is working

### Solution

A daily sprint format forces one employee per day to ship a working demonstration, compels everyone else to actively evaluate it, and creates a living record of ideas — scored, ranked, and archived — that the org can act on.

---

## 3. Goals & Success Metrics

### Primary Goals

| Goal | Description |
|------|-------------|
| AI Adoption | Drive hands-on AI tool usage across all roles |
| Idea Generation | Surface practical, implementable ideas from every function |
| Culture | Build an AI-first mindset through daily visibility and peer engagement |
| Outcomes | Connect ideas to real implementation and measurable business impact |

### Quantitative Success Metrics

| Metric | Target |
|--------|--------|
| Employee participation rate | ≥ 90% across the 16-day sprint |
| Ideas submitted | ≥ 1 per employee |
| Ideas shortlisted for implementation | ≥ 30% of all submissions |
| Production-ready improvements shipped | ≥ 5 within 30 days of sprint close |
| Avg voting participation per session | ≥ 80% of active employees |

---

## 4. Scope & Sprint Structure

### Sprint Format

- **Duration:** 16 working days
- **Daily Format:**
  - 1 employee presents per day
  - Presentation covers a real business or product problem + AI-driven solution
  - Immediately followed by a 2-minute voting window (admin-controlled)
  - Scores computed and leaderboard updated in real time

### What Counts as a Valid Presentation

- A demonstrable, working AI-assisted solution (not just a slide deck)
- Must reference a real internal problem (ops, product, sales, support, etc.)
- Must use at least one identifiable AI tool
- Must include a problem statement, approach, and live demo or link

### What HackQube Is NOT

- Not a multi-day hackathon with teams
- Not a suggestion box
- Not optional — every employee is scheduled to participate as a presenter

---

## 5. User Roles & Permissions

### Role Matrix

| Feature | Admin | Participant |
|---------|-------|-------------|
| View dashboard | ✅ | ✅ |
| View leaderboard | ✅ | ✅ |
| View archive | ✅ | ✅ |
| View presentation calendar | ✅ | ✅ |
| Submit idea/presentation | ✅ | ✅ |
| Vote (during window) | ✅ | ✅ |
| Self-vote | ❌ | ❌ |
| Start/stop voting window | ✅ | ❌ |
| Manage schedule & calendar | ✅ | ❌ |
| Add/remove users & assign roles | ✅ | ❌ |
| Moderate/edit/delete submissions | ✅ | ❌ |
| Override scores (with audit log) | ✅ | ❌ |

---

## 6. Core Feature Specifications

---

### 6.1 Authentication & Access Control

**Tool:** Clerk

**Requirements:**

- Email/password login restricted to company domain (e.g., `@qubesense.com`)
- Support for SSO if org uses Google Workspace (Clerk handles this natively)
- Role assignment at account creation or by admin post-signup
- Two roles: `admin` and `participant`
- Session management handled by Clerk; JWT claims carry role info
- Unauthorized route access redirects to login

**Acceptance Criteria:**

- [ ] Non-company-domain emails are rejected at signup
- [ ] Admin-only routes return 403 for participant tokens
- [ ] Session expiry and re-auth flow work without data loss

---

### 6.2 Dashboard (Home)

The dashboard is the daily command center. It surfaces the most time-sensitive information first.

#### 6.2.1 Today's Presenter Card

**Data shown:**
- Presenter full name + avatar
- Scheduled presentation time
- Countdown timer to presentation start (HH:MM:SS)
- Presentation topic/title (if submitted in advance)

**Behavior:**
- Timer auto-refreshes; no manual reload needed
- If no presenter is scheduled for today, show "No presentation scheduled today"

#### 6.2.2 Voting Status Banner

**States:**
- `VOTING CLOSED` — default grey state
- `VOTING OPEN` — active green state with 2-minute countdown
- `VOTING ENDED` — shown after window closes, before next presenter

**Behavior:**
- Banner updates in real time via WebSocket / Supabase Realtime
- During open state: voting CTA button is enabled
- After 2-minute expiry: voting UI disables, banner switches to ENDED state
- Last 30 seconds: banner pulses or changes color to create urgency

#### 6.2.3 Live AI News Feed

**Purpose:** Contextual inspiration — keeps AI top of mind even on non-presentation days

**Sources (configurable):**
- Curated RSS feeds (e.g., The Verge AI, MIT Tech Review, Hugging Face Blog)
- Optional: Twitter/X API (if available and budgeted)

**Behavior:**
- Auto-refresh every 2 minutes
- Show headline + source + published time
- Link opens in new tab
- Max 10 items displayed; scroll for more
- Admin can pin or remove specific feed sources

#### 6.2.4 Quick Leaderboard Preview

- Top 3 current leaders shown as cards
- Rank, name, score, and presentation date
- "View Full Leaderboard" CTA link

---

### 6.3 Presentation Calendar

#### Purpose
Give every employee full visibility into the 16-day sprint schedule, and give admins the tools to build and maintain it.

#### Participant View

- Monthly calendar view (16 days highlighted)
- Each scheduled date shows:
  - Presenter name
  - Status badge: `Upcoming` / `Completed` / `Today`
- Clicking a completed date shows the archived submission

#### Admin View (extends Participant view)

- Add presenter to a date (dropdown of users)
- Drag-and-drop rescheduling between dates
- Conflict validation: no two presenters on the same day
- Clear/reassign a date
- Visual indicator for unassigned days (shown in red or with warning icon)

**Acceptance Criteria:**
- [ ] Admin can assign all 16 days before sprint starts
- [ ] Reassigning a presenter sends them a notification (if notifications enabled)
- [ ] Completed presentation dates are locked from reassignment
- [ ] Calendar renders correctly on mobile

---

### 6.4 Voting System

This is the highest-stakes feature. Reliability and speed are non-negotiable during the 2-minute window.

#### 6.4.1 Voting Window

| Property | Value |
|----------|-------|
| Duration | 2 minutes (120 seconds) |
| Trigger | Admin manually starts from Admin Panel |
| End | Auto-expires at 120s OR admin manually closes |
| Frequency | Once per presentation day |

#### 6.4.2 Voting Categories

Each voter rates the presenter across 4 dimensions:

| Category | Weight | Description |
|----------|--------|-------------|
| Idea | 30% | Originality, relevance, and potential impact of the concept |
| Execution | 30% | Quality of the working demo or solution built |
| Helpfulness | 20% | How directly useful this is to the business or team |
| Presentation | 20% | Clarity, structure, and communication quality |

**Input:** 1–5 star rating per category (no half stars in MVP)

#### 6.4.3 Score Computation

```
Final Score = (Idea × 0.30) + (Execution × 0.30) + (Helpfulness × 0.20) + (Presentation × 0.20)
```

- Scores are computed per voter, then averaged across all voters for the presentation
- Raw votes are stored; aggregation is computed server-side
- Scores update on the leaderboard in real time as votes come in

#### 6.4.4 Voting Rules (Enforced in Backend)

- **No self-voting:** Presenter cannot vote on their own submission
- **One submission per voter per presentation:** Once submitted, vote is locked
- **No editing after submission:** Vote is final when submitted during the window
- **Votes after window closes are rejected:** Server validates timestamp against window close time

#### 6.4.5 Voting UX Flow

1. Voting banner switches to OPEN → voter sees enabled voting card
2. Voter selects star rating for each of the 4 categories
3. "Submit Vote" button activates only when all 4 categories are rated
4. On submit: confirmation toast + card greys out with "Vote Submitted ✓"
5. If timer expires before submission: card disables with "Voting Closed" state
6. Presenter sees their own card in read-only/locked state throughout

**Acceptance Criteria:**
- [ ] Self-vote is rejected at API level (not just UI)
- [ ] Second vote attempt returns 409 Conflict
- [ ] Vote submitted after window close returns 403 Forbidden
- [ ] All 4 categories must be rated before submit activates
- [ ] Voting card disables within 1s of window close across all clients

---

### 6.5 Leaderboard

#### 6.5.1 Overall Leaderboard

Displays all participants who have presented, ranked by Final Score.

**Columns:**
| Field | Description |
|-------|-------------|
| Rank | 1, 2, 3... (with medal icon for top 3) |
| Name | Presenter full name + avatar |
| Score | Final weighted score (e.g., 4.32 / 5.00) |
| Date | Presentation date |
| Actions | View archived submission |

#### 6.5.2 Category Leaderboards

Separate tabs or filters for:
- Best Idea
- Best Execution
- Best Helpfulness
- Best Presentation

Each ranked by that category's raw average score.

#### 6.5.3 Time-Based Views

| View | Description |
|------|-------------|
| Overall (Sprint) | All-time rankings for the 16-day sprint |
| Weekly | Rankings reset each calendar week within the sprint |
| Top Performer of the Week | Highlighted card at the top of the leaderboard |

#### 6.5.4 Real-Time Updates

- Leaderboard ranks update live as votes are submitted during the active voting window
- Rank changes animate (card slides up/down) to create visible drama
- After voting window closes, final scores are locked

---

### 6.6 Idea Submission & Archive

#### 6.6.1 Submission Form

Filled by the presenter before or on their presentation day. Fields:

| Field | Type | Required |
|-------|------|----------|
| Problem Statement | Long text | ✅ |
| AI Tools Used | Multi-select + free text | ✅ |
| Approach / Solution Summary | Long text | ✅ |
| Demo Link | URL | Optional |
| Attachments | File upload (PDF, images, video) | Optional |
| Impact Level | Dropdown: Low / Medium / High / Critical | ✅ |
| Functional Category | Dropdown: Ops / Product / Sales / Support / Engineering / Other | ✅ |

#### 6.6.2 Archive View

All submissions are stored and publicly browsable by all employees post-sprint.

**Search & Filters:**

| Filter | Options |
|--------|---------|
| Search | Full-text search across title, problem, approach |
| AI Tool Used | Multi-select filter |
| Category | Functional area |
| Impact Level | Low / Medium / High / Critical |
| Implementation Status | Proposed / In Progress / Implemented |
| Score Range | Slider (0–5) |

**Archive Card shows:**
- Presenter name + date
- Problem statement excerpt
- AI tools used (tags)
- Final score + category scores
- Implementation status badge
- Comments count

---

### 6.7 Admin Panel

The Admin Panel is a dedicated route (`/admin`) accessible only to admin-role users.

#### 6.7.1 Voting Control

| Control | Description |
|---------|-------------|
| Start Voting | Opens the 2-minute window; triggers real-time event to all clients |
| End Voting | Manually closes window before 2 minutes (optional override) |
| Timer Display | Admin sees same countdown as participants |
| Auto-Expire | Server enforces 120s close even if admin tab is closed |

#### 6.7.2 Schedule Management

- View full 16-day calendar
- Assign/reassign presenters to dates
- Edit presentation slot (title, time)
- Lock completed dates

#### 6.7.3 User Management

| Action | Description |
|--------|-------------|
| View all users | Table with name, email, role, status |
| Add user | Invite by email (sends Clerk invite) |
| Remove user | Deactivates login; keeps historical data |
| Change role | Promote to admin or demote to participant |

#### 6.7.4 Idea Moderation

- View all submissions
- Edit any field in a submission
- Remove invalid or inappropriate entries (soft delete — kept in audit log)
- Flag submissions for follow-up

#### 6.7.5 Score Override

- Admin can manually adjust a final score
- Reason field required
- Action is written to an immutable audit log (timestamp, admin ID, before/after score, reason)
- Participant is not notified automatically (admin discretion)

---

### 6.8 Notifications

**Channels:** In-app (toast + notification bell) + Email (via Clerk or Resend)

| Trigger | Recipient | Message |
|---------|-----------|---------|
| Voting window opens | All participants | "Voting is now open for [Presenter Name]! You have 2 minutes." |
| Voting window closing | All participants (30s before close) | "30 seconds left to vote!" |
| Vote submitted | Voter | "Your vote was submitted successfully." |
| Presentation scheduled | Assigned presenter | "You're scheduled to present on [Date]. Submit your idea by [Date - 1]." |
| Idea submission reminder | Presenter (day before) | "Your presentation is tomorrow. Don't forget to submit your idea." |
| Weekly leaderboard | All | "Week [N] top performer: [Name] with [Score]" |

---

## 7. Advanced & Future Features

These are **post-MVP additions** that should be designed for in the data model but not built in sprint 1.

### 7.1 AI Tool Tracker

- Aggregate which AI tools appear most frequently across submissions
- Tool-level leaderboard: "Top tools used at QubeSense"
- Useful for org-level AI stack decisions

### 7.2 Implementation Tracker

Each archived idea can be tagged with:

| Status | Description |
|--------|-------------|
| Proposed | Default — idea submitted but not yet reviewed |
| Under Review | Being evaluated by leadership |
| In Progress | Being actively built or piloted |
| Implemented | Shipped to production |
| Rejected | Will not be pursued (reason logged) |

Admin can update status. This closes the loop from idea → outcome.

### 7.3 Anonymous Feedback System

- After each presentation, voters can optionally leave a short text comment
- Comments are anonymous by default
- Presenter sees aggregated feedback after the voting window closes
- Useful for learning loop without social awkwardness

### 7.4 Anti-Bias & Vote Normalization (Advanced)

- Detect outlier voters (e.g., someone who always rates 1 or always rates 5)
- Optional score normalization per voter's distribution
- Flag potential coordinated voting patterns to admin

### 7.5 Presentation Replay / Knowledge Base

- Allow presenters to attach a video recording of their demo
- Videos stored and playable from the archive
- Evolves the archive into an internal AI knowledge base over time

---

## 8. Technical Architecture

### Frontend

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Styling | TailwindCSS |
| Components | ShadCN UI |
| State Management | Zustand or React Context (lightweight) |
| Real-time client | Supabase Realtime client or native WebSocket |

### Backend

| Layer | Technology |
|-------|-----------|
| API Layer | Next.js API Routes (or separate Express/Fastify service if needed) |
| Runtime | Node.js |
| ORM | Prisma |
| Validation | Zod |

### Database

**Recommended: Supabase (PostgreSQL)**

Reasons:
- Built-in Realtime pub/sub (voting window sync)
- Row-level security for role enforcement
- Storage for file attachments
- Managed Postgres — no infra overhead for an internal tool

**Alternative: Neon (Postgres) + Upstash (Redis for pub/sub)**

Use if more control over the database layer is needed.

### Authentication

- **Clerk** — handles signup, login, session, JWTs, and role metadata
- Role stored in Clerk's `publicMetadata` field (`{ role: "admin" | "participant" }`)
- All API routes validate JWT and check role before responding

### Real-time Layer

Used for:

| Event | Mechanism |
|-------|-----------|
| Voting window open/close | Supabase Realtime broadcast |
| Live vote count updates | Supabase Realtime on `votes` table |
| Leaderboard rank changes | Supabase Realtime on `scores` table |
| Countdown timer sync | Server-authoritative; clients sync from server timestamp |

### File Storage

- Supabase Storage (S3-compatible)
- Buckets: `presentation-attachments`, `profile-avatars`
- Access policy: authenticated read, presenter/admin write

### Hosting

| Service | Platform |
|---------|----------|
| Frontend + API | Vercel |
| Database | Supabase (cloud) |
| Auth | Clerk (cloud) |
| Email | Resend (transactional) |

---

## 9. Data Models

### `users`

```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
clerk_id      TEXT UNIQUE NOT NULL
name          TEXT NOT NULL
email         TEXT UNIQUE NOT NULL
role          TEXT CHECK (role IN ('admin', 'participant')) DEFAULT 'participant'
avatar_url    TEXT
created_at    TIMESTAMPTZ DEFAULT now()
is_active     BOOLEAN DEFAULT true
```

### `presentations`

```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id             UUID REFERENCES users(id)
scheduled_date      DATE NOT NULL UNIQUE
title               TEXT
problem_statement   TEXT
ai_tools_used       TEXT[]
approach            TEXT
demo_link           TEXT
impact_level        TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical'))
category            TEXT CHECK (category IN ('ops', 'product', 'sales', 'support', 'engineering', 'other'))
status              TEXT CHECK (status IN ('upcoming', 'completed', 'cancelled')) DEFAULT 'upcoming'
implementation_status TEXT CHECK (implementation_status IN ('proposed', 'under_review', 'in_progress', 'implemented', 'rejected')) DEFAULT 'proposed'
created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

### `votes`

```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
voter_id          UUID REFERENCES users(id)
presentation_id   UUID REFERENCES presentations(id)
idea_score        SMALLINT CHECK (idea_score BETWEEN 1 AND 5)
execution_score   SMALLINT CHECK (execution_score BETWEEN 1 AND 5)
helpfulness_score SMALLINT CHECK (helpfulness_score BETWEEN 1 AND 5)
presentation_score SMALLINT CHECK (presentation_score BETWEEN 1 AND 5)
submitted_at      TIMESTAMPTZ DEFAULT now()

UNIQUE (voter_id, presentation_id)
```

### `scores` (materialized / cached)

```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
presentation_id   UUID REFERENCES presentations(id) UNIQUE
avg_idea          NUMERIC(3,2)
avg_execution     NUMERIC(3,2)
avg_helpfulness   NUMERIC(3,2)
avg_presentation  NUMERIC(3,2)
final_score       NUMERIC(3,2)
vote_count        INTEGER DEFAULT 0
computed_at       TIMESTAMPTZ DEFAULT now()
```

Final score formula applied server-side:
```
final_score = (avg_idea * 0.30) + (avg_execution * 0.30) + (avg_helpfulness * 0.20) + (avg_presentation * 0.20)
```

### `voting_sessions`

```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
presentation_id   UUID REFERENCES presentations(id)
opened_at         TIMESTAMPTZ
closes_at         TIMESTAMPTZ   -- opened_at + 120 seconds
closed_at         TIMESTAMPTZ   -- actual close time (manual or auto)
opened_by         UUID REFERENCES users(id)
is_active         BOOLEAN DEFAULT false
```

### `audit_logs`

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
actor_id    UUID REFERENCES users(id)
action      TEXT NOT NULL
target_type TEXT  -- 'score', 'submission', 'user', etc.
target_id   UUID
before_val  JSONB
after_val   JSONB
created_at  TIMESTAMPTZ DEFAULT now()
```

### `comments` (optional / post-MVP)

```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
presentation_id   UUID REFERENCES presentations(id)
voter_id          UUID REFERENCES users(id)
content           TEXT
is_anonymous      BOOLEAN DEFAULT true
created_at        TIMESTAMPTZ DEFAULT now()
```

---

## 10. API Contract Overview

### Authentication Headers
All protected routes require:  
`Authorization: Bearer <clerk_jwt>`

---

### Voting

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/votes` | Participant | Submit a vote during active window |
| GET | `/api/votes/:presentationId` | Admin | Get all votes for a presentation |

**POST `/api/votes` — Request Body:**
```json
{
  "presentation_id": "uuid",
  "idea_score": 4,
  "execution_score": 5,
  "helpfulness_score": 3,
  "presentation_score": 4
}
```

**Error Responses:**
- `403` — Voting window closed or self-vote attempted
- `409` — Vote already submitted

---

### Voting Sessions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/voting-sessions/open` | Admin | Open voting window |
| POST | `/api/voting-sessions/close` | Admin | Manually close window |
| GET | `/api/voting-sessions/active` | All | Get current session state |

---

### Presentations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/presentations` | All | List all presentations (calendar) |
| GET | `/api/presentations/:id` | All | Get single presentation + scores |
| POST | `/api/presentations` | Presenter/Admin | Submit/update idea |
| PATCH | `/api/presentations/:id` | Admin | Moderate/edit submission |
| DELETE | `/api/presentations/:id` | Admin | Soft delete (audit logged) |

---

### Leaderboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leaderboard` | All | Overall ranked leaderboard |
| GET | `/api/leaderboard?category=idea` | All | Category-specific ranking |
| GET | `/api/leaderboard?view=weekly&week=2` | All | Weekly view |

---

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users/invite` | Admin | Invite user by email |
| PATCH | `/api/users/:id` | Admin | Update role or status |
| DELETE | `/api/users/:id` | Admin | Deactivate user |

---

### Schedule

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/schedule` | All | Get 16-day schedule |
| POST | `/api/schedule` | Admin | Assign presenter to a date |
| PATCH | `/api/schedule/:date` | Admin | Reassign or edit slot |

---

## 11. UX & Design Principles

### Core Principles

1. **Speed first during voting** — The voting flow must be completable in under 30 seconds. No modals, no confirmation dialogs, no friction.
2. **Real-time is mandatory** — Stale data during voting breaks trust. Leaderboard updates, timer sync, and voting state must be pushed, not polled.
3. **Mobile-first layout** — Employees may vote from phones during live presentations. All voting and leaderboard views must be thumb-friendly.
4. **Gamification is visual** — Rank changes, medal icons, top-performer highlights, and animated leaderboard movements are not cosmetic — they are the engagement mechanism.
5. **Zero ambiguity on state** — At all times, every user should know: Is voting open? Who is presenting? What is my current vote status?

### Key UX Flows

**Voting Flow (Happy Path):**
```
Dashboard → Voting banner turns green →
Click "Vote Now" → Star rating card appears →
Select 1-5 for each of 4 categories →
"Submit" activates → Click Submit →
Toast: "Vote submitted ✓" → Card greys out
```

**Presenter Submission Flow:**
```
Login → "My Presentation" link in nav →
Fill form (problem, tools, approach, demo) →
Save draft → Submit before presentation day
```

**Admin Voting Control Flow:**
```
Admin Panel → Today's Session card →
Click "Open Voting" → Confirm dialog →
Server broadcasts open event → 120s countdown begins →
Auto-close OR admin clicks "End Voting"
```

---

## 12. Security & Compliance

| Concern | Mitigation |
|---------|------------|
| Unauthorized access | Clerk JWT validation on every API route |
| Domain restriction | Clerk allowlist limited to `@qubesense.com` |
| Self-voting | Server-side check: `voter_id !== presentation.user_id` |
| Duplicate votes | DB-level UNIQUE constraint on `(voter_id, presentation_id)` |
| Late votes | Server validates `submitted_at < voting_session.closes_at` |
| Score manipulation | Scores computed server-side only; no client-submitted score values |
| Admin abuse | Score overrides logged in immutable audit table |
| File uploads | Server validates MIME type and size before storage |
| Data access | Supabase Row Level Security (RLS) policies per role |

---

## 13. MVP Scope

### Include in MVP (Sprint 1 Launch)

| Feature | Priority |
|---------|----------|
| Clerk authentication (domain-restricted) | P0 |
| 16-day presentation calendar (admin-managed) | P0 |
| Voting system (2-min window, 4 categories, real-time) | P0 |
| Score computation (weighted formula) | P0 |
| Leaderboard (overall + category) | P0 |
| Idea submission form (presenter) | P0 |
| Submission archive (searchable) | P0 |
| Admin panel (voting control, schedule, user mgmt) | P0 |
| Dashboard (presenter card, voting status, leaderboard preview) | P0 |
| In-app notifications (voting open/close) | P1 |
| Email notifications (schedule, reminders) | P1 |
| Mobile-responsive layout | P1 |

### Explicitly Out of Scope for MVP

| Feature | Reason |
|---------|--------|
| AI News Feed | Nice-to-have; no critical path |
| AI Tool Tracker | Requires aggregation logic; post-sprint |
| Implementation Tracker status updates | Admin overhead; post-MVP |
| Anonymous feedback/comments | Post-MVP |
| Anti-bias vote normalization | Advanced; post-sprint |
| Presentation video replay | Storage cost; post-sprint |
| Weekly leaderboard reset view | Can be derived from existing data post-MVP |

---

## 14. Build Timeline

### Week 1 — Foundation

| Day | Tasks |
|-----|-------|
| 1–2 | Repo setup, Next.js + Tailwind + ShadCN scaffolding, Clerk integration, DB schema (Supabase + Prisma) |
| 3–4 | Auth flows (login, role guard, protected routes), User model + admin invite |
| 5 | Presentation calendar (participant view), 16-day schedule data model |

### Week 2 — Core Sprint Flow

| Day | Tasks |
|-----|-------|
| 6–7 | Voting system backend (session, vote API, score computation, constraints) |
| 8 | Voting system frontend (real-time banner, star cards, timer, submit) |
| 9 | Leaderboard (overall + category, real-time updates) |
| 10 | Dashboard composition (presenter card, leaderboard preview, voting status) |

### Week 3 — Admin & Archive

| Day | Tasks |
|-----|-------|
| 11–12 | Admin panel (voting control, schedule management, user management) |
| 13 | Idea submission form + archive view with search + filters |
| 14 | Notifications (in-app toasts + email via Resend) |

### Week 4 — Polish & Deploy

| Day | Tasks |
|-----|-------|
| 15 | Audit log, score override, mobile responsiveness sweep |
| 16 | QA, bug fixing, edge case testing (duplicate votes, expired window, self-vote) |
| 17 | Staging deployment to Vercel, stakeholder review |
| 18 | Production deployment, employee onboarding, sprint kick-off |

---

## 15. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low presentation participation | Medium | High | Assign all 16 slots before sprint starts; make it mandatory |
| Lazy / dishonest voting (all 5s or all 1s) | Medium | Medium | Anti-bias normalization (post-MVP); weighted score dilutes outliers across voters |
| Real-time voting sync failure | Low | Critical | Fallback polling if WebSocket drops; server is authoritative on window state |
| Voting window abuse (re-open after close) | Low | Medium | DB-level session lock; audit log for all admin actions |
| Feature scope creep delaying launch | High | High | Strict MVP cutoff; all non-P0 items logged as backlog |
| Employee disengagement after week 1 | Medium | High | Weekly leaderboard reset + Top Performer highlight to keep stakes fresh |
| Poor mobile UX degrading voting rate | Medium | Medium | Mobile-first design from day 1; test on actual devices before sprint |

---

## 16. Open Questions

| # | Question | Owner | Decision Needed By |
|---|----------|-------|-------------------|
| 1 | Will the sprint run 16 consecutive working days or allow weekends off? | Product / HR | Before calendar is built |
| 2 | Should admins be able to vote on presentations they did not present? | Admin team | Before voting logic is finalized |
| 3 | Is Supabase approved for internal employee data under company data policy? | IT / Legal | Before DB setup |
| 4 | What is the company email domain? Is there more than one? | IT | Before Clerk is configured |
| 5 | Should score overrides be visible to employees or admin-only? | Leadership | Before admin panel is built |
| 6 | Will presentations be pre-submitted in the system, or is the title/topic optional? | Product | Before submission form UX is finalized |
| 7 | Who seeds the initial user list — admin manually invites, or bulk CSV import? | Admin team | Before user management is built |
| 8 | Is there a budget/approved vendor for the AI news feed source? | Product | Post-MVP; can skip for launch |

---

*Document ends. Next steps: schema review → API contract finalization → UI wireframes → Sprint 1 kickoff.*
