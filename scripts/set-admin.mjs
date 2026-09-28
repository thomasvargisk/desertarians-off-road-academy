import { execSync } from "node:child_process";

const email = process.argv[2];
const remote = process.argv.includes("--remote");

if (!email) {
  console.error("Usage: npm run set-admin -- <email> [--remote]");
  process.exit(1);
}

const sql = `UPDATE users SET is_admin = 1 WHERE email = '${email.trim().toLowerCase().replace(/'/g, "''")}';`;
const target = remote ? "--remote" : "--local";

execSync(`npx wrangler d1 execute desertarians-db ${target} --command "${sql}"`, { stdio: "inherit" });
