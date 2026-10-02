"use client";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Clapperboard, Copy, Crown, Loader2, Megaphone, Printer, Radio, Scale, Sun, Snowflake } from "lucide-react";
import { PURITIES, formatEur, offerPerGram } from "@/lib/pricing";
import { DEFAULT_MARGINS, SEASON_LABEL, spreadFor, type MarginSettings, type Promotions } from "@/lib/margins";
import { ADS, GOOGLE_LIMITS, META_LIMITS, RADIO_SPOTS, REEL_SCRIPT } from "@/lib/marketing/spots-data";
import { useQuotes } from "@/lib/useQuotes";
import { useMargins } from "@/lib/useMargins";
import { MARGINS_WRITE_URL, apiError } from "@/lib/useAdminData";
import { cn } from "@/lib/cn";

/** Ritmo medio di lettura radiofonica in italiano. */
const WORDS_PER_SECOND = 2.3;

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copiato`);
  } catch {
    toast.error("Copia non riuscita: seleziona il testo a mano");
  }
}

function CopyButton({ text, what }: { text: string; what: string }) {
  return (
    <button type="button" onClick={() => void copy(text, what)} className="inline-flex h-8 items-center gap-1.5 border border-hairline px-2.5 text-xs font-medium hover:bg-muted">
      <Copy className="size-3.5" /> Copia
    </button>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="border border-hairline bg-paper p-6">
      <h2 className="flex items-center gap-2 font-serif text-2xl font-medium">
        <Icon className="size-5 text-gold" strokeWidth={1.5} /> {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-guarantee" : "bg-hairline")}
    >
      <span className={cn("absolute left-0 top-1 size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

/** Soglia in grammi e bonus €/g modificabili, con salvataggio esplicito. */
function ThresholdEditor({ minGrams, bonus, onSave }: { minGrams: number; bonus: number; onSave: (v: { minGrams: number; bonusPerGram: number }) => void }) {
  const [g, setG] = useState(String(minGrams));
  const [b, setB] = useState(bonus.toFixed(2).replace(".", ","));
  const gn = Number(g);
  const bn = Number(b.replace(",", "."));
  const valid = Number.isFinite(gn) && gn >= 1 && Number.isFinite(bn) && bn >= 0 && bn <= 20;
  const dirty = gn !== minGrams || bn !== bonus;
  const input = "w-20 border-b border-foreground bg-transparent py-1 text-right font-medium tabular-nums outline-none focus:border-gold";
  return (
    <div className="mt-4 flex flex-wrap items-end gap-4 text-sm">
      <label className="flex items-center gap-2">
        Oltre <input inputMode="numeric" className={input} value={g} onChange={(e) => setG(e.target.value.replace(/\D/g, ""))} aria-label="Soglia in grammi" /> g
      </label>
      <label className="flex items-center gap-2">
        Bonus + <input inputMode="decimal" className={input} value={b} onChange={(e) => setB(e.target.value.replace(/[^\d.,]/g, ""))} aria-label="Bonus in euro al grammo" /> €/g
      </label>
      <button type="button" disabled={!valid || !dirty} onClick={() => onSave({ minGrams: gn, bonusPerGram: bn })}
        className="h-8 bg-foreground px-3 text-xs font-semibold text-background disabled:opacity-30">
        Salva
      </button>
    </div>
  );
}

function PromotionsPanel() {
  const { gold24k, silver } = useQuotes();
  const { settings, mutate } = useMargins();
  const promos: Promotions = { ...DEFAULT_MARGINS.promotions, ...settings.promotions };
  const [saving, setSaving] = useState<string | null>(null);
  const p18 = PURITIES.find((p) => p.id === "18K")!;
  const base18 = offerPerGram(p18, gold24k, silver, spreadFor(settings, "18K")).toNumber();

  const save = async (
    key: string,
    patch: {
      seasonal?: Partial<Promotions["seasonal"]>;
      heritage?: Partial<Promotions["heritage"]>;
      bulk?: Partial<Promotions["bulk"]>;
      vip?: Partial<Promotions["vip"]>;
    },
  ) => {
    setSaving(key);
    try {
      const { data } = await axios.put<MarginSettings>(MARGINS_WRITE_URL, { promotions: patch });
      await mutate(data, { revalidate: false });
      toast.success("Promozione aggiornata sul sito");
    } catch (err) {
      toast.error(apiError(err, "Promozione non salvata"));
    } finally {
      setSaving(null);
    }
  };

  const SeasonIcon = promos.seasonal.season === "summer" ? Sun : Snowflake;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={cn("border-2 p-5", promos.seasonal.active ? "border-gold bg-gold-soft" : "border-hairline")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <SeasonIcon className="size-4 text-gold" /> {SEASON_LABEL[promos.seasonal.season]}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              +{formatEur(promos.seasonal.bonusPerGram)}/g su oro {promos.seasonal.purityIds.join(", ")}. Il cliente vede{" "}
              <strong className="text-foreground">{formatEur(base18 + promos.seasonal.bonusPerGram)}/g</strong> invece di {formatEur(base18)}/g sul 18K.
            </p>
          </div>
          {saving === "seasonal" ? <Loader2 className="size-5 animate-spin" /> : (
            <Switch label="Attiva promozione stagionale" checked={promos.seasonal.active} onChange={(v) => void save("seasonal", { seasonal: { active: v } })} />
          )}
        </div>
        <div className="mt-4 flex gap-1.5">
          {(["summer", "winter"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={promos.seasonal.season === s} onClick={() => void save("seasonal", { seasonal: { season: s } })}
              className={cn("h-8 border px-3 text-xs font-medium", promos.seasonal.season === s ? "border-foreground bg-foreground text-background" : "border-hairline hover:bg-muted")}>
              {SEASON_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className={cn("border-2 p-5", promos.heritage.active ? "border-foreground bg-muted" : "border-hairline")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Crown className="size-4 text-gold" /> Heritage VIP
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Lotti d&apos;oro oltre {promos.heritage.minGrams} g: valutazione riservata gratuita e bonus di +{formatEur(promos.heritage.bonusPerGram)}/g. Sul sito
              compare un riquadro con la prenotazione dell&apos;appuntamento.
            </p>
          </div>
          {saving === "heritage" ? <Loader2 className="size-5 animate-spin" /> : (
            <Switch label="Attiva pacchetto Heritage VIP" checked={promos.heritage.active} onChange={(v) => void save("heritage", { heritage: { active: v } })} />
          )}
        </div>
        <ThresholdEditor
          key={`h-${promos.heritage.minGrams}-${promos.heritage.bonusPerGram}`}
          minGrams={promos.heritage.minGrams}
          bonus={promos.heritage.bonusPerGram}
          onSave={(v) => void save("heritage", { heritage: v })}
        />
      </div>

      <div className={cn("border-2 p-5 lg:col-span-2", promos.bulk.active ? "border-guarantee bg-guarantee-soft" : "border-hairline")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Scale className="size-4 text-guarantee" /> Bonus lotti
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              +{formatEur(promos.bulk.bonusPerGram)}/g su qualsiasi caratura d&apos;oro oltre {promos.bulk.minGrams} g. Si somma alle altre promozioni attive.
            </p>
          </div>
          {saving === "bulk" ? <Loader2 className="size-5 animate-spin" /> : (
            <Switch label="Attiva bonus lotti" checked={promos.bulk.active} onChange={(v) => void save("bulk", { bulk: { active: v } })} />
          )}
        </div>
        <ThresholdEditor
          key={`b-${promos.bulk.minGrams}-${promos.bulk.bonusPerGram}`}
          minGrams={promos.bulk.minGrams}
          bonus={promos.bulk.bonusPerGram}
          onSave={(v) => void save("bulk", { bulk: v })}
        />
      </div>
      <div className={cn("border-2 p-5 lg:col-span-2", promos.vip.active ? "border-gold bg-gold-soft" : "border-hairline")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <Crown className="size-4 text-gold" /> Livelli VIP del calcolatore
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Oro da {promos.vip.bonusMinGrams} g: +{formatEur(promos.vip.bonusPerGram)}/g. Oltre {promos.vip.vipMinGrams} g: +
              {formatEur(promos.vip.vipBonusPerGram)}/g e perizia nel salotto riservato. I due livelli non si sommano tra loro, ma si sommano alle altre promozioni attive.
            </p>
          </div>
          {saving === "vip" ? <Loader2 className="size-5 animate-spin" /> : (
            <Switch label="Attiva livelli VIP" checked={promos.vip.active} onChange={(v) => void save("vip", { vip: { active: v } })} />
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground lg:col-span-2">
        I bonus riducono lo spread e valgono anche per i voucher emessi mentre la promozione è attiva. Il prezzo al cliente non supera mai la quotazione di Borsa.
      </p>
    </div>
  );
}

function Counted({ text, limit }: { text: string; limit: number }) {
  const over = text.length > limit;
  return (
    <li className="flex items-start justify-between gap-3 py-2">
      <span>{text}</span>
      <span className={cn("shrink-0 text-xs tabular-nums", over ? "font-semibold text-rose-700" : "text-muted-foreground")}>
        {text.length}/{limit}
      </span>
    </li>
  );
}

export default function MarketingSuite() {
  const reelText = REEL_SCRIPT.scenes.map((s) => `[${s.t}] ${s.shot}\nTesto: ${s.onScreen}\nVoce: ${s.voice}`).join("\n\n");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium">Marketing e promozioni</h1>
          <p className="mt-1 text-sm text-muted-foreground">Promozioni attivabili sul sito e script pronti per radio, social e annunci.</p>
        </div>
        <Link href="/admin/marketing/flyer" className="inline-flex h-11 items-center gap-2 bg-foreground px-5 text-sm font-semibold text-background">
          <Printer className="size-4" /> Volantino stampabile
        </Link>
      </div>

      <Section icon={Megaphone} title="Promozioni 1-click">
        <PromotionsPanel />
      </Section>

      <Section icon={Radio} title="Spot radio">
        <div className="grid gap-4 lg:grid-cols-2">
          {RADIO_SPOTS.map((r) => {
            const words = r.text.split(/\s+/).length;
            return (
              <article key={r.id} className="border border-hairline p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {r.durationS}″ · {r.tone} · {words} parole ≈ {Math.round(words / WORDS_PER_SECOND)}″ di lettura
                    </p>
                  </div>
                  <CopyButton text={r.text} what="Spot" />
                </div>
                <p className="mt-4 font-serif text-lg leading-relaxed">“{r.text}”</p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section icon={Clapperboard} title="Reel / TikTok">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{REEL_SCRIPT.title}</h3>
            <p className="text-xs text-muted-foreground">{REEL_SCRIPT.format}</p>
          </div>
          <CopyButton text={`${REEL_SCRIPT.title}\n\n${reelText}\n\n${REEL_SCRIPT.caption}\n${REEL_SCRIPT.hashtags.join(" ")}`} what="Script reel" />
        </div>
        <div className="mt-4 overflow-x-auto border border-hairline">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Tempo</th>
                <th className="px-3 py-2 font-medium">Inquadratura</th>
                <th className="px-3 py-2 font-medium">Testo a schermo</th>
                <th className="px-3 py-2 font-medium">Voce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border align-top">
              {REEL_SCRIPT.scenes.map((s) => (
                <tr key={s.t}>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums">{s.t}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.shot}</td>
                  <td className="px-3 py-2 font-medium">{s.onScreen}</td>
                  <td className="px-3 py-2">{s.voice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm">
          <span className="text-muted-foreground">Didascalia:</span> {REEL_SCRIPT.caption}{" "}
          <span className="text-gold">{REEL_SCRIPT.hashtags.join(" ")}</span>
        </p>
      </Section>

      <Section icon={Megaphone} title="Annunci Google e Meta">
        <div className="grid gap-4 lg:grid-cols-3">
          {ADS.map((a) => {
            const L = a.channel === "Google Ads" ? GOOGLE_LIMITS : META_LIMITS;
            return (
              <article key={a.id} className="border border-hairline p-5 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">{a.channel}</div>
                    <h3 className="font-semibold">{a.angle}</h3>
                  </div>
                  <CopyButton text={`Titoli:\n${a.headlines.join("\n")}\n\nDescrizioni:\n${a.descriptions.join("\n")}`} what="Annuncio" />
                </div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Titoli</div>
                <ul className="divide-y divide-border">{a.headlines.map((h) => <Counted key={h} text={h} limit={L.headline} />)}</ul>
                <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Descrizioni</div>
                <ul className="divide-y divide-border">{a.descriptions.map((d) => <Counted key={d} text={d} limit={L.description} />)}</ul>
              </article>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
