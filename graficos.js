const elemento = document.querySelector(".receita_vs_despesa")

var gasto = parseFloat(elemento.dataset.gasto)
var receita = parseFloat(elemento.dataset.receita)

var restante = receita - gasto

if (restante < 0) {
    restante = 0
}

// Elementos do HTML

var textoGasto = document.querySelector(".texto_valor_gasto")
var saldoRestante = document.querySelector(".texto_saldo_restante")

var gastoFormatado = gasto.toFixed(2)
var restanteFormatado = restante.toFixed(2)

textoGasto.textContent = "Gasto: R$ " + gastoFormatado
saldoRestante.textContent = "Restante: R$ " + restanteFormatado

// ODINCNAOVIANEOIVNIVO

var svg = document.querySelector(".grafico_progresso")

svg.setAttribute('width', '300');
svg.setAttribute('height', '170');

var width = 300
var height = 170

var cx = width / 2
var cy = height
var raio = height - 10

var percentual = gasto / receita

if (receita == 0) {
    percentual = 0
}

var anguloGasto = 180 * percentual
var anguloRestante = 180

var pontoInicial1 = cx - raio
var pontoInicial2 = cy

var pontoFinal1 = cx + raio
var pontoFinal2 = cy

var radianos = (180 - anguloGasto) * (Math.PI / 180)

pontoFinal1 = cx + raio * Math.cos(radianos)
pontoFinal2 = cy - raio * Math.sin(radianos)


// passo 7

const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

path.setAttribute('d', `M ${pontoInicial1} ${pontoInicial2} A ${raio} ${raio} 0 0 1 ${pontoFinal1} ${pontoFinal2}`);
path.setAttribute('fill', 'none');
path.setAttribute('stroke', '#e74e4e');
path.setAttribute('stroke-width', '35');
path.setAttribute('stroke-linecap', 'round');
svg.appendChild(path)