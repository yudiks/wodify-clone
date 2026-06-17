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
      <p className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        No submissions yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {submissions.map((s) => (
        <li key={s.id}>
          <Link
            href={`/submissions/${s.id}`}
            className="group flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-300">
                {s.title}
              </p>
              <p className="truncate text-sm text-zinc-400 dark:text-zinc-500">
                {showAthlete ? `${s.athlete.name} · ` : ""}
                {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-sm">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {s._count.annotations}
                <span className="hidden sm:inline"> annotation{s._count.annotations === 1 ? "" : "s"}</span>
                <span className="sm:hidden"> ann</span>
                {" · "}
                {s._count.comments}
                <span className="hidden sm:inline"> comment{s._count.comments === 1 ? "" : "s"}</span>
                <span className="sm:hidden"> cmt</span>
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  s.status === "REVIEWED"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
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
