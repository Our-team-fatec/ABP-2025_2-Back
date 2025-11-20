/*
  Warnings:

  - Added the required column `idade` to the `pets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."pets" ADD COLUMN     "idade" INTEGER NOT NULL DEFAULT 0;
