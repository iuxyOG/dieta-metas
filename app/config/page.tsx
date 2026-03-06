"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Moon, Save, Sun, Target, UserRound } from "lucide-react";

import { Header } from "@/components/Header";
import { ShoppingListCard, type ShoppingListItem } from "@/components/ShoppingListCard";
import { WeeklyMealPlanCard } from "@/components/WeeklyMealPlanCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  buildInitialFoods,
  buildRecommendedMacroTargets,
  buildStarterDay,
  DEFAULT_META_KCAL,
  DEFAULT_PROFILE,
  getWeekdayLabel,
  getFoodCategoryLabel,
  goalTypeLabels,
  toDateKey,
  type FoodRecord,
  type GoalType,
  type MacroTargets,
  type MealTemplateRecord,
  type PersonalProfile,
  type WeeklyMealPlan,
  type WeekdayGoalsMap,
  weekdayOrder,
} from "@/lib/data";
import { fetchTrackerSnapshot, patchTracker } from "@/lib/tracker-api";

const THEME_STORAGE_KEY = "calorias.theme.v1";

type ProfileFormState = {
  name: string;
  goalType: GoalType;
  targetWeight: string;
  weeklyPace: string;
  targetDate: string;
  dailyWaterGoal: string;
  focus: string;
};

type MacroFormState = {
  proteina: string;
  carboidrato: string;
  gordura: string;
};

function buildWeekdayGoalInputs(goals: WeekdayGoalsMap) {
  return Object.fromEntries(
    weekdayOrder.map((weekday) => [weekday, goals[weekday] ? String(goals[weekday]) : ""]),
  ) as Record<string, string>;
}

function profileToForm(profile: PersonalProfile): ProfileFormState {
  return {
    name: profile.name,
    goalType: profile.goalType,
    targetWeight: profile.targetWeight ? String(profile.targetWeight) : "",
    weeklyPace: profile.weeklyPace ? String(profile.weeklyPace) : "",
    targetDate: profile.targetDate ?? "",
    dailyWaterGoal: String(profile.dailyWaterGoal),
    focus: profile.focus ?? "",
  };
}

function normalizeDecimalOrNull(value: string) {
  const parsed = Number(value.replace(",", ".").trim());
  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : null;
}

function macroTargetsToForm(targets: MacroTargets): MacroFormState {
  return {
    proteina: String(targets.proteina),
    carboidrato: String(targets.carboidrato),
    gordura: String(targets.gordura),
  };
}

