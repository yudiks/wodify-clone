import Link from "next/link";

type SubmissionListItem = {
  id: string;
  title: string;
  movementType: string;
  status: "PENDING" | "REVIEWED";
  createdAt: Date;
  athlete: { name: string };
  _count: { annotations: number; comments: number };
};

export default function SubmissionList({
  submissions,
  showAthlete = false,
}: {
  submissions: SubmissionListItem[];
  showAthlete?: boolean;
}) {
  if (submissions.length === 0) {
    return (
      <p className="rounded border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
        No submissions yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {submissions.map((s) => (
        <li key={s.id}>
          <Link
            href={`/submissions/${s.id}`}
            className="flex items-center justify-between rounded border border-zinc-200 bg-white p-4 hover:border-zinc-400"
          >
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-zinc-500">
                {s.movementType}
                {showAthlete ? ` · ${s.athlete.name}` : ""} ·{" "}
                {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-zinc-500">
                {s._count.annotations} annotation
                {s._count.annotations === 1 ? "" : "s"} ·{" "}
                {s._count.comments} comment{s._count.comments === 1 ? "" : "s"}
              </span>
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  s.status === "REVIEWED"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {s.status === "REVIEWED" ? "Reviewed" : "Pending"}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
