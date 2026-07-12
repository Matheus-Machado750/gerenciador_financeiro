from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash #Importação funções de Hash
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "chave-dev-temporaria")
"""O Flask vai usar essa chave para assinar o cookie de sessão, impedindo que alguém altere o conteúdo da sessão no navegador e o Flask aceite como se fosse verdadeiro"""

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "finance.db")
PRIORIDADES_VALIDAS = {"Necessário", "Conveniente", "Desnecessário"}


def get_db_connection():
    conexao = sqlite3.connect(DB_PATH)
    conexao.row_factory = sqlite3.Row
    return conexao


def criar_tabela_usuarios():
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        criado_em TEXT NOT NULL
        )""" ) #O Hash da senha já é nativo do Flask e traz mais segurança
    
    conexao.commit()
    conexao.close()


def criar_tabela_despesas():
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" CREATE TABLE IF NOT EXISTS despesas (
                   id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                   usuario_id INTEGER NOT NULL,
                   nome TEXT NOT NULL,
                   valor REAL NOT NULL,
                   prioridade TEXT NOT NULL,
                   data_criacao TEXT NOT NULL,
                   FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
                   )""" )
    
    conexao.commit()
    conexao.close()


def criar_tabela_receita():
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" CREATE TABLE IF NOT EXISTS receita (
                   id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                   usuario_id INTEGER NOT NULL,
                   valor REAL NOT NULL,
                   mes INTEGER NOT NULL,
                   ano INTEGER NOT NULL,
                   FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
                   UNIQUE(usuario_id, mes, ano)
                   )""" ) #Para garantir que cada usuario tenha uma receita por mês e ano
    
    conexao.commit()
    conexao.close()


def criar_tabela_gastos_fixos():
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" CREATE TABLE IF NOT EXISTS gastos_fixos (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            nome TEXT NOT NULL,
            valor REAL NOT NULL,
            prioridade TEXT NOT NULL,
            ativo INTEGER NOT NULL DEFAULT 1,
            data_inicio TEXT NOT NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )""")

    conexao.commit()
    conexao.close()


def criar_usuario(email, senha):
    
    senha_hash = generate_password_hash(senha) #Recebe a senha pura mas já tranforma ela com hash
    criado_em = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" INSERT INTO usuarios (email, senha_hash, criado_em)
                   VALUES (?, ?, ?)
                   """, (email, senha_hash, criado_em))
    
    usuario_id = cursor.lastrowid #Pega o ultimo id

    conexao.commit()
    conexao.close()

    return usuario_id


def buscar_usuario_por_email(email):
    """
    Função para login e cadastro;
    No login, é usado p/ encontrar a conta, no cadastro impede email duplicado.
    """

    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" SELECT id, email, senha_hash, criado_em
                   FROM usuarios
                   WHERE email = ?
                   """ (email,))
    
    usuario = cursor.fetchone()
    conexao.close()

    return usuario


def buscar_despesas_avulsas(mes, ano):
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" SELECT id, nome, valor, prioridade, data_criacao
        FROM despesas
        WHERE strftime('%m', data_criacao) = ?
          AND strftime('%Y', data_criacao) = ?
        ORDER BY data_criacao DESC, id DESC
    """, (f"{mes:02d}", str(ano)))

    despesas = cursor.fetchall()
    conexao.close()
    return despesas


def buscar_gastos_fixos_ativos(mes, ano):
    data_referencia = f"{ano}-{mes:02d}-01"

    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" SELECT id, nome, valor, prioridade, ativo, data_inicio
        FROM gastos_fixos
        WHERE ativo = 1
          AND date(data_inicio) <= date(?)
        ORDER BY id DESC
    """, (data_referencia,))

    gastos_fixos = cursor.fetchall()
    conexao.close()
    return gastos_fixos


