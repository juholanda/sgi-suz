# AGENTS.md

## Cursor Cloud specific instructions

### Overview
SGI (Sistema de Gestão de Intertravamentos) is a Next.js 14 app for managing industrial safety interlocks. Single-service architecture: Next.js handles both frontend and API. Uses SQLite for local development via Prisma ORM.

### Environment
- `.env` must exist with `DATABASE_URL="file:./dev.db"`, `AUTH_SECRET`, and `NEXT_PUBLIC_APP_URL="http://localhost:3000"`.
- The Prisma schema uses `provider = "sqlite"` despite `.env.example` showing PostgreSQL. Always use `file:./dev.db` for local dev.

### Key commands
See `package.json` scripts. Summary:
- **Dev server:** `npm run dev` (port 3000)
- **Lint:** `npm run lint` (ESLint via `next lint`)
- **Build:** `npm run build`
- **DB generate:** `npm run db:generate` (prisma generate)
- **DB push:** `npm run db:push` (prisma db push — creates/syncs SQLite)
- **DB seed:** `npm run db:seed` (creates admin user `000001`/`suzano123` and demo user `000002`/`suzano123`)

### Gotchas
- There is no test framework configured (no jest/vitest/playwright). Lint and build are the main automated checks.
- The `.eslintrc.json` must exist for `next lint` to work non-interactively. Without it, `next lint` prompts for interactive setup which blocks CI/agents.
- The `react/no-unescaped-entities` rule is set to `"warn"` to accommodate pre-existing code; build will fail if this is set to `"error"`.
- Auth uses NextAuth v5 beta with a Credentials provider (matrícula + senha). Sessions are JWT-based.
- After `npm install`, always run `npm run db:generate` to regenerate the Prisma client.
