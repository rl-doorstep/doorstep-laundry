import type { MetadataRoute } from "next";

const PRODUCTION_BASE_URL = "https://doorsteplaundrylc.com";

function getBaseUrl(): string {
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_BASE_URL;
  }
  return "http://localhost:3000";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();

  const routes: { path: string; changeFrequency?: "weekly" | "monthly" | "yearly"; priority?: number }[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "login", changeFrequency: "monthly", priority: 0.8 },
    { path: "signup", changeFrequency: "monthly", priority: 0.8 },
    { path: "pricing", changeFrequency: "weekly", priority: 0.9 },
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
