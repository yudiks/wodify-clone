import { execSync } from "child_process";
import path from "path";

export default async function globalSetup() {
  const cwd = path.resolve(__dirname, "..");
  console.log("\n[e2e] Resetting database...");
  if (process.env.CI) {
    // In CI: prisma is available locally; DATABASE_URL is set in the job environment
    execSync("npx prisma migrate reset --force --skip-generate", {
      cwd,
      stdio: "inherit",
    });
  } else {
    // Local: run inside the docker compose app container
    execSync(
      "docker compose exec -T app npx prisma migrate reset --force --skip-generate",
      { cwd, stdio: "inherit" }
    );
  }
  console.log("[e2e] Database ready.\n");
}
