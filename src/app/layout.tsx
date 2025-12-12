import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
// Import workflows to ensure they're loaded
import "@/modules/finance/workflows";

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
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
