import siteData from "@/data/site-data.json";
import type { PaymentMethod } from "@/lib/vouchers";

/** Soglia oltre la quale (inclusa) il compro oro non può pagare in contanti. Vedi data/site-data.json. */
export const CASH_LIMIT_EUR = siteData.compliance.cashLimitEur;

export interface ComplianceResult {
  ok: boolean;
  /** Importo pari o superiore alla soglia: ammessi solo mezzi tracciabili. */
  traceableRequired: boolean;
  /** Contanti vicini alla soglia: attenzione al frazionamento artificioso dell'operazione. */
  nearLimit: boolean;
  message: string;
}

/** Da questa quota della soglia in su i contanti generano un avviso (80%: 400 € su 500 €). */
export const NEAR_LIMIT_RATIO = 0.8;

export function checkPayment(amountCents: number, method: PaymentMethod): ComplianceResult {
  const traceableRequired = amountCents >= CASH_LIMIT_EUR * 100;
  const nearLimit = !traceableRequired && method === "contanti" && amountCents >= CASH_LIMIT_EUR * 100 * NEAR_LIMIT_RATIO;
  if (traceableRequired && method === "contanti") {
    return {
      ok: false,
      traceableRequired,
      nearLimit: false,
      message: `Importo pari o superiore a ${CASH_LIMIT_EUR} €: pagamento in contanti non consentito. Usare bonifico o assegno circolare non trasferibile.`,
    };
  }
  if (nearLimit) {
    return {
      ok: true,
      traceableRequired,
      nearLimit,
      message: `Contanti vicini alla soglia di ${CASH_LIMIT_EUR} €: verificare che l'operazione non sia frazionata con altre dello stesso cliente. In caso di dubbio usare bonifico.`,
    };
  }
  return {
    ok: true,
    traceableRequired,
    nearLimit,
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
