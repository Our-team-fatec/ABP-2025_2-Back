-- CreateTable
CREATE TABLE "public"."saude" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "castrado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vacinas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "removido_em" TIMESTAMP(3),

    CONSTRAINT "vacinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vacinas_pet" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "vacina_id" TEXT NOT NULL,
    "data_aplicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacinas_pet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saude_pet_id_key" ON "public"."saude"("pet_id");

-- CreateIndex
CREATE INDEX "saude_pet_id_idx" ON "public"."saude"("pet_id");

-- CreateIndex
CREATE UNIQUE INDEX "vacinas_nome_key" ON "public"."vacinas"("nome");

-- CreateIndex
CREATE INDEX "vacinas_removido_em_idx" ON "public"."vacinas"("removido_em");

-- CreateIndex
CREATE INDEX "vacinas_pet_pet_id_idx" ON "public"."vacinas_pet"("pet_id");

-- CreateIndex
CREATE INDEX "vacinas_pet_vacina_id_idx" ON "public"."vacinas_pet"("vacina_id");

-- CreateIndex
CREATE UNIQUE INDEX "vacinas_pet_pet_id_vacina_id_key" ON "public"."vacinas_pet"("pet_id", "vacina_id");

-- AddForeignKey
ALTER TABLE "public"."saude" ADD CONSTRAINT "saude_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vacinas_pet" ADD CONSTRAINT "vacinas_pet_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vacinas_pet" ADD CONSTRAINT "vacinas_pet_vacina_id_fkey" FOREIGN KEY ("vacina_id") REFERENCES "public"."vacinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
