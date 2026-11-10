import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { appUrl } from "@/lib/url";

// Self-hosted variable fonts (SIL OFL): no runtime call to Google.
const sans = localFont({
  src: "./fonts/instrument-sans-latin-wght-normal.woff2",
  variable: "--font-sans-face",
  weight: "400 700",
  display: "swap",
});

const mono = localFont({
  src: "./fonts/geist-mono-latin-wght-normal.woff2",
  variable: "--font-mono-face",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "Reunite: let anyone reach you without your number",
    template: "%s · Reunite",
  },
  description:
    "QR tags for your car, luggage, laptop, keys and pet. Someone scans, messages you, and your number stays private. AI filters abuse, flags what is urgent and translates.",
  applicationName: "Reunite",
  keywords: ["QR code sticker", "windshield contact sticker", "blocked in car sticker", "luggage tag", "laptop sticker", "pet tag", "lost and found QR"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Reunite",
    title: "Reunite: let anyone reach you without your number",
    description: "Scan, message, reply. QR tags with AI that filters abuse, flags urgency and translates.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reunite: let anyone reach you without your number",
    description: "QR tags for your car, bag, laptop, keys and pet. Your number stays private.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f2f4f1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
