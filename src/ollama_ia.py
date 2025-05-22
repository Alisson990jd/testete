import ollama
import json

def gerar_plano_acao(comando_usuario, estado_jogo):
    """
    Envia o comando e o estado do jogo para o Ollama e retorna um plano em JSON.
    """
    prompt = f"""
Você é um jogador humano no Minecraft 1.20.4.
Seu objetivo é interpretar comandos e criar um plano de ação passo a passo.

### Comandos válidos:
1. mover_para <x> <y> <z>
2. coletar <item> [quantidade]
3. domar <animal>

### Comando da live:
"{comando_usuario}"

### Tarefas:
1. Entenda o que o usuário deseja.
2. Crie um plano de ação passo a passo (em JSON).
3. Use apenas os comandos acima.
4. Exemplo de formato:
[
  {{ "acao": "mover_para", "posicao": [100, 64, 100] }},
  {{ "acao": "coletar", "item": "madeira", "quantidade": 10 }},
  {{ "acao": "domar", "animal": "cavalo" }}
]

Responda apenas com o plano em JSON, sem explicações.
"""

    try:
        response = ollama.generate(model="llama3", prompt=prompt)
        plano = json.loads(response["response"])
        
        # Garante que o plano seja uma lista de ações
        if isinstance(plano, dict):
            plano = [plano]
            
        return plano
    except Exception as e:
        print(f"[Erro] Falha ao gerar plano: {e}")
        return []
