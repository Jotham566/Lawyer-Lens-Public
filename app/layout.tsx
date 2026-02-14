import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout";
import { Toaster } from "sonner";

// Use local font with system font fallbacks (avoids Google Fonts network issues during build)
const inter = localFont({
  src: [
    {
      path: "../public/fonts/Inter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Inter-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Inter-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/Inter-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
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
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"),
  title: {
    default: "Law Lens - Uganda Legal Intelligence Platform",
    template: "%s | Law Lens",
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
  authors: [{ name: "Law Lens Team" }],
  creator: "Law Lens",
  openGraph: {
    type: "website",
    locale: "en_UG",
    siteName: "Law Lens",
    title: "Law Lens - Uganda Legal Intelligence Platform",
    description:
      "Access Uganda's laws, judgments, and regulations. Find answers faster with intelligent search.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Law Lens - Uganda Legal Intelligence Platform",
    description:
      "Access Uganda's laws, judgments, and regulations. Find answers faster with intelligent search.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster richColors position="top-right" />
        </Providers>
        {umamiScript}
      </body>
    </html>
  );
}
