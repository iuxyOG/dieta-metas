"use client";

import { useEffect, useState } from "react";
import { Download, Moon, Save, Sun } from "lucide-react";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildStarterDay, DEFAULT_META_KCAL, toDateKey } from "@/lib/data";
import { fetchTrackerSnapshot, patchTracker } from "@/lib/tracker-api";

const THEME_STORAGE_KEY = "calorias.theme.v1";

export default function ConfigPage() {
  const [meta, setMeta] = useState(String(DEFAULT_META_KCAL));
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let active = true;

    void fetchTrackerSnapshot()
      .then((snapshot) => {
        if (!active) {
          return;
        }
        setMeta(String(snapshot.meta));
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setMeta(String(DEFAULT_META_KCAL));
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
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextDark ? "dark" : "light");
  };

  const exportCsv = async () => {
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
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 p-4 pb-8 md:p-6">
      <Header />

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
