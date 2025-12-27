

# 🚀 Preper: AI-Powered Interview Preparation

**Preper** is a sophisticated, AI-driven platform designed to help candidates master their interview skills. By leveraging the power of **Hume AI** for realistic voice/chat interactions and **Google Gemini** for intelligent question generation, Preper provides a personalized and immersive preparation environment.

---

## 📑 Table of Contents

1. [Project Overview](https://www.google.com/search?q=%23project-overview)
2. [Key Features](https://www.google.com/search?q=%23key-features)
3. [Tech Stack](https://www.google.com/search?q=%23tech-stack)
4. [Application Workflow](https://www.google.com/search?q=%23application-workflow)
5. [Prerequisites](https://www.google.com/search?q=%23prerequisites)
6. [Installation](https://www.google.com/search?q=%23installation)
7. [Environment Configuration](https://www.google.com/search?q=%23environment-configuration)
8. [Database Setup](https://www.google.com/search?q=%23database-setup)
9. [Development](https://www.google.com/search?q=%23development)
10. [Deployment](https://www.google.com/search?q=%23deployment)

---

## 📖 Project Overview

Preper simulates real-world interview scenarios. It allows users to input specific job details, generates tailored technical and behavioral questions, and conducts interactive AI sessions. The application monitors and saves progress in real-time, providing a seamless experience from configuration to feedback.

---

## ✨ Key Features

* **🔐 Secure Authentication**: Integrated with Clerk for robust user management and custom-themed authentication flows.
* **🎙️ AI Voice & Chat**: Powered by **Hume AI** for low-latency, emotionally expressive AI interactions.
* **🧠 Intelligent Questioning**: Utilizes **Google Gemini (via Vercel AI SDK)** to generate context-aware interview questions based on job descriptions.
* **💾 Real-time Syncing**: Automatically updates interview progress to a PostgreSQL database every 5 seconds to prevent data loss.
* **🛡️ Advanced Security**: Built-in protection using **Arcjet** for rate limiting and bot detection.
* **🌗 Modern UI/UX**: Responsive design with Tailwind CSS, supporting Dark/Light modes via `next-themes`.
* **📊 Type-Safe Environment**: Strict environment variable validation using Zod for reliable deployments.

---

## 🛠 Tech Stack

### Languages & Frameworks

* **Language**: [TypeScript](https://www.typescriptlang.org/) (95%+)
* **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **ORM**: [Drizzle ORM](https://orm.drizzle.team/)

### Backend & Infrastructure

* **Database**: [PostgreSQL](https://www.postgresql.org/)
* **Auth**: [Clerk](https://clerk.dev/)
* **Security**: [Arcjet](https://arcjet.com/)
* **Containerization**: [Docker](https://www.docker.com/) (for local database)

### AI & SDKs

* **AI Brain**: [Google Gemini AI](https://deepmind.google/technologies/gemini/)
* **Voice/Chat Interface**: [Hume AI SDK](https://hume.ai/)
* **Stream Handling**: [Vercel AI SDK](https://sdk.vercel.ai/)

---

## 🔄 Application Workflow

Below is the high-level flow of how a user interacts with Preper:

```mermaid
graph TD
    A[User Visits Landing Page] --> B{Authenticated?}
    B -- No --> C[Clerk Login/Sign-up]
    B -- Yes --> D[User Dashboard]
    
    D --> E[Job Information Form]
    E -->|Input Role/Description| F[Gemini AI Question Generation]
    
    F --> G[Interview Session Started]
    G --> H[Hume AI Interface]
    H -->|Voice/Chat Input| I[AI Real-time Response]
    
    I --> J[Auto-Sync to DB]
    J -->|Every 5 Seconds| K[(PostgreSQL Database)]
    
    G --> L[Session Completion]
    L --> M[Feedback & Analysis]

```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js** (v18.x or later)
* **Docker** & **Docker Compose**
* **npm** or **pnpm** or **bun**

---

## ⚙️ Installation

1. **Clone the Repository**
```bash
git clone https://github.com/shubthenub/preper.git
cd preper

```


2. **Install Dependencies**
```bash
npm install

```



---

## 🔑 Environment Configuration

Create a `.env.local` file in the root directory and populate it with the following keys. Refer to `src/env.ts` (if applicable) for the required schema.

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/preper

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
HUME_API_KEY=your_hume_api_key
HUME_SECRET_KEY=your_hume_secret_key

# Security
ARCJET_KEY=aj_...

```

---

## 🗄️ Database Setup

The project uses **Docker** to spin up a local PostgreSQL instance and **Drizzle** to manage the schema.

1. **Start the Database**
```bash
docker-compose up -d

```


2. **Generate and Push Schema**
```bash
npx drizzle-kit generate
npx drizzle-kit push

```



---

## 🚀 Development

Run the development server:

```bash
npm run dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser to see the application.

### Key Scripts

* `npm run dev`: Starts the Next.js dev server.
* `npm run build`: Builds the application for production.
* `npm run db:studio`: Opens the Drizzle Studio UI to visualize your data.

---

## 🚢 Deployment

Preper is optimized for deployment on **Vercel**.

1. Connect your GitHub repository to Vercel.
2. Add the environment variables listed in `.env.local`.
3. Ensure the Database URL points to a hosted PostgreSQL instance (e.g., Neon, Supabase, or AWS RDS).
4. Deploy!

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Developed with ❤️ by [shubthenub](https://www.google.com/search?q=https://github.com/shubthenub).*
