import fs from "fs/promises";

const INDICADORES = [
  {
    codigo: "C1",
    nome: "Mais acesso à APS",
    grupo: "Indicadores C",
    colunaValor: "C1 - Mais acesso à APS",
  },
  {
    codigo: "C2",
    nome: "Cuidado no desenvolvimento infantil",
    grupo: "Indicadores C",
    colunaValor: "C2 - Cuidado no desenvolvimento infantil",
  },
  {
    codigo: "C3",
    nome: "Cuidado na gestação e puerpério",
    grupo: "Indicadores C",
    colunaValor: "C3 - Cuidado na gestação e puerpério",
  },
  {
    codigo: "C4",
    nome: "Cuidado da pessoa com diabetes",
    grupo: "Indicadores C",
    colunaValor: "C4 - Cuidado da pessoa com diabetes",
  },
  {
    codigo: "C5",
    nome: "Cuidado da pessoa com hipertensão",
    grupo: "Indicadores C",
    colunaValor: "C5 - Cuidado da pessoa com hipertensão",
  },
  {
    codigo: "C6",
    nome: "Cuidado da pessoa idosa",
    grupo: "Indicadores C",
    colunaValor: "C6 - Cuidado da pessoa idosa",
  },
  {
    codigo: "C7",
    nome: "Cuidado da mulher na prevenção do câncer",
    grupo: "Indicadores C",
    colunaValor: "C7 - Cuidado da mulher na prevenção do câncer",
  },
  {
    codigo: "B1",
    nome: "Primeira consulta programada",
    grupo: "Saúde Bucal",
    colunaValor: "B1 - Primeira consulta programada",
  },
  {
    codigo: "B2",
    nome: "Tratamento concluído",
    grupo: "Saúde Bucal",
    colunaValor: "B2 - Tratamento concluído",
  },
  {
    codigo: "B3",
    nome: "Taxa de exodontia",
    grupo: "Saúde Bucal",
    colunaValor: "B3 - Taxa de exodontia",
  },
  {
    codigo: "B4",
    nome: "Escovação supervisionada em faixa etária escolar",
    grupo: "Saúde Bucal",
    colunaValor: "B4 - Escovação supervisionada em faixa etária escolar",
  },
  {
    codigo: "B5",
    nome: "Procedimentos odontológicos preventivos",
    grupo: "Saúde Bucal",
    colunaValor: "B5 - Procedimentos odontológicos preventivos",
  },
  {
    codigo: "B6",
    nome: "Tratamento restaurador atraumático",
    grupo: "Saúde Bucal",
    colunaValor: "B6 - Tratamento restaurador atraumático",
  },
  {
    codigo: "M1",
    nome: "Média de atendimentos por pessoa pela eMulti na APS",
    grupo: "eMulti",
    colunaValor: "M1 - Média de atendimentos por pessoa pela eMulti na APS",
  },
  {
    codigo: "M2",
    nome: "Ações interprofissionais realizadas pela eMulti na APS",
    grupo: "eMulti",
    colunaValor: "M2 - Ações interprofissionais realizadas pela eMulti na APS",
  },
];

