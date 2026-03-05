import { Flame, Target } from "lucide-react";

import { toKcal } from "@/lib/data";

type ProgressRingProps = {
  consumido: number;
  meta: number;
};

export function ProgressRing({ consumido, meta }: ProgressRingProps) {
  const clampedMeta = Math.max(1, meta);
  const progresso = Math.max(0, Math.min(100, (consumido / clampedMeta) * 100));
  const radius = 62;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progresso / 100) * circumference;
  const restante = Math.max(meta - consumido, 0);

  return (
    <div className="rounded-[26px] border border-borda/75 bg-white/85 p-5 shadow-[0_8px_28px_-18px_rgba(230,75,141,0.65)] dark:border-border dark:bg-card/90 dark:shadow-[0_8px_28px_-18px_rgba(0,0,0,0.9)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-textoPrim dark:text-foreground">Seu progresso</h2>
        <span className="rounded-full bg-rosaClaro px-3 py-1 text-xs font-semibold text-botao dark:bg-secondary">hoje</span>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
        <svg
          width="164"
          height="164"
          viewBox="0 0 164 164"
          className="h-[150px] w-[150px] shrink-0 drop-shadow-sm md:h-[164px] md:w-[164px]"
        >
          <defs>
            <linearGradient id="rose-progress" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f79bc0" />
              <stop offset="100%" stopColor="#e64b8d" />
            </linearGradient>
          </defs>

          <circle cx="82" cy="82" r={radius} strokeWidth={stroke} className="stroke-rosaClaro fill-none" />
          <circle
            cx="82"
            cy="82"
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            className="fill-none"
            stroke="url(#rose-progress)"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 82 82)"
            style={{ transition: "stroke-dashoffset 700ms ease" }}
          />
          <text
            x="82"
            y="66"
            textAnchor="middle"
            className="fill-textoSec dark:fill-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]"
          >
            progresso
          </text>
          <text x="82" y="100" textAnchor="middle" className="fill-textoPrim dark:fill-foreground text-4xl font-black">
            {Math.round(progresso)}%
          </text>
        </svg>

        <div className="w-full space-y-3 md:max-w-[220px]">
          <div className="rounded-2xl bg-rosaClaro/70 p-3 dark:bg-secondary/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">Meta</p>
            <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-textoPrim dark:text-foreground">
              <Target className="h-4 w-4 text-botao" />
              {toKcal(meta)} kcal
            </p>
          </div>

          <div className="rounded-2xl bg-rosaClaro/70 p-3 dark:bg-secondary/70">
            <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">Consumidas</p>
            <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-textoPrim dark:text-foreground">
              <Flame className="h-4 w-4 text-botao" />
              {toKcal(consumido)} kcal
            </p>
          </div>

          <p className="text-center text-sm font-semibold text-botao">{toKcal(restante)} restantes</p>
        </div>
      </div>
    </div>
  );
}
