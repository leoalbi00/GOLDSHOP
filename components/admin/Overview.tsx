"use client";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { FileText, MessageCircle, Phone, ScanLine, ShieldAlert } from "lucide-react";
import siteData from "@/data/site-data.json";
import { formatEur } from "@/lib/pricing";
import { isHotLead, voucherState, type Voucher, type VoucherState } from "@/lib/vouchers";
import { VOLATILITY_THRESHOLD_PCT, volatilityFor } from "@/lib/volatility-alert";
import { priorityMessageLink, telLink } from "@/lib/whatsapp-engine";
import { STORE_TZ } from "@/lib/store-hours";
import { useQuotes } from "@/lib/useQuotes";
import { useBookings, useVouchers } from "@/lib/useAdminData";
import QRScannerModal from "@/components/admin/QRScannerModal";
import OAMFormDialog from "@/components/admin/OAMFormDialog";
import ReviewBooster from "@/components/admin/ReviewBooster";
import { HotLeadBadge, StateBadge, VolatilityBadge } from "@/components/admin/VoucherBadges";
import { cn } from "@/lib/cn";

dayjs.extend(utc);
dayjs.extend(timezone);

const gramsFmt = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
const FILTERS: { id: VoucherState | "all"; label: string }[] = [
  { id: "all", label: "Tutti" },
  { id: "active", label: "Attivi" },
  { id: "completed", label: "Completati" },
  { id: "expired", label: "Scaduti" },
];

