import type { Metadata } from "next";
import { Open_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ANIMA Explorer",
  description: "Explore the AI Sovereign Agents protocol on Sui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
