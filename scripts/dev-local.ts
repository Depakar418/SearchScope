import { mkdir } from "node:fs/promises";
import { spawnSync, spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  throw new Error("Local testing is unavailable in production or Vercel.");
}
const port = process.env.SEARCHSCOPE_LOCAL_PORT || "3000";
if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535) throw new Error("Use a local port between 1024 and 65535.");
await mkdir(".searchscope-local", { recursive: true });
const env: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "development",
  SEARCHSCOPE_TARGET: "vercel",
  SEARCHSCOPE_LOCAL_TESTING: "1",
  TURSO_DATABASE_URL: pathToFileURL(resolve(".searchscope-local/testing.db")).href,
  TURSO_AUTH_TOKEN: "",
  NEXT_TELEMETRY_DISABLED: "1",
};
const migrated = spawnSync(process.execPath, ["scripts/migrate-turso.mjs"], { env, stdio: "inherit" });
if (migrated.error) throw migrated.error;
if (migrated.status !== 0) process.exit(migrated.status ?? 1);
console.log("Local test account enabled. Test data stays in .searchscope-local/testing.db.");
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", port], { env, stdio: "inherit" });
server.on("error", (error) => { console.error(error); process.exitCode = 1; });
server.on("exit", (code) => { process.exitCode = code ?? 0; });
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => server.kill(signal));
