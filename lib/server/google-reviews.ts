import "server-only";
import siteData from "@/data/site-data.json";
import reviewsData from "@/data/reviews.json";

export interface PublicReview {
  author: string;
  /** Profilo Google dell'autore, se disponibile (richiesto dalle regole di attribuzione di Google). */
  authorUrl?: string;
  rating: number;
  text: string;
  /** Es. "2 settimane fa", fornito da Google. */
  when?: string;
}

export interface ReviewsSummary {
  rating: number;
  count: number;
  reviews: PublicReview[];
  /** "google": dati letti in tempo reale dalla Places API; "manual": data/reviews.json + site-data. */
  source: "google" | "manual";
  /** Link alla scheda Google con tutte le recensioni. */
  mapsUrl: string;
}

const API = "https://places.googleapis.com/v1";
/** Le recensioni cambiano lentamente: una lettura al giorno resta ampiamente nella quota gratuita. */
const REVALIDATE_S = 24 * 3600;

interface PlacesReview {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  authorAttribution?: { displayName?: string; uri?: string };
}

interface PlaceDetails {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesReview[];
}

function manual(): ReviewsSummary {
  return {
    rating: siteData.trust.googleRating,
    count: siteData.trust.reviewsCount,
    reviews: reviewsData.reviews as PublicReview[],
    source: "manual",
    mapsUrl: siteData.links.googleReviews,
  };
}

/** Place ID da site-data o env; se manca, lo cerca una volta per nome e indirizzo (risultato in cache). */
async function placeId(key: string): Promise<string | null> {
  const configured = siteData.links.googlePlaceId || process.env.GOOGLE_PLACE_ID;
  if (configured) return configured;
  const { address } = siteData;
  const res = await fetch(`${API}/places:searchText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id" },
    body: JSON.stringify({ textQuery: `123 Gold compro oro ${address.street} ${address.cap} ${address.city}`, languageCode: "it" }),
    next: { revalidate: 7 * 24 * 3600 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { places?: { id: string }[] };
  return data.places?.[0]?.id ?? null;
}

/**
 * Recensioni reali dalla scheda Google (Places API, max 5 scelte da Google) con voto e totale aggiornati.
 * Senza GOOGLE_PLACES_API_KEY, o se Google non risponde, usa i dati inseriti a mano.
 */
export async function getReviews(): Promise<ReviewsSummary> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return manual();
  try {
    const id = await placeId(key);
    if (!id) return manual();
    const res = await fetch(`${API}/places/${encodeURIComponent(id)}?languageCode=it`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri,reviews" },
      next: { revalidate: REVALIDATE_S },
    });
    if (!res.ok) return manual();
    const place = (await res.json()) as PlaceDetails;
    const fallback = manual();
    const reviews = (place.reviews ?? [])
      .map<PublicReview>((r) => ({
        author: r.authorAttribution?.displayName ?? "Cliente Google",
        authorUrl: r.authorAttribution?.uri,
        rating: r.rating ?? 5,
        // Testo originale del cliente; la traduzione automatica solo se manca.
        text: (r.originalText?.text ?? r.text?.text ?? "").trim(),
        when: r.relativePublishTimeDescription,
      }))
      .filter((r) => r.text.length > 0);
    return {
      rating: place.rating ?? fallback.rating,
      count: place.userRatingCount ?? fallback.count,
      reviews: reviews.length > 0 ? reviews : fallback.reviews,
      source: "google",
      mapsUrl: place.googleMapsUri ?? fallback.mapsUrl,
    };
  } catch {
    return manual();
  }
}
