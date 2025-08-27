import "./(styles)/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FiabeMVP – Storie illustrate personalizzate",
  description: "Genera fiabe illustrate personalizzate con stili curati.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
