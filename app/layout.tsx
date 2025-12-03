import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lawyer Lens - Uganda Legal Intelligence Platform",
    template: "%s | Lawyer Lens",
  },
  description:
    "Access Uganda's laws, judgments, and regulations. Search, browse, and interact with legal documents using AI-powered tools.",
  keywords: [
    "Uganda law",
    "legal documents",
    "acts",
    "judgments",
    "regulations",
    "constitution",
    "legal research",
    "AI legal assistant",
  ],
  authors: [{ name: "Lawyer Lens Team" }],
  creator: "Lawyer Lens",
  openGraph: {
    type: "website",
    locale: "en_UG",
    siteName: "Lawyer Lens",
    title: "Lawyer Lens - Uganda Legal Intelligence Platform",
    description:
      "Access Uganda's laws, judgments, and regulations with AI-powered search.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lawyer Lens - Uganda Legal Intelligence Platform",
    description:
      "Access Uganda's laws, judgments, and regulations with AI-powered search.",
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
