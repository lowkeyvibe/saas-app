"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleX, Inbox, Landmark, RotateCcw, ShoppingBag } from "lucide-react";
import { notifications as initialNotifications, TODAY, type NotificationKind } from "@/lib/mock-data";
import { formatRelativeDateTime } from "@/lib/format";
import { useDismiss } from "./use-dismiss";

// Ícono de cada tipo. Solo los rechazos van en rojo; el resto, neutro.
const KIND_ICON: Record<NotificationKind, { icon: typeof Inbox; className: string }> = {
  venta: { icon: ShoppingBag, className: "text-emerald-400" },
  rechazo: { icon: CircleX, className: "text-rose-400" },
  "upsell-rechazado": { icon: CircleX, className: "text-rose-400" },
  reembolso: { icon: RotateCcw, className: "text-muted" },
  retiro: { icon: Landmark, className: "text-muted" },
};

// Botón de la bandeja con el menú de notificaciones.
export function NotificationsMenu({ buttonClassName }: { buttonClassName: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialNotifications);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  const unread = items.filter((n) => n.unread).length;
  const markRead = (id: string) => setItems((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const markAllRead = () => setItems((list) => list.map((n) => ({ ...n, unread: false })));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        title="Notificaciones"
        className={`${buttonClassName} ${open ? "border-violet-500/40 bg-violet-500/10 text-foreground" : ""}`}
      >
        <Inbox className="size-4" />
        {/* Punto violeta: hay notificaciones sin leer. */}
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-background bg-brand" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface-2 shadow-2xl shadow-black/50 md:left-0 md:right-auto">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="text-sm font-medium">
              Notificaciones
              {unread > 0 && (
                <span className="ml-2 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
                  {unread}
                </span>
              )}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-violet-300 hover:text-violet-200"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          <ul className="max-h-[26rem] divide-y divide-border overflow-y-auto">
            {items.map((n) => {
              const kind = KIND_ICON[n.kind];
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => {
                      markRead(n.id);
                      close();
                    }}
                    className={`flex gap-3 px-4 py-3 transition hover:bg-violet-500/10 ${n.unread ? "bg-brand-soft" : ""}`}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface">
                      <kind.icon className={`size-4 ${kind.className}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${n.unread ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                      <p className="truncate text-xs text-muted">{n.detail}</p>
                      <p className="mt-0.5 text-xs text-subtle">{formatRelativeDateTime(n.date, TODAY)}</p>
                    </div>
                    {n.unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label="Sin leer" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href="/dashboard/ventas"
            onClick={close}
            className="flex items-center justify-center gap-1 border-t border-border px-4 py-2.5 text-xs text-muted transition hover:bg-overlay/[0.04] hover:text-foreground"
          >
            Ver todas las ventas <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
