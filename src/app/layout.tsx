import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OpsATM — Sistema de Gestión de Operaciones",
    template: "%s | OpsATM",
  },
  description:
    "Plataforma corporativa para gestión de operaciones técnicas en cajeros automáticos. Control de órdenes, técnicos, ATMs, inventario, mapas e informes en tiempo real.",
  keywords: ["ATM", "gestión operaciones", "órdenes de trabajo", "técnicos campo", "mantenimiento cajeros"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
