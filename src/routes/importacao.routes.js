import { Router } from "express";
import multer from "multer";
import { prisma } from "../config/prisma.js";
import { lerCsvQualidade } from "../services/csvQualidade.service.js";

const router = Router();

const upload = multer({
  dest: "uploads/",
});

router.post("/importar-csv", (req, res) => {
  upload.array("arquivos")(req, res, async (error) => {
    if (error) {
      console.error("Erro no upload:", error);

      return res.status(400).json({
        message: "Erro ao receber arquivos.",
        detalhe: error.message,
      });
    }

    const arquivos = req.files;

    if (!arquivos || arquivos.length === 0) {
      return res.status(400).json({
        message: "Nenhum arquivo enviado.",
      });
    }

    try {
      const resultado = [];

      for (const arquivo of arquivos) {
        const dadosCsv = await lerCsvQualidade(arquivo.path);

        const importacao = await prisma.importacaoCsv.create({
          data: {
            nomeArquivo: arquivo.originalname,
            competencia: dadosCsv.competencia || "NÃO IDENTIFICADA",
            municipio: dadosCsv.municipio,
          },
        });

        if (dadosCsv.indicadores.length > 0) {
          await prisma.indicadorEquipe.createMany({
            data: dadosCsv.indicadores.map((indicador) => ({
              importacaoId: importacao.id,

              competencia: indicador.competencia,
              uf: indicador.uf,
              ibgeMunicipio: indicador.ibgeMunicipio,
              nomeMunicipio: indicador.nomeMunicipio,

              cnes: indicador.cnes,
              estabelecimento: indicador.estabelecimento,
              ine: indicador.ine,
              nomeEquipe: indicador.nomeEquipe,
              siglaEquipe: indicador.siglaEquipe,

              codigoIndicador: indicador.codigoIndicador,
              nomeIndicador: indicador.nomeIndicador,
              grupoIndicador: indicador.grupoIndicador,

              valor: indicador.valor,
              classificacao: indicador.classificacao,
            })),
          });
        }

        resultado.push({
          nomeArquivo: arquivo.originalname,
          competencia: dadosCsv.competencia,
          municipio: dadosCsv.municipio,
          equipesEncontradas: dadosCsv.totalRegistros,
          indicadoresSalvos: dadosCsv.indicadores.length,
          importacaoId: importacao.id,
        });
      }

      return res.status(201).json({
        message: "Arquivos importados e salvos com sucesso.",
        quantidade: resultado.length,
        resultado,
      });
    } catch (error) {
      console.error("Erro ao importar CSV:", error);

      return res.status(500).json({
        message: "Erro ao importar CSV.",
        detalhe: error.message,
      });
    }
  });
});

