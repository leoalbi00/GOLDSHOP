import siteData from "@/data/site-data.json";
import type { PaymentMethod } from "@/lib/vouchers";

/** Soglia oltre la quale (inclusa) il compro oro non può pagare in contanti. Vedi data/site-data.json. */
export const CASH_LIMIT_EUR = siteData.compliance.cashLimitEur;

export interface ComplianceResult {
  ok: boolean;
  /** Importo pari o superiore alla soglia: ammessi solo mezzi tracciabili. */
  traceableRequired: boolean;
  message: string;
}

export function checkPayment(amountCents: number, method: PaymentMethod): ComplianceResult {
  const traceableRequired = amountCents >= CASH_LIMIT_EUR * 100;
  if (traceableRequired && method === "contanti") {
    return {
      ok: false,
      traceableRequired,
      message: `Importo pari o superiore a ${CASH_LIMIT_EUR} €: pagamento in contanti non consentito. Usare bonifico o assegno circolare non trasferibile.`,
    };
  }
  return {
    ok: true,
    traceableRequired,
    message: traceableRequired
      ? `Importo pari o superiore a ${CASH_LIMIT_EUR} €: obbligo di mezzo tracciabile rispettato.`
      : `Importo sotto ${CASH_LIMIT_EUR} €: contanti ammessi.`,
  };
}

/** Controllo formale del codice fiscale (struttura e carattere di controllo). */
export function isValidTaxCode(cf: string): boolean {
  const s = cf.toUpperCase().trim();
  if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(s)) return false;
  const odd = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const c = s[i];
    const n = c >= "0" && c <= "9" ? c.charCodeAt(0) - 48 : c.charCodeAt(0) - 65;
    sum += i % 2 === 0 ? odd[n] : n;
  }
  return String.fromCharCode(65 + (sum % 26)) === s[15];
}
