import { execSync } from "child_process";
import path from "path";

export default async function globalSetup() {
  const cwd = path.resolve(__dirname, "..");
  console.log("\n[e2e] Resetting database...");
  // --force skips the interactive confirmation prompt
  // prisma migrate reset drops all data, re-runs migrations, then runs the seed
  execSync(
    "docker compose exec -T app npx prisma migrate reset --force --skip-generate",
    { cwd, stdio: "inherit" }
  );
  console.log("[e2e] Database ready.\n");
}
