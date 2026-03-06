"use client";

import { useMemo } from "react";
import { ClipboardList, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ShoppingListItem = {
  id: string;
  name: string;
  categoryLabel?: string | null;
  porcao: string;
  quantidade: number;
  occurrences: number;
};

type ShoppingListCardProps = {
  title?: string;
  description?: string;
  items: ShoppingListItem[];
};

function formatQuantity(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

export function ShoppingListCard({
  title = "Lista de compras",
  description = "Gerada automaticamente a partir do seu plano semanal.",
  items,
}: ShoppingListCardProps) {
  const clipboardText = useMemo(
    () =>
      items
        .map(
          (item) =>
            `${item.name} - ${formatQuantity(item.quantidade)}x ${item.porcao}${item.categoryLabel ? ` (${item.categoryLabel})` : ""}`,
        )
        .join("\n"),
    [items],
  );

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(clipboardText);
    } catch {}
  };

  return (
    <Card className="rounded-[26px] border-borda/80 bg-white/85 shadow-[0_10px_32px_-20px_rgba(230,75,141,0.72)] dark:border-border dark:bg-card/90 dark:shadow-[0_10px_32px_-20px_rgba(0,0,0,0.9)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="inline-flex items-center gap-2 text-lg font-bold text-textoPrim dark:text-foreground">
              <ClipboardList className="h-5 w-5 text-botao" />
              {title}
            </CardTitle>
            <p className="mt-1 text-sm text-textoSec dark:text-muted-foreground">{description}</p>
          </div>
          {items.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-borda bg-white/80 text-textoPrim hover:bg-rosaClaro dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-secondary"
              onClick={() => void copyList()}
            >
              <Copy className="mr-1.5 h-4 w-4" />
              Copiar
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-borda/80 bg-rosaClaro/45 px-4 py-5 text-sm text-textoSec dark:border-border dark:bg-secondary/45 dark:text-muted-foreground">
            Monte um plano semanal com modelos salvos para gerar a lista automaticamente.
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-borda/70 bg-white/70 px-3 py-3 text-sm dark:border-border dark:bg-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-textoPrim dark:text-foreground">{item.name}</p>
                    <p className="mt-1 text-xs text-textoSec dark:text-muted-foreground">
                      {formatQuantity(item.quantidade)}x {item.porcao}
                    </p>
                  </div>
                  {item.categoryLabel ? (
                    <span className="rounded-full bg-rosaClaro px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-botao dark:bg-secondary dark:text-primary">
                      {item.categoryLabel}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-textoSec dark:text-muted-foreground">
                  Aparece em {item.occurrences} {item.occurrences === 1 ? "refeição" : "refeições"} da semana.
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
