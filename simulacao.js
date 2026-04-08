document.addEventListener("DOMContentLoaded", () => {
  const tipoFiltro = document.getElementById("tipo_filtro");
  const msg = document.getElementById("mensagem_filtro");
  const boxPrioridade = document.getElementById("filtro_prioridade_box");
  const boxPreco = document.getElementById("filtro_preco_box");

  const tbody = document.querySelector(".tabela_simulacao tbody");
  const totalEl = document.getElementById("texto_custo_simulacao");

  if (!tbody) return;

  const linhas = Array.from(tbody.querySelectorAll("tr[data-id]"));
  const tabelaSimulacao = document.querySelector(".tabela_simulacao");

  if (tabelaSimulacao) {
    tabelaSimulacao.classList.toggle("sem-itens", linhas.length === 0);
    tabelaSimulacao.classList.toggle("poucos-itens", linhas.length > 0 && linhas.length <= 2);
  }
  const checksPrioridade = Array.from(document.querySelectorAll(".chk-prioridade"));
  const radiosPreco = Array.from(document.querySelectorAll(".radio-preco"));

  const ocultos = new Set();

  if (linhas.length === 0) return;

  const barraOriginal = document.getElementById("barra_original");
  const barraEconomia = document.getElementById("barra_economia");
  const valorOriginalEl = document.getElementById("valor_original");
  const valorEconomiaEl = document.getElementById("valor_economia");

  function normalizarTexto(txt) {
    return (txt || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function parseValor(linha) {
    const bruto = String(linha.dataset.valor || "0").replace(",", ".");
    const n = Number(bruto);
    return Number.isFinite(n) ? n : 0;
  }

  function formatBRL(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function calcularTotalOriginal() {
    return linhas.reduce((acc, linha) => acc + parseValor(linha), 0);
  }

  const totalOriginal = calcularTotalOriginal();

  function atualizarGrafico(totalAtual) {
    if (!barraOriginal || !barraEconomia) return;

    let economia = totalOriginal - totalAtual;
    if (economia < 0) economia = 0;

    const ALTURA_BASE = 120; // px (altura fixa da barra vermelha)
    const proporcao = totalOriginal > 0 ? (economia / totalOriginal) : 0;

    barraOriginal.style.height = `${ALTURA_BASE}px`;

    // barra verde proporcional à vermelha
    const alturaEconomia = Math.max(4, Math.round(ALTURA_BASE * proporcao));
    barraEconomia.style.height = `${alturaEconomia}px`;

    if (valorOriginalEl) valorOriginalEl.textContent = formatBRL(totalOriginal);
    if (valorEconomiaEl) valorEconomiaEl.textContent = formatBRL(economia);
  }

  function atualizarTotal() {
    let total = 0;

    linhas.forEach((linha) => {
      const id = linha.dataset.id;
      const visivel = linha.style.display !== "none";

      if (visivel && !ocultos.has(id)) {
        total += parseValor(linha);
      }
    });

    if (totalEl) {
      totalEl.innerHTML = `<strong>${formatBRL(total)}</strong>`;
    }

    atualizarGrafico(total);
  }

  function renderLinhasOcultas() {
    linhas.forEach((linha) => {
      const id = linha.dataset.id;
      linha.classList.toggle("linha_oculta", ocultos.has(id));
    });
  }

  function aplicarFiltroPrioridade() {
    const marcadas = checksPrioridade
      .filter((c) => c.checked)
      .map((c) => normalizarTexto(c.value));

    linhas.forEach((linha) => {
      const prioridadeLinha = normalizarTexto(linha.dataset.prioridade);
      linha.style.display = marcadas.includes(prioridadeLinha) ? "" : "none";
    });

    atualizarTotal();
  }

  function aplicarOrdenacaoPreco(ordem) {
    const linhasVisiveis = linhas.filter((linha) => linha.style.display !== "none");

    linhasVisiveis.sort((a, b) => {
      const va = parseValor(a);
      const vb = parseValor(b);
      return ordem === "crescente" ? va - vb : vb - va;
    });

    linhasVisiveis.forEach((linha) => tbody.appendChild(linha));
  }

  function resetApenasFiltros() {
    linhas.forEach((linha) => {
      linha.style.display = "";
      tbody.appendChild(linha);
    });

    checksPrioridade.forEach((c) => (c.checked = true));
    radiosPreco.forEach((r) => (r.checked = false));

    atualizarTotal();
  }

  tbody.addEventListener("click", (e) => {
    const botao = e.target.closest(".botao_ocultar");
    if (!botao) return;

    const linha = botao.closest("tr[data-id]");
    if (!linha) return;

    const id = linha.dataset.id;

    if (ocultos.has(id)) {
      ocultos.delete(id);
    } else {
      ocultos.add(id);
    }

    renderLinhasOcultas();
    atualizarTotal();

    const icone = botao.querySelector("i");
    if (icone) {
      icone.classList.toggle("fa-eye-slash", !ocultos.has(id));
      icone.classList.toggle("fa-eye", ocultos.has(id));
    }
  });

  tipoFiltro?.addEventListener("change", () => {
    const tipo = tipoFiltro.value;

    if (!tipo) {
      msg.style.display = "block";
      boxPrioridade.style.display = "none";
      boxPreco.style.display = "none";
      resetApenasFiltros();
      atualizarTotal();
      return;
    }

    msg.style.display = "none";

    if (tipo === "prioridade") {
      boxPrioridade.style.display = "block";
      boxPreco.style.display = "none";
      radiosPreco.forEach((r) => (r.checked = false));
      aplicarFiltroPrioridade();
    } else if (tipo === "preco") {
      boxPrioridade.style.display = "none";
      boxPreco.style.display = "block";
      linhas.forEach((linha) => (linha.style.display = ""));
      checksPrioridade.forEach((c) => (c.checked = true));
      atualizarTotal();
    }
  });

  checksPrioridade.forEach((c) => {
    c.addEventListener("change", () => {
      if (tipoFiltro?.value === "prioridade") {
        aplicarFiltroPrioridade();
      }
    });
  });

  radiosPreco.forEach((r) => {
    r.addEventListener("change", () => {
      if (tipoFiltro?.value === "preco") {
        aplicarOrdenacaoPreco(r.value);
      }
    });
  });

  renderLinhasOcultas();
  atualizarTotal();
});