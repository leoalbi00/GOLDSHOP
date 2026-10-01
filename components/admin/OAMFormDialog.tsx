"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { Check, FileDown, Loader2, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { formatEur } from "@/lib/pricing";
import { checkPayment, isValidTaxCode } from "@/lib/compliance-checker";
import { PAYMENT_LABEL, type OamRecord, type PaymentMethod, type Voucher } from "@/lib/vouchers";
import { VOUCHERS_KEY, apiError } from "@/lib/useAdminData";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/cn";

type Form = Omit<OamRecord, "grossWeight" | "netWeight" | "pricePaidCents" | "provenanceDeclared" | "recordedAt"> & {
  grossWeight: string;
  netWeight: string;
  price: string;
  provenanceDeclared: boolean;
};

/** "1.234,56" e "12,5" all'italiana; senza virgola il punto è il separatore decimale ("12.5"). */
const num = (s: string) => {
  const t = s.trim();
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const decimalInput = (n: number) => String(n).replace(".", ",");

function initialForm(v: Voucher): Form {
  const o = v.oam;
  return {
    firstName: o?.firstName ?? v.contact?.name.split(" ")[0] ?? "",
    lastName: o?.lastName ?? v.contact?.name.split(" ").slice(1).join(" ") ?? "",
    taxCode: o?.taxCode ?? "",
    birthDate: o?.birthDate ?? "",
    birthPlace: o?.birthPlace ?? "",
    address: o?.address ?? "",
    docType: o?.docType ?? "Carta d'identità",
    docNumber: o?.docNumber ?? "",
    docIssuer: o?.docIssuer ?? "",
    docExpiry: o?.docExpiry ?? "",
    itemsDescription: o?.itemsDescription ?? "",
    grossWeight: decimalInput(o?.grossWeight ?? v.grams),
    netWeight: decimalInput(o?.netWeight ?? v.grams),
    price: decimalInput((o?.pricePaidCents ?? v.amountCents) / 100),
    paymentMethod: o?.paymentMethod ?? "bonifico",
    paymentReference: o?.paymentReference ?? "",
    provenanceDeclared: !!o,
  };
}

const label = "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground";
const input =
  "mt-1 h-10 w-full border-b border-hairline bg-transparent text-sm outline-none transition-colors focus:border-gold aria-[invalid=true]:border-rose-600";

function Field({ name, children, className }: { name: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className={label}>{name}</span>
      {children}
    </label>
  );
}

export default function OAMFormDialog({ voucher, onOpenChange }: { voucher: Voucher | null; onOpenChange: (o: boolean) => void }) {
  const { mutate } = useSWRConfig();
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Solo al cambio di voucher: i refresh periodici della lista non devono cancellare ciò che si sta scrivendo.
  const code = voucher?.code;
  useEffect(() => {
    setForm(voucher ? initialForm(voucher) : null);
    setSaved(!!voucher?.oam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!voucher || !form) return <Dialog open={false} />;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm({ ...form, [k]: v });
    setSaved(false);
  };
  const priceEur = num(form.price);
  const priceCents = priceEur ? Math.round(priceEur * 100) : 0;
  const compliance = priceCents ? checkPayment(priceCents, form.paymentMethod) : null;
  const cfOk = isValidTaxCode(form.taxCode);
  const gross = num(form.grossWeight);
  const net = num(form.netWeight);
  const weightsOk = !!gross && !!net && net <= gross;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compliance?.ok || !cfOk || !weightsOk) return;
    setSaving(true);
    const { grossWeight: _g, netWeight: _n, price: _p, ...rest } = form;
    try {
      await axios.patch(`/api/vouchers/${voucher.code}`, {
        action: "oam",
        oam: { ...rest, taxCode: form.taxCode.toUpperCase(), grossWeight: gross, netWeight: net, pricePaidCents: priceCents },
      });
      await mutate(VOUCHERS_KEY);
      setSaved(true);
      toast.success("Scheda cliente salvata");
    } catch (err) {
      toast.error(apiError(err, "Salvataggio non riuscito"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="block rounded-sm sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scheda cliente OAM</DialogTitle>
          <DialogDescription>
            Operazione {voucher.code} · {voucher.purityLabel}. Dati obbligatori per il registro (D.Lgs. 92/2017).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-6 space-y-7">
          <fieldset className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <legend className="mb-3 font-serif text-lg">Dati anagrafici</legend>
            <Field name="Nome"><input className={input} required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
            <Field name="Cognome"><input className={input} required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
            <Field name="Codice fiscale">
              <div className="relative">
                <input
                  className={cn(input, "pr-7 font-mono uppercase tracking-wider")}
                  required
                  maxLength={16}
                  aria-invalid={form.taxCode.length === 16 && !cfOk}
                  value={form.taxCode}
                  onChange={(e) => set("taxCode", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                />
                {form.taxCode.length === 16 &&
                  (cfOk ? <Check className="absolute right-1 top-4 size-4 text-guarantee" /> : <X className="absolute right-1 top-4 size-4 text-rose-700" />)}
              </div>
            </Field>
            <Field name="Indirizzo di residenza"><input className={input} required value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field name="Luogo di nascita"><input className={input} required value={form.birthPlace} onChange={(e) => set("birthPlace", e.target.value)} /></Field>
            <Field name="Data di nascita"><input type="date" className={input} required value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} /></Field>
            <Field name="Tipo documento"><input className={input} required value={form.docType} onChange={(e) => set("docType", e.target.value)} /></Field>
            <Field name="Numero documento"><input className={cn(input, "font-mono uppercase")} required value={form.docNumber} onChange={(e) => set("docNumber", e.target.value.toUpperCase())} /></Field>
            <Field name="Rilasciato da"><input className={input} required value={form.docIssuer} onChange={(e) => set("docIssuer", e.target.value)} /></Field>
            <Field name="Scadenza documento"><input type="date" className={input} required value={form.docExpiry} onChange={(e) => set("docExpiry", e.target.value)} /></Field>
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <legend className="mb-3 font-serif text-lg">Dettaglio prezioso</legend>
            <Field name="Descrizione oggetti" className="sm:col-span-3">
              <textarea
                className={cn(input, "h-16 resize-none py-2")}
                required
                placeholder="es. 2 anelli, 1 catenina con pendente, punzone 750"
                value={form.itemsDescription}
                onChange={(e) => set("itemsDescription", e.target.value)}
              />
            </Field>
            <Field name="Peso lordo (g)"><input inputMode="decimal" className={input} required aria-invalid={!gross} value={form.grossWeight} onChange={(e) => set("grossWeight", e.target.value)} /></Field>
            <Field name="Peso netto (g)"><input inputMode="decimal" className={input} required aria-invalid={!weightsOk} value={form.netWeight} onChange={(e) => set("netWeight", e.target.value)} /></Field>
            <Field name="Prezzo corrisposto (€)"><input inputMode="decimal" className={cn(input, "font-semibold")} required aria-invalid={!priceEur} value={form.price} onChange={(e) => set("price", e.target.value)} /></Field>
            {!weightsOk && gross && net ? <p className="text-xs text-rose-700 sm:col-span-3">Il peso netto non può superare il lordo.</p> : null}
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <legend className="mb-3 font-serif text-lg">Pagamento</legend>
            <Field name="Modalità">
              <Select value={form.paymentMethod} onValueChange={(v) => set("paymentMethod", v as PaymentMethod)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field name="Riferimento (CRO/TRN, n. assegno)">
              <input className={input} value={form.paymentReference} onChange={(e) => set("paymentReference", e.target.value)} />
            </Field>
            {compliance && (
              <div
                role="alert"
                className={cn(
                  "flex items-start gap-3 border p-3 text-sm sm:col-span-2",
                  !compliance.ok
                    ? "border-rose-700/30 bg-rose-50 text-rose-800"
                    : compliance.traceableRequired || compliance.nearLimit
                      ? "border-amber-700/30 bg-amber-50 text-amber-900"
                      : "border-guarantee/30 bg-guarantee-soft text-guarantee",
                )}
              >
                {compliance.ok && !compliance.nearLimit ? <ShieldCheck className="mt-0.5 size-4 shrink-0" /> : <ShieldAlert className="mt-0.5 size-4 shrink-0" />}
                <span>
                  <strong className="font-semibold">{formatEur(priceCents / 100)} · </strong>
                  {compliance.message}
                </span>
              </div>
            )}
          </fieldset>

          <label className="flex items-start gap-3 border border-hairline bg-muted/60 p-4 text-sm">
            <input type="checkbox" className="mt-0.5 accent-[#92400e]" required checked={form.provenanceDeclared} onChange={(e) => set("provenanceDeclared", e.target.checked)} />
            Il cliente ha sottoscritto la dichiarazione di lecita provenienza e proprietà degli oggetti ceduti.
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving || !compliance?.ok || !cfOk || !weightsOk || !form.provenanceDeclared}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 bg-foreground text-sm font-semibold text-background disabled:opacity-30"
            >
              {saving && <Loader2 className="size-4 animate-spin" />} Salva scheda
            </button>
            <a
              href={`/api/generate-oam-pdf?code=${voucher.code}`}
              target="_blank"
              rel="noopener"
              aria-disabled={!saved}
              className={cn(
                "inline-flex h-12 flex-1 items-center justify-center gap-2 border border-foreground text-sm font-semibold transition-colors hover:bg-foreground hover:text-background",
                !saved && "pointer-events-none opacity-30",
              )}
            >
              <FileDown className="size-4" /> Genera PDF da firmare
            </a>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