def buscar_despesas(mes, ano):
    despesas = []

    for linha in buscar_despesas_avulsas(mes, ano):
        item = dict(linha)
        item["uid"] = f"manual-{linha['id']}"
        item["tipo"] = "manual"
        despesas.append(item)

    for linha in buscar_gastos_fixos_ativos(mes, ano):
        despesas.append({
            "id": linha["id"],
            "uid": f"fixo-{linha['id']}",
            "nome": linha["nome"],
            "valor": float(linha["valor"]),
            "prioridade": linha["prioridade"],
            "tipo": "fixo",
        })

    return despesas


def calcular_total_despesas(despesas):
    return sum(float(despesa["valor"] or 0) for despesa in despesas)


def calcular_gastos_por_prioridade(despesas):
    gastos = {"necessario": 0.0, "conveniente": 0.0, "desnecessario": 0.0}
    mapa = {
        "Necessário": "necessario",
        "Conveniente": "conveniente",
        "Desnecessário": "desnecessario",
    }

    for despesa in despesas:
        chave = mapa.get(despesa["prioridade"])
        if chave:
            gastos[chave] += float(despesa["valor"] or 0)

    return gastos


def buscar_gastos_fixos_config():
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" SELECT id, nome, valor, prioridade, ativo, data_inicio
        FROM gastos_fixos
        ORDER BY id DESC """)

    itens = cursor.fetchall()
    conexao.close()
    return itens


def serializar_gasto_fixo(linha):
    return {
        "id": linha["id"],
        "nome": linha["nome"],
        "valor": float(linha["valor"]),
        "prioridade": linha["prioridade"],
        "ativo": bool(linha["ativo"]),
        "data_inicio": linha["data_inicio"],
    }

def buscar_receita_mes(mes, ano):
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("SELECT valor FROM receita WHERE mes = ? AND ano = ?", (mes, ano))

    resultado = cursor.fetchone()
    conexao.close()

    return float(resultado["valor"]) if resultado else None

@app.route("/")
def index():
    agora = datetime.now()
    mes = request.args.get("mes", type=int)

    if not mes:
        mes = agora.month

    ano = agora.year

    despesas = buscar_despesas(mes, ano)
    total = calcular_total_despesas(despesas)
    gastos_prioridade = calcular_gastos_por_prioridade(despesas)

    receita = buscar_receita_mes(mes, ano)
    if receita is None:
        receita_formatada = "0.00"
    else:
        receita_formatada = f"{receita:.2f}"

    reais, centavos = receita_formatada.split(".")

    return render_template(
        "home.html",
        despesas=despesas,
        total=total,
        receita=receita,
        reais=reais,
        centavos=centavos,
        mes_atual=mes,
        gastos_prioridade=gastos_prioridade
    )

@app.route("/simulacao")
def simulacao():
    agora = datetime.now()
    mes = request.args.get("mes", type=int)

    if not mes or mes < 1 or mes > 12:
        mes = agora.month

    ano = agora.year

    despesas = buscar_despesas(mes, ano)
    total_original = calcular_total_despesas(despesas)

    return render_template(
        "simulacao.html",
        despesas=despesas,
        mes_atual=mes,
        total_original=total_original,
        ano_atual=ano
    )

@app.route("/config")
def config():
    agora = datetime.now()
    receita = buscar_receita_mes(agora.month, agora.year) or 0
    return render_template("config.html", receita_config=receita)


@app.route("/enviar-dados", methods=["POST"])
def enviar_dados():
    
    nome = request.form["nome"]
    valor = request.form["valor"]
    prioridade = request.form["prioridade"]

    mes = int(request.form["mes"])
    ano = datetime.now().year

    data_criacao = datetime(ano, mes, 1).strftime("%Y-%m-%d")

    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("""INSERT INTO despesas (nome, valor, prioridade, data_criacao)
                   VALUES (?, ?, ?, ?)
                   """, (nome, valor, prioridade, data_criacao))
    
    conexao.commit()
    conexao.close()

    return redirect(url_for("index", mes=mes))

@app.route("/excluir/<int:id>")
def excluir_despesa(id):

    mes = request.args.get("mes", type=int)

    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("DELETE from despesas WHERE id = ?", (id,))

    conexao.commit()
    conexao.close()

    return redirect(url_for("index", mes=mes))


@app.route("/salvar_receita", methods=["POST"])

def salvar_receita():

    mes = int(request.form["mes"])
    ano = datetime.now().year
    valor_str = request.form.get("valor", "").strip()

    if not valor_str:
        return redirect(url_for("index", mes=mes))
    
    try:
        valor = float(valor_str)
    except ValueError:
        return redirect(url_for("index", mes=mes))


    conexao = get_db_connection()
    cursor = conexao.cursor()

    # remove receita antiga
    cursor.execute("DELETE FROM receita WHERE mes = ? AND ano = ?", (mes, ano))

    # insere nova
    cursor.execute("INSERT INTO receita (valor, mes, ano) VALUES (?, ?, ?)", (valor, mes, ano))


    conexao.commit()
    conexao.close()

    return redirect(url_for("index", mes=mes))

@app.route("/api/gastos-fixos", methods=["GET"])
def listar_gastos_fixos_api():
    itens = [serializar_gasto_fixo(linha) for linha in buscar_gastos_fixos_config()]
    return jsonify(itens)


@app.route("/api/gastos-fixos", methods=["POST"])
def criar_gasto_fixo_api():
    dados = request.get_json(silent=True) or {}

    nome = str(dados.get("nome", "")).strip()
    valor_bruto = str(dados.get("valor", "")).strip().replace(",", ".")
    prioridade = str(dados.get("prioridade", "")).strip()

    if not nome or not valor_bruto or prioridade not in PRIORIDADES_VALIDAS:
        return jsonify({"erro": "Dados inválidos."}), 400

    try:
        valor = float(valor_bruto)
    except ValueError:
        return jsonify({"erro": "Valor inválido."}), 400

    if valor <= 0:
        return jsonify({"erro": "O valor deve ser maior que zero."}), 400

    data_inicio = datetime.now().strftime("%Y-%m-01")

    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("""
        INSERT INTO gastos_fixos (nome, valor, prioridade, ativo, data_inicio)
        VALUES (?, ?, ?, 1, ?)
    """, (nome[:20], valor, prioridade, data_inicio))

    novo_id = cursor.lastrowid
    conexao.commit()

    cursor.execute("""
        SELECT id, nome, valor, prioridade, ativo, data_inicio
        FROM gastos_fixos
        WHERE id = ?
    """, (novo_id,))

    novo_item = cursor.fetchone()
    conexao.close()

    return jsonify(serializar_gasto_fixo(novo_item)), 201


@app.route("/api/gastos-fixos/<int:id>/toggle", methods=["POST"])
def alternar_gasto_fixo_api(id):
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("""
        UPDATE gastos_fixos
        SET ativo = CASE WHEN ativo = 1 THEN 0 ELSE 1 END
        WHERE id = ?
    """, (id,))

    if cursor.rowcount == 0:
        conexao.close()
        return jsonify({"erro": "Gasto fixo não encontrado."}), 404

    conexao.commit()

    cursor.execute("""
        SELECT id, nome, valor, prioridade, ativo, data_inicio
        FROM gastos_fixos
        WHERE id = ?
    """, (id,))

    item = cursor.fetchone()
    conexao.close()

    return jsonify(serializar_gasto_fixo(item))


@app.route("/api/gastos-fixos/<int:id>", methods=["DELETE"])
def excluir_gasto_fixo_api(id):
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("DELETE FROM gastos_fixos WHERE id = ?", (id,))

    if cursor.rowcount == 0:
        conexao.close()
        return jsonify({"erro": "Gasto fixo não encontrado."}), 404

    conexao.commit()
    conexao.close()

    return "", 204


def inicializar_banco():
    criar_tabela_usuarios()
    criar_tabela_despesas()
    criar_tabela_receita()
    criar_tabela_gastos_fixos()

inicializar_banco()

if __name__ == "__main__":
    app.run(debug=True)