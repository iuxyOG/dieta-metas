import { BrainCircuit } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeekdayLabel, type DailyCheckInRecord, type MacroTargets } from "@/lib/data";
import type { LogsMap } from "@/lib/tracker-api";

type SmartInsightsCardProps = {
  checkIns: DailyCheckInRecord[];
  logsMap: LogsMap;
  waterGoal: number;
  macroTargets: MacroTargets;
  proteinConsumedToday: number;
};

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function consumedOfDay(log?: LogsMap[string]) {
  if (!log) {
    return 0;
  }

  return log.items.reduce((acc, item) => acc + item.kcalPorcao * item.quantidade, 0);
}

export function SmartInsightsCard({
  checkIns,
  logsMap,
  waterGoal,
  macroTargets,
  proteinConsumedToday,
}: SmartInsightsCardProps) {
  const recentCheckIns = checkIns.slice(-14);
  const lowSleepDays = recentCheckIns.filter((entry) => entry.sleepHours > 0 && entry.sleepHours < 6);
  const highSleepDays = recentCheckIns.filter((entry) => entry.sleepHours >= 7);
  const hydratedDays = recentCheckIns.filter((entry) => entry.waterGlasses >= waterGoal);
  const dryDays = recentCheckIns.filter((entry) => entry.waterGlasses < waterGoal);

  const weekdayBuckets = new Map<number, number[]>();
  Object.values(logsMap)
    .slice(-21)
    .forEach((log) => {
      const weekday = new Date(`${log.dateKey}T12:00:00`).getDay();
      const list = weekdayBuckets.get(weekday) ?? [];
      list.push(consumedOfDay(log));
      weekdayBuckets.set(weekday, list);
    });

  const topWeekday = Array.from(weekdayBuckets.entries())
    .map(([weekday, totals]) => ({
      weekday,
      average: average(totals),
    }))
    .sort((a, b) => b.average - a.average)[0];

  const insights = [
    lowSleepDays.length > 0 && highSleepDays.length > 0
      ? `Nos dias com menos de 6h de sono, sua fome média foi ${average(lowSleepDays.map((entry) => entry.hunger)).toFixed(1)}/5 contra ${average(highSleepDays.map((entry) => entry.hunger)).toFixed(1)}/5 quando você dormiu bem.`
      : lowSleepDays.length > 0
        ? `Nos dias com menos de 6h de sono, sua fome média foi ${average(lowSleepDays.map((entry) => entry.hunger)).toFixed(1)}/5.`
      : "Preencha mais check-ins de sono para cruzar com a fome e refinar o plano.",
    hydratedDays.length > 0 && dryDays.length > 0
      ? `Quando você bate a água, sua energia média sobe para ${average(hydratedDays.map((entry) => entry.energy)).toFixed(1)}/5 contra ${average(dryDays.map((entry) => entry.energy)).toFixed(1)}/5 nos dias abaixo da meta.`
      : "Ainda faltam dias suficientes acima e abaixo da meta de água para comparar energia.",
    topWeekday
      ? `Seu maior consumo médio recente cai em ${getWeekdayLabel(topWeekday.weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6)}.`
      : "Registre mais dias para descobrir qual dia da semana mais pesa no plano.",
    proteinConsumedToday < macroTargets.proteina
      ? `Hoje ainda faltam ${Math.max(0, Math.round(macroTargets.proteina - proteinConsumedToday))}g de proteína para bater a meta do plano.`
      : "Sua proteína de hoje já encostou ou passou da meta planejada.",
  ];

  return (
    <Card className="rounded-[26px] border-borda/80 bg-white/85 shadow-[0_10px_32px_-20px_rgba(230,75,141,0.72)] dark:border-border dark:bg-card/90 dark:shadow-[0_10px_32px_-20px_rgba(0,0,0,0.9)]">
      <CardHeader className="pb-3">
        <CardTitle className="inline-flex items-center gap-2 text-lg font-bold text-textoPrim dark:text-foreground">
          <BrainCircuit className="h-5 w-5 text-botao" />
          Leituras da rotina
        </CardTitle>
        <p className="text-sm text-textoSec dark:text-muted-foreground">
          Cruzando consumo, água, sono e sensação para guiar ajustes práticos.
        </p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {insights.map((insight) => (
          <div
            key={insight}
            className="rounded-2xl border border-borda/70 bg-rosaClaro/45 px-3 py-3 text-sm text-textoPrim dark:border-border dark:bg-secondary/55 dark:text-foreground"
          >
            {insight}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
