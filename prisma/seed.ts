import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const coachPassword = await bcrypt.hash("coachpass123", 10);
  const athletePassword = await bcrypt.hash("athletepass123", 10);

  await prisma.user.upsert({
    where: { email: "coach@example.com" },
    update: {},
    create: {
      name: "Coach Carter",
      email: "coach@example.com",
      passwordHash: coachPassword,
      role: "COACH",
    },
  });

  await prisma.user.upsert({
    where: { email: "athlete@example.com" },
    update: {},
    create: {
      name: "Alex Athlete",
      email: "athlete@example.com",
      passwordHash: athletePassword,
      role: "ATHLETE",
    },
  });

  console.log("Seeded users:");
  console.log("  Coach:   coach@example.com / coachpass123");
  console.log("  Athlete: athlete@example.com / athletepass123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
