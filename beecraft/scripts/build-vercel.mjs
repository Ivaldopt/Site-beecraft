import { cp, mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicFrontend = path.join(root, "frontend");
const adminFrontend = path.join(root, "management", "frontend");
const publicDist = path.join(publicFrontend, "dist");
const adminDist = path.join(adminFrontend, "dist");
const adminTarget = path.join(publicDist, "adm");
function build(directory, env) {
  const vite = path.join(directory, "node_modules", "vite", "bin", "vite.js");
  const result = spawnSync(process.execPath, [vite, "build"], {
    cwd: directory,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    if (result.error) console.error(result.error);
    process.exit(result.status ?? 1);
  }
}

const storeApiUrl = process.env.STORE_API_URL || process.env.VITE_API_URL || "http://localhost:3000";
const managementApiUrl = process.env.MANAGEMENT_API_URL || "http://localhost:8000/api";

build(publicFrontend, {
  VITE_API_URL: storeApiUrl,
  VITE_MANAGEMENT_API_URL: managementApiUrl,
});

build(adminFrontend, {
  VITE_BASE_PATH: "/adm/",
  VITE_API_URL: managementApiUrl,
  VITE_STORE_URL: "/",
});

await rm(adminTarget, { recursive: true, force: true });
await mkdir(adminTarget, { recursive: true });
await cp(adminDist, adminTarget, { recursive: true });

console.log("Build Vercel concluído: loja em / e gestão em /adm/.");
