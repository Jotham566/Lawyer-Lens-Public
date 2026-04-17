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
      path: "../public/fonts/manrope/Manrope-Variable.woff2",
      weight: "200 800",
      style: "normal",
    },
  ],
  variable: "--font-manrope",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const newsreader = localFont({
  src: [
    {
      path: "../public/fonts/newsreader/Newsreader-Variable.woff2",
      weight: "300 800",
      style: "normal",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
  preload: true,
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://lawlens.io"),
  title: {
    default: "Law Lens Uganda — Legal Intelligence Platform",
    template: "%s | Law Lens Uganda",
  },
  description:
    "Legal intelligence platform for institutions. Automate legal research, get citation-backed answers, and stay ahead of compliance obligations and regulatory change.",
  keywords: [
    "Uganda legal research",
    "legal intelligence platform",
    "Uganda judgments",
    "Uganda acts of parliament",
    "citation-backed legal answers",
    "compliance monitoring Uganda",
    "contract analysis",
    "regulatory change monitoring",
    "legal research automation",
    "AI legal research Uganda",
  ],
  authors: [{ name: "Law Lens" }],
  creator: "Law Lens",
  publisher: "Law Lens",
  openGraph: {
    type: "website",
    locale: "en_UG",
    siteName: "Law Lens Uganda",
    title: "Law Lens Uganda — Legal Intelligence Platform",
    description:
      "Automate legal research, get citation-backed answers, and stay ahead of compliance obligations and regulatory change.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Law Lens Uganda — Legal Intelligence Platform",
    description:
      "Legal intelligence platform for institutions. Citation-backed legal research, compliance monitoring, and internal knowledge intelligence.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
  // We ALWAYS wrap children in <AppShell>. The previous approach of
  // conditionally skipping AppShell at the root-layout level (based on
  // incoming headers) had a subtle-but-fatal bug: Next.js root layouts
  // don't re-execute on client-side navigation. The "skip AppShell"
  // decision made at initial render (e.g. when landing on `/`) stuck
  // for the entire session, so a soft-nav to `/chat` rendered raw —
  // DashboardShell never wrapped the chat page until a hard refresh.
  //
  // The accurate shell-routing logic lives inside <AppShell> which
  // reacts to usePathname(). We just forward the initial landing-domain
  // signal so it can classify pathname="/" on the root domain as a
  // landing page (which it can't infer from pathname alone — internal
  // rewrites keep the external URL as "/").
  const isLandingDomain = headersList.get("x-ll-domain") === "landing";

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
          <AppShell initialIsLandingDomain={isLandingDomain}>{children}</AppShell>
          <Toaster richColors position="top-right" />
        </Providers>
        {umamiScript}
      </body>
    </html>
  );
}
