import type { Metadata } from "next";
import { adminPin, isAdmin } from "@/lib/server/session";
import AdminLogin from "@/components/admin/AdminLogin";

export const metadata: Metadata = {
  title: "Area riservata · 123gold",
  robots: { index: false, follow: false },
};

/** Tutto /admin passa da qui: senza sessione valida si vede solo il PIN. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) return <AdminLogin pinLength={adminPin()?.length ?? 4} />;
  return <div className="min-h-screen bg-background">{children}</div>;
}
