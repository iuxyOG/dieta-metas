import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type FoodUpdatePayload = {
  name?: string;
  porcao?: string;
  kcalPorcao?: number;
  proteina?: number | null;
  carboidrato?: number | null;
  gordura?: number | null;
  fotoUrl?: string | null;
  favoritos?: boolean;
};

function toNumberOrNull(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePayload(raw: unknown): FoodUpdatePayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const body = raw as Record<string, unknown>;
  const payload: FoodUpdatePayload = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return null;
    }
    payload.name = name;
  }

  if (body.porcao !== undefined) {
    const portion = String(body.porcao).trim();
    if (!portion) {
      return null;
    }
    payload.porcao = portion;
  }

  if (body.kcalPorcao !== undefined) {
    const kcal = Number(body.kcalPorcao);
    if (!Number.isFinite(kcal) || kcal <= 0) {
      return null;
    }
    payload.kcalPorcao = Math.round(kcal);
  }

  if (body.proteina !== undefined) {
    payload.proteina = toNumberOrNull(body.proteina);
  }
  if (body.carboidrato !== undefined) {
    payload.carboidrato = toNumberOrNull(body.carboidrato);
  }
  if (body.gordura !== undefined) {
    payload.gordura = toNumberOrNull(body.gordura);
  }
  if (body.fotoUrl !== undefined) {
    payload.fotoUrl = body.fotoUrl ? String(body.fotoUrl).trim() : null;
  }
  if (body.favoritos !== undefined) {
    payload.favoritos = Boolean(body.favoritos);
  }

  return payload;
}

function isPrismaNotFoundError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const foodId = context.params.id;
  const payload = parsePayload(await request.json());

  if (!payload || Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  try {
    const updated = await prisma.food.update({
      where: { id: foodId },
      data: payload,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: "Alimento não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ error: "Falha ao atualizar alimento no banco de dados" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const foodId = context.params.id;

  try {
    await prisma.food.delete({ where: { id: foodId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json({ error: "Alimento não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ error: "Falha ao remover alimento do banco de dados" }, { status: 500 });
  }
}
