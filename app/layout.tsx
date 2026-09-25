import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OrganLink — Secure Organ Donation & Transplantation Platform",
  description: "Production-grade healthcare authentication and organ transplantation management network.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "OrganLink Authentication",
    description: "Secure, verified healthcare access for organ donation and recipient matching.",
    url: "https://organlink.health",
    siteName: "OrganLink",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7C00D9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans antialiased text-[#171717]">
        {children}
      </body>
    </html>
  );
}
