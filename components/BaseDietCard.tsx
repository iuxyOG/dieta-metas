"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_META_KCAL, dietaBase2500, type DietBaseGroup, type DietBaseOption } from "@/lib/data";
import { toKcal } from "@/lib/data";

type BaseDietCardProps = {
  onApplyOption: (option: DietBaseOption) => void;
  onSetDefaultMeta: () => void;
};

export function BaseDietCard({ onApplyOption, onSetDefaultMeta }: BaseDietCardProps) {
  const [activeGroupId, setActiveGroupId] = useState<string>(dietaBase2500.groups[0]?.id ?? "");

  const activeGroup = useMemo<DietBaseGroup | undefined>(
    () => dietaBase2500.groups.find((group) => group.id === activeGroupId),
    [activeGroupId],
  );

  if (!activeGroup) {
    return null;
  }

  return (
    <Card className="rounded-[26px] border-borda/80 bg-white/85 shadow-[0_10px_32px_-20px_rgba(230,75,141,0.75)] dark:border-border dark:bg-card/90 dark:shadow-[0_10px_32px_-20px_rgba(0,0,0,0.9)]">
      <CardHeader className="space-y-2 pb-2 sm:space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="inline-flex items-center gap-2 text-lg font-bold text-textoPrim dark:text-foreground">
              <Sparkles className="h-5 w-5 text-botao" />
              Dieta base {toKcal(dietaBase2500.meta)} kcal
            </CardTitle>
            <p className="mt-0.5 text-sm text-textoSec dark:text-muted-foreground">Use as opções prontas para montar o dia mais rápido.</p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-9 w-full rounded-xl border-borda bg-white text-sm font-semibold text-botao hover:bg-rosaClaro dark:border-border dark:bg-card dark:hover:bg-secondary sm:w-auto"
            onClick={onSetDefaultMeta}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Definir meta {DEFAULT_META_KCAL}
          </Button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {dietaBase2500.groups.map((group) => {
            const isActive = group.id === activeGroupId;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroupId(group.id)}
                className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-botao text-white"
                    : "bg-rosaClaro text-textoSec hover:bg-rosa dark:bg-secondary dark:text-muted-foreground dark:hover:bg-secondary/80"
                }`}
              >
                {group.horario} • {group.title}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 pt-0">
        {activeGroup.note ? (
          <p className="rounded-xl bg-rosaClaro/70 px-3 py-2 text-xs font-medium text-textoSec dark:bg-secondary/70 dark:text-muted-foreground">{activeGroup.note}</p>
        ) : null}

        <div className="grid gap-2 md:grid-cols-2">
          {activeGroup.options.map((option) => (
            <article key={option.id} className="rounded-2xl border border-borda/70 bg-white p-2.5 dark:border-border dark:bg-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-textoPrim dark:text-foreground">{option.title}</p>
                  <p className="text-xs font-medium text-textoSec dark:text-muted-foreground">
                    {option.horario} • {toKcal(option.kcal)} kcal
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-xl bg-botao px-2 text-xs text-white hover:bg-botao/90"
                  onClick={() => onApplyOption(option)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              <ul className="mt-1.5 space-y-0.5 text-xs text-textoSec dark:text-muted-foreground">
                {option.description.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>

              <p className="mt-1.5 text-[11px] font-medium text-textoSec dark:text-muted-foreground">
                Aproximado: P {option.proteina}g • C {option.carboidrato}g • G {option.gordura}g
              </p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
