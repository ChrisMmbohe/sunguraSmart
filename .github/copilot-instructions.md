# Copilot Instructions for SunguraSmart

## Project Overview

SunguraSmart is a Next.js 16 application for managing rabbit farms. It's a full-stack system built with:
- **Frontend**: React 19 with TypeScript, Tailwind CSS 4, shadcn/ui components
- **Backend**: Next.js API routes, server actions (use server directive)
- **Database**: MongoDB with Mongoose ODM
- **Auth**: Clerk for authentication and user management
- **UI Framework**: Radix UI primitives, shadcn/ui (New York style)

The app features dashboard views for rabbits, feeds, litters, finances, health records, schedules, and cage cards—each following a consistent feature-page architecture.

## Build, Test, and Lint Commands

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run ESLint (includes TypeScript linting via eslint-config-next)
npm run lint
```

**Note**: No test suite is configured. The project uses only linting via ESLint.

## Architecture

### Core Structure

```
app/                          # Next.js App Router pages and routes
  api/                        # API endpoints (if needed)
  [feature]/                  # Feature pages (rabbits, feeds, litters, etc.)
    page.tsx                  # Main feature page component
    actions.ts                # Server actions using "use server"
    columns.tsx               # Table column definitions (if applicable)
    types.ts                  # TypeScript types and Zod schemas
components/                   # React components (mostly client-side)
  ui/                         # shadcn/ui components (generated)
  shared/                     # Reusable domain components
  [feature]/                  # Feature-specific components
database/                     # Mongoose models and utilities
  models/                     # Data models (follow *_model.ts naming)
  plugins/                    # Mongoose schema plugins
  connection.ts               # MongoDB connection management
  utils/                      # Database utilities
lib/                          # Utilities and helpers
  actions/                    # Shared server actions (named *-actions.ts)
  data-fetcher.ts             # Central data fetching functions
  prompts/                    # Any LLM prompts used
hooks/                        # Custom React hooks
types/                        # Shared TypeScript types and enums
```

### Key Architectural Patterns

1. **Server Actions**: Uses Next.js server actions ("use server" directive) for data mutations from components
2. **Data Fetching**: Centralized in `lib/data-fetcher.ts` for queries used across features
3. **Database Connection Caching**: MongoDB connection is cached globally to survive hot reloads and serverless contexts (see `database/connection.ts`)
4. **Multi-tenant Architecture**: Models use a tenant plugin (`database/plugins/_tenantPlugin.ts`) to isolate data per user
5. **Clerk Auth Integration**: Authentication and userId extraction via `@clerk/nextjs/server`
6. **Client vs Server**: 
   - Feature pages in `app/` are server components by default
   - Client-heavy components use "use client" pragma
   - Data fetching happens in server components or server actions
7. **Error Handling in Pages**: Feature pages catch errors from data fetchers and render error UI gracefully

### Feature Page Pattern

Each feature (rabbits, feeds, litters, etc.) follows this pattern:
- **`page.tsx`**: Server component that fetches data and renders layout with sidebar, header, and feature content
- **`actions.ts`**: "use server" file with form actions and mutations (use `ActionResult` interface for consistent responses)
- **`columns.tsx`**: Data table column definitions using TanStack React Table
- **`types.ts`**: TypeScript interfaces and Zod validation schemas
- **`*-client.tsx` or `*-table.tsx`**: Client components for interactive parts (forms, tables with client-side sorting/filtering)

### Mongoose Model Conventions

- Files: `CapitalCamelCase_model.ts` (e.g., `Rabbit_model.ts`)
- Exports: Interface `I<ModelName>`, then the model itself
- Includes:
  - `ITenantFields` plugin mixin for multi-tenancy
  - Type-safe enums imported from `types/enums`
  - Virtuals for computed fields
  - Optional indexes for frequently queried fields
- Connection: Always use `dbConnect()` before querying (safe for hot reloads)

### Tailwind & Styling

- **Tailwind CSS 4** with PostCSS integration
- **shadcn/ui components** (New York style, stone base color, using CSS variables)
- Custom theme in `app/globals.css`
- Use Tailwind utility classes; component styling is in shadcn/ui or custom `.tsx` files
- Dark mode support via `next-themes` (class-based)

### Path Aliases

TypeScript paths are configured to use `@/` prefix:
- `@/components` → root/components
- `@/lib` → root/lib
- `@/hooks` → root/hooks
- `@/database` → root/database
- `@/types` → root/types

Always use path aliases; avoid relative imports for clarity.

## Key Conventions

### Server Actions

```typescript
// Use "use server" at the top of actions files
"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export interface ActionResult {
  success: boolean
  error?: string
  fieldErrors?: Partial<Record<string, string>>
}

