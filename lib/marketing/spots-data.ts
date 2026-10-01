import siteData from "@/data/site-data.json";

const { address, contacts, pricing, shortName } = siteData;

/**
 * Archivio script promozionali pronti all'uso.
 * Nota legale: si parla di valutazione "sulla" quotazione di Borsa (il negozio applica un margine),
 * senza promesse di "miglior prezzo" non dimostrabili.
 */

export interface RadioSpot {
  id: string;
  title: string;
  durationS: number;
  tone: string;
  text: string;
}

export const RADIO_SPOTS: RadioSpot[] = [
  {
    id: "radio-istituzionale",
    title: "Spot radio istituzionale",
    durationS: 30,
    tone: "Istituzionale e trasparente",
    text:
      `Hai gioielli in oro che non indossi più? A Bergamo, in ${address.street}, Compro Oro 123 valuta il tuo oro ` +
      `sulla quotazione ufficiale di Borsa, con pesata a vista su bilancia omologata. Blocca il prezzo online per ` +
      `${pricing.voucherValidityHours} ore o vieni in sede, vicino alla Stazione. Compro Oro 123: massima trasparenza, pagamento immediato.`,
  },
  {
    id: "radio-eredita",
    title: "Spot radio: eredità e lotti importanti",
    durationS: 20,
    tone: "Riservato e rassicurante",
    text:
      `Un'eredità, vecchi orologi, gioielli di famiglia? Da Compro Oro 123, in ${address.street} a Bergamo, ` +
      `prenoti una valutazione riservata in ufficio privato. Pesata davanti a te, documentazione completa, pagamento tracciabile.`,
  },
];

export interface ReelScene {
  t: string;
  shot: string;
  onScreen: string;
  voice: string;
}

export const REEL_SCRIPT: { title: string; format: string; scenes: ReelScene[]; caption: string; hashtags: string[] } = {
  title: "Come non farsi imbrogliare quando vendi oro",
  format: "Reel / TikTok verticale 9:16 · 30–40 secondi · formato educativo",
  scenes: [
    {
      t: "0–3s",
      shot: "Primo piano: anello d'oro posato sulla bilancia omologata, display che si stabilizza.",
      onScreen: "Vendi oro? Guarda qui prima 👇",
      voice: "Prima di vendere il tuo oro, controlla tre cose.",
    },
    {
      t: "3–10s",
      shot: "Macro sul punzone interno dell'anello: 750.",
      onScreen: "1 · Il punzone: 750 = oro 18K",
      voice: "Uno: il punzone. 750 vuol dire oro 18 carati: tre quarti del peso è oro puro.",
    },
    {
      t: "10–18s",
      shot: "La bilancia girata verso la camera, il cliente legge il peso.",
      onScreen: "2 · Il peso si legge INSIEME",
      voice: "Due: il peso si legge insieme, sulla bilancia omologata, davanti a te. Mai nel retro.",
    },
    {
      t: "18–28s",
      shot: "Calcolatrice o telefono col calcolatore del sito: 10 g × 0,750 = 7,5 g di oro puro.",
      onScreen: "3 · 10 g di 18K = 7,5 g di oro puro",
      voice: "Tre: fatti spiegare il conto. Dieci grammi di 18 carati contengono sette grammi e mezzo d'oro puro: è su quelli che si calcola il valore.",
    },
    {
      t: "28–35s",
      shot: `Esterno del negozio, insegna, cartello ${address.street}.`,
      onScreen: `Compro Oro 123 · ${address.street}, Bergamo`,
      voice: `Da noi è tutto a vista. E il prezzo lo blocchi online per ${pricing.voucherValidityHours} ore.`,
    },
  ],
  caption: `Vendere oro senza sorprese: punzone, pesata a vista e conto trasparente. Calcola e blocca il prezzo online, poi passa in ${address.street} a Bergamo, vicino alla Stazione.`,
  hashtags: ["#comprooro", "#bergamo", "#oro18k", "#vendereoro", "#bergamocentro"],
};

export interface AdVariant {
  id: string;
  channel: "Google Ads" | "Meta Ads";
  angle: string;
  headlines: string[];
  descriptions: string[];
}

/** Limiti Google Ads (annunci adattabili): titoli 30 caratteri, descrizioni 90. */
export const GOOGLE_LIMITS = { headline: 30, description: 90 };
/** Meta: titolo consigliato ~40 caratteri, testo principale ~125 prima del "Mostra altro". */
export const META_LIMITS = { headline: 40, description: 125 };

export const ADS: AdVariant[] = [
  {
    id: "google-vicinanza",
    channel: "Google Ads",
    angle: "Vicinanza: zona Stazione",
    headlines: ["Compro Oro Bergamo Centro", "Vicino alla Stazione FS", "Via Angelo Maj 39/B", "Pesata a vista omologata", "Pagamento immediato"],
    descriptions: [
      "Valutazione gratuita su quotazione di Borsa. Pesata davanti a te, vicino alla Stazione.",
      "Iscritti al Registro OAM. Bilancia omologata, pagamento immediato nei termini di legge.",
    ],
  },
  {
    id: "google-blocco",
    channel: "Google Ads",
    angle: "Blocco quotazione 24h",
    headlines: ["Blocca il prezzo per 24 ore", "Calcola il valore online", "Quotazione oro aggiornata", "Compro Oro 123 Bergamo"],
    descriptions: [
      "Inserisci peso e caratura, scopri la stima e blocca il prezzo. Poi passa in negozio.",
      "Prezzo bloccato 24 ore, anche se la quotazione scende. Via Angelo Maj 39/B, Bergamo.",
    ],
  },
  {
    id: "meta-blocco",
    channel: "Meta Ads",
    angle: "Blocco quotazione + trasparenza",
    headlines: ["Blocca il prezzo del tuo oro", "Oro usato? Scopri quanto vale"],
    descriptions: [
      `Calcola online quanto vale il tuo oro e blocca il prezzo per ${pricing.voucherValidityHours} ore. Pesata a vista in ${address.street}, Bergamo.`,
      "Gioielli che non usi più? Valutazione gratuita, bilancia omologata, pagamento immediato. Vicino alla Stazione.",
    ],
  },
];

export const FLYER = {
  headline: "Il tuo oro, pesato davanti a te.",
  subhead: "Valutazione gratuita sulla quotazione di Borsa · Pagamento immediato",
  points: [
    "Pesata a vista su bilancia omologata",
    `Prezzo bloccato online per ${pricing.voucherValidityHours} ore`,
    "Iscritti al Registro Compro Oro OAM",
    "Appuntamenti riservati per eredità e lotti importanti",
  ],
  cta: "Inquadra il QR: calcola il valore e blocca il prezzo",
  contacts: { phone: contacts.phone, address: `${address.street}, ${address.cap} ${address.city}`, brand: shortName },
};
