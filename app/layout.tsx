import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "three-js-portfolio",
  description: "3D interactive portfolio (work in progress).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}