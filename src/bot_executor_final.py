import os
import json
import subprocess
import time

def gerar_plano_acao_fallback(comando_usuario):
    """
    Função de fallback que gera um plano simples para construir uma casa de madeira.
    """
    print("[INFO] Usando plano de fallback para construir uma casa de madeira")
    
    # Plano para construir uma casa de madeira
    return [
        # Coletar madeira
        {"acao": "coletar", "item": "oak_log", "quantidade": 16},
        
        # Coletar mais recursos
        {"acao": "coletar", "item": "cobblestone", "quantidade": 8},
        
        # Mover para um local adequado para construção
        {"acao": "mover_para", "posicao": [100, 64, 100]},
        
        # Coletar mais madeira para o telhado e decoração
        {"acao": "coletar", "item": "oak_log", "quantidade": 10},
        
        # Coletar alguns itens adicionais
        {"acao": "coletar", "item": "glass", "quantidade": 4}
    ]

# Estado inicial simulado
estado_jogo = {
    "inventario": [],
    "localizacao": "floresta",
    "ferramentas": []
}

def executar_plano(plano):
    """Envia cada ação do plano para o bot.js via linha de comando."""
    if not isinstance(plano, list) or len(plano) == 0:
        print("[Erro] O plano está vazio ou inválido. Usando plano de fallback.")
        plano = gerar_plano_acao_fallback("Construir uma casa de madeira")
    
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
    
    # Usar diretamente o plano de fallback
    plano = gerar_plano_acao_fallback(comando_usuario)
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
