const blocoProgresso = document.querySelector(".container_svg")
const elemento = document.querySelector(".receita_vs_despesa")
let avisoProgresso = elemento.querySelector(".aviso_orcamento") //para evitar duplicação

var gasto = parseFloat(elemento.dataset.gasto) || 0;
var receita = parseFloat(elemento.dataset.receita) || 0;

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
var raio = height - 42

var percentual = gasto / receita

if (receita == 0) {
    percentual = 0
}

if (receita > 0) {
    percentual = Math.min(gasto / receita, 1); // mínimo de 1
}

else if (receita === 0 && gasto > 0) {
    percentual = 1
}

else {
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


if (percentual < 1) {
    const pathBase = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    pathBase.setAttribute('d', `M ${pontoInicial1} ${pontoInicial2} A ${raio} ${raio} 0 0 1 ${cx + raio} ${cy}`);
    pathBase.setAttribute('fill', 'none');
    pathBase.setAttribute('stroke', '#7fe261');
    pathBase.setAttribute('stroke-width', '45');
    pathBase.setAttribute('stroke-linecap', 'round');
    svg.appendChild(pathBase)
}

if (percentual > 0) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    path.setAttribute('d', `M ${pontoInicial1} ${pontoInicial2} A ${raio} ${raio} 0 0 1 ${pontoFinal1} ${pontoFinal2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#e74e4e');
    path.setAttribute('stroke-width', '45');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path)
}

if (receita === 0 && gasto === 0) {
    blocoProgresso.style.display = "none";

    if (!avisoProgresso) {
        avisoProgresso = document.createElement("p");
        avisoProgresso.classList.add("aviso_orcamento");
        avisoProgresso.textContent = "Sem despesas ou receita no mês";
        elemento.appendChild(avisoProgresso);
    }

    avisoProgresso.style.display = "block";
} else {
    blocoProgresso.style.display = "flex";

    if (avisoProgresso) {
        avisoProgresso.style.display = "none";
    }
}


// Tópico 3


const graficoMensal = document.querySelector(".grafico_mensal")
const graficoSVG = document.querySelector(".grafico_mensal_svg")

if (graficoMensal && graficoSVG) {
    const necessario = parseFloat(graficoMensal.dataset.necessario) || 0;
    const conveniente = parseFloat(graficoMensal.dataset.conveniente) || 0;
    const desnecessario = parseFloat(graficoMensal.dataset.desnecessario) || 0;

    const total = necessario + conveniente + desnecessario;
    console.log({ necessario, conveniente, desnecessario, total });

    if (total <= 0) {
        graficoSVG.innerHTML = ""; // Apaga o desenho
        document.querySelector(".legenda_grafico_mensal").style.display = "none";
        
        const aviso = document.createElement("p");
        aviso.classList.add("aviso_despesas");
        aviso.textContent = "Sem despesas no mês";
        graficoMensal.appendChild(aviso);
    }
    
    else {
        const widthPizza = 500;
        const heightPizza = 500;
        const cxPizza = widthPizza / 2;
        const cyPizza = heightPizza / 2;
        const raioPizza = 180;

        graficoSVG.setAttribute("width", String(widthPizza));
        graficoSVG.setAttribute("height", String(heightPizza));
        graficoSVG.setAttribute("viewBox", `0 0 ${widthPizza} ${heightPizza}`);
        graficoSVG.innerHTML = "";

        const fatias = [
            { nome: "necessario", valor: necessario, cor: '#e74e4e' },
            { nome: "conveniente", valor: conveniente, cor: '#f6e635' },
            { nome: "desnecessario", valor: desnecessario, cor: '#4fc1e6' },
        ];

        const fatiasAtivas = fatias.filter(f =>f.valor > 0); //percorre o array e "puxa" apenas valores > 0

        const itemDesnecessario = document.querySelector(".item_legenda_desnecessario");
        const itemConveniente = document.querySelector(".item_legenda_conveniente");
        const itemNecessario = document.querySelector(".item_legenda_necessario");

        itemDesnecessario.style.display = desnecessario > 0 ? "inline-flex" : "none";
        itemConveniente.style.display = conveniente > 0 ? "inline-flex" : "none";
        itemNecessario.style.display = necessario > 0 ? "inline-flex" : "none";
        
        if (fatiasAtivas.length === 1) {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

            circle.setAttribute('cx', cxPizza);
            circle.setAttribute('cy', cyPizza);
            circle.setAttribute('r', raioPizza);
            circle.setAttribute('fill', fatiasAtivas[0].cor);

            let fill =  fatiasAtivas[0].cor;

            graficoSVG.appendChild(circle);
        }

        else {

            let anguloAtual = -90;

            for (const fatia of fatias) {

                if (fatia.valor <= 0) continue;

                const anguloFatia = (fatia.valor / total) * 360;
                const anguloInicio = anguloAtual;
                const anguloFim = anguloAtual + anguloFatia;

                const inicioRad = anguloInicio * (Math.PI / 180);
                const fimRad = anguloFim * (Math.PI / 180);

                const x1 = cxPizza + raioPizza * Math.cos(inicioRad);
                const y1 = cyPizza + raioPizza * Math.sin(inicioRad);
                const x2 = cxPizza + raioPizza * Math.cos(fimRad);
                const y2 = cyPizza + raioPizza * Math.sin(fimRad);

                const largeArcFlag = anguloFatia > 180 ? 1 : 0;

                const d = [
                    `M ${cxPizza} ${cyPizza}`,
                    `L ${x1} ${y1}`,
                    `A ${raioPizza} ${raioPizza} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    "Z",
                ].join(" ");

                const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");

                path2.setAttribute('d', d);
                path2.setAttribute('fill', fatia.cor);
                graficoSVG.appendChild(path2);

                anguloAtual = anguloFim;
            }   
        }
    }
}