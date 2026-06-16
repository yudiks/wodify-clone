const YT_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"];

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname;
    // youtu.be/ID
    if (host === "youtu.be") {
      return u.pathname.slice(1).split("?")[0] || null;
    }
    if (!YT_HOSTS.includes(host)) return null;
    // youtube.com/watch?v=ID
    const v = u.searchParams.get("v");
    if (v) return v;
    // youtube.com/shorts/ID or youtube.com/embed/ID
    const match = u.pathname.match(/\/(shorts|embed)\/([^/?]+)/);
    if (match) return match[2];
  } catch {
    // not a valid URL
  }
  return null;
}

export function toYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
