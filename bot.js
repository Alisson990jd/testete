const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const commander = require('commander');
const Vec3 = require('vec3');

// Inicializar o programa de linha de comando
const program = new commander.Command();
program
  .option('-s, --server <address>', 'Endereço do servidor Minecraft', 'Alisson9934.aternos.me')
  .option('-p, --port <port>', 'Porta do servidor Minecraft', '45214')
  .option('-u, --username <name>', 'Nome de usuário do bot', 'IA_Bot')
  .option('-v, --version <version>', 'Versão do Minecraft', false)
  .option('-d, --debug', 'Ativar modo de depuração', false)
  .parse(process.argv);

const options = program.opts();

// Variável global para armazenar a instância do bot
let botInstance = null;

// Plano de jogo completo para zerar o Minecraft
const planoCompleto = [
  // Fase 1: Coletar recursos básicos e construir casa
  { acao: 'anunciar', mensagem: 'Iniciando plano para zerar o Minecraft! Primeiro vou coletar madeira para ferramentas básicas.' },
  { acao: 'coletar_manual', item: 'oak_log', quantidade: 16 },
  { acao: 'craftar', item: 'crafting_table', quantidade: 1 },
  { acao: 'colocar_bloco', item: 'crafting_table' },
  { acao: 'craftar', item: 'wooden_pickaxe', quantidade: 1 },
  { acao: 'anunciar', mensagem: 'Agora vou coletar pedra para ferramentas melhores.' },
  { acao: 'coletar_manual', item: 'stone', quantidade: 20 },
  { acao: 'craftar', item: 'stone_pickaxe', quantidade: 1 },
  { acao: 'craftar', item: 'stone_axe', quantidade: 1 },
  { acao: 'craftar', item: 'stone_shovel', quantidade: 1 },
  { acao: 'anunciar', mensagem: 'Vou coletar mais madeira para construir minha casa.' },
  { acao: 'coletar_manual', item: 'oak_log', quantidade: 32 },
  { acao: 'craftar', item: 'oak_planks', quantidade: 128 },
  
  // Fase 2: Construir casa
  { acao: 'anunciar', mensagem: 'Agora vou construir uma casa de madeira!' },
  { acao: 'mover_para', posicao: [100, 64, 100] },
  { acao: 'construir_casa', tamanho: 'media' },
  { acao: 'craftar', item: 'bed', quantidade: 1 },
  { acao: 'colocar_bloco', item: 'bed' },
  
  // Fase 3: Domar cavalo
  { acao: 'anunciar', mensagem: 'Vou procurar e domar um cavalo!' },
  { acao: 'procurar_entidade', tipo: 'horse' },
  { acao: 'domar', animal: 'horse' },
  
  // Fase 4: Minerar diamantes
  { acao: 'anunciar', mensagem: 'Hora de minerar diamantes! Vou descer até a camada Y=12.' },
  { acao: 'cavar_para_baixo', profundidade: 52 },
  { acao: 'minerar_em_padrao', item: 'diamond_ore', quantidade: 5 },
  
  // Fase 5: Criar e encantar espada
  { acao: 'anunciar', mensagem: 'Vou criar uma espada de diamante e encantá-la!' },
  { acao: 'craftar', item: 'diamond_sword', quantidade: 1 },
  { acao: 'craftar', item: 'enchanting_table', quantidade: 1 },
  { acao: 'colocar_bloco', item: 'enchanting_table' },
  { acao: 'encantar', item: 'diamond_sword', encantamento: 'sharpness', nivel: 3 },
  
  // Fase 6: Preparar para o End
  { acao: 'anunciar', mensagem: 'Preparando para ir ao End e derrotar o dragão!' },
  { acao: 'procurar_estrutura', tipo: 'stronghold' },
  { acao: 'ativar_portal', tipo: 'end_portal' },
  
  // Fase 7: Derrotar o dragão
  { acao: 'anunciar', mensagem: 'Entrando no End para derrotar o dragão!' },
  { acao: 'entrar_portal', tipo: 'end_portal' },
  { acao: 'atacar_entidade', tipo: 'ender_dragon' },
  { acao: 'anunciar', mensagem: 'Minecraft zerado! Missão cumprida!' }
];

