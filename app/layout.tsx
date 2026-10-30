import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusGenie",
  description: "A curriculum-aware academic agent for focused learning.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}