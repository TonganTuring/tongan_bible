import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BibleProvider } from "./context/BibleContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tongan Bible - Ko e Tohitapu | English Bible",
  description: "A bilingual Bible application featuring the Tongan Bible (Ko e Tohitapu) alongside the English Bible. Read, study, and compare scriptures in both languages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BibleProvider>{children}</BibleProvider>
      </body>
    </html>
  );
}
