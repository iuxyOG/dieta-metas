import { Droplets, Flame, Scale, Sparkles, Target, TrendingUp } from "lucide-react";

import {
  getGoalTypeDescription,
  goalTypeLabels,
  type DailyCheckInRecord,
  type PersonalProfile,
  toKcal,
} from "@/lib/data";
import type { WeightEntryRecord } from "@/lib/tracker-api";

type PersonalPlanCardProps = {
  profile: PersonalProfile;
  consumed: number;
  meta: number;
  remaining: number;
  todayCheckIn: DailyCheckInRecord | null;
  latestWeight: WeightEntryRecord | null;
  firstWeight: WeightEntryRecord | null;
};

function weightProgress(current: number, start: number, target: number) {
  const total = Math.abs(start - target);
  if (total < 0.1) {
    return 100;
  }

  const done = Math.abs(start - current);
  return Math.max(0, Math.min(100, (done / total) * 100));
}

export function PersonalPlanCard({
  profile,
  consumed,
  meta,
  remaining,
  todayCheckIn,
  latestWeight,
  firstWeight,
}: PersonalPlanCardProps) {
  const hydrationPercent = Math.max(
    0,
    Math.min(100, ((todayCheckIn?.waterGlasses ?? 0) / Math.max(1, profile.dailyWaterGoal)) * 100),
  );
  const weightPct =
    latestWeight && firstWeight && profile.targetWeight
      ? weightProgress(latestWeight.weight, firstWeight.weight, profile.targetWeight)
      : null;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,rgba(253,238,245,0.94)_45%,rgba(245,219,232,0.82)_100%)] p-5 shadow-[0_18px_50px_-28px_rgba(230,75,141,0.82)] dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(43,27,46,0.96)_0%,rgba(57,34,60,0.95)_45%,rgba(67,39,61,0.9)_100%)] dark:shadow-[0_18px_50px_-28px_rgba(0,0,0,0.94)]">
      <div className="pointer-events-none absolute -right-12 top-0 h-36 w-36 rounded-full bg-white/55 blur-3xl dark:bg-white/5" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[#e64b8d]/20 blur-3xl dark:bg-primary/10" />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center rounded-full bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-botao dark:bg-white/10 dark:text-primary">
              meu plano
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-textoPrim dark:text-foreground">
              {goalTypeLabels[profile.goalType]}
            </h2>
            <p className="mt-1 text-sm text-textoSec dark:text-muted-foreground">{getGoalTypeDescription(profile.goalType)}</p>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-3 lg:max-w-[360px]">
            <div className="rounded-2xl bg-white/72 p-3 dark:bg-black/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-textoSec dark:text-muted-foreground">Consumidas</p>
              <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-textoPrim dark:text-foreground">
                <Flame className="h-4 w-4 text-botao" />
                {toKcal(consumed)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/72 p-3 dark:bg-black/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-textoSec dark:text-muted-foreground">Restantes</p>
              <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-textoPrim dark:text-foreground">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                {toKcal(remaining)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/72 p-3 dark:bg-black/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-textoSec dark:text-muted-foreground">Água</p>
              <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-textoPrim dark:text-foreground">
                <Droplets className="h-4 w-4 text-sky-500" />
                {todayCheckIn?.waterGlasses ?? 0}/{profile.dailyWaterGoal}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-white/65 bg-white/58 p-4 backdrop-blur dark:border-white/10 dark:bg-black/10">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-textoPrim dark:text-foreground">Meta do ciclo</p>
              <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-botao dark:bg-white/10">
                {toKcal(meta)} kcal
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/70 p-3 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-textoSec dark:text-muted-foreground">Peso atual</p>
                <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-textoPrim dark:text-foreground">
                  <Scale className="h-4 w-4 text-botao" />
                  {latestWeight ? `${latestWeight.weight.toFixed(1)} kg` : "sem dado"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-textoSec dark:text-muted-foreground">Peso alvo</p>
                <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-textoPrim dark:text-foreground">
                  <Target className="h-4 w-4 text-botao" />
                  {profile.targetWeight ? `${profile.targetWeight.toFixed(1)} kg` : "definir"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-textoSec dark:text-muted-foreground">Ritmo semanal</p>
                <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-textoPrim dark:text-foreground">
                  <TrendingUp className="h-4 w-4 text-sky-500" />
                  {profile.weeklyPace ? `${profile.weeklyPace.toFixed(2)} kg` : "livre"}
                </p>
              </div>
            </div>

            {weightPct !== null ? (
              <div className="mt-4 rounded-2xl bg-white/72 p-3 dark:bg-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-textoPrim dark:text-foreground">Avanço até o peso alvo</span>
                  <span className="font-semibold text-botao">{Math.round(weightPct)}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white dark:bg-white/10">
                  <div className="h-full rounded-full bg-botao transition-all duration-500" style={{ width: `${weightPct}%` }} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-white/65 bg-[#351f2f]/95 p-4 text-white shadow-[0_14px_30px_-22px_rgba(53,31,47,0.9)] dark:border-white/10 dark:bg-[#251923]/92">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">foco da rotina</p>
            <p className="mt-3 text-lg font-bold leading-snug">{profile.focus ?? "Defina um foco em Config para guiar as escolhas do dia."}</p>
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/75">Hidratação do dia</span>
                <span className="font-semibold">{Math.round(hydrationPercent)}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-sky-400 transition-all duration-500" style={{ width: `${hydrationPercent}%` }} />
              </div>
              <p className="mt-3 text-sm text-white/75">
                {profile.targetDate ? `Meta com horizonte em ${profile.targetDate.split("-").reverse().join("/")}.` : "Defina uma data-alvo para acompanhar o ciclo."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
