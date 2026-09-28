import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run set-admin -- <email>");
  process.exit(1);
}

const db = new DatabaseSync(path.join(process.cwd(), "data", "desertarians.db"));
const result = db.prepare("UPDATE users SET is_admin = 1 WHERE email = ?").run(email.trim().toLowerCase());

if (result.changes === 0) {
  console.error(`No account found for ${email}`);
  process.exit(1);
}
console.log(`${email} is now an admin.`);
