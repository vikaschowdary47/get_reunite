import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const now = new Date("2026-11-09");
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/activate`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
