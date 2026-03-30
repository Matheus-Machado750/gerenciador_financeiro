document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "gastos_fixos";

  const tbody = document.getElementById("tbody_fixos");
  const aviso = document.getElementById("aviso_config");
  const wrapper = document.getElementById("wrapper_fixos");

  const form = document.getElementById("form_config");
  const nomeInput = document.getElementById("fixo_nome");
  const valorInput = document.getElementById("fixo_valor");
  const catSelect = document.getElementById("fixo_categoria");

  const totalEl = document.getElementById("fixo_total");
  const barraFill = document.getElementById("barra_config_fill");
  const barraTxt = document.getElementById("barra_config_txt");

  const rendaMensal = 1860; // simulado por enquanto

  const btnEditar = document.getElementById("btn_editar");
  const labelSituacao = document.getElementById("label_situacao");
  let modoExcluir = false;

  function formatBRL(n) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function prioClass(cat) {
    if (cat === "Necessário") return "prio_necessario";
    if (cat === "Conveniente") return "prio_conveniente";
    return "prio_desnecessario";
  }

  function loadItems() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  }

  function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function criarToggle(ativo) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toggle_status" + (ativo ? " ativo" : "");
    btn.innerHTML = `<span class="bola_status ${ativo ? "ok" : "x"}">${ativo ? "✓" : "✕"}</span>`;
    return btn;
  }

  function criarLinha(item) {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id;
    tr.dataset.valor = String(item.valor).replace(",", ".");
    tr.dataset.ativo = item.ativo ? "1" : "0";

    tr.innerHTML = `
      <td class="nome_cell">${item.nome}</td>
      <td><span class="prio ${prioClass(item.categoria)}"></span></td>
      <td class="valor_cell">${item.valor}</td>
      <td class="celula_situacao"></td>
    `;

    const td = tr.querySelector(".celula_situacao");
    td.appendChild(criarToggle(item.ativo));
    return tr;
  }

  function aplicarModoExcluir() {
    if (modoExcluir) {
      labelSituacao.textContent = "Excluir";
    } else {
      labelSituacao.textContent = "Situação";
    }

    document.querySelectorAll(".celula_situacao").forEach((td) => {
      td.innerHTML = "";
      if (modoExcluir) {
        const btn = document.createElement("button");
        btn.className = "botao_excluir";
        btn.type = "button";
        btn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        td.appendChild(btn);
      } else {
        const tr = td.closest("tr");
        const ativo = tr.dataset.ativo === "1";
        td.appendChild(criarToggle(ativo));
      }
    });
  }

  function render(items) {
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

  function totalAtivo(items) {
    return items.reduce((acc, item) => {
      return item.ativo ? acc + Number(String(item.valor).replace(",", ".")) : acc;
    }, 0);
  }

  function atualizarUI(items) {
    const total = totalAtivo(items);
    const pct = rendaMensal > 0 ? Math.min((total / rendaMensal) * 100, 100) : 0;

    if (totalEl) totalEl.textContent = formatBRL(total);
    if (barraFill) barraFill.style.width = `${pct}%`;

    if (barraTxt) {
      if (total === 0) {
        barraTxt.textContent = "";
      } else {
        barraTxt.textContent = `${Math.round(pct)}%`;
      }
    }
  }

  // Estado inicial
  let items = loadItems();
  render(items);

  // Toggle status OU excluir
  tbody.addEventListener("click", (e) => {
    const btnExcluir = e.target.closest(".botao_excluir");
    if (btnExcluir) {
      const tr = btnExcluir.closest("tr");
      const id = tr.dataset.id;
      items = items.filter((it) => it.id !== id);
      saveItems(items);
      render(items);
      return;
    }

    const btn = e.target.closest(".toggle_status");
    if (!btn) return;

    const tr = btn.closest("tr");
    if (!tr) return;

    const id = tr.dataset.id;
    items = items.map((it) =>
      it.id === id ? { ...it, ativo: !it.ativo } : it
    );
    saveItems(items);
    render(items);
  });

  // Adicionar item
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();
    const valor = valorInput.value.trim().replace(",", ".");
    const categoria = catSelect.value;

    if (!nome || !valor || !categoria) return;

    const item = {
      id: crypto.randomUUID(),
      nome: nome.slice(0, 20),
      valor,
      categoria,
      ativo: true,
    };

    items.push(item);
    saveItems(items);
    form.reset();
    render(items);
  });

  btnEditar.addEventListener("click", () => {
    modoExcluir = !modoExcluir;
    aplicarModoExcluir();
  });
});
