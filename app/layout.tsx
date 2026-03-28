import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import { PWAStatus } from "@/components/PWAStatus";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "Flow State - Time Tracker",
  description: "Track your work sessions, analyze productivity, and generate EOD summaries.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Flow State",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans bg-black">
        <Providers>
          <PWAStatus />
          {children}
        </Providers>
      </body>
    </html>
  );
}