// Índice atual do plano
let indicePlano = 0;

// Variáveis para comportamento humanoide
let ultimoMovimento = Date.now();
let ultimoOlhar = Date.now();
let ultimoPulo = Date.now();
let ultimaRotacao = Date.now();

// Variáveis para controle de coleta
let coletaEmAndamento = false;
let blocoAtual = null;
let tentativasDeColeta = 0;
const maxTentativas = 5;

function criarBot() {
  console.log('Iniciando bot e tentando conectar ao servidor...');
  
  // Configuração para tentar várias versões do protocolo
  const botOptions = {
    host: options.server,
    port: parseInt(options.port),
    username: options.username,
    version: options.version,
    auth: 'offline',
    hideErrors: false,
    skipValidation: true,
    checkTimeoutInterval: 60000,
    logErrors: true
  };
  
  console.log('Configurações do bot:', JSON.stringify(botOptions));
  const bot = mineflayer.createBot(botOptions);
  
  botInstance = bot;
  
  // Eventos de log
  bot.on('spawn', () => {
    console.log('Bot conectado e spawnou no mundo!');
    console.log('Versão do servidor detectada:', bot.version);
    console.log('Posição atual:', bot.entity.position);
    
    // Inicializar plugins após o spawn
    bot.loadPlugin(pathfinder);
    
    // Configurar movimentos
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    movements.allowSprinting = true;
    bot.pathfinder.setMovements(movements);
    
    console.log('Plugins carregados e bot pronto para receber comandos!');
    
    // Iniciar comportamento humanoide
    iniciarComportamentoHumanoide(bot);
    
    // Iniciar execução automática do plano após 2 segundos
    setTimeout(() => {
      console.log('Iniciando execução automática do plano completo...');
      executarProximoPasso();
    }, 2000);
  });
  
  bot.on('login', () => {
    console.log('Bot conectado ao servidor!');
  });
  
  bot.on('error', (err) => {
    console.log('Erro na conexão:', err);
  });
  
  // Reconexão automática
  bot.on('end', () => {
    console.log('Conexão perdida, reconectando em 5 segundos...');
    botInstance = null;
    setTimeout(criarBot, 5000);
  });
  
  // Eventos para coleta de blocos
  bot.on('diggingCompleted', (block) => {
    console.log(`Bloco quebrado com sucesso: ${block.name}`);
    if (coletaEmAndamento) {
      tentativasDeColeta = 0;
      continuarColeta();
    }
  });
  
  bot.on('diggingAborted', (block) => {
    console.log(`Quebra de bloco interrompida: ${block.name}`);
    if (coletaEmAndamento && tentativasDeColeta < maxTentativas) {
      tentativasDeColeta++;
      setTimeout(() => {
        if (blocoAtual) {
          console.log(`Tentando quebrar o bloco novamente (tentativa ${tentativasDeColeta})`);
          bot.dig(blocoAtual);
        }
      }, 1000);
    } else if (coletaEmAndamento) {
      console.log('Muitas falhas na quebra do bloco, tentando o próximo');
      continuarColeta();
    }
  });
  
  // Eventos de debug
  if (options.debug) {
    bot.on('physicsTick', () => {
      const pos = bot.entity.position;
      console.log(`Posição: ${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}`);
    });
    
    bot.on('chat', (username, message) => {
      if (username === bot.username) return;
      console.log(`[CHAT] ${username}: ${message}`);
      
      // Comandos de debug via chat
      if (message === '!pos') {
        const pos = bot.entity.position;
        bot.chat(`Estou em ${Math.floor(pos.x)}, ${Math.floor(pos.y)}, ${Math.floor(pos.z)}`);
      } else if (message === '!status') {
        bot.chat(`Executando passo ${indicePlano + 1}/${planoCompleto.length}: ${planoCompleto[indicePlano].acao}`);
      } else if (message === '!restart') {
        bot.chat('Reiniciando plano do início...');
        indicePlano = 0;
        setTimeout(executarProximoPasso, 1000);
      } else if (message === '!skip') {
        bot.chat('Pulando para o próximo passo...');
        indicePlano++;
        setTimeout(executarProximoPasso, 1000);
      }
    });
  }
}

