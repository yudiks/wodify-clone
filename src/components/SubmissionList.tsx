import Link from "next/link";

type SubmissionListItem = {
  id: string;
  title: string;
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
      <p className="rounded border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
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
            className="flex flex-col gap-2 rounded border border-zinc-200 bg-white p-4 hover:border-zinc-400 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{s.title}</p>
              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                {showAthlete ? `${s.athlete.name} · ` : ""}
                {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">
                {s._count.annotations}
                <span className="hidden sm:inline">
                  {" "}annotation{s._count.annotations === 1 ? "" : "s"}
                </span>
                <span className="sm:hidden">↓</span>
                {" "}· {s._count.comments}
                <span className="hidden sm:inline">
                  {" "}comment{s._count.comments === 1 ? "" : "s"}
                </span>
                <span className="sm:hidden">💬</span>
              </span>
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${
                  s.status === "REVIEWED"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
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
