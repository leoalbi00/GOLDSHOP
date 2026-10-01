import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import siteData from "@/data/site-data.json";
import { formatEur } from "@/lib/pricing";
import type { Voucher } from "@/lib/vouchers";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Europe/Rome";
const { address, contacts, links } = siteData;

export const MAPS_LINK = `https://maps.google.com/?q=${encodeURIComponent(`${address.street} ${address.city}`).replace(/%20/g, "+")}`;

/** Link per lasciare una recensione: diretto se è configurato il Place ID, altrimenti la scheda Maps. */
export const REVIEW_LINK = links.googlePlaceId
  ? `https://search.google.com/local/writereview?placeid=${links.googlePlaceId}`
  : links.googleReviews;

const gramsFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

/** Normalizza un numero italiano in formato internazionale senza "+" (richiesto da wa.me). */
export function toWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  return digits.startsWith("39") && digits.length > 10 ? digits : `39${digits}`;
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(text)}`;
}

export function telLink(phone: string): string {
  return `tel:+${toWaNumber(phone)}`;
}

function expiry(v: Pick<Voucher, "expiresAt">): string {
  return dayjs(v.expiresAt).tz(TZ).format("DD/MM/YYYY [ore] HH:mm");
}

/** Messaggio formale con il voucher, da inviare al cliente. */
export function voucherMessage(v: Pick<Voucher, "code" | "grams" | "amountCents" | "expiresAt" | "purityLabel">): string {
  return (
    `Gentile cliente, ecco il tuo Voucher Blocca Prezzo 24h per Compro Oro Bergamo (${address.street}). ` +
    `Codice: ${v.code} | ${v.purityLabel} | Peso stimato: ${gramsFmt.format(v.grams)}g | ` +
    `Valore Bloccato: ${formatEur(v.amountCents / 100)} | Valido fino al: ${expiry(v)}. ` +
    `Navigatore Maps: ${MAPS_LINK}`
  );
}

/** Il cliente invia il voucher al negozio. */
export function voucherToShopLink(v: Parameters<typeof voucherMessage>[0]): string {
  return waLink(contacts.whatsapp, `Buongiorno, ho bloccato questa quotazione online.\n${voucherMessage(v)}`);
}

/** Il cliente si invia il voucher sul proprio numero (chat "Messaggio a te stesso"). */
export function voucherToCustomerLink(phone: string, v: Parameters<typeof voucherMessage>[0]): string {
  return waLink(phone, voucherMessage(v));
}

/** Messaggio prioritario del titolare a un cliente "hot lead". */
export function priorityMessageLink(v: Voucher): string | null {
  if (!v.contact) return null;
  const text =
    `Buongiorno ${v.contact.name}, sono di ${siteData.name}. Abbiamo ricevuto il suo voucher ${v.code} ` +
    `(${gramsFmt.format(v.grams)} g, ${v.purityLabel}). Possiamo riservarle un orario dedicato per la valutazione, ` +
    `entro il ${expiry(v)}? Siamo in ${address.street}, ${address.city}.`;
  return waLink(v.contact.phone, text);
}

/** Ringraziamento post-transazione con invito a lasciare una recensione. */
export function reviewRequestLink(v: Voucher): string | null {
  const phone = v.contact?.phone;
  if (!phone) return null;
  const name = v.oam?.firstName || v.contact?.name || "";
  const text =
    `Gentile ${name}, grazie per aver scelto ${siteData.name}. ` +
    `Se ha qualche minuto, ci farebbe piacere leggere la sua opinione sul servizio ricevuto in ${address.street}: ` +
    `${REVIEW_LINK}\nGrazie e a presto!`;
  return waLink(phone, text);
}