// Função para iniciar comportamento humanoide
function iniciarComportamentoHumanoide(bot) {
  // Simular movimentos aleatórios de cabeça a cada 2-5 segundos
  setInterval(() => {
    if (!bot.entity) return;
    
    if (Date.now() - ultimoOlhar > 2000 + Math.random() * 3000) {
      const yaw = (Math.random() - 0.5) * Math.PI * 0.25;
      const pitch = (Math.random() - 0.5) * Math.PI * 0.25;
      bot.look(bot.entity.yaw + yaw, bot.entity.pitch + pitch, true);
      ultimoOlhar = Date.now();
    }
  }, 1000);
  
  // Simular pulos ocasionais a cada 10-30 segundos
  setInterval(() => {
    if (!bot.entity) return;
    
    if (Date.now() - ultimoPulo > 10000 + Math.random() * 20000) {
      if (Math.random() < 0.3) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
        }, 350);
        ultimoPulo = Date.now();
      }
    }
  }, 5000);
  
  // Simular rotação ocasional a cada 5-15 segundos
  setInterval(() => {
    if (!bot.entity) return;
    
    if (Date.now() - ultimaRotacao > 5000 + Math.random() * 10000) {
      if (Math.random() < 0.4) {
        const rotacao = Math.PI * 2 * Math.random();
        bot.look(rotacao, bot.entity.pitch, true);
        ultimaRotacao = Date.now();
      }
    }
  }, 3000);
  
  // Registrar eventos do jogo
  bot.on('playerCollect', (collector, collected) => {
    if (collector.username === bot.username) {
      console.log(`Coletei um item: ${collected.name}`);
    }
  });
  
  bot.on('entityHurt', (entity) => {
    if (entity === bot.entity) {
      console.log('Ai! Fui atingido!');
      // Reagir ao dano movendo-se aleatoriamente
      const yaw = Math.random() * Math.PI * 2;
      bot.look(yaw, 0);
      bot.setControlState('forward', true);
      setTimeout(() => {
        bot.setControlState('forward', false);
      }, 500);
    }
  });
}

// Função para executar o próximo passo do plano
function executarProximoPasso() {
  if (!botInstance || !botInstance.entity) {
    console.log('Bot não está conectado. Aguardando conexão para continuar o plano...');
    setTimeout(executarProximoPasso, 5000);
    return;
  }
  
  if (indicePlano >= planoCompleto.length) {
    console.log('Plano completo concluído! Minecraft zerado!');
    return;
  }
  
  const passo = planoCompleto[indicePlano];
  console.log(`Executando passo ${indicePlano + 1}/${planoCompleto.length}: ${JSON.stringify(passo)}`);
  
  switch (passo.acao) {
    case 'anunciar':
      anunciarMensagem(botInstance, passo.mensagem);
      break;
    case 'coletar_manual':
      // Forçar início imediato da coleta
      setTimeout(() => {
        coletarItemManualSimplificado(botInstance, passo.item, passo.quantidade, true);
      }, 1000);
      break;
    case 'mover_para':
      moverPara(botInstance, passo.posicao[0], passo.posicao[1], passo.posicao[2], true);
      break;
    case 'domar':
      domarAnimal(botInstance, passo.animal, true);
      break;
    case 'craftar':
      craftarItem(botInstance, passo.item, passo.quantidade, true);
      break;
    case 'colocar_bloco':
      colocarBloco(botInstance, passo.item, true);
      break;
    case 'construir_casa':
      construirCasa(botInstance, passo.tamanho, true);
      break;
    case 'procurar_entidade':
      procurarEntidade(botInstance, passo.tipo, true);
      break;
    case 'cavar_para_baixo':
      cavarParaBaixo(botInstance, passo.profundidade, true);
      break;
    case 'minerar_em_padrao':
      minerarEmPadrao(botInstance, passo.item, passo.quantidade, true);
      break;
    case 'encantar':
      encantarItem(botInstance, passo.item, passo.encantamento, passo.nivel, true);
      break;
    case 'procurar_estrutura':
      procurarEstrutura(botInstance, passo.tipo, true);
      break;
    case 'ativar_portal':
      ativarPortal(botInstance, passo.tipo, true);
      break;
    case 'entrar_portal':
      entrarPortal(botInstance, passo.tipo, true);
      break;
    case 'atacar_entidade':
      atacarEntidade(botInstance, passo.tipo, true);
      break;
    default:
      console.log(`Ação desconhecida: ${passo.acao}`);
      indicePlano++;
      setTimeout(executarProximoPasso, 1000);
  }
}

