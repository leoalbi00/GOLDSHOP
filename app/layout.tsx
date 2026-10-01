import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import type { FinancialService, Graph, LocalBusiness, OpeningHoursSpecification, PostalAddress } from "schema-dts";
import siteData from "@/data/site-data.json";
import "./globals.css";

const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const { address, contacts, trust } = siteData;

const postalAddress: PostalAddress = {
  "@type": "PostalAddress",
  streetAddress: address.street,
  addressLocality: address.city,
  addressRegion: address.province,
  postalCode: address.cap,
  addressCountry: address.country,
};

const openingHours: OpeningHoursSpecification[] = siteData.openingHoursSpecification.map((o) => ({
  "@type": "OpeningHoursSpecification",
  dayOfWeek: o.days.map((d) => `https://schema.org/${d}`) as OpeningHoursSpecification["dayOfWeek"],
  opens: o.opens,
  closes: o.closes,
}));

const shared = {
  name: siteData.name,
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
  currenciesAccepted: "EUR",
  priceRange: "€€",
} as const;

const jsonLd: Graph = {
  "@context": "https://schema.org",
  "@graph": [
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "123gold · Compro Oro Bergamo Centro | Via Angelo Maj 39/B, zona Stazione",
  applicationName: siteData.shortName,
  description:
    "Compro Oro 123 a Bergamo Centro: valutazione gratuita, quotazione oro aggiornata, prezzo bloccato 24h e pagamento immediato. Iscritto Registro OAM. Via Angelo Maj 39/B.",
  keywords: [
    "compro oro Bergamo",
    "compro oro Bergamo centro",
    "compro oro stazione Bergamo",
    "vendere oro Bergamo",
    "quotazione oro Bergamo",
    "valutazione oro gratuita Bergamo",
    "Via Angelo Maj",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: siteData.shortName,
    url: "/",
    title: "123gold · Compro Oro Bergamo Centro",
    description: "Calcola online il valore del tuo oro e blocca il prezzo per 24 ore. Via Angelo Maj 39/B, zona Stazione.",
  },
  twitter: {
    card: "summary_large_image",
    title: "123gold · Compro Oro Bergamo Centro",
    description: "Stima immediata, prezzo bloccato 24h, pagamento immediato. Via Angelo Maj 39/B, Bergamo.",
  },
  alternates: { canonical: "/" },
  other: {
    "geo.region": "IT-BG",
    "geo.placename": "Bergamo",
    "geo.position": `${address.coordinates.lat};${address.coordinates.lng}`,
    ICBM: `${address.coordinates.lat}, ${address.coordinates.lng}`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${serif.variable} ${sans.variable}`}>
      <body className="antialiased min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
