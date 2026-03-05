import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MacrosBarProps = {
  proteina: number;
  carboidrato: number;
  gordura: number;
};

const macroTargets = {
  proteina: 110,
  carboidrato: 250,
  gordura: 80,
};

function percentage(value: number, max: number) {
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export function MacrosBar({ proteina, carboidrato, gordura }: MacrosBarProps) {
  const macros = [
    {
      label: "Proteína",
      short: "Prot",
      value: proteina,
      target: macroTargets.proteina,
      percent: percentage(proteina, macroTargets.proteina),
      color: "bg-sucesso",
      text: "text-sucesso",
    },
    {
      label: "Carboidrato",
      short: "Carbo",
      value: carboidrato,
      target: macroTargets.carboidrato,
      percent: percentage(carboidrato, macroTargets.carboidrato),
      color: "bg-amber-400",
      text: "text-amber-500",
    },
    {
      label: "Gordura",
      short: "Gord",
      value: gordura,
      target: macroTargets.gordura,
      percent: percentage(gordura, macroTargets.gordura),
      color: "bg-botao",
      text: "text-botao",
    },
  ];

  return (
    <Card className="rounded-[26px] border-borda/75 bg-white/85 shadow-[0_8px_28px_-18px_rgba(230,75,141,0.65)] dark:border-border dark:bg-card/90 dark:shadow-[0_8px_28px_-18px_rgba(0,0,0,0.9)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-textoPrim dark:text-foreground">Macros</CardTitle>
        <p className="text-sm text-textoSec dark:text-muted-foreground">Distribuição do dia</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {macros.map((macro) => (
          <div key={macro.short} className="space-y-2 rounded-2xl bg-rosaClaro/60 p-3 dark:bg-secondary/70">
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
