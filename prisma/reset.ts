import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.comment.deleteMany();
  await prisma.annotation.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.user.deleteMany();

  const [coach, athlete] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Coach Carter",
        email: "coach@example.com",
        passwordHash: await bcrypt.hash("coachpass123", 10),
        role: "COACH",
      },
    }),
    prisma.user.create({
      data: {
        name: "Alex Athlete",
        email: "athlete@example.com",
        passwordHash: await bcrypt.hash("athletepass123", 10),
        role: "ATHLETE",
      },
    }),
  ]);

  console.log("Reset complete:");
  console.log(`  Coach:   ${coach.email}`);
  console.log(`  Athlete: ${athlete.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
