import os
import json
import subprocess
import time

# Tente importar o módulo ollama_ia, se falhar, use a versão modificada
try:
    from ollama_ia import gerar_plano_acao
    print("[INFO] Usando módulo ollama_ia original")
except Exception as e:
    print(f"[AVISO] Erro ao importar ollama_ia original: {e}")
    try:
        from ollama_ia_modificado import gerar_plano_acao
        print("[INFO] Usando módulo ollama_ia_modificado com OpenAI")
    except Exception as e:
        print(f"[ERRO] Não foi possível importar nenhum módulo de IA: {e}")
        # Função de fallback simples para construir uma casa
        def gerar_plano_acao(comando_usuario, estado_jogo):
            print("[INFO] Usando plano de fallback para construir uma casa")
            return [
                {"acao": "coletar", "item": "madeira", "quantidade": 20},
                {"acao": "coletar", "item": "madeira", "quantidade": 10},
                {"acao": "mover_para", "posicao": [100, 64, 100]},
                {"acao": "coletar", "item": "madeira", "quantidade": 10}
            ]

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
        try:
            subprocess.run(["node", "bot.js", acao, *args], timeout=60)
            # Pequena pausa entre comandos para dar tempo ao bot de processar
            time.sleep(2)
        except subprocess.TimeoutExpired:
            print(f"[Aviso] Comando demorou muito tempo: {acao} {' '.join(args)}")
        except Exception as e:
            print(f"[Erro] Falha ao executar comando: {e}")

if __name__ == "__main__":
    # Comando para construir uma casa de madeira
    comando_usuario = os.getenv("MINECRAFT_COMMAND", "Construir uma casa de madeira")
    print(f"[Comando Automático]: {comando_usuario}")
    
    # Tenta gerar um plano de ação
    plano = gerar_plano_acao(comando_usuario, estado_jogo)
    print("[Plano gerado]:\n", json.dumps(plano, indent=2))
    
    # Tenta reconectar várias vezes em caso de falha
    max_tentativas = 10
    tentativa = 0
    
    while tentativa < max_tentativas:
        tentativa += 1
        print(f"[Tentativa {tentativa}/{max_tentativas}] Executando plano...")
        try:
            executar_plano(plano)
            print("[Sucesso] Plano executado com sucesso!")
            break
        except Exception as e:
            print(f"[Erro] Falha na execução do plano: {e}")
            print("[Reconexão] Aguardando 10 segundos antes de tentar novamente...")
            time.sleep(10)
    
    if tentativa >= max_tentativas:
        print("[Falha] Número máximo de tentativas atingido. Encerrando.")
