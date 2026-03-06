"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, ChartColumnBig, Gauge, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Início", icon: Gauge },
  { href: "/historico", label: "Histórico", icon: ChartColumnBig },
  { href: "/alimentos", label: "Alimentos", icon: Apple },
  { href: "/config", label: "Config", icon: Settings },
];

export function AppBottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/82 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 shadow-[0_-10px_32px_-20px_rgba(15,23,42,0.4)] backdrop-blur md:hidden dark:border-white/10 dark:bg-[rgba(24,16,26,0.92)] dark:shadow-[0_-10px_32px_-20px_rgba(0,0,0,0.8)]">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-1 rounded-2xl border border-black/5 bg-white/55 p-1 dark:border-white/5 dark:bg-white/5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition",
                active
                  ? "bg-botao text-white shadow-[0_10px_20px_-14px_rgba(230,75,141,0.9)]"
                  : "text-textoSec hover:bg-white/60 dark:text-muted-foreground dark:hover:bg-white/10",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
