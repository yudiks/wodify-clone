import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import VideoGrid from "@/components/VideoGrid";
import RoleSwitcher from "@/components/RoleSwitcher";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ATHLETE") redirect("/coach");

  const submissions = await prisma.submission.findMany({
    where: { athleteId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      athlete: { select: { name: true } },
      _count: { select: { annotations: true, comments: true } },
    },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Track your submissions and coach feedback.</p>
        </div>
        <RoleSwitcher role="ATHLETE" />
      </div>
      <VideoGrid submissions={submissions} role="ATHLETE" />
    </div>
  );
}
