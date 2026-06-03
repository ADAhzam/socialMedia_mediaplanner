import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Joveo Media Planner",
  description: "Internal tool for building social media plans and generating PowerPoint decks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
