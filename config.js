document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("tbody_fixos");
  const aviso = document.getElementById("aviso_config");
  const wrapper = document.getElementById("wrapper_fixos");

  const form = document.getElementById("form_config");
  const nomeInput = document.getElementById("fixo_nome");
  const valorInput = document.getElementById("fixo_valor");
  const prioridadeSelect = document.getElementById("fixo_prioridade");

  const totalEl = document.getElementById("fixo_total");
  const barraFill = document.getElementById("barra_config_fill");
  const barraTxt = document.getElementById("barra_config_txt");

  const secaoConfig = document.querySelector(".config");
  const rendaMensal = Number(secaoConfig?.dataset.receita || 0);

  const btnEditar = document.getElementById("btn_editar");
  const labelSituacao = document.getElementById("label_situacao");

  if (!tbody || !form || !btnEditar || !labelSituacao) return;

  let modoExcluir = false;
  let items = [];

  function formatBRL(valor) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatValorTabela(valor) {
    return Number(valor).toFixed(2);
  }

  function prioClass(prioridade) {
    if (prioridade === "Necessário") return "prio_necessario";
    if (prioridade === "Conveniente") return "prio_conveniente";
    return "prio_desnecessario";
  }

  async function requestJSON(url, options = {}) {
    const config = { ...options };

    if (config.body) {
      config.headers = {
        "Content-Type": "application/json",
        ...(config.headers || {}),
      };
    }

    const resposta = await fetch(url, config);

    if (!resposta.ok) {
      const mensagem = await resposta.text();
      throw new Error(mensagem || "Falha ao comunicar com o servidor.");
    }

    if (resposta.status === 204) {
      return null;
    }

    return resposta.json();
  }

  function criarToggle(ativo) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toggle_status" + (ativo ? " ativo" : "");

    const bola = document.createElement("span");
    bola.className = "bola_status";
    bola.textContent = ativo ? "✓" : "✕";

    btn.appendChild(bola);
    return btn;
  }

  function criarBotaoExcluir() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "botao_excluir_config";

    const icone = document.createElement("i");
    icone.className = "fa-solid fa-trash";

    btn.appendChild(icone);
    return btn;
  }

  function criarLinha(item) {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id;
    tr.dataset.valor = String(item.valor);
    tr.dataset.ativo = item.ativo ? "1" : "0";

    const tdNome = document.createElement("td");
    tdNome.className = "nome_cell";

    const nomeTexto = document.createElement("span");
    nomeTexto.className = "nome_texto";
    nomeTexto.textContent = item.nome;

    tdNome.appendChild(nomeTexto);

    const tdPrioridade = document.createElement("td");
    const prioridade = document.createElement("span");
    prioridade.className = `prio ${prioClass(item.prioridade)}`;
    tdPrioridade.appendChild(prioridade);

    const tdValor = document.createElement("td");
    tdValor.className = "valor_cell";
    tdValor.textContent = formatValorTabela(item.valor);

    const tdSituacao = document.createElement("td");
    tdSituacao.className = "celula_situacao";
    tdSituacao.appendChild(modoExcluir ? criarBotaoExcluir() : criarToggle(item.ativo));

    tr.append(tdNome, tdPrioridade, tdValor, tdSituacao);
    return tr;
  }

  function aplicarModoExcluir() {
    labelSituacao.textContent = modoExcluir ? "Excluir" : "Situação";

    document.querySelectorAll(".celula_situacao").forEach((td) => {
      const tr = td.closest("tr");
      const ativo = tr?.dataset.ativo === "1";

      td.innerHTML = "";
      td.appendChild(modoExcluir ? criarBotaoExcluir() : criarToggle(ativo));
    });
  }

  function totalAtivo(lista) {
    return lista.reduce((acc, item) => {
      return item.ativo ? acc + Number(item.valor || 0) : acc;
    }, 0);
  }

  function atualizarUI(lista) {
    const total = totalAtivo(lista);
    const pct = rendaMensal > 0 ? Math.min((total / rendaMensal) * 100, 100) : 0;
    const pctArredondado = Math.round(pct);

    if (totalEl) totalEl.textContent = formatBRL(total);
    if (barraFill) barraFill.style.width = `${pct}%`;

    if (barraTxt) {
      barraTxt.textContent = pctArredondado < 5 ? "" : `${pctArredondado}%`;
    }
  }

  function render() {
    tbody.innerHTML = "";

    if (items.length === 0) {
      aviso.style.display = "block";
      wrapper.style.display = "none";
    } else {
      aviso.style.display = "none";
      wrapper.style.display = "block";
      items.forEach((item) => tbody.appendChild(criarLinha(item)));
    }

    atualizarUI(items);
    aplicarModoExcluir();
  }

  async function carregarItems() {
    items = await requestJSON("/api/gastos-fixos");
    render();
  }

  tbody.addEventListener("click", async (e) => {
    const btnExcluir = e.target.closest(".botao_excluir_config");
    if (btnExcluir) {
      const tr = btnExcluir.closest("tr");
      if (!tr) return;

      try {
        await requestJSON(`/api/gastos-fixos/${tr.dataset.id}`, {
          method: "DELETE",
        });
        await carregarItems();
      } catch (erro) {
        console.error(erro);
        alert("Não foi possível excluir o gasto fixo.");
      }

      return;
    }

    const btnToggle = e.target.closest(".toggle_status");
    if (!btnToggle) return;

    const tr = btnToggle.closest("tr");
    if (!tr) return;

    try {
      await requestJSON(`/api/gastos-fixos/${tr.dataset.id}/toggle`, {
        method: "POST",
      });
      await carregarItems();
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível alterar o status do gasto fixo.");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();
    const valor = valorInput.value.trim().replace(",", ".");
    const prioridade = prioridadeSelect.value;

    if (!nome || !valor || !prioridade) return;

    const valorNumerico = Number(valor);
    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      alert("Digite um valor válido para o gasto fixo.");
      return;
    }

    try {
      await requestJSON("/api/gastos-fixos", {
        method: "POST",
        body: JSON.stringify({
          nome,
          valor: valorNumerico,
          prioridade,
        }),
      });

      form.reset();
      prioridadeSelect.classList.remove("selecionado");
      await carregarItems();
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível salvar o gasto fixo.");
    }
  });

  prioridadeSelect.addEventListener("change", () => {
    prioridadeSelect.classList.toggle("selecionado", Boolean(prioridadeSelect.value));
  });

  btnEditar.addEventListener("click", () => {
    modoExcluir = !modoExcluir;
    aplicarModoExcluir();
  });

  carregarItems().catch((erro) => {
    console.error(erro);
    aviso.style.display = "block";
    aviso.textContent = "Não foi possível carregar os gastos fixos.";
    wrapper.style.display = "none";
  });
});
