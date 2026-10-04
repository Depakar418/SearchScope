import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { createDatabase } from "../db/vercel-workers";

test("Vercel adapter reads SQLite rows and rolls back failed write batches", async () => {
  const dir = await mkdtemp(join(tmpdir(), "searchscope-vercel-db-"));
  const client = createClient({ url: `file:${join(dir, "test.db")}` });
  try {
    const db = createDatabase(() => client);
    await db.prepare("CREATE TABLE records (id TEXT PRIMARY KEY, value TEXT)").run();
    await db.prepare("INSERT INTO records(id,value) VALUES (?,?)").bind("one", "first").run();
    assert.deepEqual(await db.prepare("SELECT value FROM records WHERE id=?").bind("one").first<{value:string}>(), { value: "first" });
    assert.equal((await db.prepare("SELECT * FROM records").all()).results.length, 1);
    await assert.rejects(db.batch([
      db.prepare("INSERT INTO records(id,value) VALUES (?,?)").bind("two", "second"),
      db.prepare("INSERT INTO records(id,value) VALUES (?,?)").bind("one", "duplicate"),
    ]));
    assert.equal(await db.prepare("SELECT COUNT(*) AS n FROM records").first<{n:number}>().then((row) => row?.n), 1);
  } finally {
    client.close();
    await rm(dir, { recursive: true, force: true });
  }
});
