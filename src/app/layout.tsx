import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Topbar from "@/components/Topbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Consultorio | Acceso",
  description: "Pantallas de login y registro para el consultorio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Topbar />
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
