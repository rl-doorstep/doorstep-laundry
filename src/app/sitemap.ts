import type { MetadataRoute } from "next";

function getBaseUrl(): string {
  const site = process.env.SITE_URL?.trim();
  if (site && site.startsWith("http")) {
    return site.replace(/\/$/, "");
  }
  if (
    process.env.NEXTAUTH_URL &&
    process.env.NEXTAUTH_URL.startsWith("http")
  ) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();

  const routes: { path: string; changeFrequency?: "weekly" | "monthly" | "yearly"; priority?: number }[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "login", changeFrequency: "monthly", priority: 0.8 },
    { path: "signup", changeFrequency: "monthly", priority: 0.8 },
    { path: "book", changeFrequency: "weekly", priority: 0.9 },
    { path: "forgot-password", changeFrequency: "yearly", priority: 0.5 },
    { path: "welcome", changeFrequency: "monthly", priority: 0.6 },
    { path: "reset-password", changeFrequency: "yearly", priority: 0.4 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: path ? `${base}/${path}` : base,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
