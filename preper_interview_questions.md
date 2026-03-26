# Preper — Next.js Fullstack Interview Questions & Answers

> **Role:** Senior Software Engineer conducting a technical interview
> **Candidate:** Put this project on their resume
> **Stack:** Next.js 15 · React 19 · TypeScript · Drizzle ORM · NeonDB · Clerk · Arcjet · Vercel AI SDK · Hume AI · Tailwind CSS

---

## 🟢 BASIC — Foundation

---

### Q1. Walk me through the overall architecture of this application.

**Expected Answer:**

Preper is a Next.js 15 fullstack application using the **App Router**. It follows a feature-slice structure under `src/features/`, where each domain (interviews, questions, jobInfos, users) has its own `actions.ts`, `db.ts`, `dbCache.ts`, and `permissions.ts`. API routes live under `src/app/api/`, and UI pages live under `src/app/app/` (a route group). The database is PostgreSQL accessed through Drizzle ORM — locally via Docker + `node-postgres`, and in production via Neon's serverless HTTP driver. Authentication is handled by Clerk, rate limiting by Arcjet, and AI features by the Vercel AI SDK (Gemini model) and Hume AI.

---

### Q2. What is the difference between the App Router and Pages Router in Next.js? Which one does this project use and why?

**Expected Answer:**

The Pages Router (`pages/`) uses a file-system based routing where every file is a page, and data fetching uses `getServerSideProps` / `getStaticProps`. The **App Router** (`app/`) introduced with Next.js 13 uses React Server Components by default, supports layouts, nested routes, loading states, and co-located data fetching directly in the component tree.

This project uses the **App Router** because it enables:
- Server Components (no client bundle overhead for data-fetching components)
- `layout.tsx` for nesting auth guards, navbars, theme providers
- Server Actions (`"use server"`) directly callable from the client
- The new `"use cache"` directive for fine-grained caching

---

### Q3. What is a React Server Component (RSC)? How is it used in this project?

**Expected Answer:**

RSCs are components that run **only on the server** — they can directly query the database, access secrets, and have zero JavaScript sent to the client. They cannot use state, effects, or browser APIs.

In this project, the `AppLayout` (`src/app/app/layout.tsx`) is an async Server Component that calls `getCurrentUser()` and redirects unauthenticated users without shipping any auth logic to the browser. Similarly, page components directly query the DB or call feature-layer functions at the top of the component tree.

---

### Q4. Explain how `layout.tsx` works in the App Router. How is it nested in this project?

**Expected Answer:**

Each `layout.tsx` wraps all its sibling `page.tsx` files and any nested routes. Layouts are persistent — they don't re-render on navigation between child routes.

In this project:
- `src/app/layout.tsx` — **Root layout**: wraps everything in `<ClerkProvider>` and `<ThemeProvider>`. Sets the font.
- `src/app/app/layout.tsx` — **App layout**: checks authentication via `getCurrentUser()` and renders the `<Navbar>`. Protected routes live here.

This means unauthenticated users are redirected at the layout level, not in every individual page.

---

### Q5. How are environment variables handled safely in this project?

**Expected Answer:**

The project uses `@t3-oss/env-nextjs` to define a typed, validated schema for environment variables. Rather than using raw `process.env.MY_VAR` (which returns `string | undefined`), this library throws an error at build/startup time if a required variable is missing, and provides fully typed access.

Server-only env vars are defined in `src/data/env/server.ts` and imported as `env.NEON_DB_URL`, etc. This prevents secrets from accidentally being referenced in client-side code.

---

### Q6. What is Drizzle ORM? How does this project define its schema?

**Expected Answer:**

Drizzle ORM is a TypeScript-first ORM with a SQL-like query builder. Schemas are defined as plain TypeScript objects.

In this project, each table is in its own file under `src/drizzle/schema/`. For example, `JobInfoTable` uses `pgTable`, `varchar`, `uuid`, and a `pgEnum` for experience levels. Common columns (`id`, `createdAt`, `updatedAt`) are extracted into `schemaHelpers.ts` and reused across all tables — DRY and consistent.

Relations are defined separately using Drizzle's `relations()` helper, enabling the `with` syntax in queries (e.g., fetching an interview with its related `jobInfo` in one query).

---

### Q7. What does `"use server"` do at the top of a file?

**Expected Answer:**

It marks the entire module as a **Server Action module**. Every exported function becomes a Server Action — callable from Client Components via a serialized RPC-like mechanism. Next.js automatically creates secure POST endpoints for them.

