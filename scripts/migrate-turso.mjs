import { readFile } from "node:fs/promises";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
const local = process.env.SEARCHSCOPE_LOCAL_TESTING === "1" && process.env.NODE_ENV === "development" && !process.env.VERCEL && url?.startsWith("file:");
if (!local && (!url || !url.startsWith("libsql://") || !token)) {
  throw new Error("Set TURSO_DATABASE_URL (libsql://...) and TURSO_AUTH_TOKEN for an empty target database.");
}
const client = createClient({ url, ...(local ? {} : { authToken: token }) });
try {
  const existing = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const tables = existing.rows.map((row) => String(row.name));
  if (tables.length && !tables.includes("_searchscope_migrations")) {
    throw new Error("Target database already has tables but no migration history. Export and reconcile it before changing the schema.");
  }
  await client.execute("CREATE TABLE IF NOT EXISTS _searchscope_migrations (name TEXT PRIMARY KEY NOT NULL, applied TEXT NOT NULL)");
  const applied = new Set((await client.execute("SELECT name FROM _searchscope_migrations")).rows.map((row) => String(row.name)));
  const journal = JSON.parse(await readFile(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
  for (const entry of journal.entries) {
    if (applied.has(entry.tag)) continue;
    const sql = await readFile(new URL(`../drizzle/${entry.tag}.sql`, import.meta.url), "utf8");
    const statements = sql.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean);
    await client.batch([
      ...statements.map((statement) => ({ sql: statement })),
      { sql: "INSERT INTO _searchscope_migrations(name,applied) VALUES (?,?)", args: [entry.tag, new Date().toISOString()] },
    ], "write");
    console.log(`Applied ${entry.tag}`);
  }
  console.log("Schema current. No account or audit data was copied.");
} finally {
  client.close();
}
