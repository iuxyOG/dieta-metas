-- CreateEnum
CREATE TYPE "Refeicao" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Jhullya Isabela',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "porcao" TEXT NOT NULL,
    "kcalPorcao" INTEGER NOT NULL,
    "proteina" DOUBLE PRECISION,
    "carboidrato" DOUBLE PRECISION,
    "gordura" DOUBLE PRECISION,
    "fotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "favoritos" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateKey" TEXT NOT NULL,
    "meta" INTEGER NOT NULL DEFAULT 2500,
    "consumido" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogItem" (
    "id" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "dailyLogId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "refeicao" "Refeicao" NOT NULL,
    "name" TEXT NOT NULL,
    "porcao" TEXT NOT NULL,
    "kcalPorcao" INTEGER NOT NULL,
    "proteina" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carboidrato" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gordura" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogItem_pkey" PRIMARY KEY ("id","dailyLogId")
);

-- CreateTable
CREATE TABLE "WeeklyGoal" (
    "id" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "kcal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_dateKey_key" ON "DailyLog"("dateKey");

-- CreateIndex
CREATE INDEX "LogItem_dailyLogId_idx" ON "LogItem"("dailyLogId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyGoal_weekKey_key" ON "WeeklyGoal"("weekKey");

-- CreateIndex
CREATE UNIQUE INDEX "WeightEntry_dateKey_key" ON "WeightEntry"("dateKey");

-- AddForeignKey
ALTER TABLE "LogItem" ADD CONSTRAINT "LogItem_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "DailyLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
