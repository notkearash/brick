# Brick - CRM GUI

Desktop/web GUI for the CRM database.

## Stack

- **Frontend:** React + Vite + TanStack Table + Tailwind + shadcn/ui
- **Backend:** Hono + Bun (serves API + static files)
- **Desktop:** Tauri v2
- **Database:** SQLite via `../crm.db`

## Development

```bash
# Terminal 1: Hono API server on :3000
bun run dev

# Terminal 2: Vite dev server on :5173 (proxies /api to :3000)
bun run dev:client
```

Open http://localhost:5173 in browser.

For Tauri desktop app:
```bash
bun run tauri dev
```

## Production

```bash
bun run build          # Build Vite client to dist/
bun run dev            # Serves built client + API

bun run tauri build    # Build desktop app
```

## Structure

```
brick/
├── client/
│   ├── components/
│   │   ├── calendar/     # Calendar view components
│   │   ├── data-table/   # Table view components
│   │   ├── dialogs/      # Modal dialogs
│   │   ├── document/     # Document/rich-text editor
│   │   ├── layout/       # Shell layout + sidebar orchestration
│   │   ├── sidebar/      # Nav items, icons, context menus
│   │   └── ui/           # shadcn/ui primitives
│   ├── hooks/            # React hooks (useTablePrefs, useDocumentEditor, etc.)
│   ├── pages/            # Route pages (TableView, CalendarView, DocumentView, etc.)
│   └── lib/              # Utilities
├── server/
│   ├── index.ts          # Hono API server + all routes
│   └── db.ts             # SQLite connection + brick helpers
├── shared/               # Code shared between client and server
│   └── filters.ts        # Filter types
└── src-tauri/            # Tauri v2 desktop wrapper
```

## API Endpoints

Tables (generic, any user-created table):
- `GET /api/tables` - list all tables
- `POST /api/tables` - create table (supports type: "table" | "calendar" | "document")
- `DELETE /api/tables/:name` - drop table
- `GET /api/tables/:name` - query rows (supports ?limit, ?offset, ?filters, ?start_date, ?end_date)
- `GET /api/tables/:name/schema` - get column info
- `POST /api/tables/:name` - insert row
- `PUT /api/tables/:name/:id` - update row
- `DELETE /api/tables/:name/:id` - delete row
- `PUT /api/tables/:name/sync` - bulk upsert/delete blocks (used by document editor)
- `PUT /api/tables/:name/rename` - rename table

Brick (metadata layer):
- `GET /api/brick/status` - check if DB has brick metadata tables
- `POST /api/brick/up` - initialize brick metadata (or copy + init)
- `GET /api/brick/preferences` - read preferences (?scope= optional)
- `PUT /api/brick/preferences` - upsert a preference
- `DELETE /api/brick/preferences` - delete a preference

Config:
- `GET /api/config` - get current DB path
- `POST /api/config` - set DB path
