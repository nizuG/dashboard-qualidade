const competenciaSelect = document.getElementById("competenciaSelect");
const equipeSelect = document.getElementById("equipeSelect");
const grupoSelect = document.getElementById("grupoSelect");
const btnCarregar = document.getElementById("btnCarregar");
const resultado = document.getElementById("resultado");

let dadosCompetencia = null;

function formatarNumero(valor) {
  if (valor === null || valor === undefined) return "—";

  const numero = Number(valor);

  if (Number.isNaN(numero)) return "—";

  return numero.toFixed(2).replace(".", ",");
}

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function ordenarCompetencias(lista) {
  const mapa = new Map();

  for (const item of lista) {
    if (!mapa.has(item.competencia)) {
      mapa.set(item.competencia, item);
    }
  }

  return Array.from(mapa.values()).sort((a, b) => {
    return competenciaParaDataOrdenavel(b.competencia) - competenciaParaDataOrdenavel(a.competencia);
  });
}

function getClassificacaoClass(classificacao) {
  const texto = normalizarTexto(classificacao);

  if (texto.includes("otimo")) return "class-otimo";
  if (texto.includes("bom")) return "class-bom";
  if (texto.includes("suficiente")) return "class-suficiente";
  if (texto.includes("regular")) return "class-regular";

  return "class-empty";
}

function renderClassificacao(classificacao) {
  if (!classificacao) {
    return `<span class="classification class-empty">Sem classificação</span>`;
  }

  return `<span class="classification ${getClassificacaoClass(classificacao)}">${classificacao}</span>`;
}

async function carregarCompetencias() {
  const response = await fetch("/api/competencias");
  const competencias = await response.json();

  competenciaSelect.innerHTML = "";

  ordenarCompetencias(competencias).forEach((item) => {
    const option = document.createElement("option");
    option.value = item.competencia;
    option.textContent = item.competencia;

    competenciaSelect.appendChild(option);
  });
}

async function carregarDadosCompetencia() {
  const competencia = competenciaSelect.value;

  if (!competencia) {
    alert("Selecione uma competência.");
    return;
  }

  resultado.innerHTML = `<div class="empty-state">Carregando dados...</div>`;

  const url = `/api/competencia?competencia=${encodeURIComponent(competencia)}`;
  const response = await fetch(url);
  const data = await response.json();

  dadosCompetencia = data;

  preencherSelectEquipes(data.equipes || []);
  atualizarResumo(data.resumo);
  renderizarEquipes();
}

function preencherSelectEquipes(equipes) {
  const equipeAtual = equipeSelect.value;

  equipeSelect.innerHTML = `<option value="">Todas as equipes</option>`;

  equipes
    .sort((a, b) => a.equipe.localeCompare(b.equipe))
    .forEach((item) => {
      const option = document.createElement("option");
      option.value = item.equipe;
      option.textContent = item.equipe;

      equipeSelect.appendChild(option);
    });

  if ([...equipeSelect.options].some((option) => option.value === equipeAtual)) {
    equipeSelect.value = equipeAtual;
  }
}

function atualizarResumo(resumo) {
  document.getElementById("totalEquipes").textContent = resumo?.totalEquipes ?? 0;
  document.getElementById("totalIndicadores").textContent = resumo?.totalIndicadores ?? 0;
  document.getElementById("totalOtimo").textContent = resumo?.otimo ?? 0;
  document.getElementById("totalBom").textContent = resumo?.bom ?? 0;
  document.getElementById("totalSuficiente").textContent = resumo?.suficiente ?? 0;
  document.getElementById("totalRegular").textContent = resumo?.regular ?? 0;
}

function filtrarEquipes() {
  const equipeSelecionada = equipeSelect.value;
  const grupoSelecionado = grupoSelect.value;

  const equipes = dadosCompetencia?.equipes || [];

  return equipes
    .filter((equipe) => {
      return !equipeSelecionada || equipe.equipe === equipeSelecionada;
    })
    .map((equipe) => {
      return {
        ...equipe,
        indicadores: equipe.indicadores.filter((indicador) => {
          return !grupoSelecionado || indicador.grupoIndicador === grupoSelecionado;
        }),
      };
    })
    .filter((equipe) => equipe.indicadores.length > 0);
}

function agruparIndicadoresPorGrupo(indicadores) {
  const grupos = new Map();

  indicadores.forEach((indicador) => {
    if (!grupos.has(indicador.grupoIndicador)) {
      grupos.set(indicador.grupoIndicador, []);
    }

    grupos.get(indicador.grupoIndicador).push(indicador);
  });

  return Array.from(grupos.entries());
}

function renderizarEquipes() {
  const equipes = filtrarEquipes();

  if (equipes.length === 0) {
    resultado.innerHTML = `<div class="empty-state">Nenhum dado encontrado.</div>`;
    return;
  }

  resultado.innerHTML = equipes.map((equipe) => {
    const grupos = agruparIndicadoresPorGrupo(equipe.indicadores);

    return `
      <article class="team-card">
        <div class="team-header">
          <div>
            <div class="team-name">${equipe.equipe}</div>
            <div class="team-sub">${equipe.estabelecimento || ""}</div>
          </div>

          <div class="team-sub">
            ${equipe.indicadores.length} indicadores exibidos
          </div>
        </div>

        <div class="team-body">
          ${grupos.map(([grupo, indicadores]) => `
            <div class="group-section">
              <h3 class="group-title">${grupo}</h3>

              <div class="indicators-grid">
                ${indicadores
                  .sort((a, b) => a.codigoIndicador.localeCompare(b.codigoIndicador, "pt-BR", { numeric: true }))
                  .map(renderizarIndicador)
                  .join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderizarIndicador(indicador) {
  return `
    <div class="indicator-card">
      <div class="indicator-top">
        <div>
          <div class="indicator-code">${indicador.codigoIndicador}</div>
          <div class="indicator-name">${indicador.nomeIndicador}</div>
        </div>
      </div>

      <div>
        <div class="value-number">${formatarNumero(indicador.valor)}</div>
        ${renderClassificacao(indicador.classificacao)}
      </div>
    </div>
  `;
}

btnCarregar.addEventListener("click", carregarDadosCompetencia);

competenciaSelect.addEventListener("change", () => {
  equipeSelect.value = "";
  carregarDadosCompetencia();
});

equipeSelect.addEventListener("change", renderizarEquipes);
grupoSelect.addEventListener("change", renderizarEquipes);

async function iniciar() {
  await carregarCompetencias();
  await carregarDadosCompetencia();
}

iniciar();