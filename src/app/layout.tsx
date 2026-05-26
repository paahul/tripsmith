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

function SiteFooter() {
  return (
    <footer className="border-t border-line bg-cream/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-6 py-4 text-xs italic text-muted sm:flex-row sm:items-center">
        <span>A side project by Paahul Sikand.</span>
        <div className="flex items-center gap-4 not-italic">
          <a
            href="https://github.com/paahul/tripsmith"
            target="_blank"
            rel="noreferrer"
            className="hover:text-terracotta"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/paahul/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-terracotta"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}

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
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