export async function lerCsvQualidade(caminhoArquivo) {
  const conteudo = await fs.readFile(caminhoArquivo, "utf-8");

  const linhas = conteudo.split(/\r?\n/);

  const linhaCompetencia = linhas.find((linha) =>
    linha.startsWith("Competência selecionada:")
  );

  const competencia = linhaCompetencia
    ? linhaCompetencia.replace("Competência selecionada:", "").trim()
    : null;

  const linhaMunicipio = linhas.find((linha) => linha.startsWith("Município:"));

  const municipio = linhaMunicipio
    ? linhaMunicipio.replace("Município:", "").trim()
    : null;

  const indiceCabecalho = linhas.findIndex((linha) =>
    linha.startsWith("Competência/Ano;")
  );

  if (indiceCabecalho === -1) {
    throw new Error("Cabeçalho da tabela não encontrado no CSV.");
  }

  const cabecalhos = linhas[indiceCabecalho]
    .split(";")
    .map((item) => limparCampo(item));

  const linhasDados = linhas.slice(indiceCabecalho + 1);

  const registros = [];
  const indicadores = [];

  for (const linha of linhasDados) {
    if (!linha.trim()) {
      continue;
    }

    const valores = linha.split(";").map((item) => limparCampo(item));

    const nomeEquipe = pegarValor(cabecalhos, valores, "NOME DA EQUIPE");

    if (!nomeEquipe || nomeEquipe === "None" || nomeEquipe === "nan") {
      continue;
    }

    const registro = montarRegistroBase(cabecalhos, valores);
    registros.push(registro);

    const indicadoresDaLinha = transformarLinhaEmIndicadores({
      cabecalhos,
      valores,
      competenciaArquivo: competencia,
    });

    indicadores.push(...indicadoresDaLinha);
  }

  return {
    competencia,
    municipio,
    totalRegistros: registros.length,
    totalIndicadores: indicadores.length,
    registros,
    indicadores,
  };
}

function transformarLinhaEmIndicadores({ cabecalhos, valores, competenciaArquivo }) {
  const indicadores = [];

  for (const indicador of INDICADORES) {
    const indiceValor = cabecalhos.indexOf(indicador.colunaValor);

    if (indiceValor === -1) {
      continue;
    }

    const valorBruto = valores[indiceValor];
    const classificacaoBruta = valores[indiceValor + 1];

    const valor = converterNumero(valorBruto);
    const classificacao = limparClassificacao(classificacaoBruta);

    if (valor === null && classificacao === null) {
      continue;
    }

    indicadores.push({
      competencia:
        limparCompetencia(pegarValor(cabecalhos, valores, "Competência/Ano")) ||
        competenciaArquivo,

      uf: pegarValor(cabecalhos, valores, "UF"),
      ibgeMunicipio: pegarValor(cabecalhos, valores, "IBGE Município"),
      nomeMunicipio: pegarValor(cabecalhos, valores, "Nome Município"),

      cnes: pegarValor(cabecalhos, valores, "CNES"),
      estabelecimento: pegarValor(cabecalhos, valores, "ESTABELECIMENTO"),
      ine: pegarValor(cabecalhos, valores, "INE"),
      nomeEquipe: pegarValor(cabecalhos, valores, "NOME DA EQUIPE"),
      siglaEquipe: pegarValor(cabecalhos, valores, "SIGLA DA EQUIPE"),

      codigoIndicador: indicador.codigo,
      nomeIndicador: indicador.nome,
      grupoIndicador: indicador.grupo,

      valor,
      classificacao,
    });
  }

  return indicadores;
}

function montarRegistroBase(cabecalhos, valores) {
  const registro = {};

  cabecalhos.forEach((cabecalho, index) => {
    if (!registro[cabecalho]) {
      registro[cabecalho] = valores[index] ?? null;
    }
  });

  return registro;
}

function pegarValor(cabecalhos, valores, nomeColuna) {
  const indice = cabecalhos.indexOf(nomeColuna);

  if (indice === -1) {
    return null;
  }

  const valor = valores[indice];

  if (!valor || valor === "N/A" || valor === "nan" || valor === "None") {
    return null;
  }

  return valor;
}

function converterNumero(valor) {
  if (!valor || valor === "N/A" || valor === "nan" || valor === "None") {
    return null;
  }

  const numero = Number(String(valor).replace(",", "."));

  if (Number.isNaN(numero)) {
    return null;
  }

  return numero;
}

function limparClassificacao(valor) {
  if (!valor || valor === "N/A" || valor === "nan" || valor === "None") {
    return null;
  }

  return String(valor).trim();
}

function limparCompetencia(valor) {
  if (!valor) {
    return null;
  }

  return String(valor).replace("\t", "").trim();
}

function limparCampo(valor) {
  if (valor === undefined || valor === null) {
    return null;
  }

  return String(valor).replaceAll('"', "").replaceAll("\t", "").trim();
}