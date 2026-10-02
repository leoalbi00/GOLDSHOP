"use client";
import dynamic from "next/dynamic";

/**
 * Agentation: barra di ispezione visiva per annotare elementi della pagina e copiarne selettori e contesto
 * per l'agente. Solo in sviluppo: in produzione il modulo non viene incluso nel bundle.
 */
const Agentation =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("agentation").then((m) => m.Agentation), { ssr: false })
    : () => null;

export default function DevInspector() {
  return <Agentation appName="123 Gold Bergamo" />;
}
