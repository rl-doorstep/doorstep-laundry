import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const staffEmail = "staff@example.com";
  const existing = await prisma.user.findUnique({ where: { email: staffEmail } });
  if (existing) {
    console.log("Staff user already exists:", staffEmail);
    return;
  }
  const passwordHash = await bcrypt.hash("staff123", 10);
  await prisma.user.create({
    data: {
      email: staffEmail,
      name: "Staff User",
      role: "staff",
      passwordHash,
      authProvider: "credentials",
    },
  });
  console.log("Created staff user:", staffEmail, "(password: staff123)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
