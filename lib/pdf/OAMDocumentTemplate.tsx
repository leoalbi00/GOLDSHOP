import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import siteData from "@/data/site-data.json";
import { PURITIES, formatEur } from "@/lib/pricing";
import { CASH_LIMIT_EUR } from "@/lib/compliance-checker";
import { PAYMENT_LABEL, type OamRecord, type Voucher } from "@/lib/vouchers";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Europe/Rome";
const INK = "#111827";
const MUTED = "#6b6760";
const RULE = "#d9d4c8";
const BRONZE = "#92400e";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: INK, lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1.5, borderBottomColor: INK, paddingBottom: 10 },
  shop: { fontSize: 14, fontFamily: "Helvetica-Bold", lineHeight: 1.2, marginBottom: 3 },
  muted: { color: MUTED },
  title: { marginTop: 16, fontSize: 12, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  subtitle: { color: MUTED, marginTop: 2 },
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRONZE,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    paddingBottom: 3,
    marginBottom: 4,
  },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: RULE, paddingVertical: 3 },
  label: { width: "32%", color: MUTED },
  value: { width: "68%" },
  grid: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },
  declaration: { marginTop: 4, padding: 8, borderWidth: 0.5, borderColor: RULE, textAlign: "justify" },
  photos: { marginTop: 4, height: 70, borderWidth: 0.5, borderColor: RULE, borderStyle: "dashed", justifyContent: "center", alignItems: "center" },
  signatures: { flexDirection: "row", gap: 40, marginTop: 28 },
  signature: { flex: 1, borderTopWidth: 0.75, borderTopColor: INK, paddingTop: 4, color: MUTED },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 7, color: MUTED, textAlign: "center" },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row} wrap={false}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value || "—"}</Text>
    </View>
  );
}

const gramsFmt = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (iso: string) => (iso ? dayjs(iso).format("DD/MM/YYYY") : "");

export function OAMDocument({ voucher, oam }: { voucher: Voucher; oam: OamRecord }) {
  const { address, trust } = siteData;
  const purity = PURITIES.find((p) => p.id === voucher.purityId);
  const recorded = dayjs(oam.recordedAt).tz(TZ);
  const fineGrams = purity ? oam.netWeight * purity.fineness : 0;

  return (
    <Document title={`Scheda cliente ${voucher.code}`} author={siteData.name} language="it">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.shop}>{siteData.name}</Text>
            <Text style={s.muted}>
              {address.street}, {address.cap} {address.city} ({address.province})
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text>Iscrizione Registro Operatori Compro Oro (OAM)</Text>
            <Text style={s.muted}>n. {trust.oamRegistrationNumber || "____________________"}</Text>
          </View>
        </View>

        <Text style={s.title}>SCHEDA CLIENTE — OPERAZIONE DI COMPRO ORO</Text>
        <Text style={s.subtitle}>
          Ai sensi del D.Lgs. 25 maggio 2017, n. 92 · Operazione {voucher.code} · {recorded.format("DD/MM/YYYY HH:mm")}
        </Text>

        <View style={s.section}>
          <Text style={s.sectionTitle}>1. Dati anagrafici del cedente</Text>
          <View style={s.grid}>
            <View style={s.col}>
              <Row label="Cognome" value={oam.lastName} />
              <Row label="Nome" value={oam.firstName} />
              <Row label="Codice fiscale" value={oam.taxCode} />
              <Row label="Nato/a a" value={oam.birthPlace} />
              <Row label="Il" value={date(oam.birthDate)} />
            </View>
            <View style={s.col}>
              <Row label="Residenza" value={oam.address} />
              <Row label="Documento" value={oam.docType} />
              <Row label="Numero" value={oam.docNumber} />
              <Row label="Rilasciato da" value={oam.docIssuer} />
              <Row label="Scadenza" value={date(oam.docExpiry)} />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>2. Dettaglio degli oggetti preziosi</Text>
          <Row label="Descrizione" value={oam.itemsDescription} />
          <Row label="Metallo e caratura" value={`${voucher.purityLabel}${purity ? ` (titolo ${Math.round(purity.fineness * 1000)}‰)` : ""}`} />
          <Row label="Peso lordo" value={`${gramsFmt.format(oam.grossWeight)} g`} />
          <Row label="Peso netto" value={`${gramsFmt.format(oam.netWeight)} g`} />
          <Row label="Metallo fino contenuto" value={`${gramsFmt.format(fineGrams)} g`} />
          <Row label="Prezzo corrisposto" value={formatEur(oam.pricePaidCents / 100)} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>3. Modalità di pagamento</Text>
          <Row label="Mezzo di pagamento" value={PAYMENT_LABEL[oam.paymentMethod]} />
          <Row label="Riferimento (CRO/TRN, n. assegno)" value={oam.paymentReference} />
          <Text style={[s.muted, { marginTop: 4, fontSize: 8 }]}>
            Operazioni di importo pari o superiore a {CASH_LIMIT_EUR} € regolate esclusivamente con mezzi di pagamento
            tracciabili (art. 5 D.Lgs. 92/2017).
          </Text>
        </View>

        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>4. Dichiarazione di lecita provenienza</Text>
          <Text style={s.declaration}>
            Il/La sottoscritto/a {oam.firstName} {oam.lastName}, consapevole delle responsabilità penali in caso di
            dichiarazioni mendaci, dichiara che gli oggetti sopra descritti sono di sua esclusiva proprietà, di lecita
            provenienza, liberi da vincoli, pegni o diritti di terzi, e di cederli volontariamente al prezzo indicato.
            Dichiara inoltre di aver ricevuto l&apos;informativa sul trattamento dei dati personali, raccolti per gli
            obblighi di legge (D.Lgs. 92/2017 e normativa antiriciclaggio) e conservati per il periodo previsto.
          </Text>
        </View>

        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>5. Documentazione fotografica</Text>
          <View style={s.photos}>
            <Text style={s.muted}>Allegare le fotografie degli oggetti acquistati</Text>
          </View>
        </View>

        <View style={s.signatures} wrap={false}>
          <Text style={s.signature}>Firma del cedente</Text>
          <Text style={s.signature}>Timbro e firma dell&apos;operatore</Text>
        </View>

        <Text style={s.footer} fixed>
          {siteData.name} · {address.street}, {address.city} · Scheda {voucher.code} · Documento da conservare agli atti
        </Text>
      </Page>
    </Document>
  );
}
