"use client";

import { CalendarRange } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getWeekdayLabel,
  mealLabels,
  mealOrder,
  type MealTemplateRecord,
  type WeeklyMealPlan,
  weekdayOrder,
} from "@/lib/data";

type WeeklyMealPlanCardProps = {
  templates: MealTemplateRecord[];
  plan: WeeklyMealPlan;
  onChange: (nextPlan: WeeklyMealPlan) => void;
};

export function WeeklyMealPlanCard({ templates, plan, onChange }: WeeklyMealPlanCardProps) {
  const updateSlot = (weekday: (typeof weekdayOrder)[number], meal: (typeof mealOrder)[number], templateId: string) => {
    const currentDay = plan[weekday] ?? {};
    const nextDay = { ...currentDay };

    if (templateId === "none") {
      delete nextDay[meal];
    } else {
      nextDay[meal] = templateId;
    }

    const nextPlan: WeeklyMealPlan = { ...plan };
    if (Object.keys(nextDay).length === 0) {
      delete nextPlan[weekday];
    } else {
      nextPlan[weekday] = nextDay;
    }

    onChange(nextPlan);
  };

  return (
    <Card className="rounded-3xl border-borda/80 bg-white/82 dark:border-border dark:bg-card/90">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2 text-lg text-textoPrim dark:text-foreground">
          <CalendarRange className="h-5 w-5 text-botao" />
          Planner semanal
        </CardTitle>
        <p className="text-sm text-textoSec dark:text-muted-foreground">
          Escolha quais modelos devem aparecer automaticamente em cada refeição da semana.
        </p>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-borda/80 bg-rosaClaro/45 px-4 py-5 text-sm text-textoSec dark:border-border dark:bg-secondary/45 dark:text-muted-foreground">
            Salve primeiro alguns modelos de refeição na home para montar o planner semanal.
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {weekdayOrder.map((weekday) => (
              <div key={weekday} className="rounded-2xl bg-rosaClaro/55 p-3 dark:bg-secondary/65">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-textoSec dark:text-muted-foreground">
                  {getWeekdayLabel(weekday)}
                </p>
                <div className="space-y-2">
                  {mealOrder.map((meal) => {
                    const templatesForMeal = templates.filter((template) => template.refeicao === meal);

                    return (
                      <div key={`${weekday}-${meal}`} className="grid items-center gap-2 sm:grid-cols-[120px_1fr]">
                        <span className="text-sm font-medium text-textoPrim dark:text-foreground">{mealLabels[meal]}</span>
                        <Select
                          value={plan[weekday]?.[meal] ?? "none"}
                          onValueChange={(value) => updateSlot(weekday, meal, value)}
                        >
                          <SelectTrigger className="h-10 rounded-xl border-borda bg-white dark:border-border dark:bg-card dark:text-foreground">
                            <SelectValue placeholder="Sem modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sem modelo</SelectItem>
                            {templatesForMeal.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
