import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SubmissionList from "@/components/SubmissionList";

export default async function CoachPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "COACH") redirect("/dashboard");

  const submissions = await prisma.submission.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      athlete: { select: { name: true } },
      _count: { select: { annotations: true, comments: true } },
    },
  });

  const pending = submissions.filter((s) => s.status === "PENDING");
  const reviewed = submissions.filter((s) => s.status === "REVIEWED");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Coach Inbox</h1>
        <p className="text-sm text-zinc-500">
          Review athlete submissions and leave annotated feedback.
        </p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Pending review ({pending.length})</h2>
        <SubmissionList submissions={pending} showAthlete />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Reviewed ({reviewed.length})</h2>
        <SubmissionList submissions={reviewed} showAthlete />
      </section>
    </div>
  );
}