router.get("/competencias", async (req, res) => {
  try {
    const competencias = await prisma.importacaoCsv.findMany({
      select: {
        id: true,
        competencia: true,
        municipio: true,
        nomeArquivo: true,
        criadoEm: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return res.json(competencias);
  } catch (error) {
    console.error("Erro ao buscar competências:", error);

    return res.status(500).json({
      message: "Erro ao buscar competências.",
      detalhe: error.message,
    });
  }
});

router.get("/comparativo", async (req, res) => {
  try {
    const { competenciaA, competenciaB } = req.query;

    if (!competenciaA || !competenciaB) {
      return res.status(400).json({
        message: "Informe competenciaA e competenciaB.",
        exemplo: "/api/comparativo?competenciaA=JAN/26&competenciaB=FEV/26",
      });
    }

    const dadosA = await prisma.indicadorEquipe.findMany({
      where: {
        competencia: competenciaA,
      },
      orderBy: [
        { nomeEquipe: "asc" },
        { codigoIndicador: "asc" },
      ],
    });

    const dadosB = await prisma.indicadorEquipe.findMany({
      where: {
        competencia: competenciaB,
      },
      orderBy: [
        { nomeEquipe: "asc" },
        { codigoIndicador: "asc" },
      ],
    });

    const mapaA = criarMapaIndicadores(dadosA);
    const mapaB = criarMapaIndicadores(dadosB);

    const chaves = new Set([...Object.keys(mapaA), ...Object.keys(mapaB)]);

    const comparativo = [];

    for (const chave of chaves) {
      const itemA = mapaA[chave] || null;
      const itemB = mapaB[chave] || null;

      const base = itemB || itemA;

      const valorA = itemA?.valor ?? null;
      const valorB = itemB?.valor ?? null;

      let variacao = null;
      let status = "sem-dados";

      if (valorA !== null && valorB !== null) {
        variacao = Number((valorB - valorA).toFixed(2));

        if (variacao > 0) {
          status = "subiu";
        } else if (variacao < 0) {
          status = "caiu";
        } else {
          status = "estavel";
        }
      }

      comparativo.push({
        equipe: base.nomeEquipe,
        siglaEquipe: base.siglaEquipe,
        estabelecimento: base.estabelecimento,

        codigoIndicador: base.codigoIndicador,
        nomeIndicador: base.nomeIndicador,
        grupoIndicador: base.grupoIndicador,

        competenciaA,
        valorA,
        classificacaoA: itemA?.classificacao ?? null,

        competenciaB,
        valorB,
        classificacaoB: itemB?.classificacao ?? null,

        variacao,
        status,
      });
    }

    const resumo = {
      competenciaA,
      competenciaB,
      totalComparados: comparativo.length,
      subiram: comparativo.filter((item) => item.status === "subiu").length,
      cairam: comparativo.filter((item) => item.status === "caiu").length,
      estaveis: comparativo.filter((item) => item.status === "estavel").length,
      semDados: comparativo.filter((item) => item.status === "sem-dados").length,
    };

    return res.json({
      resumo,
      comparativo,
    });
  } catch (error) {
    console.error("Erro ao gerar comparativo:", error);

    return res.status(500).json({
      message: "Erro ao gerar comparativo.",
      detalhe: error.message,
    });
  }
});

function criarMapaIndicadores(dados) {
  const mapa = {};

  for (const item of dados) {
    const chave = `${item.nomeEquipe}__${item.codigoIndicador}`;
    mapa[chave] = item;
  }

  return mapa;
}

router.get("/competencia", async (req, res) => {
  try {
    const { competencia } = req.query;

    if (!competencia) {
      return res.status(400).json({
        message: "Informe a competência.",
        exemplo: "/api/competencia?competencia=JAN/26",
      });
    }

    const indicadores = await prisma.indicadorEquipe.findMany({
      where: {
        competencia,
      },
      orderBy: [
        { nomeEquipe: "asc" },
        { codigoIndicador: "asc" },
      ],
    });

    const equipesMap = new Map();

    for (const item of indicadores) {
      if (!equipesMap.has(item.nomeEquipe)) {
        equipesMap.set(item.nomeEquipe, {
          equipe: item.nomeEquipe,
          siglaEquipe: item.siglaEquipe,
          estabelecimento: item.estabelecimento,
          indicadores: [],
        });
      }

      equipesMap.get(item.nomeEquipe).indicadores.push({
        id: item.id,
        codigoIndicador: item.codigoIndicador,
        nomeIndicador: item.nomeIndicador,
        grupoIndicador: item.grupoIndicador,
        valor: item.valor,
        classificacao: item.classificacao,
      });
    }

    const equipes = Array.from(equipesMap.values());

    const resumo = {
      competencia,
      totalEquipes: equipes.length,
      totalIndicadores: indicadores.length,
      otimo: indicadores.filter((item) => item.classificacao === "ÓTIMO").length,
      bom: indicadores.filter((item) => item.classificacao === "BOM").length,
      suficiente: indicadores.filter((item) => item.classificacao === "SUFICIENTE").length,
      regular: indicadores.filter((item) => item.classificacao === "REGULAR").length,
      semClassificacao: indicadores.filter((item) => !item.classificacao).length,
    };

    return res.json({
      resumo,
      equipes,
    });
  } catch (error) {
    console.error("Erro ao buscar dados da competência:", error);

    return res.status(500).json({
      message: "Erro ao buscar dados da competência.",
      detalhe: error.message,
    });
  }
});

export default router;