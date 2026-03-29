import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { headers } from "next/headers";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout";
import { Toaster } from "sonner";
import { ThemeFavicon } from "@/components/theme-favicon";

const manrope = localFont({
  src: [
    {
      path: "../public/fonts/manrope/Manrope-Variable.ttf",
      weight: "200 800",
      style: "normal",
    },
  ],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const newsreader = localFont({
  src: [
    {
      path: "../public/fonts/newsreader/Newsreader-Variable.ttf",
      weight: "300 800",
      style: "normal",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
  preload: false,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const jetbrainsMono = localFont({
  src: [
    {
      path: "../public/fonts/JetBrainsMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/JetBrainsMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"),
  title: {
    default: "Law Lens Uganda - Uganda Legal Intelligence Platform",
    template: "%s | Law Lens Uganda",
  },
  description:
    "Access Uganda's laws, judgments, and regulations. Search, browse, and get instant answers with citations to authoritative sources.",
  keywords: [
    "Uganda law",
    "legal documents",
    "acts",
    "judgments",
    "regulations",
    "constitution",
    "legal research",
    "legal assistant",
  ],
  authors: [{ name: "Law Lens Uganda Team" }],
  creator: "Law Lens Uganda",
  openGraph: {
    type: "website",
    locale: "en_UG",
    siteName: "Law Lens Uganda",
    title: "Law Lens Uganda - Uganda Legal Intelligence Platform",
    description:
      "Access Uganda's laws, judgments, and regulations. Find answers faster with intelligent search.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Law Lens Uganda - Uganda Legal Intelligence Platform",
    description:
      "Access Uganda's laws, judgments, and regulations. Find answers faster with intelligent search.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icons/light/favicon.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/icons/dark/favicon.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
      { url: "/icons/light/favicon-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/icons/dark/favicon-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/icons/light/favicon-16x16.png", sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/icons/dark/favicon-16x16.png", sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [
      { url: "/icons/light/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#051426" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const isLandingDomain = headersList.get("x-ll-domain") === "landing";
  // Also detect /landing path directly (for dev testing on localhost)
  const pathname = headersList.get("x-next-url") || headersList.get("x-invoke-path") || "";
  const isLanding = isLandingDomain || pathname.startsWith("/landing");

  const umamiHost = process.env.NEXT_PUBLIC_UMAMI_HOST?.replace(/\/+$/, "");
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID_PUBLIC;
  const umamiScript =
    umamiHost && umamiWebsiteId ? (
      <Script
        src={`${umamiHost}/script.js`}
        data-website-id={umamiWebsiteId}
        strategy="afterInteractive"
      />
    ) : null;

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${manrope.variable} ${newsreader.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <ThemeFavicon />
          {isLanding ? children : <AppShell>{children}</AppShell>}
          <Toaster richColors position="top-right" />
        </Providers>
        {umamiScript}
      </body>
    </html>
  );
}
