const competenciaASelect = document.getElementById("competenciaA");
const competenciaBSelect = document.getElementById("competenciaB");

const buscaInput = document.getElementById("busca");
const equipeSelect = document.getElementById("equipeSelect");
const grupoSelect = document.getElementById("grupo");
const statusSelect = document.getElementById("status");

const btnComparar = document.getElementById("btnComparar");
const btnRecarregar = document.getElementById("btnRecarregar");
const btnCards = document.getElementById("btnCards");
const btnTabela = document.getElementById("btnTabela");
const btnRelatorio = document.getElementById("btnRelatorio");

const cardsView = document.getElementById("cardsView");
const tableView = document.getElementById("tableView");
const reportView = document.getElementById("reportView");
const tabelaComparativo = document.getElementById("tabelaComparativo");

let comparativoOriginal = [];

function formatarNumero(valor, comSinal = false) {
  if (valor === null || valor === undefined) return "—";

  const numero = Number(valor);

  if (Number.isNaN(numero)) return "—";

  const texto = numero.toFixed(2).replace(".", ",");

  if (comSinal && numero > 0) return `+${texto}`;

  return texto;
}

function getDeltaClass(valor) {
  if (valor > 0) return "verde-text";
  if (valor < 0) return "vermelho-text";
  return "cinza-text";
}

function getStatusLabel(status) {
  const labels = {
    subiu: "Subiu",
    caiu: "Caiu",
    estavel: "Estável",
    "sem-dados": "Sem dados",
  };

  return labels[status] || status || "—";
}

function getStatusIcon(status) {
  if (status === "subiu") return "↑";
  if (status === "caiu") return "↓";
  if (status === "estavel") return "=";
  return "?";
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
    return `<span class="classification class-empty">—</span>`;
  }

  return `<span class="classification ${getClassificacaoClass(classificacao)}">${classificacao}</span>`;
}

function renderClassificacaoCompacta(classificacao) {
  if (!classificacao) {
    return `<span class="report-classificacao class-empty">—</span>`;
  }

  return `
    <span class="report-classificacao ${getClassificacaoClass(classificacao)}">
      ${classificacao}
    </span>
  `;
}

