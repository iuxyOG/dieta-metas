"use client";

import { HeartPulse, MoonStar, SmilePlus, Soup, type LucideIcon, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type DailyCheckInRecord } from "@/lib/data";
import { cn } from "@/lib/utils";

type DailyCheckInCardProps = {
  value: DailyCheckInRecord;
  waterGoal: number;
  saving: boolean;
  onChange: (next: DailyCheckInRecord) => void;
  onSave: () => void;
};

const scaleButtons = [1, 2, 3, 4, 5] as const;

type RatingField = "mood" | "energy" | "hunger";

const fieldMeta: Record<
  RatingField,
  { label: string; icon: LucideIcon; descriptions: Record<(typeof scaleButtons)[number], string> }
> = {
  mood: {
    label: "Humor",
    icon: SmilePlus,
    descriptions: {
      1: "pesado",
      2: "baixo",
      3: "ok",
      4: "bom",
      5: "ótimo",
    },
  },
  energy: {
    label: "Energia",
    icon: HeartPulse,
    descriptions: {
      1: "zerada",
      2: "baixa",
      3: "normal",
      4: "forte",
      5: "voando",
    },
  },
  hunger: {
    label: "Fome",
    icon: Soup,
    descriptions: {
      1: "sem fome",
      2: "leve",
      3: "normal",
      4: "alta",
      5: "muita",
    },
  },
};

export function DailyCheckInCard({ value, waterGoal, saving, onChange, onSave }: DailyCheckInCardProps) {
  const update = <K extends keyof DailyCheckInRecord>(field: K, nextValue: DailyCheckInRecord[K]) => {
    onChange({
      ...value,
      [field]: nextValue,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <section className="rounded-[26px] border border-borda/80 bg-white/82 p-5 shadow-[0_12px_32px_-20px_rgba(230,75,141,0.75)] dark:border-border dark:bg-card/90 dark:shadow-[0_12px_32px_-20px_rgba(0,0,0,0.92)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-botao">check-in do dia</p>
          <h3 className="mt-2 text-xl font-bold text-textoPrim dark:text-foreground">Como foi o seu corpo hoje?</h3>
        </div>
        <span className="rounded-full bg-rosaClaro px-3 py-1 text-xs font-semibold text-textoSec dark:bg-secondary dark:text-muted-foreground">
          {value.dateKey.split("-").reverse().join("/")}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {(Object.keys(fieldMeta) as RatingField[]).map((field) => {
          const Icon = fieldMeta[field].icon;
          return (
            <div key={field} className="rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/65">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 font-semibold text-textoPrim dark:text-foreground">
                  <Icon className="h-4 w-4 text-botao" />
                  {fieldMeta[field].label}
                </span>
                <span className="text-xs font-medium capitalize text-textoSec dark:text-muted-foreground">
                  {fieldMeta[field].descriptions[value[field] as (typeof scaleButtons)[number]]}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {scaleButtons.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => update(field, option)}
                    className={cn(
                      "rounded-xl px-0 py-2 text-sm font-semibold transition",
                      value[field] === option
                        ? "bg-botao text-white shadow-[0_10px_20px_-14px_rgba(230,75,141,0.85)]"
                        : "bg-white text-textoSec hover:bg-white/80 dark:bg-card dark:text-muted-foreground",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/65">
            <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-textoPrim dark:text-foreground">
              <Waves className="h-4 w-4 text-sky-500" />
              Água do dia
            </label>
            <Input
              type="number"
              min={0}
              max={30}
              value={String(value.waterGlasses)}
              onChange={(event) => update("waterGlasses", Math.max(0, Number(event.target.value) || 0))}
              className="h-11 rounded-xl border-borda bg-white dark:border-border dark:bg-card dark:text-foreground"
            />
            <p className="mt-2 text-xs text-textoSec dark:text-muted-foreground">Meta pessoal: {waterGoal} copos</p>
          </div>

          <div className="rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/65">
            <label className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-textoPrim dark:text-foreground">
              <MoonStar className="h-4 w-4 text-indigo-500" />
              Sono da noite
            </label>
            <Input
              type="number"
              min={0}
              max={24}
              step="0.5"
              value={value.sleepHours === 0 ? "" : String(value.sleepHours)}
              onChange={(event) => update("sleepHours", Math.max(0, Number(event.target.value.replace(",", ".")) || 0))}
              className="h-11 rounded-xl border-borda bg-white dark:border-border dark:bg-card dark:text-foreground"
              placeholder="Horas de sono"
            />
            <p className="mt-2 text-xs text-textoSec dark:text-muted-foreground">Ex.: 7.5 para sete horas e meia.</p>
          </div>
        </div>

        <div className="rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/65">
          <label className="text-sm font-semibold text-textoPrim dark:text-foreground">Observação do dia</label>
          <textarea
            value={value.note ?? ""}
            onChange={(event) => update("note", event.target.value || null)}
            placeholder="Ex.: treino rendeu bem, fome mais alta à tarde..."
            className="mt-2 min-h-24 w-full rounded-2xl border border-borda bg-white px-3 py-2 text-sm text-textoPrim outline-none ring-0 placeholder:text-textoSec/70 focus:border-botao dark:border-border dark:bg-card dark:text-foreground dark:placeholder:text-muted-foreground"
          />
        </div>

        <Button onClick={onSave} disabled={saving} className="h-11 w-full rounded-2xl bg-botao text-white hover:bg-botao/90">
          {saving ? "Salvando..." : "Salvar check-in do dia"}
        </Button>
      </div>
    </section>
  );
}
