import type { Metadata } from "next";
import "./globals.css";
import { localTestingEnabled } from "../lib/local-testing";

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
      <body className="antialiased">{localTestingEnabled() && <aside role="status" style={{padding:"12px 24px",background:"#fff3cd",color:"#533f03",borderBottom:"1px solid #e6cf7e"}}>Local testing · Sign-in is disabled. You are using a test account and local test data.</aside>}{children}</body>
    </html>
  );
}