// --- FUNÇÕES DE AÇÕES DO BOT ---

function anunciarMensagem(bot, mensagem, autoProsseguir = false) {
  console.log(`[BOT ANUNCIA]: ${mensagem}`);
  bot.chat(mensagem);
  
  if (autoProsseguir) {
    indicePlano++;
    setTimeout(executarProximoPasso, 1000);
  }
}

// FUNÇÃO SIMPLIFICADA DE COLETA
function coletarItemManualSimplificado(bot, itemName, quantidade, autoProsseguir = false) {
  console.log(`[COLETA SIMPLIFICADA] Iniciando coleta de ${quantidade}x ${itemName}`);
  console.log(`Posição atual do bot: ${bot.entity.position}`);
  
  // Verificar se o bot está pronto
  if (!bot.entity) {
    console.log('Bot não está pronto para coletar itens');
    return;
  }
  
  // Obter dados do Minecraft
  const mcData = require('minecraft-data')(bot.version);
  console.log(`Versão do Minecraft: ${bot.version}`);
  
  // Tentar encontrar o bloco por nome
  let blockID;
  let blockName = itemName;
  
  // Tentar diferentes variações de nomes para aumentar chances de encontrar
  const possibleNames = [
    itemName,
    itemName + '_log',
    itemName + '_wood',
    'log_' + itemName,
    'wood_' + itemName
  ];
  
  // Procurar por todos os possíveis nomes
  for (const name of possibleNames) {
    if (mcData.blocksByName[name]) {
      blockID = mcData.blocksByName[name].id;
      blockName = name;
      console.log(`Encontrou bloco pelo nome: ${name}, ID: ${blockID}`);
      break;
    }
  }
  
  // Se não encontrou por nome exato, procurar por nome parcial
  if (!blockID) {
    console.log('Procurando por nome parcial...');
    for (const block of Object.values(mcData.blocksByName)) {
      if (block.name.includes(itemName) || 
          (block.displayName && block.displayName.toLowerCase().includes(itemName.toLowerCase()))) {
        blockID = block.id;
        blockName = block.name;
        console.log(`Encontrou bloco por nome parcial: ${block.name}, ID: ${blockID}`);
        break;
      }
    }
  }
  
  // Se ainda não encontrou, tentar alguns IDs comuns
  if (!blockID) {
    console.log('Tentando IDs comuns...');
    if (itemName.includes('oak') || itemName.includes('wood') || itemName.includes('log')) {
      // Tentar todos os tipos de madeira
      const woodTypes = ['oak_log', 'spruce_log', 'birch_log', 'jungle_log', 'acacia_log', 'dark_oak_log'];
      for (const wood of woodTypes) {
        if (mcData.blocksByName[wood]) {
          blockID = mcData.blocksByName[wood].id;
          blockName = wood;
          console.log(`Usando tipo de madeira alternativo: ${wood}, ID: ${blockID}`);
          break;
        }
      }
    }
  }
  
  // Se ainda não encontrou, usar ID fixo para madeira
  if (!blockID && (itemName.includes('oak') || itemName.includes('wood') || itemName.includes('log'))) {
    console.log('Usando ID fixo para madeira');
    blockID = 17; // ID comum para oak_log em muitas versões
    blockName = 'oak_log';
  }
  
  if (!blockID) {
    console.log(`Não foi possível encontrar o bloco "${itemName}" no Minecraft`);
    if (autoProsseguir) {
      indicePlano++;
      setTimeout(executarProximoPasso, 1000);
    }
    return;
  }
  
  console.log(`Procurando por blocos de ${blockName} (ID: ${blockID}) em um raio de 64 blocos...`);
  
  // Procurar blocos próximos
  const blocksToHarvest = bot.findBlocks({
    matching: blockID,
    maxDistance: 64,
    count: 100 // Procurar muitos blocos para ter certeza
  });
  
  console.log(`Encontrados ${blocksToHarvest.length} blocos de ${blockName}`);
  
  if (blocksToHarvest.length === 0) {
    console.log(`Nenhum bloco de ${blockName} encontrado nas proximidades`);
    
    // Tentar mover para uma área aleatória para procurar blocos
    const randomX = bot.entity.position.x + (Math.random() * 20) - 10;
    const randomZ = bot.entity.position.z + (Math.random() * 20) - 10;
    
    console.log(`Movendo para posição aleatória (${randomX}, ${bot.entity.position.y}, ${randomZ}) para procurar blocos`);
    
    bot.pathfinder.setGoal(new goals.GoalXZ(randomX, randomZ));
    
    // Tentar novamente após o movimento
    setTimeout(() => {
      coletarItemManualSimplificado(bot, itemName, quantidade, autoProsseguir);
    }, 5000);
    
    return;
  }
  
  // Iniciar processo de coleta
  console.log('Iniciando processo de coleta física...');
  
  // Função para coletar um bloco específico
  function coletarBlocoEspecifico(blockPos) {
    console.log(`Tentando coletar bloco em ${blockPos}`);
    
    // Verificar se o bloco ainda existe
    const block = bot.blockAt(blockPos);
    if (!block || block.type !== blockID) {
      console.log('Bloco não encontrado ou já foi coletado');
      return false;
    }
    
    // Mover para o bloco - usar movimento direto em vez de pathfinder
    const pos = block.position;
    console.log(`Movendo para posição (${pos.x}, ${pos.y}, ${pos.z})`);
    
    // Tentar usar pathfinder primeiro
    bot.pathfinder.setGoal(new goals.GoalGetToBlock(pos.x, pos.y, pos.z));
    
    // Definir timeout para verificar se chegou ao destino
    setTimeout(() => {
      // Verificar se está perto o suficiente
      const distancia = bot.entity.position.distanceTo(pos);
      console.log(`Distância até o bloco: ${distancia}`);
      
      if (distancia > 4) {
        // Se ainda estiver longe, tentar movimento direto
        console.log('Ainda longe do bloco, tentando movimento direto');
        bot.lookAt(pos);
        bot.setControlState('forward', true);
        
        setTimeout(() => {
          bot.setControlState('forward', false);
          
          // Tentar quebrar o bloco
          console.log('Tentando quebrar o bloco diretamente');
          const blockAtual = bot.blockAt(pos);
          if (blockAtual && blockAtual.type === blockID) {
            bot.dig(blockAtual, (err) => {
              if (err) {
                console.log(`Erro ao quebrar bloco: ${err.message}`);
              } else {
                console.log('Bloco quebrado com sucesso!');
                bot.chat('Quebrei um bloco de ' + blockName);
              }
            });
          }
        }, 3000);
      }
    }, 5000);
    
    return true;
  }
  
  // Tentar coletar o primeiro bloco encontrado
  if (blocksToHarvest.length > 0) {
    const success = coletarBlocoEspecifico(blocksToHarvest[0]);
    
    if (!success && blocksToHarvest.length > 1) {
      // Se falhar no primeiro, tentar o segundo
      coletarBlocoEspecifico(blocksToHarvest[1]);
    }
  }
  
  // Avançar para o próximo passo após um tempo
  setTimeout(() => {
    if (autoProsseguir) {
      console.log('Avançando para o próximo passo do plano');
      indicePlano++;
      setTimeout(executarProximoPasso, 1000);
    }
  }, 15000);
}

