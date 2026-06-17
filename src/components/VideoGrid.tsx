"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type SubmissionListItem = {
  id: string;
  title: string;
  status: "PENDING" | "REVIEWED";
  createdAt: Date;
  athlete: { name: string };
  _count: { annotations: number; comments: number };
};

type Filter = "all" | "pending" | "reviewed";

function initials(name: string): string {
  return name.charAt(0).toUpperCase();
}

function StatCard({
  icon,
  value,
  label,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={iconBg ? { backgroundColor: iconBg } : undefined}>
        <span style={iconColor ? { color: iconColor } : undefined}>{icon}</span>
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

const ICONS = {
  total: (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={1.5}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
};

export default function VideoGrid({
  submissions,
  role,
  showAthlete = false,
}: {
  submissions: SubmissionListItem[];
  role: "ATHLETE" | "COACH";
  showAthlete?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return submissions;
    return submissions.filter((s) => (filter === "pending" ? s.status === "PENDING" : s.status === "REVIEWED"));
  }, [submissions, filter]);

  const total = submissions.length;
  const pending = submissions.filter((s) => s.status === "PENDING").length;
  const reviewed = submissions.filter((s) => s.status === "REVIEWED").length;
  const athleteCount = new Set(submissions.map((s) => s.athlete.name)).size;

  return (
    <div className="flex flex-col gap-8">
      <div className="dashboard-stats">
        {role === "ATHLETE" ? (
          <>
            <StatCard icon={ICONS.total} value={total} label="Total Submissions" />
            <StatCard
              icon={ICONS.clock}
              value={pending}
              label="Awaiting Coach"
              iconBg="var(--accent-yellow-bg)"
              iconColor="var(--accent-yellow)"
            />
            <StatCard
              icon={ICONS.check}
              value={reviewed}
              label="Reviewed Lifts"
              iconBg="var(--accent-green-bg)"
              iconColor="var(--accent-green)"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={ICONS.alert}
              value={pending}
              label="Needs Review"
              iconBg="var(--accent-yellow-bg)"
              iconColor="var(--accent-yellow)"
            />
            <StatCard
              icon={ICONS.check}
              value={reviewed}
              label="Completed Reviews"
              iconBg="var(--accent-green-bg)"
              iconColor="var(--accent-green)"
            />
            <StatCard icon={ICONS.users} value={athleteCount} label="Athletes Managed" />
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="dashboard-header">
          <h3 className="section-title">
            {role === "ATHLETE" ? "My Video Submissions" : "Coaching Lift Queue"}
          </h3>
          <div className="filters-bar">
            <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
              All
            </button>
            <button className={`filter-btn ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>
              Pending Review
            </button>
            <button className={`filter-btn ${filter === "reviewed" ? "active" : ""}`} onClick={() => setFilter("reviewed")}>
              Completed
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <h3 style={{ fontFamily: "var(--font-outfit)" }}>No videos found</h3>
            <p>
              {role === "ATHLETE"
                ? "Upload your first lift video to get coach feedback."
                : "All caught up! No athlete videos match this filter."}
            </p>
            {role === "ATHLETE" && (
              <Link href="/upload" className="btn-glow-blue mt-2 rounded-lg px-4 py-2 text-sm font-medium">
                Upload a video
              </Link>
            )}
          </div>
        ) : (
          <div className="video-grid">
            {filtered.map((s) => (
              <Link key={s.id} href={`/submissions/${s.id}`} className="video-card">
                <div className="video-thumbnail-placeholder">
                  <div className="thumbnail-background" />
                  <span className="category-tag">Video</span>
                  <span className={`status-pill ${s.status === "REVIEWED" ? "reviewed" : "pending"}`}>
                    {s.status === "REVIEWED" ? "Reviewed" : "Pending"}
                  </span>
                  <div className="thumbnail-graphic">
                    {ICONS.play}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Watch Session</span>
                  </div>
                </div>
                <div className="video-info-block">
                  <h4 className="video-card-title">{s.title}</h4>
                  <div className="video-card-meta">
                    <span className="meta-user">
                      {showAthlete && (
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                          style={{ background: "rgba(41,121,255,0.15)", color: "var(--accent-blue)" }}
                        >
                          {initials(s.athlete.name)}
                        </span>
                      )}
                      {showAthlete ? s.athlete.name : `${s._count.annotations} annotations`}
                    </span>
                    <span style={{ fontSize: 11 }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
