/*
  Warnings:

  - Added the required column `contato` to the `adocoes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."adocoes" ADD COLUMN     "contato" TEXT NOT NULL;
