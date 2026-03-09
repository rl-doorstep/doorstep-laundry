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

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/orders",
          "/admin",
          "/driver",
          "/wash",
          "/account",
          "/app",
          "/debug",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
