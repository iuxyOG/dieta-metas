export type Refeicao = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACKS";

export type FoodSeed = {
  name: string;
  category?: FoodCategory;
  porcao: string;
  kcalPorcao: number;
  proteina?: number;
  carboidrato?: number;
  gordura?: number;
  fotoUrl?: string;
  favoritos?: boolean;
};

export type FoodRecord = {
  id: string;
  name: string;
  category: FoodCategory;
  porcao: string;
  kcalPorcao: number;
  proteina: number | null;
  carboidrato: number | null;
  gordura: number | null;
  fotoUrl: string | null;
  createdAt: string;
  favoritos: boolean;
};

export type LoggedFood = {
  id: string;
  foodId: string;
  name: string;
  porcao: string;
  kcalPorcao: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  quantidade: number;
  refeicao: Refeicao;
  createdAt: string;
};

export type DailyState = {
  dateKey: string;
  meta: number;
  items: LoggedFood[];
};

export type GoalType = "CUT" | "GAIN" | "MAINTAIN";

export type PersonalProfile = {
  id: string;
  name: string;
  goalType: GoalType;
  targetWeight: number | null;
  weeklyPace: number | null;
  targetDate: string | null;
  dailyWaterGoal: number;
  focus: string | null;
};

export type DailyCheckInRecord = {
  id: string;
  dateKey: string;
  mood: number;
  energy: number;
  hunger: number;
  waterGlasses: number;
  sleepHours: number;
  note: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MacroTargets = {
  proteina: number;
  carboidrato: number;
  gordura: number;
};

export const weekdayOrder = [1, 2, 3, 4, 5, 6, 0] as const;
export type WeekdayIndex = (typeof weekdayOrder)[number];
export type WeekdayGoalsMap = Partial<Record<WeekdayIndex, number>>;

export type FoodCategory =
  | "PROTEIN"
  | "CARB"
  | "FRUIT"
  | "VEGETABLE"
  | "DAIRY"
  | "DRINK"
  | "SNACK"
  | "SWEET"
  | "OTHER";

export type MealTemplateItem = {
  foodId: string;
  name: string;
  porcao: string;
  kcalPorcao: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
  quantidade: number;
};

export type MealTemplateRecord = {
  id: string;
  name: string;
  refeicao: Refeicao;
  items: MealTemplateItem[];
  createdAt: string;
  updatedAt: string;
};

export type WeeklyMealPlanDay = Partial<Record<Refeicao, string>>;
export type WeeklyMealPlan = Partial<Record<WeekdayIndex, WeeklyMealPlanDay>>;

export const DEFAULT_META_KCAL = 2500;
export const DEFAULT_WATER_GOAL = 8;

export const DEFAULT_PROFILE: PersonalProfile = {
  id: "local-profile",
  name: "Jhullya Isabela",
  goalType: "MAINTAIN",
  targetWeight: null,
  weeklyPace: null,
  targetDate: null,
  dailyWaterGoal: DEFAULT_WATER_GOAL,
  focus: "Consistência primeiro. Ajustes depois.",
};

export type DietBaseOption = {
  id: string;
  refeicao: Refeicao;
  horario: string;
  title: string;
  description: string[];
  kcal: number;
  proteina: number;
  carboidrato: number;
  gordura: number;
};

export type DietBaseGroup = {
  id: string;
  refeicao: Refeicao;
  horario: string;
  title: string;
  note?: string;
  options: DietBaseOption[];
};

export const initialFoods: FoodSeed[] = [
  { name: "Frango grelhado", category: "PROTEIN", porcao: "200g", kcalPorcao: 250, proteina: 45, favoritos: true },
  { name: "Arroz branco", category: "CARB", porcao: "200g", kcalPorcao: 300, carboidrato: 65 },
  { name: "Feijão carioca", category: "CARB", porcao: "150g", kcalPorcao: 150, carboidrato: 25 },
  { name: "Ovo cozido", category: "PROTEIN", porcao: "1 un", kcalPorcao: 80, proteina: 6 },
  { name: "Espaguete c/ frango", category: "SNACK", porcao: "300g", kcalPorcao: 450, proteina: 30 },
  { name: "Shake whey", category: "DRINK", porcao: "1 scoop", kcalPorcao: 200, proteina: 30 },
  { name: "Banana prata", category: "FRUIT", porcao: "1 un", kcalPorcao: 100, carboidrato: 23 },
  { name: "Batata doce", category: "CARB", porcao: "200g", kcalPorcao: 180, carboidrato: 40 },
  { name: "Salada alface/tomate", category: "VEGETABLE", porcao: "200g", kcalPorcao: 50 },
  { name: "Iogurte natural", category: "DAIRY", porcao: "170g", kcalPorcao: 100, proteina: 5 },
  { name: "Pão integral", category: "CARB", porcao: "1 fatia", kcalPorcao: 70, carboidrato: 12 },
  { name: "Açai c/ whey", category: "SNACK", porcao: "300g", kcalPorcao: 350, proteina: 25 },
  { name: "Coxinha frango", category: "SNACK", porcao: "1 un", kcalPorcao: 280 },
  { name: "Maçã", category: "FRUIT", porcao: "1 un", kcalPorcao: 80 },
  { name: "Café c/ leite", category: "DRINK", porcao: "200ml", kcalPorcao: 120 },
  { name: "Tapioca com queijo", category: "CARB", porcao: "1 un", kcalPorcao: 260, carboidrato: 35 },
  { name: "Pão de sal", category: "CARB", porcao: "1 un", kcalPorcao: 140, carboidrato: 28 },
  { name: "Rap10", category: "CARB", porcao: "1 un", kcalPorcao: 120, carboidrato: 22 },
  { name: "Tapioca", category: "CARB", porcao: "120g", kcalPorcao: 250, carboidrato: 60, favoritos: true },
  { name: "Queijo muçarela", category: "DAIRY", porcao: "1 fatia", kcalPorcao: 70, proteina: 5, gordura: 5 },
  { name: "Requeijão", category: "DAIRY", porcao: "2 colheres", kcalPorcao: 80, gordura: 7 },
  { name: "Aveia", category: "CARB", porcao: "20g", kcalPorcao: 78, proteina: 3, carboidrato: 13 },
  { name: "Suco natural", category: "DRINK", porcao: "250ml", kcalPorcao: 120, carboidrato: 28 },
  { name: "Purê de batata", category: "CARB", porcao: "100g", kcalPorcao: 110, carboidrato: 18 },
  { name: "Carne moída", category: "PROTEIN", porcao: "120g", kcalPorcao: 250, proteina: 28, gordura: 14 },
  { name: "Batata palha", category: "SNACK", porcao: "20g", kcalPorcao: 110, carboidrato: 12, gordura: 7 },
  { name: "Feijão preto", category: "CARB", porcao: "100g", kcalPorcao: 77, proteina: 5, carboidrato: 14 },
  { name: "Bife grelhado", category: "PROTEIN", porcao: "120g", kcalPorcao: 240, proteina: 30, gordura: 12 },
  { name: "Filé de frango", category: "PROTEIN", porcao: "150g", kcalPorcao: 240, proteina: 45, favoritos: true },
  { name: "Milho verde", category: "VEGETABLE", porcao: "100g", kcalPorcao: 86, carboidrato: 19 },
  { name: "Doce de leite", category: "SWEET", porcao: "30g", kcalPorcao: 95, carboidrato: 16 },
  { name: "Leite integral", category: "DAIRY", porcao: "200ml", kcalPorcao: 120, proteina: 6, carboidrato: 9, gordura: 6 },
  { name: "Hipercalórico", category: "DRINK", porcao: "30g", kcalPorcao: 115, carboidrato: 20, proteina: 5 },
];

export const mealOrder: Refeicao[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"];

export const mealLabels: Record<Refeicao, string> = {
  BREAKFAST: "Café da manhã",
  LUNCH: "Almoço",
  DINNER: "Jantar",
  SNACKS: "Lanches",
};

export const mealTargetRatios: Record<Refeicao, number> = {
  BREAKFAST: 0.25,
  LUNCH: 0.35,
  DINNER: 0.25,
  SNACKS: 0.15,
};

export const foodCategoryLabels: Record<FoodCategory, string> = {
  PROTEIN: "Proteína",
  CARB: "Carbo",
  FRUIT: "Fruta",
  VEGETABLE: "Vegetais",
  DAIRY: "Laticínio",
  DRINK: "Bebida",
  SNACK: "Lanche",
  SWEET: "Doce",
  OTHER: "Outros",
};

export const goalTypeLabels: Record<GoalType, string> = {
  CUT: "Secar",
  GAIN: "Ganhar massa",
  MAINTAIN: "Manter",
};

const almocoJantaBase = [
  {
    key: "opcao-1",
    title: "Opção 1",
    description: ["150g arroz", "100g purê de batata", "120g frango", "salada", "250ml suco"],
    kcal: 780,
    proteina: 45,
    carboidrato: 110,
    gordura: 16,
  },
  {
    key: "opcao-2",
    title: "Opção 2",
    description: ["150g arroz", "120g carne moída", "batata palha", "salada", "250ml suco"],
    kcal: 830,
    proteina: 36,
    carboidrato: 112,
    gordura: 24,
  },
  {
    key: "opcao-3",
    title: "Opção 3",
    description: ["200g macarrão", "120g carne moída ou bife", "salada", "250ml suco"],
    kcal: 860,
    proteina: 38,
    carboidrato: 120,
    gordura: 22,
  },
  {
    key: "opcao-4",
    title: "Opção 4",
    description: ["150g arroz", "100g feijão preto", "120g proteína", "salada", "250ml suco"],
    kcal: 760,
    proteina: 42,
    carboidrato: 102,
    gordura: 14,
  },
  {
    key: "opcao-5-receita",
    title: "Opção 5 (Receita)",
    description: ["200g macarrão", "150g filé de frango", "1/2 latinha de milho", "80g maionese"],
    kcal: 980,
    proteina: 55,
    carboidrato: 115,
    gordura: 31,
  },
];

export const dietaBase2500: { meta: number; groups: DietBaseGroup[] } = {
  meta: DEFAULT_META_KCAL,
  groups: [
    {
      id: "cafe-manha",
      refeicao: "BREAKFAST",
      horario: "06:10",
      title: "Café da manhã",
      options: [
        {
          id: "cafe-opcao-1",
          refeicao: "BREAKFAST",
          horario: "06:10",
          title: "Opção 1",
          description: [
            "Base: 2 fatias pão, pão de sal, rap10 ou tapioca (120g)",
            "2 ovos",
            "1 fatia queijo ou 2 colheres requeijão",
            "1 fruta + 20g aveia ou 2 frutas",
          ],
          kcal: 640,
          proteina: 28,
          carboidrato: 90,
          gordura: 20,
        },
        {
          id: "cafe-opcao-2",
          refeicao: "BREAKFAST",
          horario: "06:10",
          title: "Opção 2",
          description: ["120g tapioca", "50g frango", "20g queijo ou 2 colheres requeijão", "250ml suco"],
          kcal: 560,
          proteina: 27,
          carboidrato: 95,
          gordura: 10,
        },
      ],
    },
    {
      id: "almoco",
      refeicao: "LUNCH",
      horario: "11:30",
      title: "Almoço",
      note: "Sobremesa opcional: 1 bombom, paçoca ou 1 colher de doce de leite.",
      options: almocoJantaBase.map((item) => ({
        id: `almoco-${item.key}`,
        refeicao: "LUNCH" as const,
        horario: "11:30",
        title: item.title,
        description: item.description,
        kcal: item.kcal,
        proteina: item.proteina,
        carboidrato: item.carboidrato,
        gordura: item.gordura,
      })),
    },
    {
      id: "cafe-tarde",
      refeicao: "SNACKS",
      horario: "16:00",
      title: "Café da tarde",
      options: [
        {
          id: "tarde-opcao-1",
          refeicao: "SNACKS",
          horario: "16:00",
          title: "Opção 1",
          description: [
            "Base: 2 fatias pão, pão de sal, rap10 ou tapioca (120g)",
            "40g de proteína",
            "1 fatia queijo ou 2 colheres requeijão",
          ],
          kcal: 500,
          proteina: 34,
          carboidrato: 58,
          gordura: 14,
        },
        {
          id: "tarde-opcao-2",
          refeicao: "SNACKS",
          horario: "16:00",
          title: "Opção 2",
          description: ["2 fatias pão de forma", "40g doce de leite", "1 banana", "200ml leite", "1 scoop whey"],
          kcal: 620,
          proteina: 38,
          carboidrato: 82,
          gordura: 16,
        },
        {
          id: "tarde-opcao-3",
          refeicao: "SNACKS",
          horario: "16:00",
          title: "Opção 3 (Panqueca)",
          description: ["2 ovos", "1 banana", "1 scoop whey", "20g farinha de aveia", "mel"],
          kcal: 520,
          proteina: 39,
          carboidrato: 50,
          gordura: 14,
        },
        {
          id: "tarde-opcao-4",
          refeicao: "SNACKS",
          horario: "16:00",
          title: "Opção 4",
          description: ["iogurte natural", "1 fruta", "1 scoop whey", "30g doce de leite"],
          kcal: 430,
          proteina: 33,
          carboidrato: 45,
          gordura: 9,
        },
      ],
    },
    {
      id: "janta",
      refeicao: "DINNER",
      horario: "19:00",
      title: "Janta",
      note: "Sobremesa opcional: 1 bombom, paçoca ou 1 colher de doce de leite.",
      options: almocoJantaBase.map((item) => ({
        id: `janta-${item.key}`,
        refeicao: "DINNER" as const,
        horario: "19:00",
        title: item.title,
        description: item.description,
        kcal: item.kcal,
        proteina: item.proteina,
        carboidrato: item.carboidrato,
        gordura: item.gordura,
      })),
    },
    {
      id: "lanche-noite",
      refeicao: "SNACKS",
      horario: "21:00",
      title: "Lanche da noite",
      options: [
        {
          id: "noite-opcao-1",
          refeicao: "SNACKS",
          horario: "21:00",
          title: "Opção 1",
          description: ["30g hipercalórico", "200ml leite"],
          kcal: 260,
          proteina: 14,
          carboidrato: 32,
          gordura: 8,
        },
      ],
    },
  ],
};

const monthMap = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const weekMap = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function getWeekdayLabel(weekday: WeekdayIndex): string {
  return weekMap[weekday];
}

export function getGoalTypeDescription(goalType: GoalType): string {
  if (goalType === "CUT") {
    return "Foco em reduzir gordura sem perder consistência.";
  }
  if (goalType === "GAIN") {
    return "Foco em subir calorias e sustentar ganho de massa.";
  }
  return "Foco em manter ritmo, peso e rotina estáveis.";
}

export function getFoodCategoryLabel(category: FoodCategory): string {
  return foodCategoryLabels[category];
}

export function getPtDateLabel(date = new Date()): string {
  const weekday = weekMap[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = monthMap[date.getMonth()];
  return `${weekday}, ${day} ${month}`;
}

export function toDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function parseGramsFromPortion(portion: string): number | null {
  const match = portion.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*g/);
  if (!match?.[1]) {
    return null;
  }

  return Number(match[1].replace(",", "."));
}

export function buildFoodRecord(seed: FoodSeed, index: number): FoodRecord {
  return {
    id: `seed-${index + 1}`,
    name: seed.name,
    category: seed.category ?? "OTHER",
    porcao: seed.porcao,
    kcalPorcao: seed.kcalPorcao,
    proteina: seed.proteina ?? null,
    carboidrato: seed.carboidrato ?? null,
    gordura: seed.gordura ?? null,
    fotoUrl: seed.fotoUrl ?? null,
    createdAt: new Date().toISOString(),
    favoritos: Boolean(seed.favoritos),
  };
}

export function buildInitialFoods(): FoodRecord[] {
  return initialFoods.map(buildFoodRecord);
}

export function buildStarterDay(dateKey: string, meta = DEFAULT_META_KCAL): DailyState {
  return {
    dateKey,
    meta,
    items: [],
  };
}

export function buildDefaultDailyCheckIn(dateKey: string): DailyCheckInRecord {
  return {
    id: `checkin-${dateKey}`,
    dateKey,
    mood: 3,
    energy: 3,
    hunger: 3,
    waterGlasses: 0,
    sleepHours: 0,
    note: null,
  };
}

export function getMealTargetKcal(meta: number, refeicao: Refeicao): number {
  return Math.round(meta * mealTargetRatios[refeicao]);
}

export function buildRecommendedMacroTargets(
  meta: number,
  profile: PersonalProfile,
  referenceWeight = profile.targetWeight ?? 60,
): MacroTargets {
  const safeMeta = Math.max(DEFAULT_META_KCAL * 0.5, meta);
  const safeWeight = Math.max(45, referenceWeight);
  const proteinPerKg = profile.goalType === "CUT" ? 2.2 : profile.goalType === "GAIN" ? 2 : 1.8;
  const fatShare = profile.goalType === "MAINTAIN" ? 0.28 : 0.25;

  const proteina = Math.round(safeWeight * proteinPerKg);
  const gordura = Math.round((safeMeta * fatShare) / 9);
  const carboidrato = Math.max(60, Math.round((safeMeta - proteina * 4 - gordura * 9) / 4));

  return {
    proteina,
    carboidrato,
    gordura,
  };
}

export function buildEmptyWeeklyMealPlan(): WeeklyMealPlan {
  return {};
}

export function toKcal(total: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(total));
}
