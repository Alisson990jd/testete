import os
import json
import subprocess
from ollama_ia import gerar_plano_acao

# Estado inicial simulado
estado_jogo = {
    "inventario": [],
    "localizacao": "floresta",
    "ferramentas": []
}

def executar_plano(plano):
    """Envia cada ação do plano para o bot.js via linha de comando."""
    if not isinstance(plano, list):
        print("[Erro] O plano deve ser uma lista de ações")
        return
    
    for passo in plano:
        if not isinstance(passo, dict):
            print(f"[Ignorando] Passo inválido: {passo}")
            continue
            
        acao = passo.get("acao")
        if not acao:
            print(f"[Ignorando] Ação ausente: {passo}")
            continue

        args = []

        if acao == "mover_para":
            pos = passo.get("posicao")
            if isinstance(pos, list) and len(pos) == 3:
                args = list(map(str, pos))
            else:
                print(f"[Ignorando] Posição inválida: {pos}")
                continue

        elif acao == "coletar":
            item = passo.get("item")
            quantidade = passo.get("quantidade", 1)
            if item:
                args = [item, str(quantidade)]
            else:
                print(f"[Ignorando] Item ausente: {passo}")
                continue

        elif acao == "domar":
            animal = passo.get("animal")
            if animal:
                args = [animal]
            else:
                print(f"[Ignorando] Animal ausente: {passo}")
                continue

        else:
            print(f"[Ignorando] Ação desconhecida: {acao}")
            continue

        print(f"[Bot] Executando: {acao} {' '.join(args)}")
        subprocess.run(["node", "bot.js", acao, *args])

if __name__ == "__main__":
    comando_usuario = os.getenv("MINECRAFT_COMMAND", "Domar um cavalo")
    print(f"[Comando Automático]: {comando_usuario}")

    plano = gerar_plano_acao(comando_usuario, estado_jogo)
    print("[Plano gerado]:\n", json.dumps(plano, indent=2))
    executar_plano(plano)
