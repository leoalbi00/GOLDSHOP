import { getStore } from "@/lib/server/store";
import { denyUnlessAdmin, json, withStore } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Solo lettura per il titolare (dashboard, schede OAM). La creazione pubblica di voucher dal sito è disattivata:
 * senza handler POST, Next.js risponde 405 Method Not Allowed.
 */
export const GET = withStore(async () => {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;
  return json(await getStore().vouchers.list());
});
