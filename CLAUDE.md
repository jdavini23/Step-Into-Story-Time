# Step Into Storytime

AI-powered personalized bedtime story generator for children ages 2-8. Parents create stories where their child is the main character, choose tones/themes, save favorites, and build bedtime rituals. Three subscription tiers: Free, Premium, Family.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Wouter (routing), TanStack Query (server state), Tailwind CSS + shadcn/ui, Vite, Framer Motion |
| Backend | Node.js, Express.js, TypeScript, ESM modules |
| Database | PostgreSQL (Neon serverless), Drizzle ORM |
| AI | Google Gemini 2.5 Flash via `@google/genai` |
| Auth | better-auth (email/password + Google OAuth), PostgreSQL session store |
| Payments | Stripe (checkout, subscriptions, webhooks) |
| Validation | Zod + drizzle-zod (shared client/server schemas) |
| PDF | jspdf for story export |
| Deployment | Railway, port from `$PORT` env var |

## Project Structure

```
client/src/
  components/
    ui/              # shadcn/ui primitives (do not edit manually - use shadcn CLI)
    dashboard/       # Dashboard-specific components
    landing/         # Landing page sections
    story-wizard/    # Multi-step story creation wizard
    header.tsx       # App header with nav and auth
    error-boundary.tsx
  pages/             # Route-level page components
    dashboard.tsx    # Authenticated home (story library)
    landing.tsx      # Unauthenticated home
    story-wizard.tsx # Story creation flow
    story-reader.tsx # Story display/reading
    characters.tsx   # Custom character management (Pro)
    pricing.tsx      # Tier comparison
    subscribe.tsx    # Stripe checkout flow
    checkout.tsx     # Payment processing
  hooks/             # Custom React hooks
    useAuth.ts       # Authentication state
    useCSRF.ts       # CSRF token management
    useTierInfo.ts   # Subscription tier info
    use-toast.ts     # Toast notifications
    use-mobile.tsx   # Mobile breakpoint detection
  lib/               # Utilities
    queryClient.ts   # TanStack Query config with error handling
    inputValidation.ts # Client-side validation helpers
    authRedirect.ts  # Auth redirect logic

server/
  routes/            # Express route modules (registerXRoutes pattern)
    stories.ts       # Story CRUD + generation + PDF export
    characters.ts    # Custom character CRUD
    favorites.ts     # Favorite toggle
    payments.ts      # Stripe checkout/portal
    webhooks.ts      # Stripe webhook handler
    auth.ts          # Auth endpoints
    seo.ts           # SEO/meta routes
    system.ts        # Health check
    index.ts         # Route registration + rate limiters
  openai.ts          # ⚠️ MISLEADING NAME: Actually uses Google Gemini, not OpenAI
  storage.ts         # IStorage interface + DatabaseStorage implementation
  auth.ts            # better-auth setup (Google OAuth + email/password)
  authMiddleware.ts  # Express middleware: isAuthenticated
  tierManager.ts     # Subscription tier logic + usage tracking
  tierMiddleware.ts  # Express middleware for tier-based access control
  pdfGenerator.ts    # PDF story export
  inputValidation.ts # Server-side validation, CSRF, rate limiting
  db.ts              # Drizzle database connection

shared/
  schema.ts          # Drizzle table definitions + Zod insert schemas
  storyTemplates.ts  # Story structure templates for AI prompts
  models/            # Shared type models
```

## Path Aliases

```
@/*       → client/src/*
@shared/* → shared/*
@assets/* → attached_assets/*
```

Configured in both `tsconfig.json` and `vite.config.ts`.

## Commands

```bash
npm run dev      # Development server (tsx server/index.ts)
npm run build    # Production build (vite + esbuild)
npm start        # Production server (node dist/index.js)
npm run check    # TypeScript type checking (tsc --noEmit)
npm run db:push  # Push schema changes to database (drizzle-kit)
```

**Note:** No test runner, linter, or formatter is configured. `npm run check` is the only code quality command available.

## Key Conventions

### Database & Schema
- All table definitions live in `shared/schema.ts` using Drizzle ORM
- Insert schemas auto-generated via `createInsertSchema` from drizzle-zod
- Schema changes: edit `shared/schema.ts` → run `npm run db:push`
- **Do NOT drop** the `users` table — required by better-auth for user identity

### Server Patterns
- Routes follow `registerXRoutes(app, ...limiters)` pattern in `server/routes/`
- All database operations go through `IStorage` interface (`server/storage.ts`)
- CSRF tokens required for all mutation endpoints (POST/PUT/DELETE)
- Rate limiting: `storyGenerationLimiter` (5/min) and `generalLimiter` (30/min)
- `server/openai.ts` is the AI generation module — it uses **Gemini**, not OpenAI (legacy filename)

### Frontend Patterns
- Data fetching via TanStack Query (`useQuery`/`useMutation` with `queryClient`)
- Routing via Wouter (`<Route>`, `<Switch>`, `useLocation`)
- UI components from shadcn/ui in `client/src/components/ui/`
- Forms use react-hook-form + zod resolvers
- Authentication state via `useAuth()` hook
- Tier-gated features checked via `useTierInfo()` hook

### Subscription Tiers
- **Free**: Limited weekly stories, no PDF, no custom characters
- **Premium**: Higher limits, PDF downloads
- **Family**: Highest limits, PDF downloads, custom characters
- Tier enforcement: `tierMiddleware.ts` (server), `useTierInfo` (client)

### Environment Variables
```
DATABASE_URL                # PostgreSQL connection string (Neon)
BETTER_AUTH_SECRET          # better-auth session signing secret (32+ chars)
BETTER_AUTH_BASE_URL        # App base URL (e.g. https://your-app.railway.app)
TRUSTED_ORIGINS             # Allowed CORS origins (same as BETTER_AUTH_BASE_URL)
GOOGLE_CLIENT_ID            # Google OAuth client ID
GOOGLE_CLIENT_SECRET        # Google OAuth client secret
GEMINI_API_KEY              # Google Gemini API key
STRIPE_SECRET_KEY           # Stripe payment processing
STRIPE_WEBHOOK_SECRET       # Stripe webhook signing secret
VITE_STRIPE_PUBLIC_KEY      # Stripe publishable key (client-side)
NODE_ENV                    # production | development
PORT                        # Server port (Railway sets this automatically)
```

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Run `npm run check` to verify TypeScript compiles cleanly
- Run `npm run build` for production-impacting changes
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Check server logs, browser console, and TypeScript errors independently

## Task Management

- Plan first: write plan to `tasks/todo.md` with checkable items
- Track corrections in `tasks/lessons.md`
- Create the `tasks/` directory if it doesn't exist

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
