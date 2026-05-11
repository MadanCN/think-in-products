import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Think in Products",
    template: "%s | Think in Products",
  },
  description:
    "A structured learning hub for aspiring and practicing product managers — roadmaps, case studies, and PM frameworks built for real career growth.",
  keywords: ["product management", "PM roadmap", "product thinking", "case studies", "PM frameworks"],
  authors: [{ name: "Think in Products" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "Think in Products",
    title: "Think in Products",
    description: "A structured learning hub for aspiring and practicing product managers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Think in Products",
    description: "A structured learning hub for aspiring and practicing product managers.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body bg-bg-primary text-text-primary">
        {/* Animated mesh gradient */}
        <div className="bg-mesh" aria-hidden="true" />
        {/* Film grain overlay */}
        <div className="grain-overlay" aria-hidden="true" />
        {/* Page content sits above overlays */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
