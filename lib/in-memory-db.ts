import { buildInitialFoods, type FoodRecord } from "@/lib/data";

type FoodPayload = {
  name: string;
  porcao: string;
  kcalPorcao: number;
  proteina?: number | null;
  carboidrato?: number | null;
  gordura?: number | null;
  fotoUrl?: string | null;
  favoritos?: boolean;
};

let foodsStore: FoodRecord[] = buildInitialFoods();

function normalizePayload(payload: FoodPayload) {
  return {
    name: payload.name,
    porcao: payload.porcao,
    kcalPorcao: payload.kcalPorcao,
    proteina: payload.proteina ?? null,
    carboidrato: payload.carboidrato ?? null,
    gordura: payload.gordura ?? null,
    fotoUrl: payload.fotoUrl ?? null,
    favoritos: Boolean(payload.favoritos),
  };
}

export const memoryDb = {
  listFoods(search?: string) {
    const query = search?.trim().toLowerCase();
    const filtered = query
      ? foodsStore.filter((food) => food.name.toLowerCase().includes(query))
      : foodsStore;

    return [...filtered].sort((a, b) => {
      if (a.favoritos !== b.favoritos) {
        return a.favoritos ? -1 : 1;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  },

  createFood(payload: FoodPayload) {
    const normalized = normalizePayload(payload);
    const created: FoodRecord = {
      ...normalized,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    foodsStore = [created, ...foodsStore];
    return created;
  },

  updateFood(id: string, payload: Partial<FoodPayload>) {
    const current = foodsStore.find((food) => food.id === id);
    if (!current) {
      return null;
    }

    const updated: FoodRecord = {
      ...current,
      ...payload,
      proteina: payload.proteina ?? current.proteina,
      carboidrato: payload.carboidrato ?? current.carboidrato,
      gordura: payload.gordura ?? current.gordura,
      fotoUrl: payload.fotoUrl ?? current.fotoUrl,
      favoritos: payload.favoritos ?? current.favoritos,
    };

    foodsStore = foodsStore.map((food) => (food.id === id ? updated : food));
    return updated;
  },

  deleteFood(id: string) {
    const exists = foodsStore.some((food) => food.id === id);
    if (!exists) {
      return false;
    }

    foodsStore = foodsStore.filter((food) => food.id !== id);
    return true;
  },
};
