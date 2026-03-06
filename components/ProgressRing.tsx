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
  const statusLabel = progresso >= 100 ? "meta batida" : progresso >= 75 ? "reta final" : "hoje";

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-borda/75 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,rgba(252,231,241,0.88)_58%,rgba(247,203,224,0.78)_100%)] p-5 shadow-[0_12px_28px_-18px_rgba(230,75,141,0.75)] dark:border-border dark:bg-[linear-gradient(145deg,rgba(43,27,46,0.96)_0%,rgba(58,34,61,0.92)_58%,rgba(66,39,61,0.88)_100%)] dark:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.92)]">
      <div className="pointer-events-none absolute -right-10 top-0 h-28 w-28 rounded-full bg-white/45 blur-2xl dark:bg-white/5" />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-textoPrim dark:text-foreground">Meta de calorias</h2>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-botao dark:bg-black/15">
          {statusLabel}
        </span>
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

        <div className="grid w-full gap-3 md:max-w-[260px]">
          <div className="rounded-2xl bg-white/72 p-3 dark:bg-black/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">Meta do dia</p>
            <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-textoPrim dark:text-foreground">
              <Target className="h-4 w-4 text-botao" />
              {toKcal(meta)} kcal
            </p>
          </div>

          <div className="rounded-2xl bg-white/72 p-3 dark:bg-black/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">Consumidas</p>
            <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-textoPrim dark:text-foreground">
              <Flame className="h-4 w-4 text-botao" />
              {toKcal(consumido)} kcal
            </p>
          </div>

          <div className="rounded-2xl bg-white/72 p-3 dark:bg-black/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">Restantes</p>
            <p className="mt-1 text-lg font-bold text-botao">{toKcal(restante)} kcal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
