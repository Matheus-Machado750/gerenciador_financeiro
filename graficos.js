const elemento = document.querySelector(".receita_vs_despesa")

var gasto = parseFloat(elemento.dataset.gasto)
var receita = parseFloat(elemento.dataset.receita)

var restante = receita - gasto

if (restante < 0) {
    restante = 0
}

// Elementos do HTML

var textoGasto = document.querySelector(".texto_valor_gasto".textContent(gastoFormatado))
var saldoRestante = document.querySelector(".texto_saldo_restante".textContent(restanteFormatado))

var gastoFormatado = gasto.toFixed(2)
var restanteFormatado = restante.toFixed(2)