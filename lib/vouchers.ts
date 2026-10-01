import siteData from "@/data/site-data.json";
import type { Metal } from "@/lib/pricing";

export type PaymentMethod = "contanti" | "bonifico" | "assegno";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  contanti: "Contanti",
  bonifico: "Bonifico bancario",
  assegno: "Assegno circolare",
};

/** Dati della scheda cliente OAM raccolti al banco. */
export interface OamRecord {
  firstName: string;
  lastName: string;
  taxCode: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  docType: string;
  docNumber: string;
  docIssuer: string;
  docExpiry: string;
  itemsDescription: string;
  grossWeight: number;
  netWeight: number;
  pricePaidCents: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  provenanceDeclared: true;
  recordedAt: string;
}

export interface Voucher {
  code: string;
  purityId: string;
  purityLabel: string;
  metal: Metal;
  grams: number;
  /** Importo bloccato riconosciuto al cliente. */
  amountCents: number;
  /** Margine stimato del negozio: spread × grammi. */
  marginCents: number;
  spreadPerGram: number;
  /** Quotazione base (oro 24K o argento 999, €/g) al momento del blocco. */
  baseAtLock: number;
  createdAt: string;
  expiresAt: string;
  status: "active" | "completed";
  /** "banco": operazione registrata in negozio senza voucher online. */
  origin?: "online" | "banco";
  completedAt?: string;
  contact?: { name: string; phone: string; consentAt: string };
  oam?: OamRecord;
}

export type VoucherState = "active" | "expired" | "completed";

export function voucherState(v: Voucher, now: Date = new Date()): VoucherState {
  if (v.status === "completed") return "completed";
  return new Date(v.expiresAt) < now ? "expired" : "active";
}

/** Cliente con quantità d'oro sopra soglia: da contattare con priorità. */
export function isHotLead(v: Pick<Voucher, "metal" | "grams">): boolean {
  return v.metal === "gold" && v.grams > siteData.pricing.hotLeadGrams;
}

/** Estrae il codice voucher dal contenuto di un QR (codice nudo o URL che lo contiene). */
export function parseVoucherCode(raw: string): string | null {
  const m = raw.toUpperCase().match(/CO123-[0-9A-F]{4}-[0-9A-F]{4}/);
  return m ? m[0] : null;
}
