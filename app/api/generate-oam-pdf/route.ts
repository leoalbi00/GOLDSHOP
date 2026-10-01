import { createElement, type ReactElement } from "react";
import type { NextRequest } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { OAMDocument } from "@/lib/pdf/OAMDocumentTemplate";
import { getStore } from "@/lib/server/store";
import { denyUnlessAdmin, error, withStore } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Scheda cliente OAM in PDF per il voucher indicato (?code=CO123-XXXX-XXXX). */
export const GET = withStore(async (req: NextRequest) => {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  const code = req.nextUrl.searchParams.get("code");
  const voucher = code ? await getStore().vouchers.get(code) : null;
  if (!voucher) return error("Voucher non trovato", 404);
  if (!voucher.oam) return error("Compila prima i dati della scheda cliente", 409);

  const doc = createElement(OAMDocument, { voucher, oam: voucher.oam }) as unknown as ReactElement<DocumentProps>;
  const pdf = await renderToBuffer(doc);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="scheda-oam-${voucher.code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
});
