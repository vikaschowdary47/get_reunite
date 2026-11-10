import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms", "/activate"],
        // Private or per-person pages: never index tag pages, inboxes, replies or accounts.
        disallow: ["/t/", "/m/", "/r/", "/dashboard", "/verify", "/signin", "/dev/", "/admin", "/api/"],
      },
    ],
    sitemap: `${appUrl()}/sitemap.xml`,
    host: appUrl(),
  };
}
