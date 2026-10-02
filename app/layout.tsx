import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import siteData from "@/data/site-data.json";
import SmoothScroll from "@/components/SmoothScroll";
import LocalBusinessSchema from "@/components/LocalBusinessSchema";
import DevInspector from "@/components/DevInspector";
import { Toaster } from "sonner";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const { address } = siteData;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "123gold · Compro Oro Bergamo Centro | Via Angelo Maj 39/B, zona Stazione",
  applicationName: siteData.shortName,
  description:
    "Compro Oro 123 a Bergamo Centro: valutazione gratuita, pesata a vista su bilancia omologata e pagamento immediato. Iscritto Registro OAM. Via Angelo Maj 39/B.",
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
    description: "Compro oro e quotazioni preziosi. Pesata a vista, iscritto Registro OAM. Via Angelo Maj 39/B, zona Stazione.",
  },
  twitter: {
    card: "summary_large_image",
    title: "123gold · Compro Oro Bergamo Centro",
    description: "Valutazione gratuita, pesata a vista e pagamento immediato. Via Angelo Maj 39/B, Bergamo.",
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
      <body className="min-h-screen antialiased">
        <LocalBusinessSchema siteUrl={siteUrl} />
        <SmoothScroll>{children}</SmoothScroll>
        <DevInspector />
        <Toaster
          position="bottom-center"
          toastOptions={{ className: "!rounded-sm !border-hairline !bg-paper !font-sans !text-foreground" }}
        />
      </body>
    </html>
  );
}
