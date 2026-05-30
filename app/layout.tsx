import type { Metadata } from "next";
import "./globals.css";

// Pas de next/font/google : utilise les polices système du navigateur.
// Garanti offline, zéro appel CDN au chargement.

export const metadata: Metadata = {
  title: "File d'attente patients",
  description: "Gestion de file d'attente pour cabinet médical",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
