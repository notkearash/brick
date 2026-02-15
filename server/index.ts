import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import type { FilterCondition } from "../shared/filters";
import {
  brickUp,
  closeDb,
  copyAndBrick,
  getConfig,
  getDb,
  isBricked,
  reconnectDb,
  setConfig,
} from "./db";

const VALID_OPS = new Set([
  "=",
  "<>",
  ">",
  ">=",
  "<",
  "<=",
  "like",
  "not_like",
  "in",
  "is_null",
  "is_not_null",
]);

function buildFilterWhereClause(
  filters: FilterCondition[],
  validColumns: Set<string>,
): { clause: string; params: (string | number | boolean | null)[] } {
  const conditions: string[] = [];
  const params: (string | number | boolean | null)[] = [];

  for (const f of filters) {
    if (!validColumns.has(f.column) || !VALID_OPS.has(f.op)) continue;

    const col = `"${f.column}"`;

    if (f.op === "is_null") {
      conditions.push(`${col} IS NULL`);
    } else if (f.op === "is_not_null") {
      conditions.push(`${col} IS NOT NULL`);
    } else if (f.op === "not_like") {
      conditions.push(`${col} NOT LIKE ?`);
      params.push(f.value ?? "");
    } else if (f.op === "in") {
      const values = (f.value ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      if (values.length === 0) continue;
      conditions.push(`${col} IN (${values.map(() => "?").join(", ")})`);
      params.push(...values);
    } else {
      conditions.push(`${col} ${f.op} ?`);
      params.push(f.value ?? "");
    }
  }

  if (conditions.length === 0) return { clause: "", params: [] };
  return { clause: conditions.join(" AND "), params };
}

const app = new Hono();

app.use("/api/*", cors());

app.get("/api/config", (c) => {
  return c.json(getConfig());
});

app.post("/api/config", async (c) => {
  const body = await c.req.json();
  const { dbPath } = body;

  if (!dbPath) {
    return c.json({ error: "dbPath is required" }, 400);
  }

  try {
    const { existsSync } = await import("node:fs");
    if (!existsSync(dbPath)) {
      return c.json({ error: "File does not exist" }, 400);
    }

    closeDb();
    setConfig({ dbPath });
    const db = getDb();
    if (!db) {
      return c.json({ error: "Failed to open database" }, 400);
    }

    return c.json({ success: true, dbPath });
  } catch (e) {
    return c.json({ error: `Invalid database: ${e}` }, 400);
  }
});

app.get("/api/tables", (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const tables = db
    .query(
      `SELECT name FROM sqlite_master
       WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_brick_%'
       ORDER BY name`,
    )
    .all() as { name: string }[];

  return c.json(tables.map((t) => t.name));
});

app.post("/api/tables", async (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const body = await c.req.json();
  const { name, columns: cols, type, title } = body;

  if (!name || typeof name !== "string") {
    return c.json({ error: "Table name is required" }, 400);
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    return c.json(
      { error: "Table name must be alphanumeric (plus underscores)" },
      400,
    );
  }

  if (name.startsWith("_brick_") || name.startsWith("sqlite_")) {
    return c.json({ error: "Reserved table name" }, 400);
  }

  if (type === "calendar") {
    try {
      db.query(
        `CREATE TABLE '${name}' (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, start_at TEXT NOT NULL, end_at TEXT, description TEXT, color TEXT)`,
      ).run();
      return c.json({ success: true, name }, 201);
    } catch (e) {
      return c.json({ error: `Create table failed: ${e}` }, 400);
    }
  }

  if (type === "document") {
    try {
      db.query(
        `CREATE TABLE '${name}' (id INTEGER PRIMARY KEY AUTOINCREMENT, position REAL NOT NULL, content TEXT NOT NULL DEFAULT '', is_title INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL DEFAULT 'paragraph', attrs TEXT)`,
      ).run();
      const docTitle =
        typeof title === "string" && title.trim() ? title.trim() : "Untitled";
      db.query(
        `INSERT INTO '${name}' (position, content, is_title) VALUES (1.0, ?, 1)`,
      ).run(docTitle);
      return c.json({ success: true, name }, 201);
    } catch (e) {
      return c.json({ error: `Create table failed: ${e}` }, 400);
    }
  }

  if (!Array.isArray(cols) || cols.length === 0) {
    return c.json({ error: "At least one column is required" }, 400);
  }

  const colDefs = cols.map(
    (col: { name: string; type: string; pk?: boolean }) => {
      const colName = col.name;
      const colType = col.type || "TEXT";
      if (col.pk) {
        return `'${colName}' ${colType} PRIMARY KEY AUTOINCREMENT`;
      }
      return `'${colName}' ${colType}`;
    },
  );

  try {
    db.query(`CREATE TABLE '${name}' (${colDefs.join(", ")})`).run();
    return c.json({ success: true, name }, 201);
  } catch (e) {
    return c.json({ error: `Create table failed: ${e}` }, 400);
  }
});

app.delete("/api/tables/:name", (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const tableName = c.req.param("name");

  if (tableName.startsWith("_brick_") || tableName.startsWith("sqlite_")) {
    return c.json({ error: "Cannot delete system tables" }, 400);
  }

  const tableExists = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableName);

  if (!tableExists) {
    return c.json({ error: "Table not found" }, 404);
  }

  try {
    db.query(`DROP TABLE '${tableName}'`).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Drop table failed: ${e}` }, 400);
  }
});

app.get("/api/tables/:name/schema", (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const tableName = c.req.param("name");

  const tableExists = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableName);

  if (!tableExists) {
    return c.json({ error: "Table not found" }, 404);
  }

  const columns = db.query(`PRAGMA table_info('${tableName}')`).all();
  const foreignKeys = db.query(`PRAGMA foreign_key_list('${tableName}')`).all();

  return c.json({ columns, foreignKeys });
});

app.get("/api/tables/:name", (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const tableName = c.req.param("name");
  const limit = parseInt(c.req.query("limit") || "100", 10);
  const offset = parseInt(c.req.query("offset") || "0", 10);
  const startDate = c.req.query("start_date");
  const endDate = c.req.query("end_date");
  const filtersParam = c.req.query("filters");

  const tableExists = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableName);

  if (!tableExists) {
    return c.json({ error: "Table not found" }, 404);
  }

  let filterClause = "";
  let filterParams: (string | number | boolean | null)[] = [];
  if (filtersParam) {
    try {
      const parsed = JSON.parse(filtersParam) as FilterCondition[];
      const columns = db.query(`PRAGMA table_info('${tableName}')`).all() as {
        name: string;
      }[];
      const validColumns = new Set(columns.map((col) => col.name));
      const result = buildFilterWhereClause(parsed, validColumns);
      filterClause = result.clause;
      filterParams = result.params;
    } catch {
      // ignore invalid filter JSON
    }
  }

  const whereParts: string[] = [];
  const allParams: (string | number | boolean | null)[] = [];

  if (startDate && endDate) {
    whereParts.push("start_at < ? AND (end_at >= ? OR end_at IS NULL)");
    allParams.push(endDate, startDate);
  }

  if (filterClause) {
    whereParts.push(filterClause);
    allParams.push(...filterParams);
  }

  const whereSQL =
    whereParts.length > 0 ? ` WHERE ${whereParts.join(" AND ")}` : "";

  const rows = db
    .query(`SELECT * FROM '${tableName}'${whereSQL} LIMIT ? OFFSET ?`)
    .all(...allParams, limit, offset);
  const countResult = db
    .query(`SELECT COUNT(*) as count FROM '${tableName}'${whereSQL}`)
    .get(...allParams) as { count: number };

  return c.json({
    rows,
    total: countResult.count,
    limit,
    offset,
  });
});

app.post("/api/tables/:name", async (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const tableName = c.req.param("name");
  const body = await c.req.json().catch(() => ({}));

  const columns = Object.keys(body);
  const values = Object.values(body) as import("bun:sqlite").SQLQueryBindings[];

  try {
    let result: { lastInsertRowid: number | bigint };
    if (columns.length === 0) {
      result = db.query(`INSERT INTO '${tableName}' DEFAULT VALUES`).run();
    } else {
      const placeholders = columns.map(() => "?").join(", ");
      result = db
        .query(
          `INSERT INTO '${tableName}' (${columns.join(", ")}) VALUES (${placeholders})`,
        )
        .run(...values);
    }

    return c.json({ success: true, id: result.lastInsertRowid }, 201);
  } catch (e) {
    return c.json({ error: `Insert failed: ${e}` }, 400);
  }
});

app.put("/api/tables/:name/sync", async (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const tableName = c.req.param("name");
  const body = await c.req.json();
  const { blocks } = body;

  if (!Array.isArray(blocks)) {
    return c.json({ error: "blocks array is required" }, 400);
  }

  const tableExists = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableName);

  if (!tableExists) {
    return c.json({ error: "Table not found" }, 404);
  }

  try {
    const columns = db.query(`PRAGMA table_info('${tableName}')`).all() as {
      name: string;
      type: string;
      pk: number;
    }[];
    if (!columns.some((col) => col.name === "type")) {
      db.query(
        `ALTER TABLE '${tableName}' ADD COLUMN type TEXT NOT NULL DEFAULT 'paragraph'`,
      ).run();
      db.query(`ALTER TABLE '${tableName}' ADD COLUMN attrs TEXT`).run();
    }

    const existing = db.query(`SELECT id FROM '${tableName}'`).all() as {
      id: number;
    }[];
    const existingIds = new Set(existing.map((r) => r.id));

    const incomingIds = new Set(
      blocks
        .filter((b: Record<string, unknown>) => b.id != null)
        .map((b: Record<string, unknown>) => b.id),
    );

    for (const id of existingIds) {
      if (!incomingIds.has(id)) {
        db.query(`DELETE FROM '${tableName}' WHERE id = ?`).run(id);
      }
    }

    for (const block of blocks) {
      const attrsStr = block.attrs ? JSON.stringify(block.attrs) : null;
      if (block.id != null && existingIds.has(block.id)) {
        db.query(
          `UPDATE '${tableName}' SET position = ?, content = ?, is_title = ?, type = ?, attrs = ? WHERE id = ?`,
        ).run(
          block.position,
          block.content,
          block.is_title ? 1 : 0,
          block.type || "paragraph",
          attrsStr,
          block.id,
        );
      } else {
        db.query(
          `INSERT INTO '${tableName}' (position, content, is_title, type, attrs) VALUES (?, ?, ?, ?, ?)`,
        ).run(
          block.position,
          block.content,
          block.is_title ? 1 : 0,
          block.type || "paragraph",
          attrsStr,
        );
      }
    }

    const rows = db
      .query(`SELECT * FROM '${tableName}' ORDER BY position`)
      .all();
    return c.json({ rows });
  } catch (e) {
    return c.json({ error: `Sync failed: ${e}` }, 400);
  }
});

app.put("/api/tables/:name/rename", async (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const oldName = c.req.param("name");
  const body = await c.req.json();
  const { newName } = body;

  if (!newName || typeof newName !== "string") {
    return c.json({ error: "newName is required" }, 400);
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newName)) {
    return c.json(
      { error: "Table name must be alphanumeric (plus underscores)" },
      400,
    );
  }

  if (newName === oldName) {
    return c.json({ success: true, name: newName });
  }

  const conflict = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(newName);

  if (conflict) {
    return c.json({ error: "A table with that name already exists" }, 409);
  }

  try {
    db.query(`ALTER TABLE '${oldName}' RENAME TO '${newName}'`).run();

    try {
      db.query("UPDATE _brick_preferences SET scope = ? WHERE scope = ?").run(
        newName,
        oldName,
      );
    } catch {
      // preferences table may not exist
    }

    return c.json({ success: true, name: newName });
  } catch (e) {
    return c.json({ error: `Rename failed: ${e}` }, 400);
  }
});

app.put("/api/tables/:name/:id", async (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const tableName = c.req.param("name");
  const id = c.req.param("id");
  const body = await c.req.json();

  const columns = db.query(`PRAGMA table_info('${tableName}')`).all() as {
    name: string;
    type: string;
    pk: number;
  }[];
  const pkColumn = columns.find((col) => col.pk === 1)?.name || "id";

  const setClauses = Object.keys(body)
    .map((col) => `${col} = ?`)
    .join(", ");
  const values = [
    ...Object.values(body),
    id,
  ] as import("bun:sqlite").SQLQueryBindings[];

  try {
    db.query(
      `UPDATE '${tableName}' SET ${setClauses} WHERE ${pkColumn} = ?`,
    ).run(...values);
    const updated = db
      .query(`SELECT * FROM '${tableName}' WHERE ${pkColumn} = ?`)
      .get(id);
    return c.json(updated);
  } catch (e) {
    return c.json({ error: `Update failed: ${e}` }, 400);
  }
});

app.delete("/api/tables/:name/:id", (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const tableName = c.req.param("name");
  const id = c.req.param("id");

  const columns = db.query(`PRAGMA table_info('${tableName}')`).all() as {
    name: string;
    type: string;
    pk: number;
  }[];
  const pkColumn = columns.find((col) => col.pk === 1)?.name || "id";

  try {
    db.query(`DELETE FROM '${tableName}' WHERE ${pkColumn} = ?`).run(id);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Delete failed: ${e}` }, 400);
  }
});

