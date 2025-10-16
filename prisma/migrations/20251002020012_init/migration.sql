-- CreateEnum
CREATE TYPE "public"."Especie" AS ENUM ('CACHORRO', 'GATO');

-- CreateEnum
CREATE TYPE "public"."TipoResidencia" AS ENUM ('CASA', 'APARTAMENTO', 'SITIO', 'CHACARA');

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "removido_em" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pets" (
    "id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" "public"."Especie" NOT NULL,
    "raca" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "removido_em" TIMESTAMP(3),

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adocoes" (
    "id" TEXT NOT NULL,
    "doador_id" TEXT NOT NULL,
    "tutor_id" TEXT,
    "pet_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "removido_em" TIMESTAMP(3),

    CONSTRAINT "adocoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."formularios" (
    "id" TEXT NOT NULL,
    "doador_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "adocao_id" TEXT NOT NULL,
    "tutor_nome" TEXT NOT NULL,
    "tutor_email" TEXT NOT NULL,
    "tutor_endereco" TEXT NOT NULL,
    "tutor_residencia" "public"."TipoResidencia" NOT NULL,
    "detalhes_residencia" TEXT NOT NULL,
    "pessoas_residencia" INTEGER NOT NULL,
    "outros_pets" BOOLEAN NOT NULL DEFAULT false,
    "horas_pet_sozinho" INTEGER NOT NULL,
    "cuidador_pet" TEXT,
    "termos_servico" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "removido_em" TIMESTAMP(3),

    CONSTRAINT "formularios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."imagens" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "titulo" TEXT,
    "descricao" TEXT,
    "pet_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "removido_em" TIMESTAMP(3),

    CONSTRAINT "imagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "public"."usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_removido_em_idx" ON "public"."usuarios"("removido_em");

-- CreateIndex
CREATE INDEX "pets_tutor_id_idx" ON "public"."pets"("tutor_id");

-- CreateIndex
CREATE INDEX "pets_especie_idx" ON "public"."pets"("especie");

-- CreateIndex
CREATE INDEX "pets_removido_em_idx" ON "public"."pets"("removido_em");

-- CreateIndex
CREATE UNIQUE INDEX "adocoes_pet_id_key" ON "public"."adocoes"("pet_id");

-- CreateIndex
CREATE INDEX "adocoes_doador_id_idx" ON "public"."adocoes"("doador_id");

-- CreateIndex
CREATE INDEX "adocoes_tutor_id_idx" ON "public"."adocoes"("tutor_id");

-- CreateIndex
CREATE INDEX "adocoes_pet_id_idx" ON "public"."adocoes"("pet_id");

-- CreateIndex
CREATE INDEX "adocoes_removido_em_idx" ON "public"."adocoes"("removido_em");

-- CreateIndex
CREATE INDEX "formularios_doador_id_idx" ON "public"."formularios"("doador_id");

-- CreateIndex
CREATE INDEX "formularios_tutor_id_idx" ON "public"."formularios"("tutor_id");

-- CreateIndex
CREATE INDEX "formularios_pet_id_idx" ON "public"."formularios"("pet_id");

-- CreateIndex
CREATE INDEX "formularios_adocao_id_idx" ON "public"."formularios"("adocao_id");

-- CreateIndex
CREATE INDEX "formularios_removido_em_idx" ON "public"."formularios"("removido_em");

-- CreateIndex
CREATE INDEX "imagens_pet_id_idx" ON "public"."imagens"("pet_id");

-- CreateIndex
CREATE INDEX "imagens_removido_em_idx" ON "public"."imagens"("removido_em");

-- AddForeignKey
ALTER TABLE "public"."pets" ADD CONSTRAINT "pets_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adocoes" ADD CONSTRAINT "adocoes_doador_id_fkey" FOREIGN KEY ("doador_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adocoes" ADD CONSTRAINT "adocoes_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adocoes" ADD CONSTRAINT "adocoes_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."formularios" ADD CONSTRAINT "formularios_doador_id_fkey" FOREIGN KEY ("doador_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."formularios" ADD CONSTRAINT "formularios_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."formularios" ADD CONSTRAINT "formularios_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."formularios" ADD CONSTRAINT "formularios_adocao_id_fkey" FOREIGN KEY ("adocao_id") REFERENCES "public"."adocoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."imagens" ADD CONSTRAINT "imagens_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
