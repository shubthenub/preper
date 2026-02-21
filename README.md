

# Preper: AI-Powered Interview & Career Growth Platform

**Preper** is a high-performance, full-stack platform designed to help candidates master technical and behavioral interviews. By combining **Hume AI’s** empathetic voice interface with **Google Gemini’s** reasoning, Preper provides a realistic, feedback-driven preparation ecosystem.

---

## 📑 Table of Contents

* [Project Overview](#project-overview)
* [Core Features](#core-features)
* [Deep Dive: Features and Services](#deep-dive-features-and-services)
* [Tech Stack](#tech-stack)
* [Application Workflow](#application-workflow)
* [Packages and Dependencies](#packages-and-dependencies)
* [Installation and Setup](#installation-and-setup)
* [Database Configuration](#database-configuration)
* [Development](#development)

---
<a id="project-overview"></a>
## Project Overview

Preper solves "interview anxiety" by providing an interactive environment that talks back. It moves beyond static question lists, offering real-time voice sessions, automated resume refining, and personalized practice modules tailored to specific job descriptions.

---

<a id="core-features"></a>
## Core Features

* ** AI-Powered Mock Interviews**: Real-time voice/chat integration with **Hume AI** for low-latency, emotionally aware sessions.
* ** Resume Refining (ATS Optimizer)**: Analyzes your resume against job descriptions to suggest keywords and structural improvements.
* ** Question Practice Module**: Drills users on specific technical topics (React, DSA, System Design) with instant AI feedback.
* ** Intelligent Questioning**: Role-specific questions generated dynamically via **Google Gemini**.
* ** Enterprise-Grade Security**: Protection against bot attacks and rate-limiting via **Arcjet**.
* ** Real-time Persistence**: State-syncing every 5 seconds to ensure interview progress is never lost.

---

<a id="deep-dive-features-and-services"></a>
## Deep Dive: Features and Services

### 📂 Features Folder (`src/features`)

Contains the core business modules of the application:

* **Interviews**: Manages the `JobInfoForm` and the live interview session UI. It coordinates the 5-second state-syncing logic to the database.
* **Resume**: Handles file uploads and coordinates the parsing and analysis logic for ATS optimization.
* **Practice**: Manages the library of AI-generated questions and the evaluation logic for user answers.
* **Dashboard**: The central hub for users to track their interview history and performance metrics.

### 🛠️ Services Folder (`src/services`)

Contains the infrastructure and external API integrations:

* **Gemini Service**: Handles prompt engineering for interviewers and resume analysts using the Vercel AI SDK.
* **Hume Service**: Manages WebSocket connections and access tokens for real-time voice interaction.
* **Arcjet Service**: Implements security layers including bot detection and AI-request rate limiting.
* **DB Service**: The source of truth for the PostgreSQL schema (users, interviews, jobInfo) and the Drizzle client initialization.

---

<a id="tech-stack"></a>
## Tech Stack

| Category | Technology |
| --- | --- |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI |
| **Backend** | Next.js Server Actions, Node.js |
| **Database** | PostgreSQL, Drizzle ORM |
| **AI / ML** | Google Gemini (Gen AI), Hume AI (Voice/Streaming) |
| **Security** | Clerk Auth, Arcjet Security |

---

<a id="application-workflow"></a>
## Application Workflow

```mermaid
graph TD
    User((User)) -->|Logs in| Clerk[Clerk Auth]
    Clerk --> Dashboard[Dashboard]
    
    Dashboard -->|Option 1| Interview[AI Mock Interview]
    Dashboard -->|Option 2| Practice[Question Practice]
    Dashboard -->|Option 3| Resume[Resume Refiner]

    Interview -->|Job Info| Gemini[Google Gemini AI]
    Gemini -->|Gen Questions| Hume[Hume AI SDK]
    Hume -->|Voice/Chat Stream| User
    
    Interview -->|Auto-Sync| DB[(PostgreSQL + Drizzle)]
    
    Resume -->|Upload PDF| GeminiAnalysis[Gemini Analysis]
    GeminiAnalysis -->|Suggestions| User

```

---

<a id="packages-and-dependencies"></a>
## Packages and Dependencies

* **UI Core**: `lucide-react`, `framer-motion`, `next-themes`, `shadcn/ui`.
* **AI Integration**: `@google/generative-ai`, `@humeai/hume-sdk`, `ai` (Vercel AI SDK).
* **Data & Auth**: `drizzle-orm`, `@clerk/nextjs`, `postgres`.
* **Shield & Guard**: `@arcjet/next`.
* **Utilities**: `zod` (Validation), `clsx`, `tailwind-merge`.

---

<a id="installation-and-setup"></a>
## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shubthenub/preper.git
cd preper

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Environment Configuration

Create a `.env.local` file:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/preper

# AI APIs
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
HUME_API_KEY=your_hume_key
HUME_SECRET_KEY=your_hume_secret

# Security
ARCJET_KEY=aj_...

```

---

<a id="database-configuration"></a>
## Database Configuration

### 1. Start Postgres (Docker)

```bash
docker-compose up -d

```

### 2. Sync Schema

```bash
npx drizzle-kit push

```

---

<a id="development"></a>
## Development

Run the development server:

```bash
npm run dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to view the application.

* **Database Studio**: Use `npx drizzle-kit studio` to manage your data via a GUI.

---


