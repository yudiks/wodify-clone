import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span
        className="brand-gradient flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ fontFamily: "var(--font-outfit)" }}
      >
        FC
      </span>
      <span
        className="text-lg font-bold tracking-tight"
        style={{ fontFamily: "var(--font-outfit)" }}
      >
        Form<span className="brand-gradient-text">Coach</span>
      </span>
    </Link>
  );
}
