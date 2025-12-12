import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bizflow - AI-native business OS",
  description: "AI-native business operating system for freelancers and founders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
