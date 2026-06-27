import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AlegoMind — Sprijin când ai nevoie",
  description:
    "Găsește terapeutul, coach-ul sau mentorul potrivit pentru tine. Privat, sigur și uman.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