In `src/features/interviews/actions.ts`, `"use server"` is at the top, so `createInterview`, `updateInterview`, and `generateInterviewFeedback` are all server actions that can be called from any client component without manually creating API routes.

---

### Q8. Explain the folder structure choice: `src/features/` vs `src/app/`. Why separate them?

**Expected Answer:**

- `src/app/` is Next.js routing — it's the file-system router. Every folder here maps to a URL.
- `src/features/` contains domain logic that is **framework-agnostic** — database queries, actions, cache tags, permissions. 

Separating them means the business logic (feature layer) can be reused across multiple routes, tested independently, and isn't coupled to the URL structure. For example, `features/interviews/db.ts` can be called from both the UI route (`app/app/...`) and the API route (`app/api/...`).

---

## 🟡 INTERMEDIATE — Core Mechanics

---

### Q9. How does authentication work in this project? What is the role of `middleware.ts`?

**Expected Answer:**

Authentication is handled by **Clerk**. The `middleware.ts` uses `clerkMiddleware` with `createRouteMatcher` to define public routes (`/`, `/sign-in/*`, `/api/webhooks/*`). For every other route, `auth.protect()` is called, which redirects unauthenticated users to the sign-in page.

The middleware runs on the **Edge runtime** (before any route handler runs), making it a performant gating layer. The regex matcher ensures Next.js internals (images, fonts, etc.) are excluded from the middleware.

---

### Q10. What is a Clerk webhook and why is it used here?

**Expected Answer:**

Clerk webhooks let you react to authentication events (e.g., `user.created`, `user.updated`) in your own backend. This is necessary because Clerk manages auth, but the app has its own `UserTable` in Postgres that needs to be kept in sync.

When a user signs up, Clerk sends a `user.created` event to `/api/webhooks/clerk`. The handler verifies the webhook signature using **svix** (preventing spoofed requests), then creates a corresponding row in the app's `UserTable`.

The webhook route is explicitly listed as public in `middleware.ts` so Clerk's servers can reach it without a user session.

---

### Q11. Walk me through the dual-database driver setup in `db.ts`. Why does it exist?

**Expected Answer:**

```typescript
if (process.env.NODE_ENV === "production") {
  // Neon HTTP driver (serverless-compatible)
  const client = neon(env.NEON_DB_URL!);
  return drizzleNeon(client, { schema });
}
// Standard node-postgres (for local Docker)
return drizzleNode(env.DATABASE_URL, { schema });
```

The **Neon HTTP driver** (`@neondatabase/serverless`) is used in production (Vercel) because Vercel runs serverless functions that can't hold persistent TCP connections. Neon's HTTP driver makes stateless HTTP calls to the database — perfect for this environment.

Locally, the standard `node-postgres` driver is used since there's a persistent local Docker PostgreSQL container running. This dual setup avoids connection errors in both environments.

---

### Q12. Explain how `"use cache"` works in Next.js 15. How is it used in this project?

**Expected Answer:**

`"use cache"` is an experimental Next.js 15 directive. When placed at the top of a function, that function's return value is **memoized on the server between requests** (similar to a server-side React cache). The cache key is derived from the function's arguments.

`cacheTag(tag)` associates the cached result with a string tag. When `revalidateTag(tag)` is called later (e.g., after a mutation), all cached results associated with that tag are invalidated.

In this project:
```typescript
async function getInterview(id: string, userId: string) {
  "use cache"
  cacheTag(getInterviewIdTag(id))  // e.g., "id:abc123:interviews"
  // ...
}
```

After an interview is updated, `revalidateTag(getInterviewIdTag(id))` is called to bust the cache. This gives them fine-grained, tag-based cache invalidation instead of re-fetching everything.

---

### Q13. Explain the caching tag strategy in `src/lib/dataCache.ts`. What is the hierarchy and why?

**Expected Answer:**

Four helpers generate structured tag strings:
```typescript
getGlobalTag("interviews")          // "global:interviews" — all interviews
getUserTag("interviews", userId)    // "user:abc:interviews" — user's interviews
getJobInfoTag("interviews", jid)    // "jobInfo:xyz:interviews" — interviews for a job
getIdTag("interviews", id)          // "id:abc123:interviews" — one specific interview
```

This hierarchy allows granular invalidation:
- Delete a job → `revalidateTag(getJobInfoTag(...))` busts all related data
- Update one interview → `revalidateTag(getIdTag(...))` busts only that interview

This is more efficient than clearing everything, and avoids stale data being served to other users.

---

### Q14. What is Arcjet and how is it used for rate limiting in this project?

**Expected Answer:**

Arcjet is a security-as-code platform for Next.js. In this project it's used for **per-user rate limiting** on the `createInterview` server action using a **token bucket algorithm**:

