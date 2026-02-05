import { Database } from "bun:sqlite";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

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

  if (!db || (db as any).filename !== config.dbPath) {
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
