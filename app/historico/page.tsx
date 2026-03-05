"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarClock, LineChart, Scale, Save, Target, TrendingUp } from "lucide-react";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_META_KCAL, fromDateKey, toDateKey, toKcal, type DailyState } from "@/lib/data";

const LOGS_STORAGE_KEY = "calorias.logs.v1";
const META_STORAGE_KEY = "calorias.meta.v1";
const WEEKLY_GOALS_STORAGE_KEY = "calorias.weekly-goals.v1";
const WEIGHTS_STORAGE_KEY = "calorias.weights.v1";

type LogsMap = Record<string, DailyState>;
type WeeklyGoalsMap = Record<string, number>;

type WeightEntry = {
  id: string;
  dateKey: string;
  weight: number;
};

type DayPoint = {
  dateKey: string;
  label: string;
  consumido: number;
  meta: number;
};

type WeekPoint = {
  weekKey: string;
  label: string;
  consumido: number;
  meta: number;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = (day + 6) % 7;
  next.setDate(next.getDate() - diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function shortDate(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function weekLabelFromStartKey(weekStartKey: string) {
  const start = fromDateKey(weekStartKey);
  const end = addDays(start, 6);
  return `${shortDate(start)} - ${shortDate(end)}`;
}

function consumedOfDay(log?: DailyState) {
  if (!log) {
    return 0;
  }
  return log.items.reduce((acc, item) => acc + item.kcalPorcao * item.quantidade, 0);
}

function loadLogs() {
  try {
    const raw = window.localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) {
      return {} as LogsMap;
    }
    return JSON.parse(raw) as LogsMap;
  } catch {
    return {} as LogsMap;
  }
}

function loadWeeklyGoals() {
  try {
    const raw = window.localStorage.getItem(WEEKLY_GOALS_STORAGE_KEY);
    if (!raw) {
      return {} as WeeklyGoalsMap;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {} as WeeklyGoalsMap;
    }

    const validEntries = Object.entries(parsed).filter((entry): entry is [string, number] => {
      return typeof entry[0] === "string" && typeof entry[1] === "number" && Number.isFinite(entry[1]);
    });

    return Object.fromEntries(validEntries);
  } catch {
    return {} as WeeklyGoalsMap;
  }
}

function loadWeightEntries() {
  try {
    const raw = window.localStorage.getItem(WEIGHTS_STORAGE_KEY);
    if (!raw) {
      return [] as WeightEntry[];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as WeightEntry[];
    }

    return parsed
      .filter((entry) => {
        if (!entry || typeof entry !== "object") {
          return false;
        }
        const value = entry as Record<string, unknown>;
        return (
          typeof value.id === "string" &&
          typeof value.dateKey === "string" &&
          typeof value.weight === "number" &&
          Number.isFinite(value.weight)
        );
      })
      .map((entry) => entry as WeightEntry);
  } catch {
    return [] as WeightEntry[];
  }
}

function buildMetaChartPaths(days: DayPoint[]) {
  const width = 760;
  const height = 240;
  const pad = 26;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;

  const maxValue = Math.max(1000, ...days.flatMap((day) => [day.meta, day.consumido])) * 1.06;

  const xFor = (index: number) => {
    if (days.length === 1) {
      return width / 2;
    }
    return pad + (innerWidth * index) / (days.length - 1);
  };

  const yFor = (value: number) => {
    const ratio = Math.max(0, Math.min(1, value / maxValue));
    return height - pad - ratio * innerHeight;
  };

  const consumedPoints = days.map((day, index) => `${xFor(index)},${yFor(day.consumido)}`).join(" ");
  const metaPoints = days.map((day, index) => `${xFor(index)},${yFor(day.meta)}`).join(" ");

  const firstX = xFor(0);
  const lastX = xFor(days.length - 1);
  const areaPath = `M ${firstX} ${height - pad} L ${consumedPoints} L ${lastX} ${height - pad} Z`;

  return {
    width,
    height,
    pad,
    maxValue,
    consumedPoints,
    metaPoints,
    areaPath,
  };
}

function buildWeightChartPaths(entries: WeightEntry[]) {
  const width = 620;
  const height = 190;
  const pad = 24;
  const innerWidth = width - pad * 2;
  const innerHeight = height - pad * 2;

  const values = entries.map((entry) => entry.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const delta = Math.max(0.5, max - min);
  const low = min - 0.2;
  const high = max + 0.2;

  const xFor = (index: number) => {
    if (entries.length === 1) {
      return width / 2;
    }
    return pad + (innerWidth * index) / (entries.length - 1);
  };

  const yFor = (value: number) => {
    const ratio = (value - low) / Math.max(0.1, high - low);
    return height - pad - ratio * innerHeight;
  };

  const points = entries.map((entry, index) => `${xFor(index)},${yFor(entry.weight)}`).join(" ");

  return {
    width,
    height,
    pad,
    min: low,
    max: high,
    delta,
    points,
  };
}

export default function HistoricoPage() {
  const [logsMap, setLogsMap] = useState<LogsMap>({});
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoalsMap>({});
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [dailyMeta, setDailyMeta] = useState(DEFAULT_META_KCAL);
  const [weekGoalInput, setWeekGoalInput] = useState(String(DEFAULT_META_KCAL * 7));
  const [weightInput, setWeightInput] = useState("");
  const [weightDate, setWeightDate] = useState("");

  useEffect(() => {
    const logs = loadLogs();
    const goals = loadWeeklyGoals();
    const weights = loadWeightEntries();

    const localMeta = Number(window.localStorage.getItem(META_STORAGE_KEY) ?? DEFAULT_META_KCAL);
    const normalizedMeta = Number.isFinite(localMeta) && localMeta > 0 ? Math.round(localMeta) : DEFAULT_META_KCAL;

    setLogsMap(logs);
    setWeeklyGoals(goals);
    setWeightEntries(weights);
    setDailyMeta(normalizedMeta);
    setWeightDate(toDateKey());
  }, []);

  const currentWeekStart = useMemo(() => startOfWeek(new Date()), []);
  const currentWeekKey = useMemo(() => toDateKey(currentWeekStart), [currentWeekStart]);

  const days30 = useMemo(() => {
    const today = new Date();
    const points: DayPoint[] = [];

    for (let offset = 29; offset >= 0; offset -= 1) {
      const date = addDays(today, -offset);
      const dateKey = toDateKey(date);
      const dayLog = logsMap[dateKey];

      points.push({
        dateKey,
        label: shortDate(date),
        consumido: consumedOfDay(dayLog),
        meta: dayLog?.meta ?? dailyMeta,
      });
    }

    return points;
  }, [dailyMeta, logsMap]);

  const weekData = useMemo(() => {
    const points: WeekPoint[] = [];

    for (let i = 4; i >= 0; i -= 1) {
      const weekStart = addDays(currentWeekStart, -i * 7);
      const weekKey = toDateKey(weekStart);

      let consumed = 0;
      let metaFromDaily = 0;

      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const dateKey = toDateKey(addDays(weekStart, dayIndex));
        const log = logsMap[dateKey];
        consumed += consumedOfDay(log);
        metaFromDaily += log?.meta ?? dailyMeta;
      }

      points.push({
        weekKey,
        label: weekLabelFromStartKey(weekKey),
        consumido: consumed,
        meta: weeklyGoals[weekKey] ?? metaFromDaily,
      });
    }

    return points;
  }, [currentWeekStart, dailyMeta, logsMap, weeklyGoals]);

  const currentWeek = weekData[weekData.length - 1];
  const previousWeek = weekData[weekData.length - 2];

  useEffect(() => {
    if (!currentWeek) {
      return;
    }
    setWeekGoalInput(String(Math.round(currentWeek.meta)));
  }, [currentWeek]);

  const weekProgress = useMemo(() => {
    if (!currentWeek || currentWeek.meta <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, (currentWeek.consumido / currentWeek.meta) * 100));
  }, [currentWeek]);

  const weeklyDiff = useMemo(() => {
    if (!currentWeek || !previousWeek) {
      return null;
    }
    return currentWeek.consumido - previousWeek.consumido;
  }, [currentWeek, previousWeek]);

  const sortedWeights = useMemo(
    () => [...weightEntries].sort((a, b) => a.dateKey.localeCompare(b.dateKey)),
    [weightEntries],
  );

  const latestWeight = sortedWeights[sortedWeights.length - 1];
  const previousWeight = sortedWeights[sortedWeights.length - 2];

  const weightTrend = useMemo(() => {
    if (!latestWeight || !previousWeight) {
      return null;
    }

    const diff = Number((latestWeight.weight - previousWeight.weight).toFixed(1));

    if (diff > 0.2) {
      return { diff, status: "ganhando peso", tone: "text-amber-500" };
    }
    if (diff < -0.2) {
      return { diff, status: "perdendo peso", tone: "text-emerald-500" };
    }
    return { diff, status: "estável", tone: "text-sky-500" };
  }, [latestWeight, previousWeight]);

  const saveWeeklyGoal = () => {
    const parsed = Number(weekGoalInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    const next = { ...weeklyGoals, [currentWeekKey]: Math.round(parsed) };
    setWeeklyGoals(next);
    window.localStorage.setItem(WEEKLY_GOALS_STORAGE_KEY, JSON.stringify(next));
  };

  const registerWeight = () => {
    const parsed = Number(weightInput.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0 || !weightDate) {
      return;
    }

    const normalizedWeight = Number(parsed.toFixed(1));
    const existing = weightEntries.find((entry) => entry.dateKey === weightDate);

    const next = existing
      ? weightEntries.map((entry) =>
          entry.dateKey === weightDate ? { ...entry, weight: normalizedWeight } : entry,
        )
      : [
          ...weightEntries,
          {
            id: crypto.randomUUID(),
            dateKey: weightDate,
            weight: normalizedWeight,
          },
        ];

    setWeightEntries(next);
    window.localStorage.setItem(WEIGHTS_STORAGE_KEY, JSON.stringify(next));
    setWeightInput("");
  };

  const chartMeta = useMemo(() => buildMetaChartPaths(days30), [days30]);
  const weightChartEntries = useMemo(() => sortedWeights.slice(-8), [sortedWeights]);
  const weightChart = useMemo(() => {
    if (weightChartEntries.length < 2) {
      return null;
    }
    return buildWeightChartPaths(weightChartEntries);
  }, [weightChartEntries]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 p-3 pb-8 sm:p-4 md:p-6">
      <Header />

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="rounded-[26px] border-borda/80 bg-white/85 dark:border-border dark:bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="inline-flex items-center gap-2 text-lg font-bold text-textoPrim dark:text-foreground">
              <LineChart className="h-5 w-5 text-botao" />
              Histórico de 30 dias
            </CardTitle>
            <p className="text-sm text-textoSec dark:text-muted-foreground">Consumo diário comparado com a meta</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-borda/70 bg-rosaClaro/45 p-2.5 dark:border-border dark:bg-secondary/35">
              <svg viewBox={`0 0 ${chartMeta.width} ${chartMeta.height}`} className="h-52 w-full">
                <defs>
                  <linearGradient id="consumed-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e64b8d" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#e64b8d" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {[0.25, 0.5, 0.75].map((ratio) => {
                  const y = chartMeta.height - chartMeta.pad - (chartMeta.height - chartMeta.pad * 2) * ratio;
                  return (
                    <line
                      key={ratio}
                      x1={chartMeta.pad}
                      x2={chartMeta.width - chartMeta.pad}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.14"
                    />
                  );
                })}

                <path d={chartMeta.areaPath} fill="url(#consumed-area)" />
                <polyline points={chartMeta.metaPoints} fill="none" stroke="#8f6a7d" strokeWidth="2" strokeDasharray="6 6" />
                <polyline points={chartMeta.consumedPoints} fill="none" stroke="#e64b8d" strokeWidth="3" strokeLinecap="round" />

                <text x={chartMeta.pad} y={chartMeta.height - 6} fontSize="11" fill="currentColor" opacity="0.65">
                  {days30[0]?.label}
                </text>
                <text
                  x={chartMeta.width / 2}
                  y={chartMeta.height - 6}
                  fontSize="11"
                  fill="currentColor"
                  opacity="0.65"
                  textAnchor="middle"
                >
                  {days30[Math.floor(days30.length / 2)]?.label}
                </text>
                <text
                  x={chartMeta.width - chartMeta.pad}
                  y={chartMeta.height - 6}
                  fontSize="11"
                  fill="currentColor"
                  opacity="0.65"
                  textAnchor="end"
                >
                  {days30[days30.length - 1]?.label}
                </text>
              </svg>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-textoSec dark:text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-botao" /> consumo
              </span>
              <span className="inline-flex items-center gap-1 text-textoSec dark:text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-[#8f6a7d]" /> meta
              </span>
              <span className="font-medium text-textoSec dark:text-muted-foreground">Escala máx.: {toKcal(chartMeta.maxValue)} kcal</span>
            </div>

            <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-borda/70 bg-white/70 p-2 dark:border-border dark:bg-card">
              {days30
                .slice()
                .reverse()
                .map((day) => {
                  const diff = day.consumido - day.meta;
                  const statusTone = diff > 0 ? "text-amber-500" : "text-emerald-500";
                  return (
                    <div key={day.dateKey} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs">
                      <span className="font-semibold text-textoPrim dark:text-foreground">{day.label}</span>
                      <span className="text-textoSec dark:text-muted-foreground">
                        {toKcal(day.consumido)} / {toKcal(day.meta)} kcal
                      </span>
                      <span className={statusTone}>{diff >= 0 ? `+${toKcal(diff)}` : `-${toKcal(Math.abs(diff))}`}</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[26px] border-borda/80 bg-white/85 dark:border-border dark:bg-card/90">
            <CardHeader className="pb-3">
              <CardTitle className="inline-flex items-center gap-2 text-lg font-bold text-textoPrim dark:text-foreground">
                <Target className="h-5 w-5 text-botao" />
                Meta semanal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  value={weekGoalInput}
                  onChange={(event) => setWeekGoalInput(event.target.value)}
                  className="h-10 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                  placeholder="Meta semanal em kcal"
                />
                <Button
                  onClick={saveWeeklyGoal}
                  className="h-10 rounded-xl bg-botao px-3 text-white hover:bg-botao/90"
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  Salvar
                </Button>
              </div>

              <div className="rounded-2xl bg-rosaClaro/65 p-3 dark:bg-secondary/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">
                  Semana atual
                </p>
                <p className="mt-1 text-lg font-bold text-textoPrim dark:text-foreground">
                  {toKcal(currentWeek?.consumido ?? 0)} / {toKcal(currentWeek?.meta ?? 0)} kcal
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/75 dark:bg-muted">
                  <div
                    className="h-full rounded-full bg-botao"
                    style={{ width: `${weekProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-textoSec dark:text-muted-foreground">
                  {Math.round(weekProgress)}% da meta semanal
                </p>
              </div>

              <div className="rounded-2xl border border-borda/70 bg-white/75 p-3 dark:border-border dark:bg-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">
                  Comparação com semana passada
                </p>
                {weeklyDiff === null ? (
                  <p className="mt-1 text-sm text-textoSec dark:text-muted-foreground">Ainda sem dados suficientes.</p>
                ) : (
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-textoPrim dark:text-foreground">
                    {weeklyDiff >= 0 ? <ArrowUp className="h-4 w-4 text-amber-500" /> : <ArrowDown className="h-4 w-4 text-emerald-500" />}
                    {weeklyDiff >= 0 ? "+" : "-"}
                    {toKcal(Math.abs(weeklyDiff))} kcal
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-borda/80 bg-white/85 dark:border-border dark:bg-card/90">
            <CardHeader className="pb-2">
              <CardTitle className="inline-flex items-center gap-2 text-lg font-bold text-textoPrim dark:text-foreground">
                <CalendarClock className="h-5 w-5 text-botao" />
                Resumo semanal (5 semanas)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weekData.map((week) => {
                const pct = week.meta > 0 ? Math.max(0, Math.min(100, (week.consumido / week.meta) * 100)) : 0;
                return (
                  <div key={week.weekKey} className="rounded-xl border border-borda/70 bg-white/70 p-2.5 dark:border-border dark:bg-card">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-textoPrim dark:text-foreground">{week.label}</span>
                      <span className="text-textoSec dark:text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-rosaClaro dark:bg-secondary">
                      <div className="h-full rounded-full bg-botao" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-textoSec dark:text-muted-foreground">
                      {toKcal(week.consumido)} / {toKcal(week.meta)} kcal
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[26px] border-borda/80 bg-white/85 dark:border-border dark:bg-card/90">
          <CardHeader className="pb-3">
            <CardTitle className="inline-flex items-center gap-2 text-lg font-bold text-textoPrim dark:text-foreground">
              <Scale className="h-5 w-5 text-botao" />
              Peso semanal
            </CardTitle>
            <p className="text-sm text-textoSec dark:text-muted-foreground">Registre 1 vez por semana para acompanhar a evolução.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                type="date"
                value={weightDate}
                onChange={(event) => setWeightDate(event.target.value)}
                className="h-10 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
              />
              <Input
                type="number"
                step="0.1"
                min={1}
                value={weightInput}
                onChange={(event) => setWeightInput(event.target.value)}
                className="h-10 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                placeholder="Peso (kg)"
              />
              <Button
                onClick={registerWeight}
                className="h-10 rounded-xl bg-botao px-3 text-white hover:bg-botao/90"
              >
                Salvar
              </Button>
            </div>

            <div className="rounded-2xl border border-borda/70 bg-white/70 p-3 dark:border-border dark:bg-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">Situação atual</p>
              {latestWeight ? (
                <div className="mt-1 space-y-1">
                  <p className="text-lg font-bold text-textoPrim dark:text-foreground">{latestWeight.weight.toFixed(1)} kg</p>
                  {weightTrend ? (
                    <p className={`inline-flex items-center gap-1 text-sm font-semibold ${weightTrend.tone}`}>
                      <TrendingUp className="h-4 w-4" />
                      {weightTrend.status} ({weightTrend.diff > 0 ? "+" : ""}{weightTrend.diff.toFixed(1)} kg)
                    </p>
                  ) : (
                    <p className="text-sm text-textoSec dark:text-muted-foreground">Adicione mais uma pesagem para ver tendência.</p>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-sm text-textoSec dark:text-muted-foreground">Nenhuma pesagem registrada ainda.</p>
              )}
            </div>

            {weightChart ? (
              <div className="rounded-2xl border border-borda/70 bg-rosaClaro/45 p-2.5 dark:border-border dark:bg-secondary/35">
                <svg viewBox={`0 0 ${weightChart.width} ${weightChart.height}`} className="h-40 w-full">
                  <line
                    x1={weightChart.pad}
                    x2={weightChart.width - weightChart.pad}
                    y1={weightChart.height - weightChart.pad}
                    y2={weightChart.height - weightChart.pad}
                    stroke="currentColor"
                    opacity="0.18"
                  />
                  <line
                    x1={weightChart.pad}
                    x2={weightChart.width - weightChart.pad}
                    y1={weightChart.pad}
                    y2={weightChart.pad}
                    stroke="currentColor"
                    opacity="0.1"
                  />
                  <polyline points={weightChart.points} fill="none" stroke="#e64b8d" strokeWidth="3" strokeLinecap="round" />
                  <text x={weightChart.pad} y={14} fontSize="11" fill="currentColor" opacity="0.7">
                    {weightChart.max.toFixed(1)} kg
                  </text>
                  <text x={weightChart.pad} y={weightChart.height - 8} fontSize="11" fill="currentColor" opacity="0.7">
                    {weightChart.min.toFixed(1)} kg
                  </text>
                </svg>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[26px] border-borda/80 bg-white/85 dark:border-border dark:bg-card/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-textoPrim dark:text-foreground">Pesagens registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {sortedWeights
                .slice()
                .reverse()
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl border border-borda/70 bg-white/70 px-3 py-2 text-sm dark:border-border dark:bg-card"
                  >
                    <span className="font-medium text-textoPrim dark:text-foreground">{shortDate(fromDateKey(entry.dateKey))}</span>
                    <span className="font-semibold text-botao">{entry.weight.toFixed(1)} kg</span>
                  </div>
                ))}

              {sortedWeights.length === 0 ? (
                <p className="rounded-xl bg-rosaClaro/50 px-3 py-3 text-sm text-textoSec dark:bg-secondary/70 dark:text-muted-foreground">
                  Sem pesagens ainda. Adicione sua primeira medição semanal.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
