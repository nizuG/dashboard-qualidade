const totalImportacoesEl = document.getElementById("totalImportacoes");
const totalCompetenciasEl = document.getElementById("totalCompetencias");
const ultimaCompetenciaEl = document.getElementById("ultimaCompetencia");
const municipioEl = document.getElementById("municipio");
const listaImportacoesEl = document.getElementById("listaImportacoes");
const statusAtualEl = document.getElementById("statusAtual");

function formatarData(dataIso) {
  if (!dataIso) return "—";

  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function extrairNomeMunicipio(municipio) {
  if (!municipio) return "—";

  const partes = String(municipio).split("/");

  if (partes.length > 1) {
    return partes[1].trim();
  }

  return municipio;
}

function competenciaParaDataOrdenavel(competencia) {
  if (!competencia) return 0;

  const mapaMeses = {
    JAN: 1,
    FEV: 2,
    MAR: 3,
    ABR: 4,
    MAI: 5,
    JUN: 6,
    JUL: 7,
    AGO: 8,
    SET: 9,
    OUT: 10,
    NOV: 11,
    DEZ: 12,
  };

  const partes = String(competencia).trim().toUpperCase().split("/");

  if (partes.length !== 2) return 0;

  const mesTexto = partes[0];
  const anoTexto = partes[1];

  const mes = mapaMeses[mesTexto];

  if (!mes) return 0;

  const ano = Number(anoTexto.length === 2 ? `20${anoTexto}` : anoTexto);

  if (Number.isNaN(ano)) return 0;

  return ano * 100 + mes;
}

function ordenarPorCompetenciaMaisRecente(importacoes) {
  return [...importacoes].sort((a, b) => {
    const dataA = competenciaParaDataOrdenavel(a.competencia);
    const dataB = competenciaParaDataOrdenavel(b.competencia);

    if (dataB !== dataA) {
      return dataB - dataA;
    }

    return new Date(b.criadoEm) - new Date(a.criadoEm);
  });
}

function obterCompetenciasUnicasOrdenadas(importacoes) {
  const mapa = new Map();

  for (const item of importacoes) {
    if (!mapa.has(item.competencia)) {
      mapa.set(item.competencia, item);
    }
  }

  return ordenarPorCompetenciaMaisRecente(Array.from(mapa.values()));
}

async function carregarResumo() {
  try {
    const response = await fetch("/api/competencias");
    const importacoes = await response.json();

    const competenciasOrdenadas = obterCompetenciasUnicasOrdenadas(importacoes);

    totalImportacoesEl.textContent = importacoes.length;
    totalCompetenciasEl.textContent = competenciasOrdenadas.length;

    if (competenciasOrdenadas.length > 0) {
      const maisRecente = competenciasOrdenadas[0];
      const ultimaImportacaoNoSistema = [...importacoes].sort((a, b) => {
        return new Date(b.criadoEm) - new Date(a.criadoEm);
      })[0];

      ultimaCompetenciaEl.textContent = maisRecente.competencia || "—";
      municipioEl.textContent = extrairNomeMunicipio(maisRecente.municipio);

      statusAtualEl.textContent =
        `Competência mais recente: ${maisRecente.competencia}. Última importação no sistema: ${formatarData(ultimaImportacaoNoSistema?.criadoEm)}.`;
    } else {
      ultimaCompetenciaEl.textContent = "—";
      municipioEl.textContent = "—";
      statusAtualEl.textContent = "Nenhuma importação encontrada. Comece importando um CSV.";
    }

    renderizarImportacoes(competenciasOrdenadas);
  } catch (error) {
    console.error(error);

    statusAtualEl.textContent = "Erro ao carregar o resumo.";
    listaImportacoesEl.innerHTML = `
      <div class="empty-state">
        Não foi possível carregar as importações.
      </div>
    `;
  }
}

function renderizarImportacoes(importacoes) {
  if (!importacoes.length) {
    listaImportacoesEl.innerHTML = `
      <div class="empty-state">
        Nenhuma importação encontrada.
      </div>
    `;
    return;
  }

  listaImportacoesEl.innerHTML = importacoes.map((item) => `
    <div class="import-item">
      <div>
        <div class="import-title">${item.nomeArquivo || "Arquivo sem nome"}</div>
        <div class="import-sub">
          ${extrairNomeMunicipio(item.municipio)} · importado em ${formatarData(item.criadoEm)}
        </div>
      </div>

      <div class="competencia-pill">
        ${item.competencia}
      </div>
    </div>
  `).join("");
}

carregarResumo();