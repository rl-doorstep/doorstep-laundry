import type { MetadataRoute } from "next";

const PRODUCTION_BASE_URL = "https://doorsteplaundrylc.com";

function getBaseUrl(): string {
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_BASE_URL;
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
