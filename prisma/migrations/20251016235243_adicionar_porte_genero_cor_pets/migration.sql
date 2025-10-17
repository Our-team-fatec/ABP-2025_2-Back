/*
  Warnings:

  - Added the required column `cor` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genero` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `porte` to the `pets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Porte" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE');

-- CreateEnum
CREATE TYPE "public"."Genero" AS ENUM ('MACHO', 'FEMEA');

-- AlterTable
ALTER TABLE "public"."pets" ADD COLUMN     "cor" TEXT NOT NULL,
ADD COLUMN     "genero" "public"."Genero" NOT NULL,
ADD COLUMN     "porte" "public"."Porte" NOT NULL;