```typescript
const aj = arcjet({
  characteristics: ["userId"],  // rate limit per user, not per IP
  rules: [tokenBucket({ capacity: 12, refillRate: 4, interval: "1d", mode: "LIVE" })],
})
```

A user can create at most 12 interviews per day, with 4 added back daily. If `decision.isDenied()`, the action returns an error instead of proceeding.

The middleware version (commented out) would have applied a global shield + bot detection, but was removed because the Arcjet bundle exceeded Vercel's 1MB edge function limit.

---

### Q15. How does permission/plan gating work? Explain `canCreateInterview()`.

**Expected Answer:**

```typescript
export async function canCreateInterview() {
  return await Promise.any([
    hasPermission("unlimited_interviews").then(bool => bool || Promise.reject()),
    Promise.all([hasPermission("1_interview"), getUserInterviewCount()]).then(
      ([has, c]) => {
        if (has && c < 1) return true
        return Promise.reject()
      }
    ),
  ]).catch(() => false)
}
```

`Promise.any()` resolves as soon as **one** of the promises fulfills successfully:
- If user has `unlimited_interviews` permission → immediately passes
- Else if user has `1_interview` permission AND count < 1 → passes

If neither resolves (both reject), the outer `.catch()` returns `false`. The `hasPermission()` call checks Clerk's user metadata/organization claims, tying billing plans to feature access without a separate billing service.

---

### Q16. How is AI text streaming implemented in the API route for question generation?

**Expected Answer:**

The Vercel AI SDK's `streamText()` returns a `textStream` (a `ReadableStream`). But the SDK's protocol requires chunks prefixed with `0:` to be recognized by the `useCompletion` hook on the client side.

A custom `TransformStream` is used to encode each chunk manually:
```typescript
controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
```

The response includes special headers:
```
"x-vercel-ai-data-stream": "v1"  // tells AI SDK client to parse the stream
"x-question-id": questionId       // passes back the DB-generated ID via header
```

This pattern was chosen because the standard `toDataStreamResponse()` helper didn't fit the need to expose a custom ID before the stream ends. The `questionId` is pre-generated using `crypto.randomUUID()` before streaming begins so it can be passed back.

---

### Q17. Why is `onFinish` used in the `generateAiQuestion` call rather than awaiting the full text?

**Expected Answer:**

Streaming sends chunks to the user as they arrive. Awaiting the full text first would block the response and eliminate the streaming UX. The `onFinish` callback fires **after** the full stream completes, allowing the DB insert to happen asynchronously while the user is already reading the streamed output:

```typescript
const aiResult = await generateAiQuestion({
  onFinish: async (text) => {
    await insertQuestion({ id: questionId, text: text.trim(), ... })
  }
})
```

The stream starts immediately, the user sees text appearing in real time, and the DB write happens on the backend once streaming is done — without blocking the UX.

---

### Q18. How does Hume AI fit into the overall interview feature?

**Expected Answer:**

Hume AI provides a **voice-based AI conversation SDK** (`@humeai/voice-react`). It manages real-time voice conversations between the user and an AI interviewer. The flow is:
1. A Hume **access token** is fetched server-side and passed to a context provider
2. The `<VoiceProvider>` (from `@humeai/voice-react`) wraps the interview UI
3. When a chat session ends, Hume stores the transcript under a `chatId`
4. The interview table stores `humeChatId` — this is later used to fetch the full transcript via `fetchChatMessages(humeChatId)` from Hume's REST API
5. The transcript is passed to `generateText()` (Gemini) to generate structured feedback

The interview progress is **synced to the DB every 5 seconds** during the session via `setInterval` calling the `updateInterview` server action — ensuring duration is recorded even if the user closes mid-session.

---

## 🔴 ADVANCED — Deep Dives

---

### Q19. How does `suppressHydrationWarning` work and why is it needed here?

**Expected Answer:**

`suppressHydrationWarning` on `<html>` silences React's hydration mismatch errors on that element. It's needed because `next-themes` dynamically modifies the `class` attribute on `<html>` (e.g., `class="dark"`) **after** the server renders without knowing the user's theme preference.

The server renders `<html lang="en">` and the client hydrates it, but `next-themes` has already injected a `class` attribute — causing a mismatch. `suppressHydrationWarning` tells React to accept the browser's version for this element only, avoiding a false positive error while keeping the rest of the tree's hydration warnings active.

---

### Q20. What is the `$inferSelect` / `$inferInsert` pattern from Drizzle and how is it used here?

**Expected Answer:**

