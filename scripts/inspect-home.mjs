#!/usr/bin/env node
/**
 * Ispezione del markup della home: verifica che ogni sezione sia presente e non vuota.
 * Uso: npm run inspect [-- URL]   (default http://localhost:3000; avvia prima `npm run dev` o `npm start`)
 */
const url = process.argv[2] ?? "http://localhost:3000";

const res = await fetch(url, { redirect: "manual" }).catch((e) => {
  console.error(`✗ Impossibile raggiungere ${url}: ${e.message}`);
  process.exit(2);
});
if (res.status !== 200) {
  console.error(`✗ ${url} risponde ${res.status}${res.status === 302 || res.status === 401 ? " (protetto da Vercel Authentication?)" : ""}`);
  process.exit(2);
}
const html = await res.text();

/** Contenuto di una <section id="..."> fino alla chiusura corrispondente (le sezioni non sono annidate). */
const section = (id) => html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`))?.[0] ?? "";
const count = (s, re) => (s.match(re) ?? []).length;
const text = (s) => s.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const gallery = section("galleria");
const reviews = section("recensioni");
const contacts = section("contatti");

const checks = [
  ["Titolo pagina", /<title>[^<]*123gold/i.test(html), html.match(/<title>([^<]*)/)?.[1]],
  ["Dati strutturati JSON-LD", html.includes('"@type":"LocalBusiness"'), ""],
  ["Hero: titolo 123 Gold", /<h1[^>]*>[\s\S]*?Gold[\s\S]*?Bergamo/.test(html), ""],
  ["Hero: badge OAM", html.includes("Registro Operatori Compro Oro OAM"), ""],
  ["Chi siamo", text(section("chi-siamo")).length > 200, `${text(section("chi-siamo")).length} caratteri`],
  ["Galleria: immagini", count(gallery, /<img /g) >= 3, `${count(gallery, /<img /g)} <img>`],
  ["Recensioni: voto Google", /\d,\d/.test(text(reviews)), text(reviews).match(/\d,\d[^·]*·[^→]*/)?.[0]],
  ["Recensioni: card con testo", count(reviews, /<blockquote/g) > 0, `${count(reviews, /<blockquote/g)} card (0 = data/reviews.json vuoto e GOOGLE_PLACES_API_KEY assente)`],
  ["Contatti: Chiama", contacts.includes('href="tel:'), ""],
  ["Contatti: WhatsApp", contacts.includes("wa.me/"), ""],
  ["Contatti: Google Maps", contacts.includes("google.com/maps/dir"), ""],
  ["Contatti: orari", count(contacts, /<dt/g) >= 2, `${count(contacts, /<dt/g)} righe`],
];

let failed = 0;
console.log(`Ispezione di ${url}\n`);
for (const [name, ok, detail] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? `  — ${detail}` : ""}`);
}
console.log(`\n${checks.length - failed}/${checks.length} controlli superati`);
process.exit(failed ? 1 : 0);
