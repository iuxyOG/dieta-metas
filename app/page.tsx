"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Flame, HeartPulse, LayoutDashboard, Plus, Settings, Sparkles, type LucideIcon, UtensilsCrossed } from "lucide-react";

import { BaseDietCard } from "@/components/BaseDietCard";
import { DailyCheckInCard } from "@/components/DailyCheckInCard";
import { DailyInsightsCard } from "@/components/DailyInsightsCard";
import { FoodModal } from "@/components/FoodModal";
import { Header } from "@/components/Header";
import { MacrosBar } from "@/components/MacrosBar";
import { MealCard } from "@/components/MealCard";
import { MealRhythmCard } from "@/components/MealRhythmCard";
import { MealTemplatesCard } from "@/components/MealTemplatesCard";
import { PersonalPlanCard } from "@/components/PersonalPlanCard";
import { ProgressRing } from "@/components/ProgressRing";
import { ShoppingListCard, type ShoppingListItem } from "@/components/ShoppingListCard";
import { SmartInsightsCard } from "@/components/SmartInsightsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildDefaultDailyCheckIn,
  buildInitialFoods,
  buildRecommendedMacroTargets,
  buildStarterDay,
  DEFAULT_META_KCAL,
  DEFAULT_PROFILE,
  getFoodCategoryLabel,
  getMealTargetKcal,
  goalTypeLabels,
  type MacroTargets,
  type DailyCheckInRecord,
  type MealTemplateRecord,
  type DietBaseOption,
  mealLabels,
  mealOrder,
  toDateKey,
  type DailyState,
  type FoodRecord,
  type LoggedFood,
  type PersonalProfile,
  type Refeicao,
  type WeeklyMealPlan,
  type WeekdayIndex,
  type WeekdayGoalsMap,
} from "@/lib/data";
import {
  fetchTrackerSnapshot,
  patchTracker,
  type LogsMap,
  type WeightEntryRecord,
} from "@/lib/tracker-api";

const RECENT_STORAGE_KEY = "calorias.recent.v1";
const MIDNIGHT_BUFFER_MS = 1500;

function getMillisecondsUntilNextDay(date = new Date()) {
  const nextMidnight = new Date(date);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(1000, nextMidnight.getTime() - date.getTime() + MIDNIGHT_BUFFER_MS);
}

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

function buildHeaderDescription(profile: PersonalProfile) {
  const goal = goalTypeLabels[profile.goalType].toLowerCase();
  if (profile.focus) {
    return `Plano de ${goal}. Hoje o foco é ${profile.focus.toLowerCase()}.`;
  }

  return `Plano de ${goal}. Organize sua rotina, acompanhe a meta de calorias e monte o dia com leveza.`;
}

type HomeSectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function HomeSectionHeading({ eyebrow, title, description }: HomeSectionHeadingProps) {
  return (
    <div className="space-y-1 px-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-botao">{eyebrow}</p>
      <h2 className="text-2xl font-black tracking-tight text-textoPrim dark:text-foreground">{title}</h2>
      <p className="max-w-2xl text-sm text-textoSec dark:text-muted-foreground">{description}</p>
    </div>
  );
}

type GoalNoticeCardProps = {
  weekdayGoalToday: number | null;
  meta: number;
};

function GoalNoticeCard({ weekdayGoalToday, meta }: GoalNoticeCardProps) {
  return (
    <section className="rounded-[26px] border border-white/60 bg-white/65 px-4 py-4 text-sm shadow-[0_10px_24px_-20px_rgba(230,75,141,0.7)] backdrop-blur dark:border-white/10 dark:bg-black/10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-botao">meta ativa</p>
      <p className="mt-2 font-semibold text-textoPrim dark:text-foreground">
        {weekdayGoalToday
          ? `Hoje você está usando a meta personalizada de ${Math.round(weekdayGoalToday).toLocaleString("pt-BR")} kcal.`
          : `Hoje você está usando a meta padrão de ${Math.round(meta).toLocaleString("pt-BR")} kcal.`}
      </p>
      <p className="mt-1 text-textoSec dark:text-muted-foreground">
        As metas por dia da semana podem ser ajustadas em Config e passam a valer automaticamente quando um novo dia abre.
      </p>
    </section>
  );
}

