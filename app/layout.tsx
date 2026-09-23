import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dentral - Panel de Control",
  description: "Plataforma de Inteligencia Artificial para Clínicas Dentales",
  // El favicon es el isotipo de marca (app/icon.svg). Se declara además aquí
  // para que quede explícito: hasta ahora se servía el de por defecto de Next,
  // el triángulo de Vercel, que salía en la pestaña como si fuera nuestro.
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)]">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
