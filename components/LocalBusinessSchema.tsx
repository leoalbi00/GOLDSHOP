import type {
  FinancialService,
  Graph,
  LocalBusiness,
  OpeningHoursSpecification,
  PostalAddress,
  WebSite,
} from "schema-dts";
import siteData from "@/data/site-data.json";

/** Nome per Google: deve restare uguale a quello della scheda Google Business Profile. */
export const SCHEMA_NAME = "123 Gold Compro Oro Bergamo";

const { address, contacts, trust } = siteData;

const postalAddress: PostalAddress = {
  "@type": "PostalAddress",
  streetAddress: address.street,
  addressLocality: address.city,
  addressRegion: address.province,
  postalCode: address.cap,
  addressCountry: address.country,
};

/** Orari e coordinate arrivano da data/site-data.json: sono gli stessi del badge "Aperto ora". */
const openingHours: OpeningHoursSpecification[] = siteData.openingHoursSpecification.map((o) => ({
  "@type": "OpeningHoursSpecification",
  dayOfWeek: o.days.map((d) => `https://schema.org/${d}`) as OpeningHoursSpecification["dayOfWeek"],
  opens: o.opens,
  closes: o.closes,
}));

function buildGraph(siteUrl: string): Graph {
  const shared = {
    name: SCHEMA_NAME,
    alternateName: siteData.name,
    url: siteUrl,
    telephone: contacts.phoneIntl,
    email: contacts.email,
    address: postalAddress,
    geo: { "@type": "GeoCoordinates", latitude: address.coordinates.lat, longitude: address.coordinates.lng },
    openingHoursSpecification: openingHours,
    areaServed: [
      { "@type": "City", name: "Bergamo" },
      { "@type": "Place", name: "Bergamo Centro" },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: trust.googleRating,
      bestRating: trust.googleRatingMax,
      reviewCount: trust.reviewsCount,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.street}, ${address.cap} ${address.city}`)}`,
    sameAs: [siteData.links.googleReviews],
    currenciesAccepted: "EUR",
    priceRange: "€€€",
  } as const;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteData.shortName,
        inLanguage: "it-IT",
        publisher: { "@id": `${siteUrl}/#localbusiness` },
      } satisfies WebSite,
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#localbusiness`,
        ...shared,
        description: `Compro oro a Bergamo Centro, ${address.street}, vicino alla Stazione. ${trust.legalNotes.join(". ")}.`,
      } satisfies LocalBusiness,
      {
        "@type": "FinancialService",
        "@id": `${siteUrl}/#financialservice`,
        ...shared,
        description: "Acquisto oro usato, gioielli, argento, monete e lingotti con valutazione gratuita e pagamento immediato.",
        parentOrganization: { "@id": `${siteUrl}/#localbusiness` },
        makesOffer: siteData.services.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s },
        })),
      } satisfies FinancialService,
    ],
  };
}

/** Dati strutturati JSON-LD per la scheda locale su Google (LocalBusiness + FinancialService). */
export default function LocalBusinessSchema({ siteUrl }: { siteUrl: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildGraph(siteUrl)).replace(/</g, "\\u003c") }}
    />
  );
}
