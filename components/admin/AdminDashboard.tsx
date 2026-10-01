"use client";
import { useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { FileText, LogOut, MessageCircle, Phone, ScanLine, ShieldAlert } from "lucide-react";
import siteData from "@/data/site-data.json";
import { formatEur } from "@/lib/pricing";
import { isHotLead, voucherState, type Voucher, type VoucherState } from "@/lib/vouchers";
import { VOLATILITY_THRESHOLD_PCT, volatilityFor } from "@/lib/volatility-alert";
import { priorityMessageLink, telLink } from "@/lib/whatsapp-engine";
import { STORE_TZ } from "@/lib/store-hours";
import { useQuotes } from "@/lib/useQuotes";
import { useBookings, useVouchers } from "@/lib/useAdminData";
import { TooltipProvider } from "@/components/ui/tooltip";
import MarginController from "@/components/admin/MarginController";
import QRScannerModal from "@/components/admin/QRScannerModal";
import OAMFormDialog from "@/components/admin/OAMFormDialog";
import ReviewBooster from "@/components/admin/ReviewBooster";
import ExportData from "@/components/admin/ExportData";
import BookingsList from "@/components/admin/BookingsList";
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
const tabCls =
  "relative -mb-px px-1 pb-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-px data-[state=active]:after:bg-foreground";

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "risk" }) {
  return (
    <div className="bg-paper p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-3xl font-medium tracking-tight tabular-nums", tone === "risk" && "text-rose-800")}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
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

  const logout = async () => {
    await axios.delete("/api/admin/login");
    window.location.reload();
  };

  return (
    <TooltipProvider delayDuration={150}>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-medium">
              Compro Oro <span className="italic text-gold">123</span>
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">Area riservata</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScanner({ open: true, code: null })}
              className="inline-flex h-10 items-center gap-2 bg-gold px-4 text-sm font-semibold text-white shadow-[0_3px_0_0_#5b2808] transition-[transform,box-shadow] active:translate-y-[3px] active:shadow-none"
            >
              <ScanLine className="size-4" /> Scansiona voucher
            </button>
            <button type="button" onClick={logout} className="inline-flex size-10 items-center justify-center border border-hairline hover:bg-muted" aria-label="Esci">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-2 gap-px border border-hairline bg-hairline lg:grid-cols-4">
          <Metric label="Voucher attivi" value={String(active.length)} sub={hotActive ? `${hotActive} hot lead da contattare` : "Nessun hot lead"} />
          <Metric label="Oro bloccato oggi" value={`${gramsFmt.format(gramsToday)} g`} sub={`Quotazione 24K ${formatEur(gold24k)}/g`} />
          <Metric label="Margine stimato" value={formatEur(marginDone / 100)} sub={`+ ${formatEur(marginPipeline / 100)} sui voucher attivi`} />
          <Metric
            label="Rischio margine"
            value={String(atRisk)}
            tone={atRisk ? "risk" : undefined}
            sub={`Voucher attivi con mercato −${VOLATILITY_THRESHOLD_PCT}% o oltre`}
          />
        </div>

        <TabsPrimitive.Root defaultValue="vouchers" className="mt-10">
          <TabsPrimitive.List className="flex gap-6 overflow-x-auto border-b border-border" aria-label="Sezioni amministrazione">
            <TabsPrimitive.Trigger value="vouchers" className={tabCls}>Voucher</TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger value="margins" className={tabCls}>Margini</TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger value="bookings" className={tabCls}>
              Appuntamenti
              {pendingBookings > 0 && <span className="ml-1.5 rounded-full bg-gold px-1.5 text-[10px] text-white">{pendingBookings}</span>}
            </TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger value="export" className={tabCls}>Registro</TabsPrimitive.Trigger>
          </TabsPrimitive.List>

          <TabsPrimitive.Content value="vouchers" className="pt-6 outline-none">
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
          </TabsPrimitive.Content>

          <TabsPrimitive.Content value="margins" className="pt-6 outline-none">
            <MarginController />
          </TabsPrimitive.Content>

          <TabsPrimitive.Content value="bookings" className="pt-6 outline-none">
            <BookingsList />
          </TabsPrimitive.Content>

          <TabsPrimitive.Content value="export" className="grid gap-6 pt-6 outline-none lg:grid-cols-2">
            <ExportData vouchers={vouchers} />
            <div className="border border-hairline p-6 text-sm text-muted-foreground">
              <h2 className="font-serif text-2xl font-medium text-foreground">Note di conformità</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  Operazioni da {siteData.compliance.cashLimitEur} € in su: solo bonifico o assegno (art. 5 D.Lgs. 92/2017). Il
                  salvataggio della scheda in contanti oltre soglia è bloccato.
                </li>
                <li>Ogni scheda va stampata, firmata dal cliente e conservata con copia del documento e foto degli oggetti.</li>
                <li>I dati personali restano solo sul server del negozio, in <code>data/store/</code>.</li>
              </ul>
            </div>
          </TabsPrimitive.Content>
        </TabsPrimitive.Root>
      </main>

      <QRScannerModal
        open={scanner.open}
        initialCode={scanner.code}
        onOpenChange={(open) => setScanner((s) => ({ ...s, open }))}
        onCompleted={(v) => setOamCode(v.code)}
      />
      <OAMFormDialog voucher={scanner.open ? null : oamVoucher} onOpenChange={(o) => !o && setOamCode(null)} />
    </TooltipProvider>
  );
}
