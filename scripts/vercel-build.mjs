import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const next = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const build = spawnSync(process.execPath, [next, "build", "--webpack"], {
  stdio: "inherit",
  env: { ...process.env, SEARCHSCOPE_TARGET: "vercel" },
});
if (build.error) throw build.error;
process.exit(build.status ?? 1);
