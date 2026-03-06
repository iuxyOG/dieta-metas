"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Download, Moon, Save, Sun } from "lucide-react";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildStarterDay, DEFAULT_META_KCAL, getWeekdayLabel, toDateKey, type WeekdayGoalsMap, weekdayOrder } from "@/lib/data";
import { fetchTrackerSnapshot, patchTracker } from "@/lib/tracker-api";

const THEME_STORAGE_KEY = "calorias.theme.v1";

function buildWeekdayGoalInputs(goals: WeekdayGoalsMap) {
  return Object.fromEntries(
    weekdayOrder.map((weekday) => [weekday, goals[weekday] ? String(goals[weekday]) : ""]),
  ) as Record<string, string>;
}

export default function ConfigPage() {
  const [meta, setMeta] = useState(String(DEFAULT_META_KCAL));
  const [weekdayGoals, setWeekdayGoals] = useState<Record<string, string>>(() => buildWeekdayGoalInputs({}));
  const [isDark, setIsDark] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchTrackerSnapshot()
      .then((snapshot) => {
        if (!active) {
          return;
        }
        setMeta(String(snapshot.meta));
        setWeekdayGoals(buildWeekdayGoalInputs(snapshot.weekdayGoals));
        setErrorMessage(null);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setMeta(String(DEFAULT_META_KCAL));
        setWeekdayGoals(buildWeekdayGoalInputs({}));
        setErrorMessage("Nao foi possivel carregar a configuracao salva no banco.");
      });

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const dark = storedTheme === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);

    return () => {
      active = false;
    };
  }, []);

  const saveMeta = async () => {
    try {
      const parsed = Number(meta);
      if (!Number.isFinite(parsed) || parsed <= 0) {
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
        return;
      }

      setErrorMessage(null);
    } catch {
      setErrorMessage("Nao foi possivel carregar os dados atuais antes de salvar.");
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
        return;
      }

      nextGoals[weekday] = Math.round(parsed);
    }

    const ok = await patchTracker({ weekdayGoals: nextGoals });
    if (!ok) {
      setErrorMessage("Nao foi possivel salvar as metas por dia da semana.");
      return;
    }

    setErrorMessage(null);
  };

  const exportCsv = async () => {
    try {
      const snapshot = await fetchTrackerSnapshot();
      const today = snapshot.logs[toDateKey()];
      if (!today) {
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
    } catch {
      setErrorMessage("Nao foi possivel carregar os dados do dia para exportacao.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 p-4 pb-8 md:p-6">
      <Header />

      {errorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl border-borda/80 bg-white/80 dark:border-border dark:bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg text-textoPrim dark:text-foreground">Meta diária</CardTitle>
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

        <Card className="rounded-3xl border-borda/80 bg-white/80 dark:border-border dark:bg-card/90">
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
            <div className="grid gap-2 sm:grid-cols-2">
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

        <Card className="rounded-3xl border-borda/80 bg-white/80 dark:border-border dark:bg-card/90">
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
    </main>
  );
}
