"use client";

import { Bookmark, CopyPlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mealLabels, toKcal, type MealTemplateRecord } from "@/lib/data";

type MealTemplatesCardProps = {
  templates: MealTemplateRecord[];
  onApplyTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
};

export function MealTemplatesCard({ templates, onApplyTemplate, onDeleteTemplate }: MealTemplatesCardProps) {
  return (
    <Card className="rounded-[26px] border-borda/80 bg-white/85 shadow-[0_10px_32px_-20px_rgba(230,75,141,0.72)] dark:border-border dark:bg-card/90 dark:shadow-[0_10px_32px_-20px_rgba(0,0,0,0.9)]">
      <CardHeader className="pb-3">
        <CardTitle className="inline-flex items-center gap-2 text-lg font-bold text-textoPrim dark:text-foreground">
          <Bookmark className="h-5 w-5 text-botao" />
          Modelos salvos
        </CardTitle>
        <p className="text-sm text-textoSec dark:text-muted-foreground">
          Guarde refeições que você repete e reaplique em um toque.
        </p>
      </CardHeader>

      <CardContent>
        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-borda/80 bg-rosaClaro/45 px-4 py-6 text-sm text-textoSec dark:border-border dark:bg-secondary/45 dark:text-muted-foreground">
            Salve uma refeição montada para criar seu primeiro modelo reutilizável.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => {
              const totalKcal = template.items.reduce((acc, item) => acc + item.kcalPorcao * item.quantidade, 0);

              return (
                <article
                  key={template.id}
                  className="rounded-2xl border border-borda/70 bg-[linear-gradient(150deg,rgba(255,255,255,0.95)_0%,rgba(252,231,241,0.9)_100%)] p-3 shadow-[0_8px_20px_-18px_rgba(230,75,141,0.9)] dark:border-border dark:bg-[linear-gradient(150deg,rgba(41,24,44,0.95)_0%,rgba(54,32,58,0.92)_100%)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-textoPrim dark:text-foreground">{template.name}</p>
                      <p className="mt-1 text-xs text-textoSec dark:text-muted-foreground">
                        {mealLabels[template.refeicao]} • {template.items.length} itens • {toKcal(totalKcal)} kcal
                      </p>
                    </div>

                    <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-botao dark:bg-black/20">
                      modelo
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-xs text-textoSec dark:text-muted-foreground">
                    {template.items.slice(0, 3).map((item) => (
                      <li key={`${template.id}-${item.foodId}-${item.name}`} className="truncate">
                        {item.quantidade.toFixed(item.quantidade % 1 === 0 ? 0 : 1)}x {item.name}
                      </li>
                    ))}
                    {template.items.length > 3 ? <li>+ {template.items.length - 3} itens</li> : null}
                  </ul>

                  <div className="mt-4 flex gap-2">
                    <Button
                      type="button"
                      className="h-9 flex-1 rounded-xl bg-botao text-white hover:bg-botao/90"
                      onClick={() => onApplyTemplate(template.id)}
                    >
                      <CopyPlus className="mr-1.5 h-4 w-4" />
                      Usar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl border-borda bg-white/80 text-red-600 hover:bg-red-50 dark:border-border dark:bg-card dark:hover:bg-secondary"
                      onClick={() => onDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
