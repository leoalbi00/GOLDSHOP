"use client";
import { useState } from "react";
import { Car, Footprints, Loader2, LocateFixed } from "lucide-react";
import siteData from "@/data/site-data.json";

const SHOP = siteData.address.coordinates;
/** La strada è più lunga della linea d'aria: fattore medio per un centro città. */
const ROAD_FACTOR = 1.35;
const WALK_KMH = 4.8;

/** Distanza in linea d'aria (formula dell'emisenoverso), in km. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Velocità media in auto: traffico urbano sotto i 10 km, poi tangenziali e statali. */
const driveKmh = (km: number) => (km < 10 ? 22 : km < 40 ? 45 : 70);

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; km: number; walkMin: number; driveMin: number }
  | { kind: "error"; message: string };

const ERRORS: Record<number, string> = {
  1: "Permesso di posizione negato. Puoi attivarlo dalle impostazioni del browser.",
  2: "Posizione non disponibile in questo momento.",
  3: "Ci sta mettendo troppo: riprova all'aperto o con il GPS attivo.",
};

const km1 = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

export default function DistanceCalculator() {
  const [state, setState] = useState<State>({ kind: "idle" });

  const locate = () => {
    if (!("geolocation" in navigator)) return setState({ kind: "error", message: "Il tuo browser non supporta la geolocalizzazione." });
    if (!window.isSecureContext) return setState({ kind: "error", message: "La posizione funziona solo su connessione sicura (https)." });
    setState({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const road = haversineKm(coords.latitude, coords.longitude, SHOP.lat, SHOP.lng) * ROAD_FACTOR;
        setState({
          kind: "done",
          km: road,
          walkMin: Math.max(1, Math.round((road / WALK_KMH) * 60)),
          driveMin: Math.max(1, Math.round((road / driveKmh(road)) * 60)),
        });
      },
      (err) => setState({ kind: "error", message: ERRORS[err.code] ?? "Impossibile ottenere la posizione." }),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  };

  const walkFirst = state.kind === "done" && state.km <= 2;

  return (
    <div className="border-2 border-dashed border-hairline p-5">
      {state.kind !== "done" ? (
        <>
          <button
            type="button"
            onClick={locate}
            disabled={state.kind === "loading"}
            className="flex h-14 w-full items-center justify-center gap-3 bg-gold text-base font-bold text-white shadow-[0_4px_0_0_#5b2808] transition-[transform,box-shadow] active:translate-y-[4px] active:shadow-none disabled:opacity-60"
          >
            {state.kind === "loading" ? <Loader2 className="size-5 animate-spin" /> : <LocateFixed className="size-5" />}
            Calcola tempo di arrivo
          </button>
          <p className={state.kind === "error" ? "mt-3 text-sm text-rose-700" : "mt-3 text-center text-xs text-muted-foreground"} role={state.kind === "error" ? "alert" : undefined}>
            {state.kind === "error" ? state.message : "Usiamo la tua posizione solo sul tuo telefono, per questo calcolo: non viene inviata a nessuno."}
          </p>
        </>
      ) : (
        <div aria-live="polite">
          <div className="text-2xl font-bold tracking-tight sm:text-3xl">
            {state.km > 150 ? (
              <>Sei a {Math.round(state.km)} km da noi</>
            ) : (
              <>
                Sei a soli <span className="text-gold">{walkFirst ? state.walkMin : state.driveMin} min</span> da noi!
              </>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Car className="size-4" /> {state.driveMin} min in auto
            </span>
            {state.km <= 8 && (
              <span className="inline-flex items-center gap-1.5">
                <Footprints className="size-4" /> {state.walkMin} min a piedi
              </span>
            )}
            <span>circa {km1.format(state.km)} km</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {state.km > 150 ? "Blocca il prezzo online e passa quando sei a Bergamo. " : ""}Stima indicativa: il navigatore ti darà il tempo esatto col traffico.
          </p>
          <button type="button" onClick={locate} className="mt-3 text-xs font-semibold text-gold underline-offset-4 hover:underline">
            Ricalcola
          </button>
        </div>
      )}
    </div>
  );
}
