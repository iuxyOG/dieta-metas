"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, ChartColumnBig, Gauge, Settings } from "lucide-react";

import { LogoutButton } from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { getPtDateLabel } from "@/lib/data";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Início", icon: Gauge },
  { href: "/historico", label: "Histórico", icon: ChartColumnBig },
  { href: "/alimentos", label: "Alimentos", icon: Apple },
  { href: "/config", label: "Config", icon: Settings },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="space-y-4 rounded-[28px] border border-borda/70 bg-white/80 p-4 shadow-[0_10px_35px_-20px_rgba(230,75,141,0.6)] backdrop-blur dark:border-border/80 dark:bg-card/85 dark:shadow-[0_10px_35px_-20px_rgba(0,0,0,0.9)] md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center rounded-full bg-rosaClaro px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-botao dark:bg-secondary dark:text-primary">
            rotina diária
          </p>
          <h1 className="mt-2 text-[1.75rem] font-black leading-tight tracking-tight text-textoPrim dark:text-foreground md:text-4xl">
            Olá, Jhullya Isabela <span className="text-botao">💗</span>
          </h1>
          <p className="mt-1 text-sm font-medium capitalize text-textoSec dark:text-muted-foreground">{getPtDateLabel()}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="h-11 rounded-2xl bg-botao px-5 text-base font-semibold text-white shadow-[0_8px_22px_-10px_rgba(230,75,141,0.9)] hover:bg-botao/90"
          >
            <Link href="/config" className="inline-flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurar meta
            </Link>
          </Button>
          <LogoutButton />
        </div>
      </div>

      <nav className="grid grid-cols-4 gap-2 rounded-2xl bg-rosaClaro/80 p-1.5 dark:bg-secondary/80">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:gap-2 sm:px-3 sm:text-sm",
                isActive
                  ? "bg-white text-botao shadow-sm dark:bg-card dark:text-primary"
                  : "text-textoSec hover:bg-white/60 hover:text-textoPrim dark:text-muted-foreground dark:hover:bg-card/80 dark:hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
