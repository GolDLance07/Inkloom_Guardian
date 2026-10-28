import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inkloom Guardian — Brand-Agnostic Content Governance Workbench",
  description: "Enterprise-grade brand governance workbench for real-time compliance review, deterministic rules enforcement, and human audit approval.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-surface-obsidian text-text-mist antialiased selection:bg-electric-lime selection:text-surface-obsidian">
        {children}
      </body>
    </html>
  );
}
