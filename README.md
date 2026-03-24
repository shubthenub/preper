# Preper

A full-stack AI-powered interview preparation platform built with Next.js 15. Users can define job targets, generate technical practice questions, run voice-based mock interviews with real-time emotional analysis, and analyze their resume against a job description.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Application Flow](#application-flow)
- [Key Implementation Details](#key-implementation-details)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)

---

## Overview

Preper is structured around a concept called a **Job Info** — a user-defined record containing a job title, description, and target experience level. Every feature in the app (questions, interviews, resume analysis) is scoped under a job info, allowing the AI to generate contextually relevant content.

---

## Features

### Job Info Management

Users create and edit job info records that act as the foundation for all AI-generated content. Each record stores the job title, description, and target experience level (junior, mid-level, or senior).

### AI Question Generation

Technical interview questions are generated on-demand using the Vercel AI SDK with Google Gemini 2.5 Flash. Questions are streamed to the client character by character and saved to the database on completion. Difficulty is user-selectable (easy, medium, hard), and the model is prompted to avoid repeating previously asked questions for the same job. After submitting an answer, the model streams back a rating (1-10) and structured feedback along with a full correct answer. Implemented via `generateAiQuestion` and `generateAiQuestionFeedback` in `src/services/ai/questions.ts`.

### Voice Mock Interviews

Interviews are conducted using Hume AI's Empathic Voice Interface (EVI), which provides a real-time conversational voice agent that captures emotional expression data alongside speech. The flow:

1. A server action (`createInterview`) creates an interview record, enforcing plan limits and per-user rate limits via Arcjet token bucket.
2. The client fetches a short-lived Hume access token from an API route and connects to the EVI WebSocket.
3. The `humeChatId` returned by Hume is synced to the database every 5 seconds during the conversation via `updateInterview`.
4. After the session ends, `generateInterviewFeedback` fetches the full chat event history from Hume via `fetchChatMessages` in `src/services/hume/lib/api.ts`, formats messages with emotional feature data, and passes them to Gemini via `generateAiInterviewFeedback` in `src/services/ai/interviews.ts`. The resulting markdown feedback is stored in the interview record.

### Resume Analysis

Users upload a resume PDF scoped to a specific job info. The file is sent to `/api/ai/resumes/analyze`, which passes it directly to `analyzeResumeForJob` in `src/services/ai/resumes/ai.ts` using Gemini's native file input capability. The model returns a structured JSON object validated via a Zod schema, with scores and categorized feedback across five dimensions: ATS compatibility, job match, writing and formatting, keyword coverage, and other. The response is streamed using `streamObject` and rendered progressively on the client.

### Authentication and User Sync

Authentication is handled by Clerk. A custom `ClerkProvider` wraps the app with Clerk's theming pre-configured. A webhook endpoint at `/api/webhooks/clerk` listens for `user.created`, `user.updated`, and `user.deleted` events, verifying the Svix signature manually using the `svix` library, then calling `upsertUser` or `deleteUser` to keep the local `users` table in sync with Clerk.

### Rate Limiting and Access Control

Arcjet is applied at the server action level using a token bucket rule scoped per `userId`. Plan-based access checks (`canCreateInterview`, `canCreateQuestion`) run before the Arcjet check. Arcjet middleware rules (bot detection, shield, sliding window) are defined in `src/middleware.ts` but commented out due to a Vercel 1MB bundle size constraint.

### Theming

A `ThemeProvider` from `next-themes` wraps the application body and supports system, light, and dark modes. The global stylesheet defines CSS variables for both themes and a custom `container` utility. Clerk's appearance object is configured inside a custom `ClerkProvider` to match the application's color tokens.

### Server-Side Caching

Next.js 15's `"use cache"` directive is used in each feature's `db.ts`. Cache tags are constructed via helpers like `getJobInfoIdTag` and `getInterviewIdTag`, allowing targeted `revalidateTag` calls after mutations in server actions and webhook handlers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, Radix UI, shadcn/ui |
| Database | PostgreSQL via Drizzle ORM |
| Local DB | Docker |
| Production DB | Neon (serverless Postgres) |
| Auth | Clerk |
| Security | Arcjet |
| Voice AI | Hume AI Empathic Voice Interface |
| Text AI | Google Gemini 2.5 Flash via Vercel AI SDK |
| Forms | React Hook Form + Zod |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout: ClerkProvider + ThemeProvider + fonts
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles, CSS variables, custom utilities
│   ├── sign-in/                # Clerk hosted sign-in page
│   ├── onboarding/             # Post-signup onboarding flow
│   ├── app/                    # Authenticated app shell
│   │   ├── layout.tsx
│   │   ├── _Navbar.tsx
│   │   ├── page.tsx            # Dashboard: lists all job infos
│   │   ├── upgrade/            # Clerk billing page
│   │   └── job-infos/
│   │       ├── new/
│   │       └── [jobInfoId]/
│   │           ├── page.tsx
│   │           ├── edit/
│   │           ├── interviews/
│   │           ├── questions/
│   │           └── resume/
│   └── api/
│       ├── webhooks/clerk/     # Clerk user lifecycle webhook handler
│       └── ai/
│           ├── questions/      # Streaming question and feedback routes
│           └── resumes/analyze # Streaming structured resume analysis route
│
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── BackLink.tsx
│   ├── MarkdownRenderer.tsx
│   ├── Skeleton.tsx
│   └── SuspendedItem.tsx
│
├── features/                   # Domain logic grouped by entity
│   ├── users/                  # upsertUser, deleteUser, cache tags
│   ├── jobInfos/               # CRUD server actions, db queries, cache, Zod schemas
│   ├── interviews/             # createInterview, updateInterview, generateInterviewFeedback, permissions
│   ├── questions/              # db queries, cache tags, permissions, formatters
│   └── resumeAnalyses/         # permissions
│
├── services/                   # Third-party service integrations
│   ├── clerk/
│   │   ├── components/         # Custom ClerkProvider with theme configuration
│   │   └── lib/                # getCurrentUser helper
│   ├── hume/
│   │   ├── lib/api.ts          # fetchChatMessages
│   │   ├── lib/condenseChatMessages.ts
│   │   └── components/         # CondensedMessages component
│   └── ai/
│       ├── models/google.ts    # Configured Gemini model instance
│       ├── interviews.ts       # generateAiInterviewFeedback
│       ├── questions.ts        # generateAiQuestion, generateAiQuestionFeedback
│       └── resumes/
│           ├── ai.ts           # analyzeResumeForJob
│           └── schemas.ts      # Zod schema for streamObject output
│
├── drizzle/
│   ├── db.ts                   # Drizzle client with Neon serverless adapter
│   ├── schema.ts               # Re-exports all table definitions
│   ├── schemaHelpers.ts        # Shared columns: id, createdAt, updatedAt
│   ├── migrations/
│   └── schema/
│       ├── user.ts
│       ├── jobInfo.ts          # experienceLevelEnum, JobInfoTable
│       ├── question.ts         # questionDifficultyEnum, QuestionTable
│       └── interview.ts        # InterviewTable
│
├── lib/
│   ├── utils.ts                # cn() helper
│   ├── formatters.ts
│   ├── dataCache.ts
│   └── errorToast.tsx
│
├── data/
│   └── env/                    # Type-safe env validation via @t3-oss/env-nextjs
│
└── middleware.ts               # Clerk auth middleware, public route definitions
```

---

## Database Schema

All tables share `id` (UUID, `gen_random_uuid()`), `createdAt`, and `updatedAt` columns from `schemaHelpers.ts`. Foreign keys use cascade delete.

| Table | Key Columns | Relations |
|---|---|---|
| `users` | `id` (Clerk ID), `email`, `name`, `imageUrl` | has many `job_info` |
| `job_info` | `userId`, `name`, `title`, `description`, `experienceLevel` | belongs to `users`; has many `questions`, `interviews` |
| `questions` | `jobInfoId`, `text`, `difficulty` | belongs to `job_info` |
| `interviews` | `jobInfoId`, `duration`, `humeChatId`, `feedback` | belongs to `job_info` |

---

## Application Flow

```
User signs up via Clerk
  └── Clerk webhook (user.created)
        └── upsertUser -> local users table

User creates a Job Info
  ├── Question Practice
  │     generateAiQuestion (streamed) -> saved to DB on finish
  │     User submits answer -> generateAiQuestionFeedback (streamed)
  │
  ├── Mock Interview
  │     createInterview (plan check + Arcjet rate check)
  │     Fetch Hume access token -> connect EVI WebSocket
  │     humeChatId synced to DB every 5 seconds
  │     Session ends -> generateInterviewFeedback
  │       -> fetchChatMessages (Hume API)
  │       -> generateAiInterviewFeedback (Gemini)
  │       -> feedback stored in interview record
  │
  └── Resume Analysis
        Upload PDF -> /api/ai/resumes/analyze
        analyzeResumeForJob (Gemini file input + streamObject)
        Structured JSON scores streamed to client
```

---

## Key Implementation Details

### Streaming Text (Questions)

`generateAiQuestion` and `generateAiQuestionFeedback` use `streamText` from the Vercel AI SDK. The API route returns the stream directly using `toDataStreamResponse()`. The client reads chunks as they arrive and renders incrementally.

### Streaming Structured Objects (Resume)

`analyzeResumeForJob` uses `streamObject` with a Zod schema so the response is progressively parsed as it streams. The client can render each scored category as soon as its fields are available, without waiting for the full response.

### Cache Architecture

Each feature has a `dbCache.ts` defining tag constructors and a `db.ts` where query functions are marked `"use cache"` and tagged via `cacheTag()`. After any mutation, only the affected cache tags are invalidated using `revalidateTag()`. This avoids blanket path invalidation and keeps cached data as fresh as needed per record.

### Type-Safe Environment Variables

All env vars are declared in `src/data/env/` using `@t3-oss/env-nextjs`, with server and client vars separated. Missing or invalid values throw at build time, preventing silent runtime failures.

### Svix Webhook Verification

The Clerk webhook handler manually reads `svix-id`, `svix-timestamp`, and `svix-signature` headers and calls `wh.verify()` from the `svix` library directly. This was chosen over `verifyWebhook` from `@clerk/nextjs/server` for explicit control over the raw body parsing and header extraction.

### Folder Structure Rationale

`features/` holds all entity-level domain logic — DB queries, server actions, permissions, and cache tags — grouped by entity rather than by type. This keeps everything related to a concept co-located without requiring navigation across multiple top-level folders for a single change.

`services/` contains stateless third-party adapters (Clerk, Hume, Google AI) with no direct database access. They are consumed by features and API routes but are not aware of each other.

`app/` contains only route definitions, page components, and layout files. No business logic lives here; pages import from `features/` and `services/`.

`drizzle/` is the only layer that touches the database connection. All DB access in the app routes through functions defined in `features/`.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Clerk server-side secret |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client-side key |
| `CLERK_WEBHOOK_SECRET` | Svix signing secret for webhook verification |
| `ARCJET_KEY` | Arcjet project key |
| `HUME_API_KEY` | Hume AI server-side API key |
| `HUME_SECRET_KEY` | Hume AI secret for access token generation |
| `HUME_CONFIG_ID` | Hume EVI configuration ID |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key |

---

## Local Development

Prerequisites: Node.js 20+, Docker, accounts for Clerk, Hume, Google AI Studio, and Arcjet.

```bash
# Install dependencies
npm install

# Start local Postgres
docker-compose up -d

# Push schema to database
npm run db:push

# Start dev server
npm run dev
```

Inspect the database:

```bash
npm run db:studio
```

Run migrations against the production Neon database:

```bash
npm run db:push:neon
```