function buildShoppingListPreview(
  weeklyMealPlan: WeeklyMealPlan,
  mealTemplates: MealTemplateRecord[],
  foods: FoodRecord[],
): ShoppingListItem[] {
  const templatesMap = new Map(mealTemplates.map((template) => [template.id, template]));
  const foodsMap = new Map(foods.map((food) => [food.id, food]));
  const aggregated = new Map<string, ShoppingListItem>();

  for (const weekday of weekdayOrder) {
    const planDay = weeklyMealPlan[weekday];
    if (!planDay) {
      continue;
    }

    for (const meal of Object.keys(planDay) as Array<keyof typeof planDay>) {
      const templateId = planDay[meal];
      if (!templateId) {
        continue;
      }

      const template = templatesMap.get(templateId);
      if (!template) {
        continue;
      }

      for (const item of template.items) {
        const key = item.foodId || `${item.name}-${item.porcao}`;
        const existing = aggregated.get(key);
        const category = foodsMap.get(item.foodId)?.category;

        aggregated.set(key, {
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

  return Array.from(aggregated.values()).sort((a, b) => b.occurrences - a.occurrences || a.name.localeCompare(b.name));
}

export default function ConfigPage() {
  const [profileForm, setProfileForm] = useState<ProfileFormState>(profileToForm(DEFAULT_PROFILE));
  const [meta, setMeta] = useState(String(DEFAULT_META_KCAL));
  const [foods, setFoods] = useState<FoodRecord[]>(buildInitialFoods());
  const [macroForm, setMacroForm] = useState<MacroFormState>(() =>
    macroTargetsToForm(buildRecommendedMacroTargets(DEFAULT_META_KCAL, DEFAULT_PROFILE)),
  );
  const [mealTemplates, setMealTemplates] = useState<MealTemplateRecord[]>([]);
  const [weeklyMealPlan, setWeeklyMealPlan] = useState<WeeklyMealPlan>({});
  const [weekdayGoals, setWeekdayGoals] = useState<Record<string, string>>(() => buildWeekdayGoalInputs({}));
  const [isDark, setIsDark] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchTrackerSnapshot()
      .then((snapshot) => {
        if (!active) {
          return;
        }
        setMeta(String(snapshot.meta));
        setProfileForm(profileToForm(snapshot.profile));
        setMacroForm(
          macroTargetsToForm(
            snapshot.macroTargets ?? buildRecommendedMacroTargets(snapshot.meta, snapshot.profile),
          ),
        );
        setMealTemplates(snapshot.mealTemplates);
        setWeeklyMealPlan(snapshot.weeklyMealPlan);
        setWeekdayGoals(buildWeekdayGoalInputs(snapshot.weekdayGoals));
        setErrorMessage(null);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setMeta(String(DEFAULT_META_KCAL));
        setProfileForm(profileToForm(DEFAULT_PROFILE));
        setMacroForm(macroTargetsToForm(buildRecommendedMacroTargets(DEFAULT_META_KCAL, DEFAULT_PROFILE)));
        setMealTemplates([]);
        setWeeklyMealPlan({});
        setWeekdayGoals(buildWeekdayGoalInputs({}));
        setErrorMessage("Nao foi possivel carregar a configuracao salva no banco.");
      });

    void fetch("/api/foods")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Falha ao carregar alimentos"))))
      .then((result: unknown) => {
        if (!active || !Array.isArray(result)) {
          return;
        }

        setFoods(
          result.filter((item): item is FoodRecord => Boolean(item && typeof item === "object" && "id" in (item as Record<string, unknown>))),
        );
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setFoods(buildInitialFoods());
      });

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const dark = storedTheme === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);

    return () => {
      active = false;
    };
  }, []);

  const profilePreview = useMemo(() => {
    const targetWeight = normalizeDecimalOrNull(profileForm.targetWeight);
    const weeklyPace = normalizeDecimalOrNull(profileForm.weeklyPace);
    return {
      targetWeight,
      weeklyPace,
      dailyWaterGoal: Number(profileForm.dailyWaterGoal) || DEFAULT_PROFILE.dailyWaterGoal,
    };
  }, [profileForm.dailyWaterGoal, profileForm.targetWeight, profileForm.weeklyPace]);
  const profileDraft = useMemo<PersonalProfile>(
    () => ({
      id: DEFAULT_PROFILE.id,
      name: profileForm.name || DEFAULT_PROFILE.name,
      goalType: profileForm.goalType,
      targetWeight: normalizeDecimalOrNull(profileForm.targetWeight),
      weeklyPace: normalizeDecimalOrNull(profileForm.weeklyPace),
      targetDate: profileForm.targetDate || null,
      dailyWaterGoal: Number(profileForm.dailyWaterGoal) || DEFAULT_PROFILE.dailyWaterGoal,
      focus: profileForm.focus.trim() || null,
    }),
    [profileForm],
  );
  const recommendedMacros = useMemo(
    () => buildRecommendedMacroTargets(Number(meta) || DEFAULT_META_KCAL, profileDraft),
    [meta, profileDraft],
  );
  const shoppingPreview = useMemo(
    () => buildShoppingListPreview(weeklyMealPlan, mealTemplates, foods),
    [foods, mealTemplates, weeklyMealPlan],
  );

  const saveProfile = async () => {
    const name = profileDraft.name.trim();
    const dailyWaterGoal = profileDraft.dailyWaterGoal;

    if (!name) {
      setErrorMessage("Informe um nome para o perfil.");
      return;
    }

    if (!Number.isFinite(dailyWaterGoal) || dailyWaterGoal <= 0) {
      setErrorMessage("A meta de água precisa ser maior que zero.");
      return;
    }

    const profilePayload: PersonalProfile = {
      ...profileDraft,
      name,
      dailyWaterGoal: Math.round(dailyWaterGoal),
    };

    const ok = await patchTracker({ profile: profilePayload });
    if (!ok) {
      setErrorMessage("Nao foi possivel salvar o plano pessoal no banco.");
      setSuccessMessage(null);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage("Plano pessoal salvo com sucesso.");
  };

  const saveMacroTargets = async () => {
    const nextTargets: MacroTargets = {
      proteina: Number(macroForm.proteina),
      carboidrato: Number(macroForm.carboidrato),
      gordura: Number(macroForm.gordura),
    };

    if (Object.values(nextTargets).some((value) => !Number.isFinite(value) || value <= 0)) {
      setErrorMessage("Informe metas válidas de macro.");
      setSuccessMessage(null);
      return;
    }

    const ok = await patchTracker({ macroTargets: nextTargets });
    if (!ok) {
      setErrorMessage("Nao foi possivel salvar as metas de macro no banco.");
      setSuccessMessage(null);
      return;
    }

    setMacroForm(macroTargetsToForm(nextTargets));
    setErrorMessage(null);
    setSuccessMessage("Metas de macro salvas com sucesso.");
  };

  const saveMeta = async () => {
    try {
      const parsed = Number(meta);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setErrorMessage("Informe uma meta diaria valida.");
        return;
      }

      const normalizedMeta = Math.round(parsed);
      setMeta(String(normalizedMeta));

      const snapshot = await fetchTrackerSnapshot();
      const todayKey = toDateKey();
      const today = snapshot.logs[todayKey] ?? buildStarterDay(todayKey, normalizedMeta);
      const ok = await patchTracker({
        meta: normalizedMeta,
        daily: {
          ...today,
          meta: normalizedMeta,
        },
      });

      if (!ok) {
        setMeta(String(snapshot.meta));
        setErrorMessage("Nao foi possivel salvar a meta diaria no banco.");
        setSuccessMessage(null);
        return;
      }

      setErrorMessage(null);
      setSuccessMessage("Meta diaria salva com sucesso.");
    } catch {
      setErrorMessage("Nao foi possivel carregar os dados atuais antes de salvar.");
      setSuccessMessage(null);
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextDark ? "dark" : "light");
  };

  const saveWeekdayGoals = async () => {
    const nextGoals: WeekdayGoalsMap = {};

    for (const weekday of weekdayOrder) {
      const rawValue = weekdayGoals[weekday]?.trim() ?? "";
      if (!rawValue) {
        continue;
      }

      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setErrorMessage(`Meta invalida para ${getWeekdayLabel(weekday)}.`);
        setSuccessMessage(null);
        return;
      }

      nextGoals[weekday] = Math.round(parsed);
    }

    const ok = await patchTracker({ weekdayGoals: nextGoals });
    if (!ok) {
      setErrorMessage("Nao foi possivel salvar as metas por dia da semana.");
      setSuccessMessage(null);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage("Metas por dia salvas com sucesso.");
  };

  const saveWeeklyMealPlan = async () => {
    const ok = await patchTracker({ weeklyMealPlan });
    if (!ok) {
      setErrorMessage("Nao foi possivel salvar o planner semanal no banco.");
      setSuccessMessage(null);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage("Planner semanal salvo com sucesso.");
  };

  const exportCsv = async () => {
    try {
      const snapshot = await fetchTrackerSnapshot();
      const today = snapshot.logs[toDateKey()];
      if (!today) {
        setErrorMessage("Ainda nao ha refeicoes registradas hoje para exportar.");
        setSuccessMessage(null);
        return;
      }

      const headers = ["refeicao", "alimento", "porcao", "quantidade", "kcal", "proteina", "carboidrato", "gordura"];
      const rows = today.items.map((item) => [
        item.refeicao,
        item.name,
        item.porcao,
        String(item.quantidade),
        String((item.kcalPorcao * item.quantidade).toFixed(1)),
        String(item.proteina.toFixed(1)),
        String(item.carboidrato.toFixed(1)),
        String(item.gordura.toFixed(1)),
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `calorias-${today.dateKey}.csv`;
      link.click();

      URL.revokeObjectURL(url);
      setErrorMessage(null);
      setSuccessMessage("CSV exportado com sucesso.");
    } catch {
      setErrorMessage("Nao foi possivel carregar os dados do dia para exportacao.");
      setSuccessMessage(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 p-3 pb-28 md:space-y-5 md:p-6 md:pb-8">
      <Header
        title="Configurações"
        description="Ajuste seu plano pessoal, metas da semana e preferências do app."
        showDate={false}
        profileName={profileForm.name}
      />

      {errorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </section>
      ) : null}

      {successMessage ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl border-borda/80 bg-white/82 dark:border-border dark:bg-card/90">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-lg text-textoPrim dark:text-foreground">
              <UserRound className="h-5 w-5 text-botao" />
              Plano pessoal
            </CardTitle>
            <p className="text-sm text-textoSec dark:text-muted-foreground">
              Isso define a identidade do app e o contexto da sua rotina.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={profileForm.name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                placeholder="Seu nome"
              />
              <Select
                value={profileForm.goalType}
                onValueChange={(value) => setProfileForm((prev) => ({ ...prev, goalType: value as GoalType }))}
              >
                <SelectTrigger className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground">
                  <SelectValue placeholder="Objetivo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(goalTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.1"
                min={1}
                value={profileForm.targetWeight}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, targetWeight: event.target.value }))}
                className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                placeholder="Peso alvo (kg)"
              />
              <Input
                type="number"
                step="0.1"
                min={0.1}
                value={profileForm.weeklyPace}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, weeklyPace: event.target.value }))}
                className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                placeholder="Ritmo semanal (kg)"
              />
              <Input
                type="date"
                value={profileForm.targetDate}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, targetDate: event.target.value }))}
                className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
              />
              <Input
                type="number"
                min={1}
                value={profileForm.dailyWaterGoal}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, dailyWaterGoal: event.target.value }))}
                className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                placeholder="Meta de água (copos)"
              />
            </div>

            <div className="rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/65">
              <label className="text-sm font-semibold text-textoPrim dark:text-foreground">Foco do ciclo</label>
              <textarea
                value={profileForm.focus}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, focus: event.target.value }))}
                placeholder="Ex.: ganhar massa com consistência e refeições mais previsíveis"
                className="mt-2 min-h-24 w-full rounded-2xl border border-borda bg-white px-3 py-2 text-sm text-textoPrim outline-none placeholder:text-textoSec/70 focus:border-botao dark:border-border dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/65">
                <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">Objetivo</p>
                <p className="mt-1 text-base font-bold text-textoPrim dark:text-foreground">{goalTypeLabels[profileForm.goalType]}</p>
              </div>
              <div className="rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/65">
                <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">Peso alvo</p>
                <p className="mt-1 text-base font-bold text-textoPrim dark:text-foreground">
                  {profilePreview.targetWeight ? `${profilePreview.targetWeight.toFixed(1)} kg` : "sem alvo"}
                </p>
              </div>
              <div className="rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/65">
                <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">Água</p>
                <p className="mt-1 text-base font-bold text-textoPrim dark:text-foreground">
                  {profilePreview.dailyWaterGoal} copos
                </p>
              </div>
            </div>

            <Button onClick={saveProfile} className="h-11 w-full rounded-2xl bg-botao text-white hover:bg-botao/90">
              <Save className="mr-2 h-4 w-4" />
              Salvar plano pessoal
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-borda/80 bg-white/82 dark:border-border dark:bg-card/90">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-lg text-textoPrim dark:text-foreground">
                <Target className="h-5 w-5 text-botao" />
                Meta diária
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="number"
                min={1}
                value={meta}
                onChange={(event) => setMeta(event.target.value)}
                className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                placeholder="Meta kcal"
              />
              <Button onClick={saveMeta} className="h-11 w-full rounded-2xl bg-botao text-white hover:bg-botao/90">
                <Save className="mr-2 h-4 w-4" />
                Salvar meta
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-borda/80 bg-white/82 dark:border-border dark:bg-card/90">
            <CardHeader>
              <CardTitle className="text-lg text-textoPrim dark:text-foreground">Metas de macro</CardTitle>
              <p className="text-sm text-textoSec dark:text-muted-foreground">
                Ajuste manualmente ou use o cálculo sugerido com base no seu plano.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min={1}
                  value={macroForm.proteina}
                  onChange={(event) => setMacroForm((prev) => ({ ...prev, proteina: event.target.value }))}
                  className="h-10 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                  placeholder="Prot"
                />
                <Input
                  type="number"
                  min={1}
                  value={macroForm.carboidrato}
                  onChange={(event) => setMacroForm((prev) => ({ ...prev, carboidrato: event.target.value }))}
                  className="h-10 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                  placeholder="Carbo"
                />
                <Input
                  type="number"
                  min={1}
                  value={macroForm.gordura}
                  onChange={(event) => setMacroForm((prev) => ({ ...prev, gordura: event.target.value }))}
                  className="h-10 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                  placeholder="Gord"
                />
              </div>

              <div className="rounded-2xl bg-rosaClaro/55 p-3 text-sm text-textoSec dark:bg-secondary/65 dark:text-muted-foreground">
                Sugestão atual: {recommendedMacros.proteina}g prot, {recommendedMacros.carboidrato}g carbo e {recommendedMacros.gordura}g gord.
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMacroForm(macroTargetsToForm(recommendedMacros))}
                  className="h-11 flex-1 rounded-2xl border-borda bg-white dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-secondary"
                >
                  Usar cálculo
                </Button>
                <Button onClick={saveMacroTargets} className="h-11 flex-1 rounded-2xl bg-botao text-white hover:bg-botao/90">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-borda/80 bg-white/82 dark:border-border dark:bg-card/90">
            <CardHeader>
              <CardTitle className="text-lg text-textoPrim dark:text-foreground">Preferências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="h-11 w-full rounded-2xl border-borda bg-white dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-secondary"
              >
                {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {isDark ? "Ativar tema claro" : "Ativar tema escuro"}
              </Button>

              <Button
                variant="outline"
                onClick={exportCsv}
                className="h-11 w-full rounded-2xl border-borda bg-white dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-secondary"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV do dia
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl border-borda/80 bg-white/82 dark:border-border dark:bg-card/90">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-lg text-textoPrim dark:text-foreground">
            <CalendarDays className="h-5 w-5 text-botao" />
            Metas por dia
          </CardTitle>
          <p className="text-sm text-textoSec dark:text-muted-foreground">
            Se um dia ficar vazio, o app usa a meta padrão.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {weekdayOrder.map((weekday) => (
              <div key={weekday} className="space-y-1 rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">
                  {getWeekdayLabel(weekday)}
                </p>
                <Input
                  type="number"
                  min={1}
                  value={weekdayGoals[weekday] ?? ""}
                  onChange={(event) =>
                    setWeekdayGoals((prev) => ({
                      ...prev,
                      [weekday]: event.target.value,
                    }))
                  }
                  className="mt-1 h-10 rounded-xl border-borda bg-white dark:border-border dark:bg-card dark:text-foreground"
                  placeholder="Usar meta padrão"
                />
              </div>
            ))}
          </div>

          <Button onClick={saveWeekdayGoals} className="h-11 w-full rounded-2xl bg-botao text-white hover:bg-botao/90">
            <Save className="mr-2 h-4 w-4" />
            Salvar metas da semana
          </Button>
        </CardContent>
      </Card>

      <WeeklyMealPlanCard templates={mealTemplates} plan={weeklyMealPlan} onChange={setWeeklyMealPlan} />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Button onClick={saveWeeklyMealPlan} className="h-11 w-full rounded-2xl bg-botao text-white hover:bg-botao/90">
            <Save className="mr-2 h-4 w-4" />
            Salvar planner semanal
          </Button>
        </div>
        <div />
      </div>

      <ShoppingListCard
        title="Prévia das compras"
        description="O app recalcula essa lista a partir do planner semanal e dos modelos escolhidos."
        items={shoppingPreview}
      />
    </main>
  );
}
