import { Database } from "bun:sqlite";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const configPath = path.resolve(import.meta.dir, "../config.json");

interface Config {
  dbPath: string | null;
}

export function getConfig(): Config {
  if (!existsSync(configPath)) {
    return { dbPath: null };
  }
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return { dbPath: null };
  }
}

export function setConfig(config: Config): void {
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

let db: Database | null = null;

export function getDb(): Database | null {
  const config = getConfig();
  if (!config.dbPath) return null;

  if (
    !db ||
    (db as unknown as { filename: string }).filename !== config.dbPath
  ) {
    if (db) db.close();
    try {
      db = new Database(config.dbPath);
      console.log(`Connected to database: ${config.dbPath}`);
    } catch (e) {
      console.error(`Failed to connect to database: ${e}`);
      return null;
    }
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function reconnectDb(): Database | null {
  closeDb();
  return getDb();
}

export function isBricked(database: Database): boolean {
  const row = database
    .query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='_brick_preferences'",
    )
    .get();
  return !!row;
}

export function brickUp(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS _brick_preferences (
      key   TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT '',
      value TEXT NOT NULL,
      PRIMARY KEY (key, scope)
    )
  `);
}

export async function copyAndBrick(
  sourcePath: string,
  destPath: string,
): Promise<void> {
  const sourceDb = new Database(sourcePath);
  try {
    sourceDb.run("PRAGMA wal_checkpoint(TRUNCATE)");
  } finally {
    sourceDb.close();
  }

  const sourceFile = Bun.file(sourcePath);
  await Bun.write(destPath, sourceFile);

  const destDb = new Database(destPath);
  try {
    brickUp(destDb);
  } finally {
    destDb.close();
  }
}
