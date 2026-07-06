import type { Metadata } from "next";
import { Inter, Funnel_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* ─────────────────────────────────────────────────────────────────────────
   Font roles — swap these per project.
   - fontSans:    body text (font-sans / font-body)
   - fontDisplay: headings & display copy (font-display / font-heading)
   - fontMono:    eyebrows, labels, data (font-mono)
   ───────────────────────────────────────────────────────────────────────── */
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Funnel_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Eset Hotel | Luxury Stays in Addis Ababa",
    template: "%s | Eset Hotel",
  },
  description:
    "Experience luxury and Ethiopian hospitality at Eset Hotel. Modern rooms, world-class amenities, and breathtaking views in the heart of Addis Ababa. Book your stay today.",
  keywords: [
    "Eset Hotel",
    "Addis Ababa hotel",
    "luxury hotel Ethiopia",
    "boutique hotel",
    "hotel booking",
  ],
  openGraph: {
    title: "Eset Hotel — Luxury Stays in Addis Ababa",
    description:
      "Modern luxury meets Ethiopian warmth. Book direct for the best rates.",
    type: "website",
    locale: "en_US",
    siteName: "Eset Hotel",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
