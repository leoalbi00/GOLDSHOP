import { requireAdminPage } from "@/lib/auth/server";
import AdminShell from "@/components/admin/AdminShell";

/** Seconda verifica dopo il proxy: ogni pagina del pannello richiede una sessione valida. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  return <AdminShell user={session.sub}>{children}</AdminShell>;
}
