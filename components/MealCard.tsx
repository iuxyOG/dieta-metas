"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, ChevronDown, Plus, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type LoggedFood, type Refeicao, toKcal } from "@/lib/data";
import { cn } from "@/lib/utils";

type MealCardProps = {
  refeicao: Refeicao;
  titulo: string;
  items: LoggedFood[];
  onAdd: (meal: Refeicao) => void;
  onRepeatYesterday?: (meal: Refeicao) => void;
  onSaveTemplate?: (meal: Refeicao) => void;
  hasYesterday: boolean;
  onRemoveItem: (itemId: string) => void;
};

const mealColors: Record<Refeicao, string> = {
  BREAKFAST: "bg-amber-400",
  LUNCH: "bg-emerald-500",
  DINNER: "bg-botao",
  SNACKS: "bg-sky-500",
};

export function MealCard({
  refeicao,
  titulo,
  items,
  onAdd,
  onRepeatYesterday,
  onSaveTemplate,
  hasYesterday,
  onRemoveItem,
}: MealCardProps) {
  const [open, setOpen] = useState(items.length > 0);

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.kcalPorcao * item.quantidade, 0),
    [items],
  );

  return (
    <Card className="overflow-hidden rounded-2xl border-borda/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.94)_0%,rgba(252,231,241,0.88)_100%)] shadow-[0_10px_22px_-18px_rgba(230,75,141,0.85)] dark:border-border dark:bg-[linear-gradient(160deg,rgba(43,27,46,0.94)_0%,rgba(54,35,59,0.92)_100%)] dark:shadow-[0_10px_22px_-18px_rgba(0,0,0,0.9)]">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        >
          <div className="flex items-start gap-2">
            <span className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.45)]", mealColors[refeicao])} />
            <div>
              <p className="text-sm font-bold text-textoPrim dark:text-foreground">{titulo}</p>
              <p className="text-xs text-textoSec dark:text-muted-foreground">
                {toKcal(total)} kcal • {items.length} {items.length === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                onAdd(refeicao);
              }}
              className="h-8 w-8 rounded-full bg-botao text-white hover:bg-botao/90"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <ChevronDown className={cn("h-4 w-4 text-textoSec transition dark:text-muted-foreground", open && "rotate-180")} />
          </div>
        </button>

        {open && (
          <div className="border-t border-borda/60 px-4 pb-3 pt-2 dark:border-border/70">
            {items.length === 0 ? (
              <p className="rounded-xl bg-white/55 px-3 py-2 text-xs text-textoSec dark:bg-black/10 dark:text-muted-foreground">
                Nenhum item adicionado.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/70 p-2.5 dark:bg-black/10">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-textoPrim dark:text-foreground">{item.name}</p>
                      <p className="text-[11px] text-textoSec dark:text-muted-foreground">x{item.quantidade.toFixed(item.quantidade % 1 === 0 ? 0 : 1)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-textoSec dark:text-muted-foreground">{toKcal(item.kcalPorcao * item.quantidade)} kcal</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 rounded-lg text-textoSec hover:bg-white dark:text-muted-foreground dark:hover:bg-card"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {(hasYesterday && onRepeatYesterday) || (items.length > 0 && onSaveTemplate) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {hasYesterday && onRepeatYesterday ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-xl px-2 text-xs font-medium text-botao hover:bg-rosaClaro"
                    onClick={() => onRepeatYesterday(refeicao)}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Repetir ontem
                  </Button>
                ) : null}

                {items.length > 0 && onSaveTemplate ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-xl px-2 text-xs font-medium text-botao hover:bg-rosaClaro"
                    onClick={() => onSaveTemplate(refeicao)}
                  >
                    <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
                    Salvar modelo
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
