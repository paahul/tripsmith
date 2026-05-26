import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: {
    default: "tripsmith — a personal travel planner",
    template: "%s · tripsmith",
  },
  description:
    "Tell it how you travel. Get a profile-tuned itinerary — flights, stays, day-by-day, packing — in under a minute.",
  openGraph: {
    title: "tripsmith — a personal travel planner",
    description:
      "Tell it how you travel. Get a profile-tuned itinerary — flights, stays, day-by-day, packing — in under a minute.",
    siteName: "tripsmith",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tripsmith — a personal travel planner",
    description:
      "Tell it how you travel. Get a profile-tuned itinerary in under a minute.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
