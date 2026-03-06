"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
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

type HeaderAction = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type HeaderProps = {
  profileName?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  showDate?: boolean;
  primaryAction?: HeaderAction;
  secondarySlot?: ReactNode;
  showDesktopNav?: boolean;
};

export function Header({
  profileName = "Jhullya Isabela",
  eyebrow = "rotina pessoal",
  title,
  description,
  showDate = true,
  primaryAction,
  secondarySlot,
  showDesktopNav = true,
}: HeaderProps) {
  const pathname = usePathname();
  const firstName = profileName.trim().split(/\s+/)[0] || profileName;
  const heroTitle = title ?? `Bem-vinda, ${firstName}`;

  return (
    <header className="relative overflow-hidden rounded-[30px] border border-white/65 bg-[linear-gradient(145deg,rgba(255,255,255,0.92)_0%,rgba(253,238,245,0.9)_46%,rgba(247,203,224,0.72)_100%)] p-4 shadow-[0_18px_50px_-28px_rgba(230,75,141,0.82)] backdrop-blur dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(40,25,43,0.96)_0%,rgba(55,33,59,0.94)_52%,rgba(65,37,58,0.9)_100%)] dark:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.92)] md:p-6">
      <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-white/50 blur-3xl dark:bg-white/5" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-[#f79bc0]/25 blur-3xl dark:bg-primary/10" />

      <div className="relative flex flex-col gap-4 md:gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-botao dark:bg-white/10 dark:text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-[1.85rem] font-black leading-tight tracking-tight text-textoPrim dark:text-foreground md:text-[2.55rem]">
              {heroTitle}
              {!title ? <span className="ml-2 text-botao">♥</span> : null}
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-textoSec dark:text-muted-foreground">
              {description ?? "Seu espaço pessoal para cuidar da rotina, das metas e das refeições do dia."}
            </p>
            {showDate ? (
              <p className="mt-2 text-sm font-semibold capitalize text-textoPrim/75 dark:text-foreground/75">{getPtDateLabel()}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {primaryAction ? (
              <Button
                asChild
                className="h-11 rounded-2xl bg-botao px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(230,75,141,0.9)] hover:bg-botao/90"
              >
                <Link href={primaryAction.href} className="inline-flex items-center gap-2">
                  <primaryAction.icon className="h-4 w-4" />
                  {primaryAction.label}
                </Link>
              </Button>
            ) : null}
            {secondarySlot}
            <LogoutButton />
          </div>
        </div>

        {showDesktopNav ? (
          <nav className="hidden grid-cols-4 gap-2 rounded-2xl border border-white/45 bg-white/55 p-1.5 backdrop-blur dark:border-white/10 dark:bg-black/10 md:grid">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-white text-botao shadow-sm dark:bg-card dark:text-primary"
                      : "text-textoSec hover:bg-white/70 hover:text-textoPrim dark:text-muted-foreground dark:hover:bg-card/80 dark:hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
