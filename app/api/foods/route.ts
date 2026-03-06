import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { initialFoods } from "@/lib/data";
import { prisma } from "@/lib/prisma";

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

const FOODS_SEED_KEY = "foods-seeded-at";

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePayload(raw: unknown): FoodPayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const body = raw as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const porcao = String(body.porcao ?? "").trim();
  const kcal = Number(body.kcalPorcao);

  if (!name || !porcao || !Number.isFinite(kcal) || kcal <= 0) {
    return null;
  }

  return {
    name,
    porcao,
    kcalPorcao: Math.round(kcal),
    proteina: toNumberOrNull(body.proteina),
    carboidrato: toNumberOrNull(body.carboidrato),
    gordura: toNumberOrNull(body.gordura),
    fotoUrl: body.fotoUrl ? String(body.fotoUrl).trim() : null,
    favoritos: Boolean(body.favoritos),
  };
}

async function ensureSeedData() {
  await prisma.$transaction(
    async (tx) => {
      const seedState = await tx.appSetting.findUnique({ where: { key: FOODS_SEED_KEY } });
      if (seedState) {
        return;
      }

      const total = await tx.food.count();
      if (total === 0) {
        await tx.food.createMany({
          data: initialFoods.map((food) => ({
            name: food.name,
            porcao: food.porcao,
            kcalPorcao: food.kcalPorcao,
            proteina: food.proteina ?? null,
            carboidrato: food.carboidrato ?? null,
            gordura: food.gordura ?? null,
            fotoUrl: food.fotoUrl ?? null,
            favoritos: Boolean(food.favoritos),
          })),
        });
      }

      await tx.appSetting.upsert({
        where: { key: FOODS_SEED_KEY },
        create: { key: FOODS_SEED_KEY, value: new Date().toISOString() },
        update: { value: new Date().toISOString() },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  try {
    await ensureSeedData();

    const foods = await prisma.food.findMany({
      where: query
        ? {
            name: {
              contains: query,
              mode: "insensitive",
            },
          }
        : undefined,
      orderBy: [{ favoritos: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(foods);
  } catch {
    return NextResponse.json({ error: "Falha ao carregar alimentos do banco de dados" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = parsePayload(await request.json());
  if (!payload) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  try {
    const created = await prisma.food.create({ data: payload });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Falha ao salvar alimento no banco de dados" }, { status: 500 });
  }
}