type MealsOfDaySectionProps = {
  byMeal: Record<Refeicao, LoggedFood[]>;
  yesterdayItems: LoggedFood[];
  onAddMeal: (meal: Refeicao) => void;
  onRepeatYesterday: (meal: Refeicao) => void;
  onSaveTemplate: (meal: Refeicao) => void;
  onRemoveItem: (itemId: string) => void;
};

function MealsOfDaySection({
  byMeal,
  yesterdayItems,
  onAddMeal,
  onRepeatYesterday,
  onSaveTemplate,
  onRemoveItem,
}: MealsOfDaySectionProps) {
  return (
    <Card className="rounded-[26px] border-borda/80 bg-white/85 shadow-[0_10px_32px_-20px_rgba(230,75,141,0.75)] dark:border-border dark:bg-card/90 dark:shadow-[0_10px_32px_-20px_rgba(0,0,0,0.9)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-textoPrim dark:text-foreground">Refeições do dia</CardTitle>
        <p className="text-sm text-textoSec dark:text-muted-foreground">
          Monte o dia por bloco e salve as combinações que mais se repetem.
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {mealOrder.map((meal) => (
          <MealCard
            key={meal}
            refeicao={meal}
            titulo={mealLabels[meal]}
            items={byMeal[meal]}
            hasYesterday={yesterdayItems.some((item) => item.refeicao === meal)}
            onAdd={onAddMeal}
            onRepeatYesterday={onRepeatYesterday}
            onSaveTemplate={onSaveTemplate}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </CardContent>
    </Card>
  );
}

const mobileHomeTabs: Array<{ value: string; label: string; icon: LucideIcon }> = [
  { value: "summary", label: "Resumo", icon: LayoutDashboard },
  { value: "checkin", label: "Check-in", icon: HeartPulse },
  { value: "calories", label: "Calorias", icon: Flame },
  { value: "insights", label: "Insights", icon: Sparkles },
  { value: "meals", label: "Refeições", icon: UtensilsCrossed },
];

function buildPlannedDay(
  dateKey: string,
  meta: number,
  weekdayIndex: WeekdayIndex,
  weeklyMealPlan: WeeklyMealPlan,
  mealTemplates: MealTemplateRecord[],
) {
  const dayPlan = weeklyMealPlan[weekdayIndex];
  if (!dayPlan) {
    return buildStarterDay(dateKey, meta);
  }

  const templatesMap = new Map(mealTemplates.map((template) => [template.id, template]));
  const items: LoggedFood[] = [];

  for (const meal of mealOrder) {
    const templateId = dayPlan[meal];
    if (!templateId) {
      continue;
    }

    const template = templatesMap.get(templateId);
    if (!template) {
      continue;
    }

    for (const item of template.items) {
      items.push({
        id: crypto.randomUUID(),
        foodId: item.foodId,
        name: item.name,
        porcao: item.porcao,
        kcalPorcao: item.kcalPorcao,
        proteina: item.proteina,
        carboidrato: item.carboidrato,
        gordura: item.gordura,
        quantidade: item.quantidade,
        refeicao: meal,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return {
    dateKey,
    meta,
    items,
  };
}

function buildShoppingList(
  weeklyMealPlan: WeeklyMealPlan,
  mealTemplates: MealTemplateRecord[],
  foods: FoodRecord[],
): ShoppingListItem[] {
  const templatesMap = new Map(mealTemplates.map((template) => [template.id, template]));
  const foodsMap = new Map(foods.map((food) => [food.id, food]));
  const itemsMap = new Map<string, ShoppingListItem>();

  for (const weekday of Object.keys(weeklyMealPlan)) {
    const dayPlan = weeklyMealPlan[Number(weekday) as WeekdayIndex];
    if (!dayPlan) {
      continue;
    }

    for (const meal of mealOrder) {
      const templateId = dayPlan[meal];
      if (!templateId) {
        continue;
      }

      const template = templatesMap.get(templateId);
      if (!template) {
        continue;
      }

      for (const item of template.items) {
        const key = item.foodId || `${item.name}-${item.porcao}`;
        const existing = itemsMap.get(key);
        const category = foodsMap.get(item.foodId)?.category;

        itemsMap.set(key, {
          id: key,
          name: item.name,
          categoryLabel: category ? getFoodCategoryLabel(category) : null,
          porcao: item.porcao,
          quantidade: Number(((existing?.quantidade ?? 0) + item.quantidade).toFixed(1)),
          occurrences: (existing?.occurrences ?? 0) + 1,
        });
      }
    }
  }

  return Array.from(itemsMap.values()).sort((a, b) => {
    if (b.occurrences !== a.occurrences) {
      return b.occurrences - a.occurrences;
    }

    return a.name.localeCompare(b.name);
  });
}

export default function HomePage() {
  const [foods, setFoods] = useState<FoodRecord[]>(buildInitialFoods());
  const [logsMap, setLogsMap] = useState<LogsMap>({});
  const [daily, setDaily] = useState<DailyState | null>(null);
  const [profile, setProfile] = useState<PersonalProfile>(DEFAULT_PROFILE);
  const [macroTargets, setMacroTargets] = useState<MacroTargets>(() =>
    buildRecommendedMacroTargets(DEFAULT_META_KCAL, DEFAULT_PROFILE),
  );
  const [weightEntries, setWeightEntries] = useState<WeightEntryRecord[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckInRecord[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckInRecord>(() => buildDefaultDailyCheckIn(toDateKey()));
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [yesterdayItems, setYesterdayItems] = useState<LoggedFood[]>([]);
  const [recentFoodIds, setRecentFoodIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Refeicao>("BREAKFAST");
  const [mealTemplates, setMealTemplates] = useState<MealTemplateRecord[]>([]);
  const [weeklyMealPlan, setWeeklyMealPlan] = useState<WeeklyMealPlan>({});
  const [weekdayGoals, setWeekdayGoals] = useState<WeekdayGoalsMap>({});
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const [foodsError, setFoodsError] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const currentDateKey = daily?.dateKey ?? null;

  const applyFallbackDay = useCallback(
    (referenceDate: Date, message: string) => {
      const fallback = buildStarterDay(toDateKey(referenceDate), daily?.meta ?? DEFAULT_META_KCAL);
      setDaily(fallback);
      setLogsMap({ [fallback.dateKey]: fallback });
      setProfile(DEFAULT_PROFILE);
      setMacroTargets(buildRecommendedMacroTargets(fallback.meta, DEFAULT_PROFILE));
      setWeightEntries([]);
      setCheckIns([]);
      setTodayCheckIn(buildDefaultDailyCheckIn(fallback.dateKey));
      setYesterdayItems([]);
      setRecentFoodIds(parseRecentIds());
      setTrackerError(message);
    },
    [daily?.meta],
  );

  const loadDayState = useCallback(async (referenceDate = new Date()) => {
    const todayKey = toDateKey(referenceDate);
    const yesterdayDate = new Date(referenceDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = toDateKey(yesterdayDate);

    const snapshot = await fetchTrackerSnapshot();
    const weekdayIndex = referenceDate.getDay() as WeekdayIndex;
    const weekdayMeta = snapshot.weekdayGoals[weekdayIndex] ?? snapshot.meta;
    const maybeToday = snapshot.logs[todayKey];
    const latestWeight = snapshot.weights[snapshot.weights.length - 1]?.weight;
    const resolvedMacroTargets =
      snapshot.macroTargets ?? buildRecommendedMacroTargets(snapshot.meta, snapshot.profile, latestWeight);
    const todayState =
      maybeToday ??
      buildPlannedDay(todayKey, weekdayMeta, weekdayIndex, snapshot.weeklyMealPlan, snapshot.mealTemplates);
    const nextLogs = { ...snapshot.logs, [todayKey]: todayState };
    const todayCheckInEntry =
      snapshot.checkIns.find((entry) => entry.dateKey === todayKey) ?? buildDefaultDailyCheckIn(todayKey);

    let nextError: string | null = null;

    if (!maybeToday) {
      const ok = await patchTracker({ daily: todayState });
      if (!ok) {
        nextError = "Nao foi possivel inicializar o novo dia no banco de dados.";
      }
    }

    setLogsMap(nextLogs);
    setDaily(todayState);
    setProfile(snapshot.profile);
    setMacroTargets(resolvedMacroTargets);
    setWeightEntries(snapshot.weights);
    setCheckIns(snapshot.checkIns);
    setTodayCheckIn(todayCheckInEntry);
    setYesterdayItems(snapshot.logs[yesterdayKey]?.items ?? []);
    setRecentFoodIds(parseRecentIds());
    setMealTemplates(snapshot.mealTemplates);
    setWeeklyMealPlan(snapshot.weeklyMealPlan);
    setWeekdayGoals(snapshot.weekdayGoals);
    setTrackerError(nextError);
  }, []);

  const persistMealTemplates = useCallback(async (nextTemplates: MealTemplateRecord[], errorMessage: string) => {
    setMealTemplates(nextTemplates);

    const ok = await patchTracker({ mealTemplates: nextTemplates });
    if (ok) {
      setTrackerError(null);
      return true;
    }

    setTrackerError(errorMessage);

    try {
      const snapshot = await fetchTrackerSnapshot();
      setMealTemplates(snapshot.mealTemplates);
      setWeeklyMealPlan(snapshot.weeklyMealPlan);
    } catch {}

    return false;
  }, []);

  useEffect(() => {
    let active = true;

    void loadDayState().catch(() => {
      if (!active) {
        return;
      }

      applyFallbackDay(new Date(), "Os dados do banco nao puderam ser carregados agora.");
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
          setFoodsError(null);
        }
      })
      .catch(() => {
        setFoods(buildInitialFoods());
        setFoodsError(
          "A lista exibida esta apenas em modo local temporario. Novos dados nao serao persistidos enquanto o banco nao responder.",
        );
      });

    return () => {
      active = false;
    };
  }, [applyFallbackDay, loadDayState]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!currentDateKey) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadDayState(new Date()).catch(() => {
        applyFallbackDay(new Date(), "A virada automatica falhou ao consultar o banco. O novo dia foi aberto localmente.");
      });
    }, getMillisecondsUntilNextDay());

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (toDateKey() === currentDateKey) {
        return;
      }

      void loadDayState(new Date()).catch(() => {
        applyFallbackDay(new Date(), "O app abriu um novo dia localmente porque o banco nao respondeu ao voltar para a aba.");
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [applyFallbackDay, currentDateKey, loadDayState]);

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

  const saveMealAsTemplate = (meal: Refeicao) => {
    const items = (daily?.items ?? []).filter((item) => item.refeicao === meal);
    if (items.length === 0) {
      return;
    }

    const suggestedName = `${mealLabels[meal]} ${new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }).format(new Date())}`;
    const templateName = window.prompt("Nome do modelo de refeicao:", suggestedName)?.trim();
    if (!templateName) {
      return;
    }

    const existing = mealTemplates.find((template) => template.name.toLowerCase() === templateName.toLowerCase());
    const timestamp = new Date().toISOString();

    const nextTemplate: MealTemplateRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      name: templateName,
      refeicao: meal,
      items: items.map((item) => ({
        foodId: item.foodId,
        name: item.name,
        porcao: item.porcao,
        kcalPorcao: item.kcalPorcao,
        proteina: item.proteina,
        carboidrato: item.carboidrato,
        gordura: item.gordura,
        quantidade: item.quantidade,
      })),
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    const nextTemplates = [nextTemplate, ...mealTemplates.filter((template) => template.id !== nextTemplate.id)]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 24);

    void persistMealTemplates(nextTemplates, "Nao foi possivel salvar o modelo de refeicao.");
  };

  const applyMealTemplate = (templateId: string) => {
    const template = mealTemplates.find((entry) => entry.id === templateId);
    if (!template) {
      return;
    }

    updateDaily((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        ...template.items.map((item) => ({
          id: crypto.randomUUID(),
          foodId: item.foodId,
          name: item.name,
          porcao: item.porcao,
          kcalPorcao: item.kcalPorcao,
          proteina: item.proteina,
          carboidrato: item.carboidrato,
          gordura: item.gordura,
          quantidade: item.quantidade,
          refeicao: template.refeicao,
          createdAt: new Date().toISOString(),
        })),
      ],
    }));
  };

  const removeMealTemplate = (templateId: string) => {
    const template = mealTemplates.find((entry) => entry.id === templateId);
    if (!template) {
      return;
    }

    if (!window.confirm(`Remover o modelo "${template.name}"?`)) {
      return;
    }

    const nextTemplates = mealTemplates.filter((entry) => entry.id !== templateId);
    void persistMealTemplates(nextTemplates, "Nao foi possivel remover o modelo de refeicao.");
  };

  const saveCheckIn = async () => {
    const payload = {
      ...todayCheckIn,
      dateKey: daily?.dateKey ?? todayCheckIn.dateKey,
      updatedAt: new Date().toISOString(),
    };

    setCheckInSaving(true);
    setTodayCheckIn(payload);
    setCheckIns((prev) =>
      [...prev.filter((entry) => entry.dateKey !== payload.dateKey), payload].sort((a, b) => a.dateKey.localeCompare(b.dateKey)),
    );

    const ok = await patchTracker({ checkIn: payload });
    setCheckInSaving(false);

    if (ok) {
      setTrackerError(null);
      return;
    }

    setTrackerError("Nao foi possivel salvar o check-in do dia no banco.");

    try {
      const snapshot = await fetchTrackerSnapshot();
      setCheckIns(snapshot.checkIns);
      const restored = snapshot.checkIns.find((entry) => entry.dateKey === (daily?.dateKey ?? payload.dateKey));
      setTodayCheckIn(restored ?? buildDefaultDailyCheckIn(daily?.dateKey ?? payload.dateKey));
    } catch {}
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
  const now = useMemo(() => new Date(clockNow), [clockNow]);
  const weekdayGoalToday = weekdayGoals[now.getDay() as WeekdayIndex] ?? null;
  const latestWeight = useMemo(() => weightEntries[weightEntries.length - 1] ?? null, [weightEntries]);
  const firstWeight = useMemo(() => weightEntries[0] ?? null, [weightEntries]);
  const mealTotals = useMemo(
    () =>
      mealOrder.reduce(
        (acc, meal) => {
          acc[meal] = byMeal[meal].reduce((sum, item) => sum + item.kcalPorcao * item.quantidade, 0);
          return acc;
        },
        { BREAKFAST: 0, LUNCH: 0, DINNER: 0, SNACKS: 0 } as Record<Refeicao, number>,
      ),
    [byMeal],
  );
  const mealTargets = useMemo(
    () =>
      mealOrder.reduce(
        (acc, meal) => {
          acc[meal] = getMealTargetKcal(daily?.meta ?? DEFAULT_META_KCAL, meal);
          return acc;
        },
        { BREAKFAST: 0, LUNCH: 0, DINNER: 0, SNACKS: 0 } as Record<Refeicao, number>,
      ),
    [daily?.meta],
  );
  const profileFirstName = useMemo(() => profile.name.trim().split(/\s+/)[0] || "Jhullya", [profile.name]);
  const headerDescription = useMemo(() => buildHeaderDescription(profile), [profile]);
  const shoppingListItems = useMemo(
    () => buildShoppingList(weeklyMealPlan, mealTemplates, foods),
    [foods, mealTemplates, weeklyMealPlan],
  );

  if (!daily) {
    return <main className="min-h-screen p-4" />;
  }

  return (
    <main className="relative mx-auto w-full max-w-7xl space-y-4 p-3 pb-28 sm:p-4 md:space-y-5 md:p-6 md:pb-8">
      <div className="animate-enter-1">
        <Header
          profileName={profile.name}
          eyebrow={`dieta da ${profileFirstName.toLowerCase()}`}
          description={headerDescription}
          primaryAction={{ href: "/config", label: "Ajustar plano", icon: Settings }}
        />
      </div>

      {trackerError ? (
        <section className="animate-enter-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {trackerError}
        </section>
      ) : null}

      {foodsError ? (
        <section className="animate-enter-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {foodsError}
        </section>
      ) : null}

      <section className="animate-enter-2 md:hidden">
        <Tabs defaultValue="summary" className="space-y-3">
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <TabsList className="h-auto w-max min-w-full justify-start gap-1 rounded-[22px] border border-white/60 bg-white/72 p-1.5 backdrop-blur dark:border-white/10 dark:bg-black/10">
              {mobileHomeTabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex min-w-[92px] shrink-0 flex-col gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold text-textoSec data-[state=active]:bg-white data-[state=active]:text-botao dark:text-muted-foreground dark:data-[state=active]:bg-card"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="summary" className="space-y-3">
            <HomeSectionHeading
              eyebrow="resumo do dia"
              title="Seu plano em uma visão rápida"
              description="Veja sua rotina pessoal sem carregar a tela inteira de uma vez."
            />
            <PersonalPlanCard
              profile={profile}
              todayCheckIn={todayCheckIn}
              latestWeight={latestWeight}
              firstWeight={firstWeight}
            />
          </TabsContent>

          <TabsContent value="checkin" className="space-y-3">
            <HomeSectionHeading
              eyebrow="check-in"
              title="Como seu corpo respondeu hoje"
              description="Registre humor, energia, fome, água e sono em uma aba própria."
            />
            <DailyCheckInCard
              value={todayCheckIn}
              waterGoal={profile.dailyWaterGoal}
              saving={checkInSaving}
              onChange={setTodayCheckIn}
              onSave={saveCheckIn}
            />
          </TabsContent>

          <TabsContent value="calories" className="space-y-3">
            <HomeSectionHeading
              eyebrow="meta de calorias"
              title="Calorias, macros e ritmo"
              description="Tudo que é meta do dia fica concentrado aqui."
            />
            <ProgressRing consumido={consumed} meta={daily.meta} />
            <GoalNoticeCard weekdayGoalToday={weekdayGoalToday} meta={daily.meta} />
            <MealRhythmCard totals={mealTotals} targets={mealTargets} />
            <MacrosBar
              proteina={macroTotals.proteina}
              carboidrato={macroTotals.carboidrato}
              gordura={macroTotals.gordura}
              targets={macroTargets}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-3">
            <HomeSectionHeading
              eyebrow="acompanhamento"
              title="Leituras e padrões da rotina"
              description="Insights da semana, sequência e lista de compras em uma só aba."
            />
            <DailyInsightsCard daily={daily} logsMap={logsMap} consumed={consumed} remaining={remaining} now={now} />
            <SmartInsightsCard
              checkIns={checkIns}
              logsMap={logsMap}
              waterGoal={profile.dailyWaterGoal}
              macroTargets={macroTargets}
              proteinConsumedToday={macroTotals.proteina}
            />
            <ShoppingListCard items={shoppingListItems} description="Baseada no planner semanal e nos modelos já salvos." />
          </TabsContent>

          <TabsContent value="meals" className="space-y-3">
            <HomeSectionHeading
              eyebrow="refeições"
              title="Monte o dia por abas mais leves"
              description="Modelos salvos, dieta base e refeições do dia agrupados em um só lugar."
            />
            <MealTemplatesCard
              templates={mealTemplates}
              onApplyTemplate={applyMealTemplate}
              onDeleteTemplate={removeMealTemplate}
            />
            <BaseDietCard onApplyOption={applyDietOption} onSetDefaultMeta={applyDefaultGoal} />
            <MealsOfDaySection
              byMeal={byMeal}
              yesterdayItems={yesterdayItems}
              onAddMeal={(meal) => {
                setSelectedMeal(meal);
                setModalOpen(true);
              }}
              onRepeatYesterday={repeatYesterdayMeal}
              onSaveTemplate={saveMealAsTemplate}
              onRemoveItem={removeItemFromMeal}
            />
          </TabsContent>
        </Tabs>
      </section>

      <div className="hidden space-y-5 md:block">
        <section className="space-y-3">
          <div className="animate-enter-2">
            <HomeSectionHeading
              eyebrow="rotina do dia"
              title="Seu corpo, seu foco e sua rotina"
              description="Aqui ficam o plano pessoal e o check-in do dia, sem misturar com as metas de calorias."
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="animate-enter-2">
              <PersonalPlanCard
                profile={profile}
                todayCheckIn={todayCheckIn}
                latestWeight={latestWeight}
                firstWeight={firstWeight}
              />
            </div>
            <div className="animate-enter-3">
              <DailyCheckInCard
                value={todayCheckIn}
                waterGoal={profile.dailyWaterGoal}
                saving={checkInSaving}
                onChange={setTodayCheckIn}
                onSave={saveCheckIn}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="animate-enter-3">
            <HomeSectionHeading
              eyebrow="meta de calorias"
              title="Calorias, macros e ritmo das refeições"
              description="Consumo do dia, divisão por refeição e meta atual em um bloco próprio e mais fácil de ler."
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
            <div className="animate-enter-3">
              <ProgressRing consumido={consumed} meta={daily.meta} />
            </div>
            <div className="space-y-4">
              <div className="animate-enter-3">
                <GoalNoticeCard weekdayGoalToday={weekdayGoalToday} meta={daily.meta} />
              </div>
              <div className="animate-enter-4">
                <MealRhythmCard totals={mealTotals} targets={mealTargets} />
              </div>
            </div>
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="animate-enter-4">
              <MacrosBar
                proteina={macroTotals.proteina}
                carboidrato={macroTotals.carboidrato}
                gordura={macroTotals.gordura}
                targets={macroTargets}
              />
            </div>
            <div className="animate-enter-3">
              <BaseDietCard onApplyOption={applyDietOption} onSetDefaultMeta={applyDefaultGoal} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="animate-enter-4">
            <HomeSectionHeading
              eyebrow="acompanhamento"
              title="Leituras do dia e da semana"
              description="Insights do seu comportamento, sequência de consistência e apoio para manter o plano."
            />
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="animate-enter-4">
              <DailyInsightsCard daily={daily} logsMap={logsMap} consumed={consumed} remaining={remaining} now={now} />
            </div>
            <div className="animate-enter-4">
              <SmartInsightsCard
                checkIns={checkIns}
                logsMap={logsMap}
                waterGoal={profile.dailyWaterGoal}
                macroTargets={macroTargets}
                proteinConsumedToday={macroTotals.proteina}
              />
            </div>
          </div>

          <div className="animate-enter-4">
            <ShoppingListCard items={shoppingListItems} description="Baseada no planner semanal e nos modelos já salvos." />
          </div>
        </section>

        <section className="space-y-3">
          <div className="animate-enter-4">
            <HomeSectionHeading
              eyebrow="montar o dia"
              title="Refeições e modelos salvos"
              description="Guarde combinações que se repetem e monte as refeições do dia em blocos mais organizados."
            />
          </div>

          <div className="animate-enter-4">
            <MealTemplatesCard
              templates={mealTemplates}
              onApplyTemplate={applyMealTemplate}
              onDeleteTemplate={removeMealTemplate}
            />
          </div>

          <div className="animate-enter-4">
            <MealsOfDaySection
              byMeal={byMeal}
              yesterdayItems={yesterdayItems}
              onAddMeal={(meal) => {
                setSelectedMeal(meal);
                setModalOpen(true);
              }}
              onRepeatYesterday={repeatYesterdayMeal}
              onSaveTemplate={saveMealAsTemplate}
              onRemoveItem={removeItemFromMeal}
            />
          </div>
        </section>
      </div>

      <Button
        type="button"
        className="fixed bottom-[5.4rem] right-3 z-30 h-11 rounded-full bg-botao px-4 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(230,75,141,0.95)] hover:bg-botao/90 md:bottom-4 md:right-4 md:h-12 md:px-5"
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
