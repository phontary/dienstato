# BetterShift AI Coding Assistant Instructions

## Architecture Overview

**BetterShift** is a Next.js 16 App Router shift management application with SQLite database, designed for managing work schedules across multiple calendars.

### Core Architecture

- **Frontend**: Next.js 16 App Router (`app/` directory), React 19, client-side state management
- **Backend**: Next.js API Routes (`app/api/`) with server-side logic
- **Database**: SQLite via Drizzle ORM, file-based at `./data/sqlite.db`
- **i18n**: next-intl with German/English support, cookie-based preference + browser detection
- **Styling**: Tailwind CSS 4 with shadcn/ui components (`components/ui/`)

### Data Model (lib/db/schema.ts)

Four main tables with cascade delete relationships:

- `calendars` → `shifts` (via calendarId), `shiftPresets`, `calendarNotes`
- `shiftPresets` → `shifts` (via presetId, set null on delete)
- All IDs use `crypto.randomUUID()`, timestamps stored as integers
- Password hashing uses SHA-256 (see `lib/password-utils.ts`)

## Critical Development Patterns

### Database Workflow

```bash
# After schema changes in lib/db/schema.ts:
npm run db:generate  # Creates migration in drizzle/
npm run db:migrate   # Runs pending migrations
```

**Important**: Migrations are committed to git. Schema changes require both updating `lib/db/schema.ts` AND running migrations.

### API Route Patterns

All API routes follow this structure (see `app/api/shifts/route.ts`):

```typescript
// GET with optional query params for filtering
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get("calendarId");
  // Always validate required params
  if (!calendarId) return NextResponse.json({ error: "..." }, { status: 400 });
}

// Dynamic routes use async params (Next.js 16)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Must await!
}
```

### Password Protection Flow

Calendars can be password-protected. The workflow is:

1. Check localStorage for `calendar_password_${calendarId}`
2. Verify via `/api/calendars/[id]/verify-password` POST endpoint
3. On 401, show `PasswordDialog`, store password in localStorage
4. Use `pendingAction` state pattern to retry after password entry

Example in `app/page.tsx`:

```typescript
setPendingAction({ type: "edit", shiftId: id, formData });
setShowPasswordDialog(true);
// After password success, execute pending action
```

### Client Component State Management

Main page (`app/page.tsx`) uses:

- `useState` for local state (shifts, presets, notes, calendars)
- `useEffect` for data fetching on calendar/date changes
- URL sync via `useRouter().replace()` for selected calendar
- Refresh triggers: `statsRefreshTrigger` counter incremented after mutations

### i18n Implementation

Uses next-intl with auto-detection:

1. Cookie `NEXT_LOCALE` overrides browser preference (see `lib/i18n.ts`)
2. Translation keys in `messages/{de,en}.json`
3. Access via `const t = useTranslations()` then `t("shift.create")`
4. Date formatting requires locale-specific formatters: `locale === "de" ? de : enUS`

### Component Patterns

- **Dialog components** (e.g., `components/note-dialog.tsx`): Control open state via props, reset internal state on close
- **Form submission**: Prevent default, validate, call parent callback, close dialog
- **Preset colors**: Use `PRESET_COLORS` constant array for consistent color picker options
- **Date handling**: Use `formatDateToLocal()` helper for consistent YYYY-MM-DD format

### Calendar Interaction Patterns

- **Left-click day**: Toggle shift using selected preset (requires preset selection)
- **Right-click day**: Open note dialog (`onContextMenu` handler with `e.preventDefault()`)
- **Shift toggle logic**: Check if matching shift exists, delete if present, create if not
- **Notes indicator**: Display `<StickyNote>` icon when day has note

## Docker & Production

### Local Development

```bash
npm install
npm run db:migrate  # One-time setup
npm run dev         # http://localhost:3000
```

### Docker Deployment

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
docker-compose up -d --build
docker compose exec bettershift npm run db:migrate  # Run migrations in container
```

**Critical**: The Dockerfile uses multi-stage build with `next/standalone` output. The `drizzle.config.ts` must be copied to runner stage for migrations to work in production.

## Common Gotchas

1. **Next.js 16 Breaking Change**: Dynamic route params are now async Promises - always `await params`
2. **SQLite Timestamps**: Use `{ mode: "timestamp" }` for date fields, stored as integers, auto-converted to Date objects
3. **Cascade Deletes**: Deleting calendar deletes all shifts/presets/notes via `onDelete: "cascade"`
4. **Preset Auto-Save**: Shift dialog has auto-save-as-preset enabled by default (`saveAsPreset` state)
5. **Color Format**: Always store hex colors (e.g., `#3b82f6`), use 20% opacity for backgrounds (`${color}20`)
6. **Mobile vs Desktop**: Separate calendar selector UIs - mobile uses dialog (`showMobileCalendarDialog`)

## Adding New Features

### New Database Table

1. Add table definition to `lib/db/schema.ts` with relationships
2. Export types: `export type TableName = typeof tableName.$inferSelect;`
3. Run `npm run db:generate && npm run db:push`
4. Create API routes: `app/api/tablename/route.ts` and `app/api/tablename/[id]/route.ts`
5. Add translations to `messages/de.json` and `messages/en.json`

### New Component with Dialog

1. Create in `components/` using shadcn/ui Dialog
2. Props: `open`, `onOpenChange`, `onSubmit`, optional `onDelete`
3. Use `useTranslations()` for all text
4. Reset local state when `open` changes to false
5. Import and integrate in `app/page.tsx`

## Testing & Debugging

- Database GUI: `npm run db:studio` (opens Drizzle Studio)
- Build validation: `npm run build` (checks TypeScript errors)
- Production test: Use Docker locally before deploying
- Check console errors for API failures - all errors logged with `console.error()`

## Important Infos

- Never run `db:push` or suggest running it.
- All code, comments, variable names, and messages must always be in English.
- Prefer safe migrations (db:generate + manual review).
- Never write German code comments.
