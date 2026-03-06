import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type MacroTargets } from "@/lib/data";

type MacrosBarProps = {
  proteina: number;
  carboidrato: number;
  gordura: number;
  targets: MacroTargets;
};

function percentage(value: number, max: number) {
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export function MacrosBar({ proteina, carboidrato, gordura, targets }: MacrosBarProps) {
  const macros = [
    {
      label: "Proteína",
      short: "Prot",
      value: proteina,
      target: targets.proteina,
      percent: percentage(proteina, targets.proteina),
      color: "bg-sucesso",
      text: "text-sucesso",
    },
    {
      label: "Carboidrato",
      short: "Carbo",
      value: carboidrato,
      target: targets.carboidrato,
      percent: percentage(carboidrato, targets.carboidrato),
      color: "bg-amber-400",
      text: "text-amber-500",
    },
    {
      label: "Gordura",
      short: "Gord",
      value: gordura,
      target: targets.gordura,
      percent: percentage(gordura, targets.gordura),
      color: "bg-botao",
      text: "text-botao",
    },
  ];

  return (
    <Card className="rounded-[26px] border-borda/75 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.88)_100%)] shadow-[0_12px_28px_-18px_rgba(230,75,141,0.7)] dark:border-border dark:bg-[linear-gradient(145deg,rgba(35,28,40,0.96)_0%,rgba(39,35,52,0.92)_100%)] dark:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.92)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-textoPrim dark:text-foreground">Macros</CardTitle>
        <p className="text-sm text-textoSec dark:text-muted-foreground">Distribuição do dia com metas personalizadas</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl bg-white/75 px-3 py-2 text-xs text-textoSec shadow-[0_8px_18px_-18px_rgba(15,23,42,0.45)] dark:bg-black/10 dark:text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-botao">
            <Sparkles className="h-3.5 w-3.5" />
            Meta do plano
          </span>{" "}
          {targets.proteina}g de proteína, {targets.carboidrato}g de carbo e {targets.gordura}g de gordura.
        </div>
        {macros.map((macro) => (
          <div key={macro.short} className="space-y-2 rounded-2xl bg-white/78 p-3 shadow-[0_8px_18px_-18px_rgba(15,23,42,0.45)] dark:bg-black/10">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-textoPrim dark:text-foreground">{macro.short}</span>
              <span className={macro.text}>{Math.round(macro.percent)}%</span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-white/75 dark:bg-muted">
              <div
                className={`${macro.color} h-full rounded-full transition-all duration-500`}
                style={{ width: `${macro.percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-textoSec dark:text-muted-foreground">{macro.label}</span>
              <span className="font-medium text-textoSec dark:text-muted-foreground">
                {macro.value.toFixed(1)}g / {macro.target}g
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
