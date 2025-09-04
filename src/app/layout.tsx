import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plateforme IA Éducative",
  description: "Plateforme d'évaluation et d'amélioration de code avec IA - Questions ouvertes, amélioration de code et QCM automatisés",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {children}
        </div>
      </body>
    </html>
  );
}