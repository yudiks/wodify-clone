import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect(session.user.role === "COACH" ? "/coach" : "/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-16 px-4 py-16">
      {/* Hero */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
          style={{ background: "rgba(41,121,255,0.1)", color: "var(--accent-blue)" }}
        >
          Frame-by-frame coaching
        </div>
        <h1
          className="text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          Get coached on <span className="brand-gradient-text">every rep</span>
        </h1>
        <p className="max-w-xl text-lg" style={{ color: "var(--text-secondary)" }}>
          Record a movement on your phone, upload it, and get frame-by-frame
          feedback from your coach — drawings, notes, and timestamped comments
          right on your video.
        </p>
        <div className="flex gap-3">
          <Link
            href="/register"
            className="btn-glow-blue rounded-lg px-5 py-2.5 font-medium"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border px-5 py-2.5 font-medium hover:bg-white/5"
            style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
          >
            Log in
          </Link>
        </div>
      </div>

      {/* Annotated video demo mockup */}
      <div className="flex flex-col gap-4">
        <h2
          className="text-center text-sm font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          How it works
        </h2>

        {/* Mock video + annotation panel */}
        <div className="card-glass overflow-hidden shadow-[var(--shadow-main)]">
          {/* Fake video frame */}
          <div className="relative w-full" style={{ aspectRatio: "16/9", background: "var(--bg-tertiary)" }}>
            {/* Simulated video still — dark background with athlete silhouette feel */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 640 360" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                {/* Barbell */}
                <rect x="120" y="172" width="400" height="16" rx="8" fill="rgba(255,255,255,0.35)"/>
                <rect x="100" y="148" width="40" height="64" rx="6" fill="rgba(255,255,255,0.35)"/>
                <rect x="500" y="148" width="40" height="64" rx="6" fill="rgba(255,255,255,0.35)"/>
                {/* Athlete silhouette (squat) */}
                <ellipse cx="320" cy="108" rx="28" ry="28" fill="rgba(255,255,255,0.35)"/>
                <path d="M320 136 L310 172 L290 230 L310 230 L320 195 L330 230 L350 230 L330 172 Z" fill="rgba(255,255,255,0.35)"/>
                <path d="M310 172 L270 185 L265 210 L285 210 L290 190 Z" fill="rgba(255,255,255,0.35)"/>
                <path d="M330 172 L370 185 L375 210 L355 210 L350 190 Z" fill="rgba(255,255,255,0.35)"/>
              </svg>
            </div>

            {/* Coach drawing overlay — yellow arc over the hip */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg">
              <path d="M255 175 Q290 140 325 175" stroke="#eab308" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <path d="M310 185 L340 210 L370 195" stroke="#ef4444" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {/* Timestamp badge */}
            <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white">
              0:12
            </div>

            {/* Play button hint */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-7 w-7 translate-x-0.5">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Annotation card */}
          <div className="flex flex-col gap-3 border-t p-4" style={{ borderColor: "var(--border-color)" }}>
            <div className="flex items-start gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "rgba(41,121,255,0.15)", color: "var(--accent-blue)" }}
              >
                SC
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Coach Sarah</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: "rgba(41,121,255,0.1)", color: "var(--accent-blue)" }}
                  >
                    Coach
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-xs"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                  >
                    0:12
                  </span>
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Your hips are shooting up too fast out of the hole — drive your chest up first so the bar stays over mid-foot. I&apos;ve circled the problem spot in yellow.
                </p>
              </div>
            </div>

            {/* Second annotation */}
            <div className="flex items-start gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "var(--accent-green-bg)", color: "var(--accent-green)" }}
              >
                SC
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Coach Sarah</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: "rgba(41,121,255,0.1)", color: "var(--accent-blue)" }}
                  >
                    Coach
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-xs"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                  >
                    0:24
                  </span>
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Knee tracking looks great here — see how the red line follows right over your toes. Keep this for every rep.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Three-step flow */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            n: "1",
            title: "Record & upload",
            body: "Film your lift on any device. Upload the video or paste a YouTube link.",
          },
          {
            n: "2",
            title: "Coach annotates",
            body: "Your coach draws on the frame, adds notes, and leaves timestamped comments.",
          },
          {
            n: "3",
            title: "You improve",
            body: "Watch the feedback overlay play back in sync with your video. Fix it next session.",
          },
        ].map(({ n, title, body }) => (
          <div key={n} className="card-glass flex flex-col gap-2 p-5">
            <span className="text-2xl font-bold brand-gradient-text" style={{ fontFamily: "var(--font-outfit)" }}>{n}</span>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
