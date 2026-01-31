import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { Header } from "@/components/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Whisper — Encrypted Messaging on NEAR",
  description: "End-to-end encrypted private messaging on NEAR blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-gray-950 text-white h-screen flex flex-col`}>
        <WalletProvider>
          <Header />
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
