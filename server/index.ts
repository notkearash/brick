import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { getDb, getConfig, setConfig, closeDb } from "./db";

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
    const { existsSync } = await import("fs");
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
       WHERE type='table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    )
    .all() as { name: string }[];

  return c.json(tables.map((t) => t.name));
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
  const limit = parseInt(c.req.query("limit") || "100");
  const offset = parseInt(c.req.query("offset") || "0");

  const tableExists = db
    .query("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(tableName);

  if (!tableExists) {
    return c.json({ error: "Table not found" }, 404);
  }

  const rows = db
    .query(`SELECT * FROM '${tableName}' LIMIT ? OFFSET ?`)
    .all(limit, offset);
  const countResult = db
    .query(`SELECT COUNT(*) as count FROM '${tableName}'`)
    .get() as { count: number };

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
  const body = await c.req.json();

  const columns = Object.keys(body);
  const values = Object.values(body) as import("bun:sqlite").SQLQueryBindings[];
  const placeholders = columns.map(() => "?").join(", ");

  try {
    const result = db
      .query(
        `INSERT INTO '${tableName}' (${columns.join(", ")}) VALUES (${placeholders})`,
      )
      .run(...values);

    return c.json({ success: true, id: result.lastInsertRowid }, 201);
  } catch (e) {
    return c.json({ error: `Insert failed: ${e}` }, 400);
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

  const columns = db.query(`PRAGMA table_info('${tableName}')`).all() as any[];
  const pkColumn = columns.find((col) => col.pk === 1)?.name || "id";

  const setClauses = Object.keys(body)
    .map((col) => `${col} = ?`)
    .join(", ");
  const values = [...Object.values(body), id] as import("bun:sqlite").SQLQueryBindings[];

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

  const columns = db.query(`PRAGMA table_info('${tableName}')`).all() as any[];
  const pkColumn = columns.find((col) => col.pk === 1)?.name || "id";

  try {
    db.query(`DELETE FROM '${tableName}' WHERE ${pkColumn} = ?`).run(id);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Delete failed: ${e}` }, 400);
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
