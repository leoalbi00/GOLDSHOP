import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "online" | "offline" | "loading";

const TONE: Record<Status, { badge: string; dot: string }> = {
  online: { badge: "border-guarantee/30 bg-guarantee-soft text-guarantee", dot: "bg-guarantee" },
  offline: { badge: "border-rose-800/20 bg-rose-50 text-rose-800", dot: "bg-rose-700" },
  loading: { badge: "border-hairline bg-paper text-muted-foreground", dot: "bg-hairline" },
};

/** Badge di stato con indicatore luminoso (pulsante quando online), costruito sul Badge shadcn/ui. */
export function StatusBadge({
  status,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Badge> & { status: Status }) {
  return (
    <Badge variant="outline" className={cn("gap-2.5 px-3.5 py-1.5", TONE[status].badge, className)} {...props}>
      <span className="relative flex size-2" aria-hidden>
        {status === "online" && (
          <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden", TONE.online.dot)} />
        )}
        <span className={cn("relative size-2 rounded-full", TONE[status].dot)} />
      </span>
      {children}
    </Badge>
  );
}
