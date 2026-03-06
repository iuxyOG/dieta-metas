"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Search, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  foodCategoryLabels,
  getFoodCategoryLabel,
  mealLabels,
  parseGramsFromPortion,
  type FoodCategory,
  type FoodRecord,
  type Refeicao,
  toKcal,
} from "@/lib/data";

type FoodModalProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  meal: Refeicao;
  foods: FoodRecord[];
  recentFoods: FoodRecord[];
  onAddFood: (meal: Refeicao, food: FoodRecord, quantidade: number) => void;
};

type QuantityMode = "1" | "2" | "0.5" | "grams";

function toQuantity(mode: QuantityMode, grams: number, selectedFood: FoodRecord | null): number {
  if (mode === "1") {
    return 1;
  }
  if (mode === "2") {
    return 2;
  }
  if (mode === "0.5") {
    return 0.5;
  }

  if (!selectedFood) {
    return 1;
  }

  const baseGrams = parseGramsFromPortion(selectedFood.porcao);
  if (!baseGrams || baseGrams <= 0) {
    return grams / 100;
  }

  return grams / baseGrams;
}

export function FoodModal({ open, onOpenChange, meal, foods, recentFoods, onAddFood }: FoodModalProps) {
  const [activeTab, setActiveTab] = useState<"favoritos" | "recentes" | "todos">("favoritos");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FoodCategory | "ALL">("ALL");
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [quantityMode, setQuantityMode] = useState<QuantityMode>("1");
  const [grams, setGrams] = useState(100);

  const selectedFood = useMemo(
    () => foods.find((food) => food.id === selectedFoodId) ?? null,
    [foods, selectedFoodId],
  );

  const favoriteFoods = useMemo(() => foods.filter((food) => food.favoritos), [foods]);

  const tabFoods = useMemo(() => {
    if (activeTab === "favoritos") {
      return favoriteFoods;
    }
    if (activeTab === "recentes") {
      return recentFoods;
    }
    return foods;
  }, [activeTab, favoriteFoods, recentFoods, foods]);

  const filteredFoods = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tabFoods.filter((food) => {
      const matchesQuery = !query || food.name.toLowerCase().includes(query);
      const matchesCategory = activeCategory === "ALL" || food.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, search, tabFoods]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setActiveCategory("ALL");
      setSelectedFoodId("");
      setQuantityMode("1");
      setGrams(100);
      return;
    }

    if (selectedFoodId) {
      const stillExists = filteredFoods.some((food) => food.id === selectedFoodId);
      if (stillExists) {
        return;
      }
    }

    if (filteredFoods[0]) {
      setSelectedFoodId(filteredFoods[0].id);
    }
  }, [open, filteredFoods, selectedFoodId]);

  const quantity = useMemo(
    () => toQuantity(quantityMode, grams, selectedFood),
    [grams, quantityMode, selectedFood],
  );

  const preview = useMemo(() => {
    if (!selectedFood) {
      return { kcal: 0, proteina: 0 };
    }

    return {
      kcal: selectedFood.kcalPorcao * quantity,
      proteina: (selectedFood.proteina ?? 0) * quantity,
    };
  }, [quantity, selectedFood]);

  const canSubmit = Boolean(selectedFood && quantity > 0);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[94dvh] rounded-t-[30px] border-borda bg-rosaClaro dark:border-border dark:bg-card">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-xl font-black text-textoPrim dark:text-foreground">Adicionar item</DrawerTitle>
          <DrawerDescription className="text-textoSec dark:text-muted-foreground">{mealLabels[meal]}</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textoSec" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar alimento"
              className="h-11 rounded-xl border-borda bg-white pl-9 text-sm dark:border-border dark:bg-card dark:text-foreground"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "favoritos" | "recentes" | "todos")}
          >
            <TabsList className="grid h-10 w-full grid-cols-3 rounded-xl bg-white dark:bg-secondary">
              <TabsTrigger value="favoritos" className="rounded-lg data-[state=active]:text-botao">
                <Star className="mr-1 h-4 w-4" />
                Favoritos
              </TabsTrigger>
              <TabsTrigger value="recentes" className="rounded-lg data-[state=active]:text-botao">
                Recentes
              </TabsTrigger>
              <TabsTrigger value="todos" className="rounded-lg data-[state=active]:text-botao">
                Todos
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                activeCategory === "ALL"
                  ? "bg-botao text-white"
                  : "bg-white text-textoSec hover:bg-rosaClaro dark:bg-card dark:text-muted-foreground"
              }`}
            >
              Todas
            </button>
            {Object.entries(foodCategoryLabels).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveCategory(value as FoodCategory)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeCategory === value
                    ? "bg-botao text-white"
                    : "bg-white text-textoSec hover:bg-rosaClaro dark:bg-card dark:text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-borda bg-white p-2 dark:border-border dark:bg-card">
            {filteredFoods.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-textoSec dark:text-muted-foreground">Nenhum alimento encontrado.</p>
            ) : (
              filteredFoods.map((food) => {
                const isActive = selectedFoodId === food.id;

                return (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => setSelectedFoodId(food.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                      isActive ? "border-botao bg-rosaClaro dark:bg-secondary" : "border-transparent hover:border-borda dark:hover:border-border"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="mb-1 inline-flex rounded-full bg-rosaClaro px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-botao dark:bg-secondary dark:text-primary">
                        {getFoodCategoryLabel(food.category)}
                      </p>
                      <p className="truncate text-sm font-semibold text-textoPrim dark:text-foreground">
                        {food.name} {food.favoritos ? "⭐" : ""}
                      </p>
                      <p className="text-xs text-textoSec dark:text-muted-foreground">
                        {food.porcao} • {food.kcalPorcao}kcal
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {isActive ? <Check className="h-4 w-4 text-botao" /> : null}
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 rounded-xl bg-botao px-2.5 text-xs text-white hover:bg-botao/90"
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddFood(meal, food, 1);
                        }}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        +1
                      </Button>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-borda bg-white p-3 dark:border-border dark:bg-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">Quantidade</p>
            <Select value={quantityMode} onValueChange={(value) => setQuantityMode(value as QuantityMode)}>
              <SelectTrigger className="h-10 rounded-xl border-borda dark:border-border dark:bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 porção</SelectItem>
                <SelectItem value="2">2 porções</SelectItem>
                <SelectItem value="0.5">meia</SelectItem>
                <SelectItem value="grams">gramas</SelectItem>
              </SelectContent>
            </Select>

            {quantityMode === "grams" ? (
              <Input
                type="number"
                min={1}
                value={grams}
                onChange={(event) => setGrams(Math.max(1, Number(event.target.value) || 1))}
                className="h-10 rounded-xl border-borda dark:border-border dark:bg-card dark:text-foreground"
                placeholder="Quantidade em gramas"
              />
            ) : null}

            <p className="text-sm text-textoSec dark:text-muted-foreground">
              Total: <span className="font-semibold text-textoPrim dark:text-foreground">{toKcal(preview.kcal)}kcal</span>{" "}
              <span className="text-xs">(Prot:{preview.proteina.toFixed(1)}g)</span>
            </p>
          </div>
        </div>

        <DrawerFooter>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!selectedFood) {
                return;
              }
              onAddFood(meal, selectedFood, quantity);
              onOpenChange(false);
            }}
            className="h-12 rounded-2xl bg-botao text-base font-semibold text-white hover:bg-botao/90"
          >
            Adicionar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
