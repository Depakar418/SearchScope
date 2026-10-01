import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SearchScope — SEO, AEO & GEO audits",
  description: "Audit website pages and content with transparent SEO, answer structure, and credibility checks.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
