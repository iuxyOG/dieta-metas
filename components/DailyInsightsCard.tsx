"use client";

import { AlarmClockCheck, Flame, Sparkles, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fromDateKey, mealLabels, toDateKey, toKcal, type DailyState, type Refeicao } from "@/lib/data";
import type { LogsMap } from "@/lib/tracker-api";

type DailyInsightsCardProps = {
  daily: DailyState;
  logsMap: LogsMap;
  consumed: number;
  remaining: number;
  now: Date;
};

function getStreakDays(daily: DailyState, logsMap: LogsMap) {
  let streak = 0;
  const cursor = fromDateKey(daily.dateKey);

  while (true) {
    const currentKey = toDateKey(cursor);
    const log = logsMap[currentKey];
    if (!log || log.items.length === 0) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getTopMeal(daily: DailyState) {
  const totals: Record<Refeicao, number> = {
    BREAKFAST: 0,
    LUNCH: 0,
    DINNER: 0,
    SNACKS: 0,
  };

  for (const item of daily.items) {
    totals[item.refeicao] += item.kcalPorcao * item.quantidade;
  }

  const [meal, kcal] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] as [Refeicao, number];
  if (!meal || kcal <= 0) {
    return null;
  }

  return {
    meal,
    kcal,
  };
}

function getStatus(consumed: number, meta: number, remaining: number) {
  const progress = meta > 0 ? consumed / meta : 0;

  if (progress >= 1) {
    return {
      title: "Meta batida",
      description: "Seu dia ja fechou acima da meta planejada.",
      tone: "text-emerald-600",
      pill: "bg-emerald-100 text-emerald-700",
    };
  }

  if (progress >= 0.75) {
    return {
      title: "Reta final",
      description: `Faltam ${toKcal(remaining)} kcal para fechar o dia.`,
      tone: "text-botao",
      pill: "bg-rosaClaro text-botao",
    };
  }

  if (progress >= 0.4) {
    return {
      title: "Bom ritmo",
      description: "Seu consumo esta consistente para a metade do dia.",
      tone: "text-amber-600",
      pill: "bg-amber-100 text-amber-700",
    };
  }

  return {
    title: "Dia em construcao",
    description: "As primeiras refeicoes ainda vao definir o ritmo de hoje.",
    tone: "text-sky-600",
    pill: "bg-sky-100 text-sky-700",
  };
}

function getResetCountdown(now: Date) {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);

  const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

export function DailyInsightsCard({ daily, logsMap, consumed, remaining, now }: DailyInsightsCardProps) {
  const streakDays = getStreakDays(daily, logsMap);
  const topMeal = getTopMeal(daily);
  const status = getStatus(consumed, daily.meta, remaining);
  const nextReset = getResetCountdown(now);

  return (
    <Card className="relative overflow-hidden rounded-[26px] border-borda/80 bg-[linear-gradient(140deg,rgba(255,255,255,0.96)_0%,rgba(252,231,241,0.96)_52%,rgba(247,203,224,0.9)_100%)] shadow-[0_12px_30px_-18px_rgba(230,75,141,0.75)] dark:border-border dark:bg-[linear-gradient(140deg,rgba(36,23,39,0.94)_0%,rgba(48,29,50,0.94)_52%,rgba(61,35,58,0.92)_100%)] dark:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.9)]">
      <div className="pointer-events-none absolute -right-12 top-0 h-32 w-32 rounded-full bg-white/40 blur-2xl dark:bg-white/5" />

      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="inline-flex items-center gap-2 text-lg font-bold text-textoPrim dark:text-foreground">
              <Sparkles className="h-5 w-5 text-botao" />
              Radar do dia
            </CardTitle>
            <p className="mt-1 text-sm text-textoSec dark:text-muted-foreground">
              O app vira automaticamente para o proximo dia em {nextReset}.
            </p>
          </div>

          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${status.pill}`}>
            {status.title}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-white/60 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-black/10">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-textoSec dark:text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Sequencia
            </p>
            <p className="mt-2 text-2xl font-black text-textoPrim dark:text-foreground">{streakDays} dias</p>
            <p className="mt-1 text-sm text-textoSec dark:text-muted-foreground">
              {streakDays > 0 ? "dias seguidos com consumo registrado" : "registre hoje para iniciar sua sequencia"}
            </p>
          </article>

          <article className="rounded-2xl border border-white/60 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-black/10">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-textoSec dark:text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-botao" />
              Refeicao forte
            </p>
            <p className="mt-2 text-xl font-black text-textoPrim dark:text-foreground">
              {topMeal ? mealLabels[topMeal.meal] : "Sem dados"}
            </p>
            <p className="mt-1 text-sm text-textoSec dark:text-muted-foreground">
              {topMeal ? `${toKcal(topMeal.kcal)} kcal concentradas nessa refeicao` : "adicione alimentos para analisar o dia"}
            </p>
          </article>

          <article className="rounded-2xl border border-white/60 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-black/10">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-textoSec dark:text-muted-foreground">
              <AlarmClockCheck className="h-3.5 w-3.5 text-sky-500" />
              Janela do dia
            </p>
            <p className="mt-2 text-xl font-black text-textoPrim dark:text-foreground">{nextReset}</p>
            <p className="mt-1 text-sm text-textoSec dark:text-muted-foreground">
              restante ate a virada automatica e abertura do proximo registro
            </p>
          </article>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/75 px-4 py-3 text-sm dark:border-white/10 dark:bg-black/10">
          <p className={`font-semibold ${status.tone}`}>{status.title}</p>
          <p className="mt-1 text-textoSec dark:text-muted-foreground">{status.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
