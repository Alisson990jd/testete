import json
import requests
from openai import OpenAI

def gerar_plano_acao(comando_usuario, estado_jogo):
    """
    Usa a API do OpenAI para gerar um plano de ação em JSON.
    Substitui a função original que usava Ollama localmente.
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
        # Usando a API do OpenAI como alternativa ao Ollama
        client = OpenAI()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Você é um assistente especializado em Minecraft que gera planos de ação em formato JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        # Extrair o JSON da resposta
        plano_texto = response.choices[0].message.content.strip()
        # Remover possíveis marcadores de código
        if "```json" in plano_texto:
            plano_texto = plano_texto.split("```json")[1].split("```")[0].strip()
        elif "```" in plano_texto:
            plano_texto = plano_texto.split("```")[1].strip()
            
        plano = json.loads(plano_texto)
        
        # Garante que o plano seja uma lista de ações
        if isinstance(plano, dict):
            plano = [plano]
            
        return plano
    except Exception as e:
        print(f"[Erro] Falha ao gerar plano: {e}")
        # Plano de fallback para construir uma casa de madeira
        return [
            {"acao": "coletar", "item": "madeira", "quantidade": 20},
            {"acao": "coletar", "item": "madeira", "quantidade": 10},
            {"acao": "mover_para", "posicao": [100, 64, 100]},
            {"acao": "coletar", "item": "madeira", "quantidade": 10}
        ]
