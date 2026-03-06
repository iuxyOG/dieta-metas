import { Prisma, type GoalType as PrismaGoalType } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  buildRecommendedMacroTargets,
  DEFAULT_META_KCAL,
  DEFAULT_PROFILE,
  type DailyCheckInRecord,
  type DailyState,
  type GoalType,
  type LoggedFood,
  type MacroTargets,
  type MealTemplateItem,
  type MealTemplateRecord,
  type PersonalProfile,
  type Refeicao,
  type WeeklyMealPlan,
  type WeeklyMealPlanDay,
  type WeekdayGoalsMap,
  type WeekdayIndex,
} from "@/lib/data";
import { prisma } from "@/lib/prisma";
import type { TrackerPatchPayload } from "@/lib/tracker-api";

const META_SETTING_KEY = "daily-meta";
const MACRO_TARGETS_SETTING_KEY = "macro-targets";
const WEEKDAY_GOALS_SETTING_KEY = "weekday-goals";
const MEAL_TEMPLATES_SETTING_KEY = "meal-templates";
const WEEKLY_MEAL_PLAN_SETTING_KEY = "weekly-meal-plan";
const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const REFEICOES: Refeicao[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"];
const GOAL_TYPES: GoalType[] = ["CUT", "GAIN", "MAINTAIN"];
const VALID_WEEKDAYS = new Set<WeekdayIndex>([0, 1, 2, 3, 4, 5, 6]);

type TrackerSnapshotResponse = {
  meta: number;
  profile: PersonalProfile;
  macroTargets: MacroTargets | null;
  logs: Record<string, DailyState>;
  weeklyGoals: Record<string, number>;
  weeklyMealPlan: WeeklyMealPlan;
  weekdayGoals: WeekdayGoalsMap;
  weights: Array<{
    id: string;
    dateKey: string;
    weight: number;
  }>;
  checkIns: DailyCheckInRecord[];
  mealTemplates: MealTemplateRecord[];
};

function toDateFromDateKey(dateKey: string): Date | null {
  if (!DATE_KEY_REGEX.test(dateKey)) {
    return null;
  }

  const parsed = new Date(`${dateKey}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKeyFromDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function normalizePositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.round(parsed);
}

function normalizeNonNegativeInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed);
}

function normalizePositiveFloat(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Number(parsed.toFixed(2));
}

function normalizeNullablePositiveFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return normalizePositiveFloat(value);
}

function normalizeMacro(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Number(parsed.toFixed(2));
}

function normalizeRefeicao(value: unknown): Refeicao {
  if (typeof value === "string" && REFEICOES.includes(value as Refeicao)) {
    return value as Refeicao;
  }
  return "SNACKS";
}

function normalizeGoalType(value: unknown): GoalType | null {
  if (typeof value === "string" && GOAL_TYPES.includes(value as GoalType)) {
    return value as GoalType;
  }

  return null;
}

function normalizeDateOnly(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return DATE_KEY_REGEX.test(trimmed) ? trimmed : null;
}

function normalizeItem(raw: unknown): LoggedFood | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const name = String(item.name ?? "").trim();
  const porcao = String(item.porcao ?? "").trim();
  const foodId = String(item.foodId ?? "").trim();
  const kcalPorcao = normalizePositiveInt(item.kcalPorcao);
  const quantidade = normalizePositiveFloat(item.quantidade);

  if (!name || !porcao || !foodId || !kcalPorcao || !quantidade) {
    return null;
  }

  return {
    id: typeof item.id === "string" && item.id.trim() ? item.id : crypto.randomUUID(),
    foodId,
    name,
    porcao,
    kcalPorcao,
    proteina: normalizeMacro(item.proteina),
    carboidrato: normalizeMacro(item.carboidrato),
    gordura: normalizeMacro(item.gordura),
    quantidade,
    refeicao: normalizeRefeicao(item.refeicao),
    createdAt:
      typeof item.createdAt === "string" && !Number.isNaN(new Date(item.createdAt).getTime())
        ? item.createdAt
        : new Date().toISOString(),
  };
}

function normalizeDaily(raw: unknown): DailyState | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const daily = raw as Record<string, unknown>;
  const dateKey = String(daily.dateKey ?? "").trim();
  const meta = normalizePositiveInt(daily.meta);
  const date = toDateFromDateKey(dateKey);
  const itemsRaw = Array.isArray(daily.items) ? daily.items : [];

  if (!dateKey || !meta || !date) {
    return null;
  }

  const items = itemsRaw.map(normalizeItem).filter((entry): entry is LoggedFood => Boolean(entry));

  return {
    dateKey,
    meta,
    items,
  };
}

function normalizeWeekday(value: unknown): WeekdayIndex | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || !VALID_WEEKDAYS.has(parsed as WeekdayIndex)) {
    return null;
  }

  return parsed as WeekdayIndex;
}

function normalizeWeekdayGoals(raw: unknown): WeekdayGoalsMap | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const entries = Object.entries(raw as Record<string, unknown>);
  const nextGoals: WeekdayGoalsMap = {};

  for (const [weekdayKey, kcalRaw] of entries) {
    const weekday = normalizeWeekday(weekdayKey);
    const kcal = normalizePositiveInt(kcalRaw);
    if (weekday === null || !kcal) {
      return null;
    }

    nextGoals[weekday] = kcal;
  }

  return nextGoals;
}

function normalizeMacroTargets(raw: unknown): MacroTargets | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const macroTargets = raw as Record<string, unknown>;
  const proteina = normalizePositiveInt(macroTargets.proteina);
  const carboidrato = normalizePositiveInt(macroTargets.carboidrato);
  const gordura = normalizePositiveInt(macroTargets.gordura);

  if (!proteina || !carboidrato || !gordura) {
    return null;
  }

  return {
    proteina,
    carboidrato,
    gordura,
  };
}

function normalizeWeeklyMealPlanDay(raw: unknown): WeeklyMealPlanDay | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const planDay = raw as Record<string, unknown>;
  const nextDay: WeeklyMealPlanDay = {};

  for (const meal of REFEICOES) {
    const templateId = planDay[meal];
    if (templateId === undefined || templateId === null || templateId === "") {
      continue;
    }

    if (typeof templateId !== "string" || !templateId.trim()) {
      return null;
    }

    nextDay[meal] = templateId.trim();
  }

  return nextDay;
}

function normalizeWeeklyMealPlan(raw: unknown): WeeklyMealPlan | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const entries = Object.entries(raw as Record<string, unknown>);
  const nextPlan: WeeklyMealPlan = {};

  for (const [weekdayKey, value] of entries) {
    const weekday = normalizeWeekday(weekdayKey);
    const planDay = normalizeWeeklyMealPlanDay(value);

    if (weekday === null || planDay === null) {
      return null;
    }

    nextPlan[weekday] = planDay;
  }

  return nextPlan;
}

function normalizeMealTemplateItem(raw: unknown): MealTemplateItem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const foodId = String(item.foodId ?? "").trim();
  const name = String(item.name ?? "").trim();
  const porcao = String(item.porcao ?? "").trim();
  const kcalPorcao = normalizePositiveInt(item.kcalPorcao);
  const quantidade = normalizePositiveFloat(item.quantidade);

  if (!foodId || !name || !porcao || !kcalPorcao || !quantidade) {
    return null;
  }

  return {
    foodId,
    name,
    porcao,
    kcalPorcao,
    proteina: normalizeMacro(item.proteina),
    carboidrato: normalizeMacro(item.carboidrato),
    gordura: normalizeMacro(item.gordura),
    quantidade,
  };
}

function normalizeMealTemplate(raw: unknown): MealTemplateRecord | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const template = raw as Record<string, unknown>;
  const name = String(template.name ?? "").trim();
  const refeicao = normalizeRefeicao(template.refeicao);
  const itemsRaw = Array.isArray(template.items) ? template.items : [];
  const items = itemsRaw.map(normalizeMealTemplateItem).filter((item): item is MealTemplateItem => Boolean(item));

  if (!name || items.length === 0) {
    return null;
  }

  const createdAt =
    typeof template.createdAt === "string" && !Number.isNaN(new Date(template.createdAt).getTime())
      ? template.createdAt
      : new Date().toISOString();

  const updatedAt =
    typeof template.updatedAt === "string" && !Number.isNaN(new Date(template.updatedAt).getTime())
      ? template.updatedAt
      : createdAt;

  return {
    id: typeof template.id === "string" && template.id.trim() ? template.id : crypto.randomUUID(),
    name,
    refeicao,
    items,
    createdAt,
    updatedAt,
  };
}

function normalizeMealTemplates(raw: unknown): MealTemplateRecord[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }

  const templates = raw.map(normalizeMealTemplate);
  if (templates.some((template) => !template)) {
    return null;
  }

  return templates.filter((template): template is MealTemplateRecord => Boolean(template));
}

function normalizeProfile(raw: unknown): PersonalProfile | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const profile = raw as Record<string, unknown>;
  const name = String(profile.name ?? "").trim();
  const goalType = normalizeGoalType(profile.goalType);
  const dailyWaterGoal = normalizePositiveInt(profile.dailyWaterGoal);
  const targetDate = normalizeDateOnly(profile.targetDate);

  if (!name || !goalType || !dailyWaterGoal) {
    return null;
  }

  return {
    id: typeof profile.id === "string" && profile.id.trim() ? profile.id : DEFAULT_PROFILE.id,
    name,
    goalType,
    targetWeight: normalizeNullablePositiveFloat(profile.targetWeight),
    weeklyPace: normalizeNullablePositiveFloat(profile.weeklyPace),
    targetDate,
    dailyWaterGoal,
    focus: profile.focus ? String(profile.focus).trim() || null : null,
  };
}

function normalizeRating(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    return null;
  }

  return parsed;
}

function normalizeSleepHours(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 24) {
    return null;
  }

  return Number(parsed.toFixed(1));
}

function normalizeCheckIn(raw: unknown): DailyCheckInRecord | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const checkIn = raw as Record<string, unknown>;
  const dateKey = normalizeDateOnly(checkIn.dateKey);
  const mood = normalizeRating(checkIn.mood);
  const energy = normalizeRating(checkIn.energy);
  const hunger = normalizeRating(checkIn.hunger);
  const waterGlasses = normalizeNonNegativeInt(checkIn.waterGlasses);
  const sleepHours = normalizeSleepHours(checkIn.sleepHours);

  if (!dateKey || !mood || !energy || !hunger || waterGlasses === null || sleepHours === null) {
    return null;
  }

  const createdAt =
    typeof checkIn.createdAt === "string" && !Number.isNaN(new Date(checkIn.createdAt).getTime())
      ? checkIn.createdAt
      : new Date().toISOString();

  const updatedAt =
    typeof checkIn.updatedAt === "string" && !Number.isNaN(new Date(checkIn.updatedAt).getTime())
      ? checkIn.updatedAt
      : createdAt;

  return {
    id: typeof checkIn.id === "string" && checkIn.id.trim() ? checkIn.id : crypto.randomUUID(),
    dateKey,
    mood,
    energy,
    hunger,
    waterGlasses,
    sleepHours,
    note: checkIn.note ? String(checkIn.note).trim() || null : null,
    createdAt,
    updatedAt,
  };
}

function parseStoredJson(value: string | null | undefined, fallback: unknown) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function sanitizeSnapshot(snapshot: TrackerSnapshotResponse): TrackerSnapshotResponse {
  return {
    meta: snapshot.meta,
    profile: snapshot.profile,
    macroTargets: snapshot.macroTargets,
    logs: snapshot.logs,
    weeklyGoals: snapshot.weeklyGoals,
    weeklyMealPlan: snapshot.weeklyMealPlan,
    weekdayGoals: snapshot.weekdayGoals,
    weights: snapshot.weights,
    checkIns: snapshot.checkIns,
    mealTemplates: snapshot.mealTemplates,
  };
}

async function ensureOwnerUser() {
  const existing = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) {
    return existing;
  }

  return prisma.user.create({ data: {} });
}

async function ensureOwnerUserTx(tx: Prisma.TransactionClient) {
  const existing = await tx.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) {
    return existing;
  }

  return tx.user.create({ data: {} });
}

async function loadSnapshot(): Promise<TrackerSnapshotResponse> {
  const owner = await ensureOwnerUser();

  const [setting, macroTargetsSetting, weekdayGoalSetting, mealTemplatesSetting, weeklyMealPlanSetting, dailyLogs, goals, weights, checkIns] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: META_SETTING_KEY } }),
    prisma.appSetting.findUnique({ where: { key: MACRO_TARGETS_SETTING_KEY } }),
    prisma.appSetting.findUnique({ where: { key: WEEKDAY_GOALS_SETTING_KEY } }),
    prisma.appSetting.findUnique({ where: { key: MEAL_TEMPLATES_SETTING_KEY } }),
    prisma.appSetting.findUnique({ where: { key: WEEKLY_MEAL_PLAN_SETTING_KEY } }),
    prisma.dailyLog.findMany({
      orderBy: { date: "asc" },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.weeklyGoal.findMany({ orderBy: { weekKey: "asc" } }),
    prisma.weightEntry.findMany({ orderBy: { dateKey: "asc" } }),
    prisma.dailyCheckIn.findMany({ orderBy: { dateKey: "asc" } }),
  ]);

  const parsedMeta = normalizePositiveInt(setting?.value);
  const meta = parsedMeta ?? DEFAULT_META_KCAL;
  const weekdayGoals = normalizeWeekdayGoals(parseStoredJson(weekdayGoalSetting?.value, {})) ?? {};
  const mealTemplates = normalizeMealTemplates(parseStoredJson(mealTemplatesSetting?.value, [])) ?? [];

  const profile: PersonalProfile = {
    id: owner.id,
    name: owner.name,
    goalType: owner.goalType as GoalType,
    targetWeight: owner.targetWeight,
    weeklyPace: owner.weeklyPace,
    targetDate: owner.targetDate ? toDateKeyFromDate(owner.targetDate) : null,
    dailyWaterGoal: owner.dailyWaterGoal,
    focus: owner.focus,
  };
  const macroTargets =
    normalizeMacroTargets(parseStoredJson(macroTargetsSetting?.value, null)) ??
    buildRecommendedMacroTargets(meta, profile);
  const weeklyMealPlan = normalizeWeeklyMealPlan(parseStoredJson(weeklyMealPlanSetting?.value, {})) ?? {};

  const logs = Object.fromEntries(
    dailyLogs.map((log) => [
      log.dateKey,
      {
        dateKey: log.dateKey,
        meta: log.meta,
        items: log.items.map((item) => ({
          id: item.id,
          foodId: item.foodId,
          name: item.name,
          porcao: item.porcao,
          kcalPorcao: item.kcalPorcao,
          proteina: item.proteina,
          carboidrato: item.carboidrato,
          gordura: item.gordura,
          quantidade: item.quantidade,
          refeicao: item.refeicao,
          createdAt: item.createdAt.toISOString(),
        })),
      },
    ]),
  ) as Record<string, DailyState>;

  const weeklyGoals = Object.fromEntries(goals.map((goal) => [goal.weekKey, goal.kcal]));
  const mappedWeights = weights.map((entry) => ({
    id: entry.id,
    dateKey: entry.dateKey,
    weight: entry.weight,
  }));
  const mappedCheckIns = checkIns.map((entry) => ({
    id: entry.id,
    dateKey: entry.dateKey,
    mood: entry.mood,
    energy: entry.energy,
    hunger: entry.hunger,
    waterGlasses: entry.waterGlasses,
    sleepHours: entry.sleepHours,
    note: entry.note,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  return {
    meta,
    profile,
    macroTargets,
    logs,
    weeklyGoals,
    weeklyMealPlan,
    weekdayGoals,
    weights: mappedWeights,
    checkIns: mappedCheckIns,
    mealTemplates,
  };
}

export async function GET() {
  try {
    const snapshot = await loadSnapshot();
    return NextResponse.json(sanitizeSnapshot(snapshot));
  } catch {
    return NextResponse.json({ error: "Falha ao carregar dados do banco de dados" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as TrackerPatchPayload | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const nextMeta = body.meta !== undefined ? normalizePositiveInt(body.meta) : null;
  const nextProfile = body.profile !== undefined ? normalizeProfile(body.profile) : undefined;
  const nextMacroTargets = body.macroTargets !== undefined ? normalizeMacroTargets(body.macroTargets) : undefined;
  const nextDaily = body.daily !== undefined ? normalizeDaily(body.daily) : null;
  const nextWeeklyMealPlan = body.weeklyMealPlan !== undefined ? normalizeWeeklyMealPlan(body.weeklyMealPlan) : undefined;
  const nextWeekdayGoals = body.weekdayGoals !== undefined ? normalizeWeekdayGoals(body.weekdayGoals) : undefined;
  const nextMealTemplates = body.mealTemplates !== undefined ? normalizeMealTemplates(body.mealTemplates) : undefined;
  const nextCheckIn = body.checkIn !== undefined ? normalizeCheckIn(body.checkIn) : undefined;

  const weeklyGoalKcal =
    body.weeklyGoal && typeof body.weeklyGoal === "object"
      ? normalizePositiveInt(body.weeklyGoal.kcal)
      : null;

  const nextWeeklyGoal =
    body.weeklyGoal &&
    typeof body.weeklyGoal === "object" &&
    DATE_KEY_REGEX.test(String(body.weeklyGoal.weekKey ?? "")) &&
    weeklyGoalKcal
      ? {
          weekKey: String(body.weeklyGoal.weekKey),
          kcal: weeklyGoalKcal,
        }
      : null;

  const weightValue = body.weight && typeof body.weight === "object" ? normalizePositiveFloat(body.weight.weight) : null;

  const nextWeight =
    body.weight &&
    typeof body.weight === "object" &&
    DATE_KEY_REGEX.test(String(body.weight.dateKey ?? "")) &&
    weightValue
      ? {
          dateKey: String(body.weight.dateKey),
          weight: Number(weightValue.toFixed(1)),
        }
      : null;

  if (body.meta !== undefined && !nextMeta) {
    return NextResponse.json({ error: "Meta inválida" }, { status: 400 });
  }

  if (body.profile !== undefined && !nextProfile) {
    return NextResponse.json({ error: "Perfil inválido" }, { status: 400 });
  }

  if (body.daily !== undefined && !nextDaily) {
    return NextResponse.json({ error: "Registro diário inválido" }, { status: 400 });
  }

  if (body.macroTargets !== undefined && !nextMacroTargets) {
    return NextResponse.json({ error: "Macros inválidos" }, { status: 400 });
  }

  if (body.weeklyMealPlan !== undefined && !nextWeeklyMealPlan) {
    return NextResponse.json({ error: "Plano semanal inválido" }, { status: 400 });
  }

  if (body.weekdayGoals !== undefined && !nextWeekdayGoals) {
    return NextResponse.json({ error: "Metas por dia inválidas" }, { status: 400 });
  }

  if (body.weeklyGoal !== undefined && !nextWeeklyGoal) {
    return NextResponse.json({ error: "Meta semanal inválida" }, { status: 400 });
  }

  if (body.weight !== undefined && !nextWeight) {
    return NextResponse.json({ error: "Peso inválido" }, { status: 400 });
  }

  if (body.checkIn !== undefined && !nextCheckIn) {
    return NextResponse.json({ error: "Check-in inválido" }, { status: 400 });
  }

  if (body.mealTemplates !== undefined && !nextMealTemplates) {
    return NextResponse.json({ error: "Modelos de refeição inválidos" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const owner = await ensureOwnerUserTx(tx);

      if (nextMeta) {
        await tx.appSetting.upsert({
          where: { key: META_SETTING_KEY },
          create: { key: META_SETTING_KEY, value: String(nextMeta) },
          update: { value: String(nextMeta) },
        });
      }

      if (nextProfile) {
        await tx.user.update({
          where: { id: owner.id },
          data: {
            name: nextProfile.name,
            goalType: nextProfile.goalType as PrismaGoalType,
            targetWeight: nextProfile.targetWeight,
            weeklyPace: nextProfile.weeklyPace,
            targetDate: nextProfile.targetDate ? toDateFromDateKey(nextProfile.targetDate) : null,
            dailyWaterGoal: nextProfile.dailyWaterGoal,
            focus: nextProfile.focus,
          },
        });
      }

      if (nextMacroTargets !== undefined) {
        await tx.appSetting.upsert({
          where: { key: MACRO_TARGETS_SETTING_KEY },
          create: { key: MACRO_TARGETS_SETTING_KEY, value: JSON.stringify(nextMacroTargets) },
          update: { value: JSON.stringify(nextMacroTargets) },
        });
      }

      if (nextWeeklyMealPlan !== undefined) {
        await tx.appSetting.upsert({
          where: { key: WEEKLY_MEAL_PLAN_SETTING_KEY },
          create: { key: WEEKLY_MEAL_PLAN_SETTING_KEY, value: JSON.stringify(nextWeeklyMealPlan) },
          update: { value: JSON.stringify(nextWeeklyMealPlan) },
        });
      }

      if (nextWeekdayGoals !== undefined) {
        await tx.appSetting.upsert({
          where: { key: WEEKDAY_GOALS_SETTING_KEY },
          create: { key: WEEKDAY_GOALS_SETTING_KEY, value: JSON.stringify(nextWeekdayGoals) },
          update: { value: JSON.stringify(nextWeekdayGoals) },
        });
      }

      if (nextDaily) {
        const date = toDateFromDateKey(nextDaily.dateKey) as Date;
        const consumido = Math.round(
          nextDaily.items.reduce((acc, item) => acc + item.kcalPorcao * item.quantidade, 0),
        );

        const dailyLog = await tx.dailyLog.upsert({
          where: { dateKey: nextDaily.dateKey },
          create: {
            dateKey: nextDaily.dateKey,
            date,
            meta: nextDaily.meta,
            consumido,
          },
          update: {
            date,
            meta: nextDaily.meta,
            consumido,
          },
        });

        await tx.logItem.deleteMany({ where: { dailyLogId: dailyLog.id } });

        if (nextDaily.items.length > 0) {
          await tx.logItem.createMany({
            data: nextDaily.items.map((item) => ({
              id: item.id,
              dailyLogId: dailyLog.id,
              foodId: item.foodId,
              quantidade: item.quantidade,
              refeicao: item.refeicao,
              name: item.name,
              porcao: item.porcao,
              kcalPorcao: item.kcalPorcao,
              proteina: item.proteina,
              carboidrato: item.carboidrato,
              gordura: item.gordura,
              createdAt: new Date(item.createdAt),
            })),
          });
        }
      }

      if (nextWeeklyGoal) {
        await tx.weeklyGoal.upsert({
          where: { weekKey: nextWeeklyGoal.weekKey },
          create: {
            weekKey: nextWeeklyGoal.weekKey,
            kcal: nextWeeklyGoal.kcal,
          },
          update: {
            kcal: nextWeeklyGoal.kcal,
          },
        });
      }

      if (nextWeight) {
        await tx.weightEntry.upsert({
          where: { dateKey: nextWeight.dateKey },
          create: {
            dateKey: nextWeight.dateKey,
            weight: nextWeight.weight,
          },
          update: {
            weight: nextWeight.weight,
          },
        });
      }

      if (nextCheckIn) {
        await tx.dailyCheckIn.upsert({
          where: { dateKey: nextCheckIn.dateKey },
          create: {
            dateKey: nextCheckIn.dateKey,
            mood: nextCheckIn.mood,
            energy: nextCheckIn.energy,
            hunger: nextCheckIn.hunger,
            waterGlasses: nextCheckIn.waterGlasses,
            sleepHours: nextCheckIn.sleepHours,
            note: nextCheckIn.note,
            createdAt: new Date(nextCheckIn.createdAt ?? new Date().toISOString()),
            updatedAt: new Date(nextCheckIn.updatedAt ?? new Date().toISOString()),
            userId: owner.id,
          },
          update: {
            mood: nextCheckIn.mood,
            energy: nextCheckIn.energy,
            hunger: nextCheckIn.hunger,
            waterGlasses: nextCheckIn.waterGlasses,
            sleepHours: nextCheckIn.sleepHours,
            note: nextCheckIn.note,
            updatedAt: new Date(nextCheckIn.updatedAt ?? new Date().toISOString()),
            userId: owner.id,
          },
        });
      }

      if (nextMealTemplates !== undefined) {
        await tx.appSetting.upsert({
          where: { key: MEAL_TEMPLATES_SETTING_KEY },
          create: { key: MEAL_TEMPLATES_SETTING_KEY, value: JSON.stringify(nextMealTemplates) },
          update: { value: JSON.stringify(nextMealTemplates) },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao salvar no banco de dados" }, { status: 500 });
  }
}
