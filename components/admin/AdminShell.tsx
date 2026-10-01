"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { CalendarCheck, FileText, Gauge, LogOut, Megaphone, SlidersHorizontal } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Panoramica", icon: Gauge },
  { href: "/admin/bookings", label: "Prenotazioni VIP", icon: CalendarCheck },
  { href: "/admin/margins", label: "Margini", icon: SlidersHorizontal },
  { href: "/admin/oam", label: "OAM e registro", icon: FileText },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
];

export default function AdminShell({ user, children }: { user: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = async () => {
    await axios.delete("/api/admin/login").catch(() => undefined);
    window.location.assign("/admin/login");
  };

  return (
    <TooltipProvider delayDuration={150}>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-medium">
              Compro Oro <span className="italic text-gold">123</span>
            </span>
            <span className="hidden text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:inline">Area riservata · {user}</span>
          </div>
          <button type="button" onClick={logout} className="inline-flex h-10 items-center gap-2 border border-hairline px-3 text-sm hover:bg-muted">
            <LogOut className="size-4" /> <span className="hidden sm:inline">Esci</span>
          </button>
        </div>
        <nav aria-label="Sezioni" className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
          <ul className="flex gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-11 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium transition-colors",
                      active ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" /> {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">{children}</main>
    </TooltipProvider>
  );
}
