// Build-time replacement for the Cloudflare binding, used only by native Next on Vercel.
// The shared audit code still speaks D1's small prepared-statement interface.
import { createClient, type Client, type InStatement, type ResultSet } from "@libsql/client";

import { localTestingEnabled } from "../lib/local-testing";

let client: Client | undefined;
function connection(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (localTestingEnabled() && url?.startsWith("file:")) {
    client = createClient({ url });
    return client;
  }
  if (!url || !authToken || !url.startsWith("libsql://")) {
    throw new Error("SearchScope database is not configured for this deployment.");
  }
  client = createClient({ url, authToken });
  return client;
}

function normalize(result: ResultSet) {
  return result.rows.map((row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, typeof value === "bigint" ? Number(value) : value]),
  ));
}

class Statement {
  constructor(readonly sql: string, readonly connect: () => Client, readonly args: unknown[] = []) {}
  bind(...args: unknown[]) { return new Statement(this.sql, this.connect, args); }
  input(): InStatement { return { sql: this.sql, args: this.args as InStatement extends { args?: infer T } ? T : never }; }
  async first<T>() { return (normalize(await this.connect().execute(this.input()))[0] ?? null) as T | null; }
  async all<T>() { return { results: normalize(await this.connect().execute(this.input())) as T[] }; }
  async run() {
    const result = await this.connect().execute(this.input());
    return { success: true, meta: { changes: result.rowsAffected, last_row_id: result.lastInsertRowid } };
  }
}

export function createDatabase(connect: () => Client): D1Database {
  return {
    prepare(sql: string) { return new Statement(sql, connect); },
    async batch(statements: Statement[]) {
      // libSQL write batches are transactional: transfer/invitation updates stay atomic.
      const results = await connect().batch(statements.map((statement) => statement.input()), "write");
      return results.map((result) => ({ success: true, results: normalize(result) }));
    },
  } as unknown as D1Database;
}
export const env = { DB: createDatabase(connection) };