function preencherSelectEquipes() {
  const equipeAtual = equipeSelect.value;

  const equipes = [...new Set(
    comparativoOriginal
      .map((item) => item.equipe)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  equipeSelect.innerHTML = `<option value="">Todas as equipes</option>`;

  equipes.forEach((equipe) => {
    const option = document.createElement("option");
    option.value = equipe;
    option.textContent = equipe;

    equipeSelect.appendChild(option);
  });

  if ([...equipeSelect.options].some((option) => option.value === equipeAtual)) {
    equipeSelect.value = equipeAtual;
  }
}

function filtrarDados() {
  const busca = normalizarTexto(buscaInput.value);
  const equipeSelecionada = equipeSelect.value;
  const grupo = grupoSelect.value;
  const status = statusSelect.value;

  return comparativoOriginal.filter((item) => {
    const textoBusca = normalizarTexto(
      `${item.equipe} ${item.estabelecimento} ${item.codigoIndicador} ${item.nomeIndicador}`
    );

    const buscaOk = textoBusca.includes(busca);
    const equipeOk = !equipeSelecionada || item.equipe === equipeSelecionada;
    const grupoOk = !grupo || item.grupoIndicador === grupo;
    const statusOk = !status || item.status === status;

    return buscaOk && equipeOk && grupoOk && statusOk;
  });
}

async function carregarCompetencias() {
  const response = await fetch("/api/competencias");
  const competencias = await response.json();

  const competenciasOrdenadas = ordenarCompetencias(competencias);

  competenciaASelect.innerHTML = "";
  competenciaBSelect.innerHTML = "";

  competenciasOrdenadas.forEach((item) => {
    const optionA = document.createElement("option");
    optionA.value = item.competencia;
    optionA.textContent = item.competencia;

    const optionB = document.createElement("option");
    optionB.value = item.competencia;
    optionB.textContent = item.competencia;

    competenciaASelect.appendChild(optionA);
    competenciaBSelect.appendChild(optionB);
  });

  if (competenciasOrdenadas.length >= 2) {
    competenciaBSelect.selectedIndex = 0;
    competenciaASelect.selectedIndex = 1;
  }
}

async function carregarComparativo() {
  const competenciaA = competenciaASelect.value;
  const competenciaB = competenciaBSelect.value;

  if (!competenciaA || !competenciaB) {
    alert("Selecione as duas competências.");
    return;
  }

  cardsView.innerHTML = `<div class="empty-state">Carregando comparativo...</div>`;
  reportView.innerHTML = `<div class="empty-state">Carregando comparativo...</div>`;
  tabelaComparativo.innerHTML = `<tr><td colspan="10">Carregando comparativo...</td></tr>`;

  const url = `/api/comparativo?competenciaA=${encodeURIComponent(competenciaA)}&competenciaB=${encodeURIComponent(competenciaB)}`;

  const response = await fetch(url);
  const data = await response.json();

  comparativoOriginal = data.comparativo || [];

  preencherSelectEquipes();

  document.getElementById("colA").textContent = competenciaA;
  document.getElementById("colB").textContent = competenciaB;

  atualizarResumo(data.resumo);
  renderizarTudo();
}

function atualizarResumo(resumo) {
  document.getElementById("totalComparados").textContent = resumo?.totalComparados ?? 0;
  document.getElementById("totalSubiram").textContent = resumo?.subiram ?? 0;
  document.getElementById("totalCairam").textContent = resumo?.cairam ?? 0;
  document.getElementById("totalEstaveis").textContent = resumo?.estaveis ?? 0;
  document.getElementById("totalSemDados").textContent = resumo?.semDados ?? 0;
}

function renderizarTudo() {
  const dados = filtrarDados();

  renderizarRankings(dados);
  renderizarCardsPorEquipe(dados);
  renderizarTabela(dados);
  renderizarRelatorioCompacto(dados);
}

function renderizarRankings(dados) {
  const validos = dados.filter((item) => item.variacao !== null && item.variacao !== undefined);

  const altas = [...validos]
    .filter((item) => item.variacao > 0)
    .sort((a, b) => b.variacao - a.variacao)
    .slice(0, 5);

  const quedas = [...validos]
    .filter((item) => item.variacao < 0)
    .sort((a, b) => a.variacao - b.variacao)
    .slice(0, 5);

  document.getElementById("maioresAltas").innerHTML = renderRankingLista(altas, "verde");
  document.getElementById("maioresQuedas").innerHTML = renderRankingLista(quedas, "vermelho");
}

function renderRankingLista(lista, cor) {
  if (lista.length === 0) {
    return `<div class="empty-state">Nenhum dado encontrado.</div>`;
  }

  return lista.map((item, index) => `
    <div class="rank-item">
      <div class="rank-number ${cor}">${index + 1}</div>
      <div>
        <div class="rank-main">${item.equipe}</div>
        <div class="rank-sub">
          ${item.codigoIndicador} — ${item.nomeIndicador}
          | ${formatarNumero(item.valorA)} → ${formatarNumero(item.valorB)}
        </div>
      </div>
      <div class="rank-delta ${getDeltaClass(item.variacao)}">
        ${formatarNumero(item.variacao, true)}
      </div>
    </div>
  `).join("");
}

function agruparPorEquipe(dados) {
  const mapa = new Map();

  dados.forEach((item) => {
    if (!mapa.has(item.equipe)) {
      mapa.set(item.equipe, {
        equipe: item.equipe,
        estabelecimento: item.estabelecimento,
        siglaEquipe: item.siglaEquipe,
        indicadores: [],
        subiram: 0,
        cairam: 0,
        estaveis: 0,
        semDados: 0,
      });
    }

    const equipe = mapa.get(item.equipe);
    equipe.indicadores.push(item);

    if (item.status === "subiu") equipe.subiram++;
    else if (item.status === "caiu") equipe.cairam++;
    else if (item.status === "estavel") equipe.estaveis++;
    else equipe.semDados++;
  });

  return Array.from(mapa.values()).sort((a, b) => {
    const saldoA = a.subiram - a.cairam;
    const saldoB = b.subiram - b.cairam;

    return saldoB - saldoA || a.equipe.localeCompare(b.equipe);
  });
}

function renderizarCardsPorEquipe(dados) {
  const equipes = agruparPorEquipe(dados);

  if (equipes.length === 0) {
    cardsView.innerHTML = `<div class="empty-state">Nenhum dado encontrado com os filtros selecionados.</div>`;
    return;
  }

  cardsView.innerHTML = equipes.map((equipe) => {
    const indicadoresOrdenados = [...equipe.indicadores].sort((a, b) => {
      return a.codigoIndicador.localeCompare(b.codigoIndicador, "pt-BR", { numeric: true });
    });

    return `
      <article class="team-card">
        <div class="team-header">
          <div>
            <div class="team-name">${equipe.equipe}</div>
            <div class="team-sub">${equipe.estabelecimento || ""}</div>
          </div>

          <div class="pill verde">↑ ${equipe.subiram} altas</div>
          <div class="pill vermelho">↓ ${equipe.cairam} quedas</div>
          <div class="pill cinza">= ${equipe.estaveis} estáveis</div>
        </div>

        <div class="team-body">
          <div class="indicators-grid">
            ${indicadoresOrdenados.map(renderIndicatorCard).join("")}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderIndicatorCard(item) {
  return `
    <div class="indicator-card ${item.status}">
      <div class="indicator-top">
        <div>
          <div class="indicator-code">${item.codigoIndicador}</div>
          <div class="indicator-name">${item.nomeIndicador}</div>
        </div>

        <div class="indicator-group">${item.grupoIndicador}</div>
      </div>

      <div class="compare-values">
        <div class="value-box">
          <div class="value-label">${item.competenciaA}</div>
          <div class="value-number">${formatarNumero(item.valorA)}</div>
          ${renderClassificacao(item.classificacaoA)}
        </div>

        <div class="arrow">→</div>

        <div class="value-box">
          <div class="value-label">${item.competenciaB}</div>
          <div class="value-number">${formatarNumero(item.valorB)}</div>
          ${renderClassificacao(item.classificacaoB)}
        </div>
      </div>

      <div class="indicator-footer">
        <div class="delta-badge ${item.status}">
          ${getStatusIcon(item.status)} ${getStatusLabel(item.status)}
        </div>

        <div class="delta-badge ${item.status}">
          ${formatarNumero(item.variacao, true)}
        </div>
      </div>
    </div>
  `;
}

function renderizarTabela(dados) {
  if (dados.length === 0) {
    tabelaComparativo.innerHTML = `<tr><td colspan="10">Nenhum dado encontrado.</td></tr>`;
    return;
  }

  tabelaComparativo.innerHTML = dados.map((item) => `
    <tr>
      <td><strong>${item.equipe}</strong></td>
      <td>${item.estabelecimento || "—"}</td>
      <td>${item.grupoIndicador}</td>
      <td><strong>${item.codigoIndicador}</strong> — ${item.nomeIndicador}</td>
      <td>${formatarNumero(item.valorA)}</td>
      <td>${renderClassificacao(item.classificacaoA)}</td>
      <td>${formatarNumero(item.valorB)}</td>
      <td>${renderClassificacao(item.classificacaoB)}</td>
      <td class="${getDeltaClass(item.variacao)}">
        <strong>${formatarNumero(item.variacao, true)}</strong>
      </td>
      <td>
        <span class="delta-badge ${item.status}">
          ${getStatusIcon(item.status)} ${getStatusLabel(item.status)}
        </span>
      </td>
    </tr>
  `).join("");
}

function renderizarRelatorioCompacto(dados) {
  const equipes = agruparPorEquipe(dados);

  if (equipes.length === 0) {
    reportView.innerHTML = `<div class="empty-state">Nenhum dado encontrado com os filtros selecionados.</div>`;
    return;
  }

  reportView.innerHTML = equipes.map((equipe) => {
    const indicadores = [...equipe.indicadores].sort((a, b) => {
      const grupoCompare = a.grupoIndicador.localeCompare(b.grupoIndicador);

      if (grupoCompare !== 0) return grupoCompare;

      return a.codigoIndicador.localeCompare(b.codigoIndicador, "pt-BR", {
        numeric: true,
      });
    });

    return `
      <article class="report-team">
        <div class="report-team-header">
          <div>
            <div class="report-team-title">${equipe.equipe}</div>
            <div class="report-team-sub">${equipe.estabelecimento || ""}</div>
          </div>

          <div class="report-summary">
            <span class="pill verde">↑ ${equipe.subiram}</span>
            <span class="pill vermelho">↓ ${equipe.cairam}</span>
            <span class="pill cinza">= ${equipe.estaveis}</span>
          </div>
        </div>

        <div class="report-table-wrapper">
          <table class="report-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Indicador</th>
                <th>${indicadores[0]?.competenciaA || "Inicial"}</th>
                <th>Class. Inicial</th>
                <th>${indicadores[0]?.competenciaB || "Final"}</th>
                <th>Class. Final</th>
                <th>Variação</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${indicadores.map((item) => `
                <tr>
                  <td>${item.grupoIndicador}</td>
                  <td>
                    <span class="report-indicator">${item.codigoIndicador}</span>
                    — ${item.nomeIndicador}
                  </td>
                  <td>${formatarNumero(item.valorA)}</td>
                  <td>${renderClassificacaoCompacta(item.classificacaoA)}</td>
                  <td>${formatarNumero(item.valorB)}</td>
                  <td>${renderClassificacaoCompacta(item.classificacaoB)}</td>
                  <td class="report-delta ${getDeltaClass(item.variacao)}">
                    ${formatarNumero(item.variacao, true)}
                  </td>
                  <td>${getStatusIcon(item.status)} ${getStatusLabel(item.status)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }).join("");
}

function ativarCards() {
  cardsView.classList.remove("hidden");
  tableView.classList.add("hidden");
  reportView.classList.add("hidden");

  btnCards.classList.add("active");
  btnTabela.classList.remove("active");
  btnRelatorio.classList.remove("active");
}

function ativarTabela() {
  cardsView.classList.add("hidden");
  tableView.classList.remove("hidden");
  reportView.classList.add("hidden");

  btnTabela.classList.add("active");
  btnCards.classList.remove("active");
  btnRelatorio.classList.remove("active");
}

function ativarRelatorio() {
  cardsView.classList.add("hidden");
  tableView.classList.add("hidden");
  reportView.classList.remove("hidden");

  btnRelatorio.classList.add("active");
  btnCards.classList.remove("active");
  btnTabela.classList.remove("active");
}

btnComparar.addEventListener("click", carregarComparativo);
btnRecarregar.addEventListener("click", carregarComparativo);

buscaInput.addEventListener("input", renderizarTudo);
equipeSelect.addEventListener("change", renderizarTudo);
grupoSelect.addEventListener("change", renderizarTudo);
statusSelect.addEventListener("change", renderizarTudo);

btnCards.addEventListener("click", ativarCards);
btnTabela.addEventListener("click", ativarTabela);
btnRelatorio.addEventListener("click", ativarRelatorio);

async function iniciar() {
  await carregarCompetencias();
  await carregarComparativo();
}

iniciar();