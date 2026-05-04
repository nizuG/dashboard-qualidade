-- CreateTable
CREATE TABLE "ImportacaoCsv" (
    "id" SERIAL NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "municipio" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportacaoCsv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicadorEquipe" (
    "id" SERIAL NOT NULL,
    "importacaoId" INTEGER NOT NULL,
    "competencia" TEXT NOT NULL,
    "uf" TEXT,
    "ibgeMunicipio" TEXT,
    "nomeMunicipio" TEXT,
    "cnes" TEXT,
    "estabelecimento" TEXT,
    "ine" TEXT,
    "nomeEquipe" TEXT NOT NULL,
    "siglaEquipe" TEXT,
    "codigoIndicador" TEXT NOT NULL,
    "nomeIndicador" TEXT NOT NULL,
    "grupoIndicador" TEXT NOT NULL,
    "valor" DOUBLE PRECISION,
    "classificacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicadorEquipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndicadorEquipe_competencia_idx" ON "IndicadorEquipe"("competencia");

-- CreateIndex
CREATE INDEX "IndicadorEquipe_nomeEquipe_idx" ON "IndicadorEquipe"("nomeEquipe");

-- CreateIndex
CREATE INDEX "IndicadorEquipe_codigoIndicador_idx" ON "IndicadorEquipe"("codigoIndicador");

-- CreateIndex
CREATE INDEX "IndicadorEquipe_competencia_nomeEquipe_idx" ON "IndicadorEquipe"("competencia", "nomeEquipe");

-- AddForeignKey
ALTER TABLE "IndicadorEquipe" ADD CONSTRAINT "IndicadorEquipe_importacaoId_fkey" FOREIGN KEY ("importacaoId") REFERENCES "ImportacaoCsv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