function Metric({ label, value, sub, tone, small }: { label: string; value: string; sub?: string; tone?: "risk"; small?: boolean }) {
  return (
    <div className="bg-paper p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={cn("mt-2 font-medium tracking-tight tabular-nums", small ? "text-xl" : "text-3xl", tone === "risk" && "text-rose-800")}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const { gold24k, silver } = useQuotes();
  const { data: vouchers = [], isLoading } = useVouchers();
  const { data: bookings = [] } = useBookings();
  const [filter, setFilter] = useState<VoucherState | "all">("all");
  const [scanner, setScanner] = useState<{ open: boolean; code: string | null }>({ open: false, code: null });
  const [oamCode, setOamCode] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      vouchers.map((v) => ({
        v,
        state: voucherState(v),
        hot: isHotLead(v),
        vol: volatilityFor(v, gold24k, silver),
      })),
    [vouchers, gold24k, silver],
  );

  const today = dayjs().tz(STORE_TZ).format("YYYY-MM-DD");
  const active = rows.filter((r) => r.state === "active");
  const gramsToday = rows
    .filter((r) => r.v.metal === "gold" && dayjs(r.v.createdAt).tz(STORE_TZ).format("YYYY-MM-DD") === today)
    .reduce((s, r) => s + r.v.grams, 0);
  const marginDone = rows.filter((r) => r.state === "completed").reduce((s, r) => s + r.v.marginCents, 0);
  const marginPipeline = active.reduce((s, r) => s + r.v.marginCents, 0);
  const atRisk = active.filter((r) => r.vol.marginAtRisk).length;
  const hotActive = active.filter((r) => r.hot).length;
  const pendingBookings = bookings.filter((b) => b.status === "requested").length;
  const shown = filter === "all" ? rows : rows.filter((r) => r.state === filter);
  const oamVoucher = vouchers.find((v) => v.code === oamCode) ?? null;

  const since30 = dayjs().subtract(30, "day");
  const avgPerGram = (id: string) => {
    const recent = vouchers.filter((v) => v.purityId === id && dayjs(v.createdAt).isAfter(since30));
    const grams = recent.reduce((t, v) => t + v.grams, 0);
    return grams ? recent.reduce((t, v) => t + v.amountCents, 0) / 100 / grams : null;
  };
  const avg18 = avgPerGram("18K");
  const avg24 = avgPerGram("24K");
  const upcomingVip = bookings.filter((b) => b.status !== "cancelled" && b.status !== "completed" && b.date >= today).length;
  const waLeads = active.filter((r) => r.v.contact).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium">Panoramica operativa</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quotazione 24K {formatEur(gold24k)}/g · aggiornamento ogni 15 secondi</p>
        </div>
        <button
          type="button"
          onClick={() => setScanner({ open: true, code: null })}
          className="inline-flex h-11 items-center gap-2 bg-gold px-5 text-sm font-semibold text-white shadow-[0_3px_0_0_#5b2808] transition-[transform,box-shadow] active:translate-y-[3px] active:shadow-none"
        >
          <ScanLine className="size-4" /> Scansiona voucher
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-px border border-hairline bg-hairline lg:grid-cols-4">
        <Metric label="Oro bloccato oggi" value={`${gramsFmt.format(gramsToday)} g`} sub={`${active.length} voucher attivi`} />
        <Metric
          label="Valutazione media 18K / 24K"
          value={`${avg18 ? formatEur(avg18) : "—"} / ${avg24 ? formatEur(avg24) : "—"}`}
          sub="€/g riconosciuti, ultimi 30 giorni"
          small
        />
        <Metric label="Appuntamenti VIP" value={String(upcomingVip)} sub={pendingBookings ? `${pendingBookings} da confermare` : "In programma"} />
        <Metric label="Lead WhatsApp attivi" value={String(waLeads)} sub={hotActive ? `${hotActive} hot lead (oltre ${siteData.pricing.hotLeadGrams} g)` : "Con contatto lasciato"} />
      </div>
      <div className="mt-px grid grid-cols-2 gap-px border border-t-0 border-hairline bg-hairline">
        <Metric label="Margine stimato" value={formatEur(marginDone / 100)} sub={`+ ${formatEur(marginPipeline / 100)} sui voucher attivi`} small />
        <Metric
          label="Rischio margine"
          value={String(atRisk)}
          tone={atRisk ? "risk" : undefined}
          sub={`Voucher attivi con mercato −${VOLATILITY_THRESHOLD_PCT}% o oltre`}
          small
        />
      </div>

      <section className="mt-10" aria-labelledby="vouchers-title">
            <h2 id="vouchers-title" className="mb-4 font-serif text-2xl font-medium">Voucher e lead</h2>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={filter === f.id}
                  className={cn(
                    "h-8 border px-3 text-xs font-medium transition-colors",
                    filter === f.id ? "border-foreground bg-foreground text-background" : "border-hairline hover:bg-muted",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <p className="mt-6 text-sm text-muted-foreground">Caricamento…</p>
            ) : !shown.length ? (
              <p className="mt-6 border border-dashed border-hairline p-8 text-center text-sm text-muted-foreground">
                Nessun voucher {filter !== "all" && FILTERS.find((f) => f.id === filter)?.label.toLowerCase()}.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border border border-hairline bg-paper">
                {shown.map(({ v, state, hot, vol }) => {
                  const priority = priorityMessageLink(v);
                  return (
                    <li
                      key={v.code}
                      className={cn(
                        "grid gap-4 p-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-center",
                        hot && state === "active" && "bg-gold-soft/60",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-sm font-semibold tracking-wider">{v.code}</span>
                          <StateBadge state={state} />
                          {hot && <HotLeadBadge />}
                          {state === "active" && <VolatilityBadge v={vol} />}
                          {v.oam && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-guarantee">
                              <FileText className="size-3" /> Scheda OAM
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Bloccato {dayjs(v.createdAt).format("DD/MM, HH:mm")} · scade {dayjs(v.expiresAt).format("DD/MM, HH:mm")}
                          {v.contact && ` · ${v.contact.name}, ${v.contact.phone}`}
                        </div>
                      </div>

                      <div className="flex items-baseline gap-4 text-sm">
                        <span className="text-muted-foreground">{v.purityLabel}</span>
                        <span className="tabular-nums">{gramsFmt.format(v.grams)} g</span>
                        <span className="ml-auto font-semibold tabular-nums lg:ml-0">{formatEur(v.amountCents / 100)}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {hot && v.contact && state === "active" && (
                          <>
                            <a href={telLink(v.contact.phone)} className="inline-flex h-8 items-center gap-1.5 bg-gold px-2.5 text-xs font-semibold text-white" aria-label={`Chiama ${v.contact.name}`}>
                              <Phone className="size-3.5" /> Chiama
                            </a>
                            {priority && (
                              <a href={priority} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 border border-gold px-2.5 text-xs font-semibold text-gold">
                                <MessageCircle className="size-3.5" /> Prioritario
                              </a>
                            )}
                          </>
                        )}
                        {state === "active" && (
                          <button
                            type="button"
                            onClick={() => setScanner({ open: true, code: v.code })}
                            className="inline-flex h-8 items-center border border-foreground px-2.5 text-xs font-semibold transition-colors hover:bg-foreground hover:text-background"
                          >
                            Concludi
                          </button>
                        )}
                        {state === "completed" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setOamCode(v.code)}
                              className="inline-flex h-8 items-center gap-1.5 border border-hairline px-2.5 text-xs font-medium hover:bg-muted"
                            >
                              <FileText className="size-3.5" /> {v.oam ? "Scheda / PDF" : "Compila scheda OAM"}
                            </button>
                            <ReviewBooster voucher={v} />
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {atRisk > 0 && (
              <p className="mt-4 flex items-start gap-2 text-xs text-rose-800">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                La quotazione è scesa di oltre il {VOLATILITY_THRESHOLD_PCT}% rispetto al blocco su {atRisk} voucher: pagando il
                prezzo bloccato il margine si riduce.
              </p>
            )}
      </section>

      <QRScannerModal
        open={scanner.open}
        initialCode={scanner.code}
        onOpenChange={(open) => setScanner((s) => ({ ...s, open }))}
        onCompleted={(v) => setOamCode(v.code)}
      />
      <OAMFormDialog voucher={scanner.open ? null : oamVoucher} onOpenChange={(o) => !o && setOamCode(null)} />
    </>
  );
}
