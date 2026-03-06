import { UtensilsCrossed } from "lucide-react";

import { mealLabels, mealOrder, type Refeicao, toKcal } from "@/lib/data";

type MealRhythmCardProps = {
  totals: Record<Refeicao, number>;
  targets: Record<Refeicao, number>;
};

const tones: Record<Refeicao, string> = {
  BREAKFAST: "bg-amber-400",
  LUNCH: "bg-emerald-500",
  DINNER: "bg-botao",
  SNACKS: "bg-sky-500",
};

export function MealRhythmCard({ totals, targets }: MealRhythmCardProps) {
  return (
    <section className="rounded-[26px] border border-borda/80 bg-white/82 p-5 shadow-[0_12px_32px_-20px_rgba(230,75,141,0.75)] dark:border-border dark:bg-card/90 dark:shadow-[0_12px_32px_-20px_rgba(0,0,0,0.92)]">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rosaClaro text-botao dark:bg-secondary">
          <UtensilsCrossed className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-bold text-textoPrim dark:text-foreground">Ritmo por refeição</p>
          <p className="text-sm text-textoSec dark:text-muted-foreground">Como o dia está distribuído até agora</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {mealOrder.map((meal) => {
          const consumed = totals[meal];
          const target = Math.max(1, targets[meal]);
          const percent = Math.max(0, Math.min(100, (consumed / target) * 100));

          return (
            <div key={meal} className="rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/65">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-textoPrim dark:text-foreground">{mealLabels[meal]}</span>
                <span className="text-textoSec dark:text-muted-foreground">
                  {toKcal(consumed)} / {toKcal(target)} kcal
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white dark:bg-card">
                <div className={`${tones[meal]} h-full rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
