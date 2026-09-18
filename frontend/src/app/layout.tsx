import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXORA AI - Autonomous Multi-Agent Intelligence Platform",
  description: "Subscription-free ChatGPT & Astra alternative with 14 autonomous agents.",
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
