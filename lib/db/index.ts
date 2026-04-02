import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL er ikke satt. Legg til variabelen i .env.local"
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

// Lazy singleton
let _db: ReturnType<typeof getDb> | null = null;

export function getDatabase() {
  if (!_db) {
    _db = getDb();
  }
  return _db;
}

// Proxy that creates the db on first access
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    return getDatabase()[prop as keyof ReturnType<typeof getDb>];
  },
});
