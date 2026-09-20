import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXORA AI - Autonomous Multi-Agent Intelligence Platform",
  description: "Subscription-free ChatGPT & Astra alternative with 14 autonomous agents.",
  authors: [{ name: "NEXORA AI Inc." }],
  creator: "NEXORA AI Inc.",
  publisher: "NEXORA AI Inc.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  other: {
    copyright: "© 2026 NEXORA AI Inc. All Rights Reserved. Proprietary & Confidential.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-[#090a10] text-gray-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