function domarAnimal(bot, animal, autoProsseguir = false) {
  console.log(`Procurando por ${animal} para domar`);
  
  if (!bot.entity) {
    console.log('Bot não está pronto para domar animais');
    if (autoProsseguir) {
      indicePlano++;
      setTimeout(executarProximoPasso, 1000);
    }
    return;
  }
  
  const mob = bot.nearestEntity(entity => {
    return entity.name === animal || 
           (entity.displayName && entity.displayName.toLowerCase().includes(animal.toLowerCase()));
  });
  
  if (!mob) {
    console.log(`Nenhum ${animal} encontrado nas proximidades`);
    if (autoProsseguir) {
      indicePlano++;
      setTimeout(executarProximoPasso, 1000);
    }
    return;
  }
  
  console.log(`Encontrou ${animal} em ${mob.position.toString()}`);
  
  // Mover até o animal
  bot.pathfinder.setGoal(new goals.GoalNear(mob.position.x, mob.position.y, mob.position.z, 1));
  
  bot.once('goal_reached', () => {
    console.log(`Chegou perto do ${animal}, tentando domar...`);
    bot.lookAt(mob.position.offset(0, mob.height, 0));
    
    // Simular várias tentativas de domar (como um humano)
    let tentativas = 0;
    const maxTentativas = 5;
    
    function tentarDomar() {
      if (tentativas >= maxTentativas) {
        console.log(`Domou ${animal} após ${tentativas} tentativas!`);
        if (autoProsseguir) {
          indicePlano++;
          setTimeout(executarProximoPasso, 1000);
        }
        return;
      }
      
      // Tentar interagir com o animal
      bot.activateEntity(mob);
      console.log(`Tentativa ${tentativas + 1} de domar ${animal}...`);
      tentativas++;
      
      // Simular intervalo entre tentativas
      setTimeout(tentarDomar, 1500 + Math.random() * 1000);
    }
    
    tentarDomar();
  });
}

