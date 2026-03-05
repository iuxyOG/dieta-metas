"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Save, Star, Trash2 } from "lucide-react";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildInitialFoods, type FoodRecord } from "@/lib/data";

type FormState = {
  name: string;
  porcao: string;
  kcalPorcao: string;
  proteina: string;
  carboidrato: string;
  gordura: string;
  fotoUrl: string;
  favoritos: boolean;
};

const emptyForm: FormState = {
  name: "",
  porcao: "",
  kcalPorcao: "",
  proteina: "",
  carboidrato: "",
  gordura: "",
  fotoUrl: "",
  favoritos: false,
};

function formFromFood(food: FoodRecord): FormState {
  return {
    name: food.name,
    porcao: food.porcao,
    kcalPorcao: String(food.kcalPorcao),
    proteina: food.proteina?.toString() ?? "",
    carboidrato: food.carboidrato?.toString() ?? "",
    gordura: food.gordura?.toString() ?? "",
    fotoUrl: food.fotoUrl ?? "",
    favoritos: food.favoritos,
  };
}

function toNumberOrNull(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function AlimentosPage() {
  const [foods, setFoods] = useState<FoodRecord[]>(buildInitialFoods());
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchFoods = useCallback(async () => {
    const response = await fetch(`/api/foods${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as FoodRecord[];
    if (Array.isArray(data)) {
      setFoods(data);
    }
  }, [query]);

  useEffect(() => {
    void fetchFoods();
  }, [fetchFoods]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchFoods();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [fetchFoods]);

  const title = useMemo(() => (editingId ? "Editar alimento" : "Novo alimento"), [editingId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.porcao.trim() || !toNumberOrNull(form.kcalPorcao)) {
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      porcao: form.porcao.trim(),
      kcalPorcao: Number(form.kcalPorcao),
      proteina: toNumberOrNull(form.proteina),
      carboidrato: toNumberOrNull(form.carboidrato),
      gordura: toNumberOrNull(form.gordura),
      fotoUrl: form.fotoUrl.trim() || null,
      favoritos: form.favoritos,
    };

    const endpoint = editingId ? `/api/foods/${editingId}` : "/api/foods";
    const method = editingId ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!response.ok) {
      return;
    }

    setEditingId(null);
    setForm(emptyForm);
    await fetchFoods();
  };

  const toggleFavorite = async (food: FoodRecord) => {
    await fetch(`/api/foods/${food.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favoritos: !food.favoritos }),
    });

    await fetchFoods();
  };

  const removeFood = async (id: string) => {
    await fetch(`/api/foods/${id}`, { method: "DELETE" });
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
    await fetchFoods();
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 p-4 pb-8 md:p-6">
      <Header />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        <Card className="rounded-3xl border-borda/80 bg-white/80 dark:border-border dark:bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg text-textoPrim dark:text-foreground">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                placeholder="Nome do alimento"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  required
                  value={form.porcao}
                  onChange={(event) => setForm((prev) => ({ ...prev, porcao: event.target.value }))}
                  className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                  placeholder="Porção (ex: 200g)"
                />
                <Input
                  required
                  type="number"
                  min={1}
                  value={form.kcalPorcao}
                  onChange={(event) => setForm((prev) => ({ ...prev, kcalPorcao: event.target.value }))}
                  className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                  placeholder="Kcal"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={form.proteina}
                  onChange={(event) => setForm((prev) => ({ ...prev, proteina: event.target.value }))}
                  className="h-10 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                  placeholder="Prot"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={form.carboidrato}
                  onChange={(event) => setForm((prev) => ({ ...prev, carboidrato: event.target.value }))}
                  className="h-10 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                  placeholder="Carbo"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={form.gordura}
                  onChange={(event) => setForm((prev) => ({ ...prev, gordura: event.target.value }))}
                  className="h-10 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                  placeholder="Gord"
                />
              </div>

              <Input
                value={form.fotoUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, fotoUrl: event.target.value }))}
                className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                placeholder="URL da foto (Cloudinary)"
              />

              <label className="flex items-center gap-2 text-sm text-textoSec dark:text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.favoritos}
                  onChange={(event) => setForm((prev) => ({ ...prev, favoritos: event.target.checked }))}
                />
                Marcar como favorito
              </label>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-11 flex-1 rounded-2xl bg-botao text-white hover:bg-botao/90"
                >
                  {editingId ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editingId ? "Salvar" : "Adicionar"}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-borda dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-secondary"
                    onClick={() => {
                      setEditingId(null);
                      setForm(emptyForm);
                    }}
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-borda/80 bg-white/80 dark:border-border dark:bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg text-textoPrim dark:text-foreground">Lista de alimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
              placeholder="Buscar alimento"
            />

            <div className="max-h-[58dvh] space-y-2 overflow-y-auto pr-1">
              {foods.map((food) => (
                <article
                  key={food.id}
                  className="rounded-2xl border border-borda/80 bg-rosaClaro/70 p-3 shadow-sm dark:border-border dark:bg-secondary/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-textoPrim dark:text-foreground">{food.name}</h3>
                      <p className="text-xs text-textoSec dark:text-muted-foreground">
                        {food.porcao} • {food.kcalPorcao} kcal
                      </p>
                      <p className="text-xs text-textoSec dark:text-muted-foreground">
                        Prot {food.proteina ?? 0}g • Carb {food.carboidrato ?? 0}g • Gord {food.gordura ?? 0}g
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => void toggleFavorite(food)}
                      >
                        <Star
                          className={`h-4 w-4 ${food.favoritos ? "fill-yellow-400 text-yellow-500" : "text-textoSec"}`}
                        />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-xl text-textoSec dark:text-muted-foreground"
                        onClick={() => {
                          setEditingId(food.id);
                          setForm(formFromFood(food));
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-xl text-red-500"
                        onClick={() => void removeFood(food.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {food.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={food.fotoUrl}
                      alt={food.name}
                      className="mt-2 h-24 w-full rounded-xl object-cover"
                    />
                  ) : null}
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