Drizzle automatically infers TypeScript types from the schema definition:
- `typeof JobInfoTable.$inferSelect` — the shape of a row returned from a SELECT
- `typeof JobInfoTable.$inferInsert` — the shape required for an INSERT

In the AI service:
```typescript
jobInfo: Pick<typeof JobInfoTable.$inferSelect, "title" | "description" | "experienceLevel">
```

This means the function only accepts the minimum required fields, keeps the type safe with changes to the schema (if `experienceLevel` is renamed, TypeScript breaks here immediately), and avoids passing unnecessary data between layers.

---

### Q21. The `getInterview` function applies two `cacheTag()` calls. Why?

**Expected Answer:**

```typescript
async function getInterview(id: string, userId: string) {
  "use cache"
  cacheTag(getInterviewIdTag(id))          // tag: "id:abc123:interviews"

  const interview = await db.query...
  cacheTag(getJobInfoIdTag(interview.jobInfo.id))  // tag: "id:xyz:jobInfos"
  ...
}
```

The cached result depends on **both** an interview row and its parent jobInfo row. If either changes, the cached interview should be invalidated. Adding both tags ensures:
- If the interview itself is updated → `revalidateTag("id:abc123:interviews")` invalidates it
- If the parent jobInfo is deleted/updated → `revalidateTag("id:xyz:jobInfos")` also invalidates it

This is a guard against stale data from related tables when using the relational query (`with: { jobInfo: ... }`).

---

### Q22. Why does the project use `Promise.any()` instead of `Promise.all()` in the permission check?

**Expected Answer:**

`Promise.all()` would require **all** conditions to be true simultaneously. But permission checks are ORs — a user can qualify through **any one** of multiple entitlement paths.

`Promise.any()` resolves as soon as the first promise fulfills (resolves), and only rejects if **all** promises reject. This maps perfectly to "user has at least one valid entitlement." Using `.then(bool => bool || Promise.reject())` converts a resolved `false` into a rejected promise, so `Promise.any()` correctly treats it as "this path doesn't qualify, try the next."

---

### Q23. What trade-off was made with the Arcjet bundle size and Vercel deployment?

**Expected Answer:**

The original design had Arcjet in `middleware.ts` with bot detection, shield, and rate limiting applied globally. However, Vercel's edge functions have a **1MB compressed bundle limit**, and Arcjet + its dependencies exceeded this.

The trade-off made was:
- Remove Arcjet from middleware → no global bot/shield protection on the edge
- Keep Arcjet **only in the server action** (`createInterview`) for rate limiting

This means: most pages aren't bot-protected at the edge, but the most expensive/sensitive operation (creating an interview) is still rate-limited at the action level. A better long-term solution would be splitting the middleware and action protections or using Arcjet's smaller edge-compatible package.

---

### Q24. How is the streaming response from the AI SDK connected to the React UI? What client-side primitives are used?

**Expected Answer:**

The `useCompletion` hook from `@ai-sdk/react` is pointed at the API route (`/api/ai/questions/generate-question`). It sends a POST, reads the streaming response respecting the `x-vercel-ai-data-stream: v1` header, and progressively updates `completion` (a string) in React state as chunks arrive.

The `x-question-id` response header is read by the client after the stream starts to obtain the DB ID for the question before the stream completes — allowing the UI to link the streamed text to a persisted entity.

For feedback, the same `useCompletion` hook pattern is applied to `/api/ai/questions/generate-feedback`.

---

### Q25. Explain `serverActions.allowedOrigins` in `next.config.ts`. What is it protecting against?

**Expected Answer:**

```typescript
serverActions: {
  allowedOrigins: ["localhost:3000", "hc3lft17-3000.inc1.devtunnels.ms", "*.vercel.app"]
}
```

Server Actions are secure POST calls made by Next.js. By default, Next.js validates the `Origin` header to prevent **Cross-Site Request Forgery (CSRF)** — only the app's own origin can trigger a Server Action.

When using a dev tunnel (e.g., VS Code devtunnels for testing on a physical device), the `Origin` header is the tunnel's URL, not `localhost:3000`. Without adding it, the action call is rejected with a 403. The `*.vercel.app` wildcard covers all Vercel preview deployment branches without needing to manually add each one.

---

### Q26. The project has both `drizzle-kit push` and `drizzle-kit migrate`. When would you use each?

**Expected Answer:**

- `db:push` (`drizzle-kit push`) — **development only**. It introspects the current schema and pushes changes directly to the database without generating SQL migration files. Fast for iteration but destructive (can drop columns) and not auditable.
- `db:generate` + `db:migrate` — **production and CI**. `generate` creates versioned SQL migration files in `src/drizzle/migrations/`. `migrate` applies them in order. This is safe, auditable, and reversible.

