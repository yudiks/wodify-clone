"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ATHLETE" | "COACH">("ATHLETE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created, but login failed. Try logging in.");
      return;
    }

    router.push(role === "COACH" ? "/coach" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="card-glass p-6">
        <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
          Sign up
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Password (min 8 characters)
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            />
          </label>
          <fieldset className="flex flex-col gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span>I am a...</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  checked={role === "ATHLETE"}
                  onChange={() => setRole("ATHLETE")}
                />
                Athlete
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  checked={role === "COACH"}
                  onChange={() => setRole("COACH")}
                />
                Coach
              </label>
            </div>
          </fieldset>
          {error && <p className="text-sm" style={{ color: "var(--accent-red)" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-glow-blue rounded-lg px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" className="underline" style={{ color: "var(--accent-blue)" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
