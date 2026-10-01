import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Area riservata",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Tutta l'area /admin è renderizzata per richiesta: la CSP del proxy usa un nonce per richiesta,
 * e una pagina statica (es. il login) avrebbe gli script senza nonce, quindi bloccati.
 */
export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return <div className="min-h-screen bg-background">{children}</div>;
}