The `db:push:neon` script uses `dotenv -e .env.production` to load prod credentials and runs `migrate` — meaning production can only be updated via explicit migration files, not by pushing directly.

---

### Q27. Why is there a `canCreateQuestion` permission check but the questions don't have a plan limit in the same way as interviews? How would you architect that?

**Expected Answer:**

*(This is a design-reasoning question)*

The candidate should identify that:
1. `canCreateInterview` checks both a plan permission AND a count threshold.
2. `canCreateQuestion` presumably only checks a permission flag, not a count.
3. For questions to have a free tier limit (e.g., 5 questions per job), we'd need:
   - A `getQuestionCount(userId)` DB query (similar to `getInterviewCount`)
   - A `Promise.any()` gate: either `unlimited_questions` OR (`free_questions` AND count < 5)
   - A Clerk permission `"1_question"` or similar

A strong candidate would also note that count queries should be cached or indexed to avoid repeated DB hits on every action call, and that plan changes should immediately revalidate count-based permission caches.

---

### Q28. How would you add end-to-end type safety between the API route request body and the client that calls it?

**Expected Answer:**

Currently, the project uses **Zod** to validate the request body server-side (`schema.safeParse(body)`). The client manually constructs the body object.

To add end-to-end type safety without switching to tRPC, you could:
1. Export the Zod schema from the route file (or a shared types file)
2. Use `z.infer<typeof schema>` on the client to get the typed request shape
3. Use a typed fetch wrapper or `@ts-rest` to enforce the contract at compile time

Alternatively, since the project already uses Server Actions for mutations, moving streaming to a server action with `createStreamableUI` would give full type safety without a separate API route — though streaming from Server Actions has different constraints.

---

### Q29. What would happen if `revalidateTag` is not called after `updateInterview` in the server action?

**Expected Answer:**

The next time `getInterview()` is called (as a `"use cache"` function), it would return the **stale cached result** from the previous call, not the newly updated data from the database. The user would see outdated interview state — for example, old feedback or an old duration — until the cache entry naturally expires.

This is a classic **cache invalidation bug**. The fix used in this project (`revalidateTag(getInterviewIdTag(id))`) ensures that any cached response tagged with that ID is purged immediately on mutation, so the next read fetches fresh data from the DB.

---

### Q30. What would you refactor or improve in this project's architecture if you had more time?

**Expected Answer (strong candidate will mention several of these):**

1. **Type-safe API layer**: Replace raw fetch-based AI routes with Server Actions using `createStreamableUI` or adopt tRPC for full type safety
2. **Optimistic updates**: Currently mutations wait for server round-trips. `useOptimistic` (React 19) could improve perceived performance
3. **Cache warming**: Currently caches are cold on first load. SSG/ISR for public pages or `unstable_cache` with longer TTLs
4. **Error boundaries**: Add React `error.tsx` files for graceful error states in each route segment
5. **Testing**: No test suite visible — add Vitest for unit tests on actions/permissions and Playwright for E2E flows
6. **Arcjet on edge**: Find a lighter Arcjet bundle (or write a custom rate limiter using Upstash Redis) to re-enable edge-level bot protection
7. **Webhook reliability**: Add idempotency checks on the Clerk webhook handler to prevent duplicate user rows on retry

---

## 📋 Quick Fire Round

| Question | Strong Answer |
|---|---|
| What does `pgEnum` do in Drizzle? | Creates a Postgres `ENUM` type + TypeScript union from a `const` array |
| Why `uuid` as primary key vs `serial`? | UUIDs are globally unique (safe for distributed/merge), `serial` is sequential and DB-specific |
| What is `svix` used for? | Verifying Clerk webhook signatures to prevent spoofed requests |
| What does `@humeai/voice-react` provide? | React hooks/provider for real-time voice AI conversations |
| What is `react-resizable-panels` for? | Draggable split-pane UI (likely for side-by-side question + answer layout) |
| What does `sonner` do? | A React toast notification library |
| Why `tw-animate-css` alongside Tailwind? | Adds CSS animation utilities (keyframes) not in Tailwind's default set |
| What is `next-themes`? | Provides theme toggling (dark/light/system) with SSR support via `suppressHydrationWarning` |
| What is `@radix-ui`? | Unstyled, accessible React primitives (accordion, dialog, dropdown, etc.) |
| What is `class-variance-authority`? | A utility for defining style variants on components (used with shadcn/ui pattern) |
