import {
  DEFAULT_META_KCAL,
  DEFAULT_PROFILE,
  type DailyCheckInRecord,
  type DailyState,
  type MacroTargets,
  type MealTemplateRecord,
  type PersonalProfile,
  type WeeklyMealPlan,
  type WeekdayGoalsMap,
} from "@/lib/data";

export type WeeklyGoalsMap = Record<string, number>;

export type WeightEntryRecord = {
  id: string;
  dateKey: string;
  weight: number;
};

export type LogsMap = Record<string, DailyState>;

export type TrackerSnapshot = {
  meta: number;
  profile: PersonalProfile;
  macroTargets: MacroTargets | null;
  logs: LogsMap;
  weeklyGoals: WeeklyGoalsMap;
  weeklyMealPlan: WeeklyMealPlan;
  weekdayGoals: WeekdayGoalsMap;
  weights: WeightEntryRecord[];
  checkIns: DailyCheckInRecord[];
  mealTemplates: MealTemplateRecord[];
};

export type TrackerPatchPayload = {
  meta?: number;
  profile?: PersonalProfile;
  macroTargets?: MacroTargets;
  daily?: DailyState;
  weeklyMealPlan?: WeeklyMealPlan;
  weekdayGoals?: WeekdayGoalsMap;
  weeklyGoal?: {
    weekKey: string;
    kcal: number;
  };
  weight?: {
    dateKey: string;
    weight: number;
  };
  checkIn?: DailyCheckInRecord;
  mealTemplates?: MealTemplateRecord[];
};

export async function fetchTrackerSnapshot(): Promise<TrackerSnapshot> {
  const response = await fetch("/api/tracker", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Falha ao carregar tracker");
  }

  const payload = (await response.json().catch(() => null)) as TrackerSnapshot | null;
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload de tracker invalido");
  }

  const meta = Number(payload.meta);
  return {
    meta: Number.isFinite(meta) && meta > 0 ? Math.round(meta) : DEFAULT_META_KCAL,
    profile:
      payload.profile && typeof payload.profile === "object"
        ? {
            ...DEFAULT_PROFILE,
            ...payload.profile,
          }
        : DEFAULT_PROFILE,
    macroTargets:
      payload.macroTargets && typeof payload.macroTargets === "object" ? payload.macroTargets : null,
    logs: payload.logs && typeof payload.logs === "object" ? payload.logs : {},
    weeklyGoals: payload.weeklyGoals && typeof payload.weeklyGoals === "object" ? payload.weeklyGoals : {},
    weeklyMealPlan: payload.weeklyMealPlan && typeof payload.weeklyMealPlan === "object" ? payload.weeklyMealPlan : {},
    weekdayGoals: payload.weekdayGoals && typeof payload.weekdayGoals === "object" ? payload.weekdayGoals : {},
    weights: Array.isArray(payload.weights) ? payload.weights : [],
    checkIns: Array.isArray(payload.checkIns) ? payload.checkIns : [],
    mealTemplates: Array.isArray(payload.mealTemplates) ? payload.mealTemplates : [],
  };
}

export async function patchTracker(payload: TrackerPatchPayload): Promise<boolean> {
  const response = await fetch("/api/tracker", {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.ok;
}
