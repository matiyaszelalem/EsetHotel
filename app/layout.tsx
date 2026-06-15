import type { Metadata } from "next";
import { Google_Sans, Funnel_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* ─────────────────────────────────────────────────────────────────────────
   Font roles — swap these per project.
   - fontSans:    body text (font-sans / font-body)
   - fontDisplay: headings & display copy (font-display / font-heading)
   - fontMono:    eyebrows, labels, data (font-mono)
   ───────────────────────────────────────────────────────────────────────── */
const fontSans = Google_Sans({
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
    default: "Project Name",
    template: "%s | Project Name",
  },
  description: "Project description goes here.",
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
