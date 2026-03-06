"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, Plus, Sparkles, Target } from "lucide-react";

import { BaseDietCard } from "@/components/BaseDietCard";
import { FoodModal } from "@/components/FoodModal";
import { Header } from "@/components/Header";
import { MacrosBar } from "@/components/MacrosBar";
import { MealCard } from "@/components/MealCard";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildInitialFoods,
  buildStarterDay,
  DEFAULT_META_KCAL,
  type DietBaseOption,
  mealLabels,
  mealOrder,
  toDateKey,
  type DailyState,
  type FoodRecord,
  type LoggedFood,
  type Refeicao,
} from "@/lib/data";
import { fetchTrackerSnapshot, patchTracker, type LogsMap } from "@/lib/tracker-api";

const RECENT_STORAGE_KEY = "calorias.recent.v1";

function parseRecentIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function HomePage() {
  const [foods, setFoods] = useState<FoodRecord[]>(buildInitialFoods());
  const [logsMap, setLogsMap] = useState<LogsMap>({});
  const [daily, setDaily] = useState<DailyState | null>(null);
  const [yesterdayItems, setYesterdayItems] = useState<LoggedFood[]>([]);
  const [recentFoodIds, setRecentFoodIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Refeicao>("BREAKFAST");
  const [trackerError, setTrackerError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTracker = async () => {
      const todayKey = toDateKey();
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayKey = toDateKey(yesterdayDate);

      const snapshot = await fetchTrackerSnapshot();
      const maybeToday = snapshot.logs[todayKey];
      const todayState = maybeToday ?? buildStarterDay(todayKey, snapshot.meta);
      const nextLogs = { ...snapshot.logs, [todayKey]: todayState };

      if (!maybeToday) {
        void patchTracker({ daily: todayState }).then((ok) => {
          if (!ok) {
            setTrackerError("Nao foi possivel inicializar o dia atual no banco de dados.");
          }
        });
      }

      if (!active) {
        return;
      }

      setLogsMap(nextLogs);
      setDaily(todayState);
      setYesterdayItems(snapshot.logs[yesterdayKey]?.items ?? []);
      setRecentFoodIds(parseRecentIds());
      setTrackerError(null);
    };

    void loadTracker().catch(() => {
      if (!active) {
        return;
      }

      const fallback = buildStarterDay(toDateKey(), DEFAULT_META_KCAL);
      setDaily(fallback);
      setLogsMap({ [fallback.dateKey]: fallback });
      setYesterdayItems([]);
      setRecentFoodIds(parseRecentIds());
      setTrackerError("Os dados do banco não puderam ser carregados agora.");
    });

    void fetch("/api/foods")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Falha ao carregar alimentos"))))
      .then((result: unknown) => {
        if (!Array.isArray(result)) {
          return;
        }

        const parsed = result.filter((item): item is FoodRecord => {
          if (!item || typeof item !== "object") {
            return false;
          }

          const food = item as Record<string, unknown>;
          return (
            typeof food.id === "string" &&
            typeof food.name === "string" &&
            typeof food.porcao === "string" &&
            typeof food.kcalPorcao === "number"
          );
        });

        if (parsed.length > 0) {
          setFoods(parsed);
          setTrackerError(null);
        }
      })
      .catch(() => {
        setFoods(buildInitialFoods());
        setTrackerError(
          (current) =>
            current ?? "A lista exibida esta apenas em modo local temporario. Novos dados nao serao persistidos enquanto o banco nao responder.",
        );
      });

    return () => {
      active = false;
    };
  }, []);

  const updateDaily = (updater: (prev: DailyState) => DailyState) => {
    setDaily((prev) => {
      if (!prev) {
        return prev;
      }

      const next = updater(prev);
      setLogsMap((current) => ({ ...current, [next.dateKey]: next }));
      void patchTracker({ daily: next }).then((ok) => {
        setTrackerError(ok ? null : "Nao foi possivel salvar esta refeicao no banco de dados.");
      });
      return next;
    });
  };

  const addRecent = (foodId: string) => {
    setRecentFoodIds((prev) => {
      const next = [foodId, ...prev.filter((id) => id !== foodId)].slice(0, 30);
      window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const addFoodToMeal = (meal: Refeicao, food: FoodRecord, quantidade: number) => {
    updateDaily((prev) => {
      const normalizedQuantity = Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1;
      const entry: LoggedFood = {
        id: crypto.randomUUID(),
        foodId: food.id,
        name: food.name,
        porcao: food.porcao,
        kcalPorcao: food.kcalPorcao,
        proteina: (food.proteina ?? 0) * normalizedQuantity,
        carboidrato: (food.carboidrato ?? 0) * normalizedQuantity,
        gordura: (food.gordura ?? 0) * normalizedQuantity,
        quantidade: Number(normalizedQuantity.toFixed(2)),
        refeicao: meal,
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        items: [...prev.items, entry],
      };
    });

    addRecent(food.id);
  };

  const removeItemFromMeal = (itemId: string) => {
    updateDaily((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const applyDietOption = (option: DietBaseOption) => {
    updateDaily((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          foodId: `dieta-base-${option.id}`,
          name: `${option.horario} • ${option.title}`,
          porcao: "1 refeição",
          kcalPorcao: option.kcal,
          proteina: option.proteina,
          carboidrato: option.carboidrato,
          gordura: option.gordura,
          quantidade: 1,
          refeicao: option.refeicao,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const applyDefaultGoal = () => {
    void patchTracker({ meta: DEFAULT_META_KCAL }).then((ok) => {
      setTrackerError(ok ? null : "Nao foi possivel salvar a meta diaria no banco de dados.");
    });
    updateDaily((prev) => ({
      ...prev,
      meta: DEFAULT_META_KCAL,
    }));
  };

  const repeatYesterdayMeal = (meal: Refeicao) => {
    const todayDate = new Date();
    todayDate.setDate(todayDate.getDate() - 1);
    const yesterdayKey = toDateKey(todayDate);
    const toClone = (logsMap[yesterdayKey]?.items ?? yesterdayItems).filter((item) => item.refeicao === meal);
    if (toClone.length === 0) {
      return;
    }

    updateDaily((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        ...toClone.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        })),
      ],
    }));
  };

  const byMeal = useMemo(() => {
    const grouped: Record<Refeicao, LoggedFood[]> = {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: [],
      SNACKS: [],
    };

    for (const item of daily?.items ?? []) {
      grouped[item.refeicao].push(item);
    }

    return grouped;
  }, [daily]);

  const consumed = useMemo(
    () => (daily?.items ?? []).reduce((acc, item) => acc + item.kcalPorcao * item.quantidade, 0),
    [daily],
  );

  const macroTotals = useMemo(() => {
    return (daily?.items ?? []).reduce(
      (acc, item) => {
        acc.proteina += item.proteina;
        acc.carboidrato += item.carboidrato;
        acc.gordura += item.gordura;
        return acc;
      },
      { proteina: 0, carboidrato: 0, gordura: 0 },
    );
  }, [daily]);

  const recentFoods = useMemo(() => {
    const map = new Map(foods.map((food) => [food.id, food]));
    return recentFoodIds.map((id) => map.get(id)).filter((food): food is FoodRecord => Boolean(food));
  }, [foods, recentFoodIds]);

  const remaining = useMemo(() => Math.max((daily?.meta ?? 0) - consumed, 0), [daily?.meta, consumed]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Consumidas",
        value: Math.round(consumed).toLocaleString("pt-BR"),
        suffix: "kcal",
        icon: Flame,
        color: "text-botao",
      },
      {
        label: "Restantes",
        value: Math.round(remaining).toLocaleString("pt-BR"),
        suffix: "kcal",
        icon: Sparkles,
        color: "text-emerald-600",
      },
      {
        label: "Meta",
        value: Math.round(daily?.meta ?? DEFAULT_META_KCAL).toLocaleString("pt-BR"),
        suffix: "kcal",
        icon: Target,
        color: "text-textoPrim",
      },
    ],
    [consumed, daily?.meta, remaining],
  );

  if (!daily) {
    return <main className="min-h-screen p-4" />;
  }

  return (
    <main className="relative mx-auto w-full max-w-6xl space-y-3 p-2.5 pb-28 sm:space-y-4 sm:p-4 md:space-y-5 md:p-6">
      <div className="animate-enter-1">
        <Header />
      </div>

      {trackerError ? (
        <section className="animate-enter-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {trackerError}
        </section>
      ) : null}

      <section className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className={`animate-enter-${Math.min(index + 2, 4)} rounded-2xl border border-borda/70 bg-white/80 px-3 py-2.5 shadow-[0_8px_24px_-20px_rgba(230,75,141,0.8)] dark:border-border dark:bg-card/90 dark:shadow-[0_8px_24px_-20px_rgba(0,0,0,0.9)]`}
            >
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-textoSec dark:text-muted-foreground">{card.label}</p>
                  <p className="mt-1 flex items-end gap-1.5 text-[2rem] font-black leading-none text-textoPrim dark:text-foreground">
                    {card.value}
                    <span className="pb-0.5 text-[11px] font-semibold text-textoSec dark:text-muted-foreground">{card.suffix}</span>
                  </p>
                </div>
                <span className="mb-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rosaClaro/80 dark:bg-secondary">
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="animate-enter-3">
        <BaseDietCard onApplyOption={applyDietOption} onSetDefaultMeta={applyDefaultGoal} />
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="animate-enter-3">
          <ProgressRing consumido={consumed} meta={daily.meta} />
        </div>
        <div className="animate-enter-4">
          <MacrosBar
            proteina={macroTotals.proteina}
            carboidrato={macroTotals.carboidrato}
            gordura={macroTotals.gordura}
          />
        </div>
      </section>

      <section className="animate-enter-4">
        <Card className="rounded-[26px] border-borda/80 bg-white/85 shadow-[0_10px_32px_-20px_rgba(230,75,141,0.75)] dark:border-border dark:bg-card/90 dark:shadow-[0_10px_32px_-20px_rgba(0,0,0,0.9)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-textoPrim dark:text-foreground">Refeições</CardTitle>
            <p className="text-sm text-textoSec dark:text-muted-foreground">Toque em + para adicionar rapidamente</p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {mealOrder.map((meal) => (
              <MealCard
                key={meal}
                refeicao={meal}
                titulo={mealLabels[meal]}
                items={byMeal[meal]}
                hasYesterday={yesterdayItems.some((item) => item.refeicao === meal)}
                onAdd={(mealType) => {
                  setSelectedMeal(mealType);
                  setModalOpen(true);
                }}
                onRepeatYesterday={repeatYesterdayMeal}
                onRemoveItem={removeItemFromMeal}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      <Button
        type="button"
        className="fixed bottom-3 right-3 z-30 h-11 rounded-full bg-botao px-4 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(230,75,141,0.95)] hover:bg-botao/90 md:bottom-4 md:right-4 md:h-12 md:px-5"
        onClick={() => {
          setSelectedMeal("SNACKS");
          setModalOpen(true);
        }}
      >
        <Plus className="mr-1 h-4 w-4" />
        Adicionar agora
      </Button>

      <FoodModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        meal={selectedMeal}
        foods={foods}
        recentFoods={recentFoods}
        onAddFood={addFoodToMeal}
      />
    </main>
  );
}
