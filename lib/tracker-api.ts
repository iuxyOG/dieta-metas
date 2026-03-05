import { DEFAULT_META_KCAL, type DailyState } from "@/lib/data";

export type WeeklyGoalsMap = Record<string, number>;

export type WeightEntryRecord = {
  id: string;
  dateKey: string;
  weight: number;
};

export type LogsMap = Record<string, DailyState>;

export type TrackerSnapshot = {
  meta: number;
  logs: LogsMap;
  weeklyGoals: WeeklyGoalsMap;
  weights: WeightEntryRecord[];
};

export type TrackerPatchPayload = {
  meta?: number;
  daily?: DailyState;
  weeklyGoal?: {
    weekKey: string;
    kcal: number;
  };
  weight?: {
    dateKey: string;
    weight: number;
  };
};

const FALLBACK_SNAPSHOT: TrackerSnapshot = {
  meta: DEFAULT_META_KCAL,
  logs: {},
  weeklyGoals: {},
  weights: [],
};

export async function fetchTrackerSnapshot(): Promise<TrackerSnapshot> {
  const response = await fetch("/api/tracker", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return FALLBACK_SNAPSHOT;
  }

  const payload = (await response.json().catch(() => null)) as TrackerSnapshot | null;
  if (!payload || typeof payload !== "object") {
    return FALLBACK_SNAPSHOT;
  }

  const meta = Number(payload.meta);
  return {
    meta: Number.isFinite(meta) && meta > 0 ? Math.round(meta) : DEFAULT_META_KCAL,
    logs: payload.logs && typeof payload.logs === "object" ? payload.logs : {},
    weeklyGoals: payload.weeklyGoals && typeof payload.weeklyGoals === "object" ? payload.weeklyGoals : {},
    weights: Array.isArray(payload.weights) ? payload.weights : [],
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
