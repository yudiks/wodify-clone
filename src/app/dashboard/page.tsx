import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UploadForm from "@/components/UploadForm";
import SubmissionList from "@/components/SubmissionList";

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
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
          My Submissions
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Upload videos and track coach feedback.</p>
      </div>
      <UploadForm />
      <SubmissionList submissions={submissions} />
    </div>
  );
}