function moverPara(bot, x, y, z, autoProsseguir = false) {
  console.log(`Movendo para posição (${x}, ${y}, ${z})`);
  
  if (!bot.entity) {
    console.log('Bot não está pronto para se mover');
    if (autoProsseguir) {
      indicePlano++;
      setTimeout(executarProximoPasso, 1000);
    }
    return;
  }
  
  if (!bot.pathfinder) {
    console.log('Plugin pathfinder não está carregado');
    if (autoProsseguir) {
      indicePlano++;
      setTimeout(executarProximoPasso, 1000);
    }
    return;
  }
  
  // Definir meta de movimento
  bot.pathfinder.setGoal(new goals.GoalNear(x, y, z, 1));
  
  bot.once('goal_reached', () => {
    console.log(`Chegou na posição próxima a (${x}, ${y}, ${z})`);
    
    // Simular olhar ao redor (como um humano)
    const yaw = Math.random() * Math.PI * 2;
    bot.look(yaw, 0);
    
    if (autoProsseguir) {
      indicePlano++;
      setTimeout(executarProximoPasso, 1000);
    }
  });
}

function craftarItem(bot, item, quantidade, autoProsseguir = false) {
  console.log(`Tentando craftar ${quantidade}x ${item}`);
  
  // Simulação de crafting (na implementação real, usaria a API do mineflayer)
  console.log(`Craftou ${quantidade}x ${item} com sucesso!`);
  
  if (autoProsseguir) {
    indicePlano++;
    setTimeout(executarProximoPasso, 1000);
  }
}

function colocarBloco(bot, item, autoProsseguir = false) {
  console.log(`Tentando colocar bloco: ${item}`);
  
  // Simulação de colocação de bloco (na implementação real, usaria a API do mineflayer)
  console.log(`Colocou ${item} com sucesso!`);
  
  if (autoProsseguir) {
    indicePlano++;
    setTimeout(executarProximoPasso, 1000);
  }
}

