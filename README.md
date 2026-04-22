# HackQube — AI Innovation Sprint Platform

A 16-day, gamified, internal AI innovation sprint platform built for QubeSense. One employee presents per day, the team votes in a 2-minute window, and scores feed a live leaderboard.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS v4 + ShadCN UI
- **Auth:** Clerk (domain-restricted, role-based)
- **Database:** Supabase (PostgreSQL) via Prisma 7
- **Real-time:** Supabase Realtime (broadcast)
- **State:** Zustand
- **Validation:** Zod
- **Email:** Resend
- **Hosting:** Vercel

## Getting Started

### 1. Clone & Install

```bash
cd hackqube
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

You'll need:
- **Supabase** project URL, anon key, and service role key
- **Clerk** publishable and secret keys
- **Resend** API key (for email notifications)

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to your Supabase database
npx prisma db push

# (Optional) Seed with sample data
npx tsx prisma/seed.ts
```

### 4. Clerk Setup

1. Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Restrict signups to your company domain (e.g., `@qubesense.com`)
3. Add webhook endpoint `https://your-domain.com/api/webhooks/clerk` for user sync
4. Set `role` in user `publicMetadata` as `"admin"` or `"participant"`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard (home)
│   ├── calendar/page.tsx           # 16-day sprint calendar
│   ├── leaderboard/page.tsx        # Rankings (overall + category)
│   ├── archive/page.tsx            # Searchable idea archive
│   ├── submit/page.tsx             # Idea submission form
│   ├── admin/page.tsx              # Admin panel (voting, schedule, users)
│   ├── sign-in/                    # Clerk sign-in
│   ├── sign-up/                    # Clerk sign-up
│   └── api/
│       ├── votes/                  # Vote submission
│       ├── voting-sessions/        # Open/close/active session
│       ├── presentations/          # CRUD presentations
│       ├── leaderboard/            # Ranked scores
│       ├── schedule/               # Sprint schedule management
│       ├── users/                  # User management
│       ├── scores/                 # Score overrides
│       └── webhooks/clerk/         # Clerk user sync
├── components/
│   ├── navbar.tsx                  # Main navigation
│   ├── realtime-provider.tsx       # Supabase real-time events
│   ├── dashboard/                  # Dashboard components
│   └── admin/                      # Admin panel components
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── supabase.ts                 # Supabase clients
│   ├── auth-utils.ts               # Auth helpers
│   ├── scoring.ts                  # Score computation
│   └── validations.ts              # Zod schemas
├── store/
│   └── voting-store.ts             # Zustand voting state
└── generated/prisma/               # Generated Prisma client
```

## Key Features

- **Real-time Voting:** 2-minute admin-controlled voting window with live countdown
- **4-Category Scoring:** Idea (30%), Execution (30%), Helpfulness (20%), Presentation (20%)
- **Live Leaderboard:** Real-time rank updates with category breakdowns
- **Admin Panel:** Voting control, schedule management, user management, score overrides
- **Idea Archive:** Searchable, filterable collection of all sprint submissions
- **Mobile-first:** Responsive design optimized for voting from phones

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Set all environment variables in Vercel dashboard before deploying.