async function getAuthUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("You must be signed in.")
  return userId
}
```

### Form Validation & Types

- Use **Zod** schemas in `types.ts` for validation
- Define `FormValues` types to mirror form fields
- Server actions accept form values, validate, transform, and return `ActionResult`
- Use `describeError()` to convert Mongoose errors to user-friendly messages (especially 11000 duplicate-key errors)

### Database Queries

```typescript
// Always connect before querying
import { dbConnect, Rabbit } from "@/database"

export async function getRabbitsForTable() {
  await dbConnect()
  const userId = await getAuthUserId()
  return Rabbit.find({ userId }).populate("breed cage").lean()
}
```

### Error Handling in Feature Pages

- Wrap data fetchers in try-catch in the page component
- Render error UI with `AlertTriangle` icon and helpful message (see rabbits/page.tsx example)
- Don't expose database errors; use "Check your database connection" message

### Component Props & Types

- Define component props as TypeScript interfaces in the component file or in `types.ts`
- Use `React.ReactNode` for children
- Avoid prop drilling; consider client context for feature-specific state
- Keep UI components small and focused

### Naming Conventions

- **Files**: kebab-case for routes and components, snake_case for utilities, CamelCase for models
- **Exports**: Named exports for functions/types, default export for page components
- **Database models**: `I<ModelName>` for interfaces, `<ModelName>` for the schema/model
- **Server actions**: Verb + noun, e.g., `createRabbit`, `updateWeightLog`, `deleteExpense`
- **Constants**: UPPER_SNAKE_CASE for enum values; lowercase for other constants

### Environment Variables

- Required: `MONGODB_URI` (connection string)
- Required: `NEXT_PUBLIC_CLERK_*` and `CLERK_*` (see Clerk docs)
- Optional: PostHog analytics keys
- Add to `.env.local` during development; document in GitHub if used in CI/CD

### PostHog Integration

- Rewrites configured in `next.config.ts` for `/ingest/` routes
- Skip trailing-slash redirect enabled for PostHog API compatibility
- Import `posthog-js` for client-side analytics (if used)

### Theme & Dark Mode

- `next-themes` ThemeProvider wraps the root layout
- HTML class attribute controls theme (Tailwind dark: prefix)
- Default to system preference
- Suppress hydration warnings with `suppressHydrationWarning` on HTML tag

## Common Workflows

### Adding a New Feature Page

1. Create folder in `app/[feature]/`
2. Build `page.tsx` (server component) to fetch data and render layout
3. Build `types.ts` with Zod schemas and TypeScript interfaces
4. Build `actions.ts` with "use server" mutations
5. Build `columns.tsx` for table columns if using TanStack React Table
6. Build client component(s) for interactive UI (forms, tables)
7. Import from `@/lib/data-fetcher` for queries or create feature-specific fetchers

### Creating a New Data Model

1. Create `database/models/Feature_model.ts` with Mongoose schema
2. Export interface `IFeature` and the model
3. Include `ITenantFields` mixin (via `tenantPlugin`)
4. Re-export in `database/index.ts`
5. Add server action in `app/[feature]/actions.ts` to create/update/delete
6. Wire into the feature page form and table

### Styling a Component

1. Use Tailwind utility classes for layout and spacing
2. Import shadcn/ui components as needed (Button, Input, Dialog, etc.)
3. For custom styling, write `.tsx` style prop or wrap shadcn/ui components
4. Respect dark mode with `dark:` prefix
5. Test in both light and dark modes

## Linting & Code Quality

- **Linter**: ESLint 9 with `eslint-config-next` and TypeScript support
- **Strict TypeScript**: `strict: true` in tsconfig.json
- **ESLint Config**: Only default Next.js and TypeScript rules; no additional plugins
- **Command**: `npm run lint` (no auto-fix configured)
- **Ignored Paths**: `.next/`, `out/`, `build/`, `next-env.d.ts`

Always ensure lint passes before committing. Fix any ESLint warnings and TypeScript errors.

## Important Notes

- **Database Connection**: Cached globally to survive Next.js hot reloads. Do not create new connections per request.
- **Importing Models**: Models are re-exported from `database/index.ts`. Always import from `@/database`, not directly from model files.
- **Client Bundles**: Avoid importing `database/connection.ts` at the top level of client components; it uses `server-only` and will crash the page.
- **Mongoose Lean Queries**: Use `.lean()` when fetching data for read-only display to improve performance.
- **Duplicate Key Errors**: Handle error code 11000 gracefully in server actions; return a friendly message to the user.
- **Revalidation**: Use `revalidatePath()` after mutations to refresh UI without full page reload.
- **PostHog Tracking**: Configure privacy and compliance settings before enabling in production.
