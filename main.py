from flask import Flask, render_template, request, redirect, url_for
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database", "finance.db")


def get_db_connection():
    conexao = sqlite3.connect(DB_PATH)
    conexao.row_factory = sqlite3.Row
    return conexao


def criar_tabela_despesas():
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" CREATE TABLE IF NOT EXISTS despesas (
                   id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                   nome TEXT NOT NULL,
                   valor REAL NOT NULL,
                   prioridade TEXT NOT NULL,
                   data_criacao TEXT NOT NULL
                   )""")
    
    conexao.commit()
    conexao.close()



def criar_tabela_receita():
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute(""" CREATE TABLE IF NOT EXISTS receita (
                   id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                   valor REAL NOT NULL,
                   mes INTEGER NOT NULL,
                   ano INTEGER NOT NULL
                   )""")
    
    conexao.commit()
    conexao.close()


def buscar_despesas(mes, ano): # do mês
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("""
                   SELECT * FROM despesas 
                   WHERE strftime('%m', data_criacao) = ? 
                   AND strftime('%Y', data_criacao) = ?  ORDER BY data_criacao DESC
                   """, (f"{mes:02d}", str(ano)))
    
    despesas = cursor.fetchall()

    conexao.close()
    return despesas


def calcular_total_despesas(mes, ano):
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("""
                   SELECT SUM(valor) FROM despesas 
                   WHERE strftime('%m', data_criacao) = ? 
                   AND strftime('%Y', data_criacao) = ?  
                   """, (f"{mes:02d}", str(ano)))
    
    total = cursor.fetchone()[0]

    conexao.close()

    return total if total else 0


def buscar_receita_mes(mes, ano):
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("SELECT valor FROM receita WHERE mes = ? AND ano = ?", (mes, ano))

    resultado = cursor.fetchone()
    conexao.close()

    return resultado["valor"] if resultado else 0

@app.route("/")
def index():

    agora = datetime.now()

    mes = request.args.get("mes", type=int)

    if not mes:
        mes = agora.month

    ano = agora.year

    despesas = buscar_despesas(mes, ano)
    total = calcular_total_despesas(mes, ano)
    
    receita = buscar_receita_mes(mes, ano)

    receita_formatada = f"{receita:.2f}"
    reais, centavos = receita_formatada.split(".")
    
    return render_template("home.html", despesas=despesas, total=total, receita=receita, reais=reais, centavos=centavos, mes_atual=mes)


@app.route("/simulacao")
def simulacao():
    return render_template("simulacao.html")


@app.route("/config")
def config():
    return render_template("config.html")


@app.route("/enviar-dados", methods=["POST"])
def enviar_dados():
    
    nome = request.form["nome"]
    valor = request.form["valor"]
    prioridade = request.form["prioridade"]

    data_criacao = datetime.now().strftime("%Y-%m-%d")

    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("""INSERT INTO despesas (nome, valor, prioridade, data_criacao)
                   VALUES (?, ?, ?, ?)
                   """, (nome, valor, prioridade, data_criacao))
    
    conexao.commit()
    conexao.close()

    return redirect(url_for("index"))

@app.route("/excluir/<int:id>")
def excluir_despesa(id):
    conexao = get_db_connection()
    cursor = conexao.cursor()

    cursor.execute("DELETE from despesas WHERE id = ?", (id,))

    conexao.commit()
    conexao.close()

    return redirect(url_for("index"))

@app.route("/salvar_receita", methods=["POST"])
def salvar_receita():

    valor = float(request.form["valor"])

    agora = datetime.now()
    mes = agora.month
    ano = agora.year

    conexao = get_db_connection()
    cursor = conexao.cursor()

    # remove reeita antiga
    cursor.execute("DELETE FROM receita WHERE mes = ? AND ano = ?", (mes, ano))

    # insere nova
    cursor.execute("INSERT INTO receita (valor, mes, ano) VALUES (?, ?, ?)", (valor, mes, ano))


    conexao.commit()
    conexao.close()

    return redirect(url_for("index"))

if __name__ == "__main__":
    criar_tabela_despesas()
    criar_tabela_receita()
    app.run(debug=True)