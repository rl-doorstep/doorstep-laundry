/**
 * Set a user's role by email. Run from project root:
 *   npx tsx scripts/set-user-role.ts <email> <role>
 * Roles: customer | staff | admin
 *
 * Uses DATABASE_URL from .env (or environment).
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

const VALID_ROLES = ["customer", "staff", "admin"] as const;

async function main() {
  const email = process.argv[2];
  const role = process.argv[3];

  if (!email || !role) {
    console.error("Usage: npx tsx scripts/set-user-role.ts <email> <role>");
    console.error("Roles:", VALID_ROLES.join(" | "));
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    console.error("Invalid role. Use one of:", VALID_ROLES.join(", "));
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: role as "customer" | "staff" | "admin" },
  });

  console.log(`Updated ${email} role to "${role}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
