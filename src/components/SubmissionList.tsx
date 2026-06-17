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
      <p
        className="rounded-xl border border-dashed p-8 text-center text-sm"
        style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
      >
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
            className="card-glass group flex flex-col gap-2 p-4 transition-colors hover:border-[var(--border-active)] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium" style={{ color: "var(--text-primary)" }}>
                {s.title}
              </p>
              <p className="truncate text-sm" style={{ color: "var(--text-muted)" }}>
                {showAthlete ? `${s.athlete.name} · ` : ""}
                {new Date(s.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-sm">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {s._count.annotations}
                <span className="hidden sm:inline"> annotation{s._count.annotations === 1 ? "" : "s"}</span>
                <span className="sm:hidden"> ann</span>
                {" · "}
                {s._count.comments}
                <span className="hidden sm:inline"> comment{s._count.comments === 1 ? "" : "s"}</span>
                <span className="sm:hidden"> cmt</span>
              </span>
              <span className={`status-pill ${s.status === "REVIEWED" ? "reviewed" : "pending"}`}>
                {s.status === "REVIEWED" ? "Reviewed" : "Pending"}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
