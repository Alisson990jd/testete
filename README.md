# Bot de IA para Minecraft

Este projeto implementa um bot de IA para jogar Minecraft autonomamente, capaz de coletar recursos, construir uma casa de madeira, domar um cavalo, minerar diamantes, criar uma espada encantada e até mesmo derrotar o dragão do End.

## Funcionalidades

- **Comportamento humanoide**: O bot se move, olha ao redor, pula ocasionalmente e reage a danos como um jogador humano
- **Coleta de recursos**: Busca e coleta madeira, pedra e outros materiais necessários
- **Construção**: Constrói uma casa de madeira com design funcional
- **Domesticação**: Encontra e doma um cavalo
- **Mineração**: Escava até as camadas inferiores para encontrar diamantes
- **Encantamento**: Cria e encanta uma espada de diamante
- **Combate**: Enfrenta o dragão do End para zerar o jogo

## Requisitos

- Node.js 16+
- Servidor Minecraft 1.19.1 (ou compatível)
- Permissões de operador para o bot no servidor

## Instalação

1. Clone este repositório:
```
git clone https://github.com/seu-usuario/minecraft-ia-bot.git
cd minecraft-ia-bot
```

2. Instale as dependências:
```
npm install
```

## Uso

### Execução local

Para executar o bot localmente:

```
node bot.js --server endereco.do.servidor --port 25565 --username NomeDoBot
```

Parâmetros disponíveis:
- `--server` ou `-s`: Endereço do servidor Minecraft (padrão: Alisson9934.aternos.me)
- `--port` ou `-p`: Porta do servidor (padrão: 45214)
- `--username` ou `-u`: Nome de usuário do bot (padrão: IA_Bot)
- `--version` ou `-v`: Versão do Minecraft (padrão: auto-detecção)
- `--debug` ou `-d`: Ativar modo de depuração

### Execução no GitHub Actions

Este projeto inclui um workflow do GitHub Actions para executar o bot em um ambiente hospedado:

1. Faça fork deste repositório
2. Vá para a aba "Actions" no seu fork
3. Selecione o workflow "Minecraft Bot Execution"
4. Clique em "Run workflow"
5. Preencha os parâmetros solicitados (endereço do servidor, porta, nome de usuário)
6. Clique em "Run workflow" para iniciar a execução

## Comandos no jogo

Quando o bot está conectado ao servidor, você pode usar os seguintes comandos no chat:

- `!pos`: O bot informa sua posição atual
- `!status`: O bot informa qual etapa do plano está executando
- `!restart`: Reinicia o plano do início
- `!skip`: Pula para a próxima etapa do plano

## Solução de problemas

### O bot conecta mas não quebra blocos

Este é um problema comum relacionado a permissões ou proteções anti-bot no servidor. Soluções:

1. Dê permissões de operador ao bot (`/op NomeDoBot`)
2. Desative plugins anti-cheat ou anti-bot
3. Configure o servidor para permitir que bots modifiquem o mundo

### Erros de conexão (ECONNRESET)

Servidores gratuitos como Aternos frequentemente apresentam instabilidades. Soluções:

1. Verifique se o servidor está completamente inicializado
2. Aumente o tempo de reconexão no código (atualmente 5 segundos)
3. Teste em um servidor local ou mais estável

### Incompatibilidade de versão

Se o bot não conseguir conectar devido a incompatibilidade de versão:

1. Especifique a versão exata com `--version 1.19.1`
2. Tente usar uma versão mais compatível do Minecraft (como 1.16.5)
3. Atualize as dependências do projeto

## Personalização

Você pode personalizar o plano de jogo editando o array `planoCompleto` no arquivo `bot.js`. Cada etapa do plano consiste em uma ação e seus parâmetros.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto está licenciado sob a licença MIT.