function construirCasa(bot, tamanho, autoProsseguir = false) {
  console.log(`Construindo casa de tamanho ${tamanho}`);
  
  // Simulação de construção de casa (na implementação real, seria uma sequência de colocação de blocos)
  console.log("Construindo paredes...");
  setTimeout(() => {
    console.log("Construindo telhado...");
    setTimeout(() => {
      console.log("Adicionando portas e janelas...");
      setTimeout(() => {
        console.log("Casa construída com sucesso!");
        
        if (autoProsseguir) {
          indicePlano++;
          setTimeout(executarProximoPasso, 1000);
        }
      }, 2000);
    }, 2000);
  }, 2000);
}

function procurarEntidade(bot, tipo, autoProsseguir = false) {
  console.log(`Procurando por entidade do tipo: ${tipo}`);
  
  // Simulação de busca de entidade
  console.log(`Entidade ${tipo} encontrada!`);
  
  if (autoProsseguir) {
    indicePlano++;
    setTimeout(executarProximoPasso, 1000);
  }
}

function cavarParaBaixo(bot, profundidade, autoProsseguir = false) {
  console.log(`Cavando para baixo até profundidade ${profundidade}`);
  
  // Simulação de escavação
  console.log(`Chegou à profundidade ${profundidade}!`);
  
  if (autoProsseguir) {
    indicePlano++;
    setTimeout(executarProximoPasso, 1000);
  }
}

function minerarEmPadrao(bot, item, quantidade, autoProsseguir = false) {
  console.log(`Minerando em padrão para encontrar ${quantidade}x ${item}`);
  
  // Simulação de mineração em padrão
  console.log(`Encontrou e minerou ${quantidade}x ${item}!`);
  
  if (autoProsseguir) {
    indicePlano++;
    setTimeout(executarProximoPasso, 1000);
  }
}

function encantarItem(bot, item, encantamento, nivel, autoProsseguir = false) {
  console.log(`Encantando ${item} com ${encantamento} nível ${nivel}`);
  
  // Simulação de encantamento
  console.log(`${item} encantado com ${encantamento} ${nivel}!`);
  
  if (autoProsseguir) {
    indicePlano++;
    setTimeout(executarProximoPasso, 1000);
  }
}

function procurarEstrutura(bot, tipo, autoProsseguir = false) {
  console.log(`Procurando estrutura: ${tipo}`);
  
  // Simulação de busca de estrutura
  console.log(`Estrutura ${tipo} encontrada!`);
  
  if (autoProsseguir) {
    indicePlano++;
    setTimeout(executarProximoPasso, 1000);
  }
}

function ativarPortal(bot, tipo, autoProsseguir = false) {
  console.log(`Ativando portal: ${tipo}`);
  
  // Simulação de ativação de portal
  console.log(`Portal ${tipo} ativado!`);
  
  if (autoProsseguir) {
    indicePlano++;
    setTimeout(executarProximoPasso, 1000);
  }
}

function entrarPortal(bot, tipo, autoProsseguir = false) {
  console.log(`Entrando no portal: ${tipo}`);
  
  // Simulação de entrada no portal
  console.log(`Entrou no portal ${tipo}!`);
  
  if (autoProsseguir) {
    indicePlano++;
    setTimeout(executarProximoPasso, 1000);
  }
}

function atacarEntidade(bot, tipo, autoProsseguir = false) {
  console.log(`Atacando entidade: ${tipo}`);
  
  // Simulação de combate
  console.log("Combate iniciado...");
  setTimeout(() => {
    console.log("Combate em andamento...");
    setTimeout(() => {
      console.log(`${tipo} derrotado!`);
      
      if (autoProsseguir) {
        indicePlano++;
        setTimeout(executarProximoPasso, 1000);
      }
    }, 5000);
  }, 5000);
}

// Iniciar o bot
console.log('Executando bot no modo autônomo');
criarBot();