app.get("/api/brick/status", (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }
  return c.json({ bricked: isBricked(db) });
});

app.post("/api/brick/up", async (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }

  const body = await c.req.json();
  const { mode } = body;

  if (mode === "copy") {
    const { destPath } = body;
    if (!destPath) {
      return c.json({ error: "destPath is required for copy mode" }, 400);
    }
    const config = getConfig();
    if (!config.dbPath) {
      return c.json({ error: "No database configured" }, 400);
    }
    try {
      await copyAndBrick(config.dbPath, destPath);
      closeDb();
      setConfig({ dbPath: destPath });
      reconnectDb();
      return c.json({ success: true, dbPath: destPath });
    } catch (e) {
      return c.json({ error: `Copy failed: ${e}` }, 500);
    }
  }

  try {
    brickUp(db);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Brick up failed: ${e}` }, 500);
  }
});

app.get("/api/brick/preferences", (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }
  if (!isBricked(db)) {
    return c.json({ error: "Database is not bricked" }, 400);
  }

  const scope = c.req.query("scope");
  const rows =
    scope !== undefined
      ? db
          .query(
            "SELECT key, scope, value FROM _brick_preferences WHERE scope = ?",
          )
          .all(scope)
      : db.query("SELECT key, scope, value FROM _brick_preferences").all();
  return c.json({ preferences: rows });
});

app.put("/api/brick/preferences", async (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }
  if (!isBricked(db)) {
    return c.json({ error: "Database is not bricked" }, 400);
  }

  const body = await c.req.json();
  const { key, value, scope = "" } = body;
  if (!key || value === undefined) {
    return c.json({ error: "key and value are required" }, 400);
  }

  try {
    db.query(
      "INSERT OR REPLACE INTO _brick_preferences (key, scope, value) VALUES (?, ?, ?)",
    ).run(
      key,
      scope,
      typeof value === "string" ? value : JSON.stringify(value),
    );
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Upsert failed: ${e}` }, 500);
  }
});

app.delete("/api/brick/preferences", async (c) => {
  const db = getDb();
  if (!db) {
    return c.json({ error: "No database configured" }, 400);
  }
  if (!isBricked(db)) {
    return c.json({ error: "Database is not bricked" }, 400);
  }

  const body = await c.req.json();
  const { key, scope = "" } = body;
  if (!key) {
    return c.json({ error: "key is required" }, 400);
  }

  try {
    db.query("DELETE FROM _brick_preferences WHERE key = ? AND scope = ?").run(
      key,
      scope,
    );
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Delete failed: ${e}` }, 500);
  }
});

app.use("/*", serveStatic({ root: "./dist" }));
app.get("/*", serveStatic({ path: "./dist/index.html" }));

const port = 3000;
console.log(`Brick running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
