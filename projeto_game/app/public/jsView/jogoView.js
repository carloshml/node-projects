let usuario = {};
let acoes = [];
let assinaturaAcoes = '';
let sincronizando = false;
let comprandoAldeao = false;
let divMensagens = null;
let temporizadorMensagem = null;
let temporizadorFlash = null;
let ultimosMaximos = {};

const DURACAO_BASE = { '1': 10000, '2': 120000, '3': 180000, '4': 240000, '5': 30000 };
const PODER_ALDEAO = 5;
const CUSTOS_ACAO = { '1': 2, '2': 3, '3': 1, '4': 1, '5': 5 };
const IMAGENS_ACAO = { '1': 'walk.gif', '2': 'dead.gif', '3': 'book.gif', '4': 'fire.gif' };
const TEXTOS_ACAO = {
    '1': 'aldeão(ões) coletando recursos',
    '2': 'enforcamento(s) programado',
    '3': 'aldeão(ões) em treinamento de história',
    '4': 'aldeão(ões) em treinamento de magia',
    '5': 'aldeão(ões) atacando a fera'
};
const LABEL_GANHO = {
    madeira: 'madeira',
    comida: 'comida',
    ferro: 'ferro',
    temor: 'temor',
    sabedoria: 'sabedoria',
    magia: 'magia',
    moeda: 'moedas'
};
const ICONES_GANHO = {
    moeda: 'images/icones/moeda.svg',
    madeira: 'images/icones/madeira.svg',
    comida: 'images/icones/comida.svg',
    ferro: 'images/icones/ferro.svg',
    temor: 'images/habilidades/temor.jpg',
    sabedoria: 'images/habilidades/sabedoria.jpg',
    magia: 'images/habilidades/magia.jpg'
};
const RECURSO_LABEL = { madeira: 'Madeira', comida: 'Comida', ferro: 'Ferro' };
const CUSTO_ALDEAO = 10000;
const PRECOS_PADRAO = { madeira: 1, comida: 2, ferro: 3 };
const DURACAO_DELTA = 2000;
const PAUSA_ANTES_MODAL = 1400;
const ATRASO_ENVIO_ORDEM = 4050;

function formatarDuracao(segundos) {
    const total = Math.max(0, Math.ceil(segundos));
    const minutos = Math.floor(total / 60);
    const resto = total % 60;
    if (minutos > 0) {
        return minutos + 'min ' + String(resto).padStart(2, '0') + 's';
    }
    return resto + 's';
}

function tocarSom(nome) {
    if (window.SomJogo && typeof window.SomJogo[nome] === 'function') {
        window.SomJogo[nome]();
    }
}

/* ----------------------------- números animados ----------------------------- */

function pausa(ms) {
    return new Promise(function (resolver) {
        setTimeout(resolver, ms);
    });
}

function animarNumero(elemento, de, para, duracao) {
    if (!elemento) {
        return Promise.resolve();
    }
    if (elemento._animacao) {
        cancelAnimationFrame(elemento._animacao);
        if (elemento._resolverAnimacao) {
            elemento._resolverAnimacao();
            elemento._resolverAnimacao = null;
        }
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        elemento.textContent = para;
        return Promise.resolve();
    }

    const inicio = performance.now();
    const tempo = duracao || 650;

    return new Promise(function (resolver) {
        elemento._resolverAnimacao = resolver;

        function passo(agora) {
            const fracao = Math.min(1, (agora - inicio) / tempo);
            const suave = 1 - Math.pow(1 - fracao, 3);
            elemento.textContent = Math.round(de + (para - de) * suave);
            if (fracao < 1) {
                elemento._animacao = requestAnimationFrame(passo);
            } else {
                elemento.textContent = para;
                elemento._animacao = null;
                elemento._resolverAnimacao = null;
                resolver();
            }
        }

        elemento._animacao = requestAnimationFrame(passo);
    });
}

function mostrarDelta(elemento, delta, tipo) {
    if (!elemento || !delta) {
        return;
    }

    const retangulo = elemento.getBoundingClientRect();
    const etiqueta = document.createElement('span');
    etiqueta.className = 'delta-valor ' +
        (delta > 0 ? 'delta-positivo' : 'delta-negativo') +
        (tipo === 'moeda' ? ' delta-moeda' : '');
    etiqueta.textContent = (delta > 0 ? '+' : '') + delta;
    etiqueta.style.left = (retangulo.left + retangulo.width / 2) + 'px';
    etiqueta.style.top = retangulo.top + 'px';
    document.body.appendChild(etiqueta);
    setTimeout(function () {
        etiqueta.remove();
    }, DURACAO_DELTA);
}

function atualizarValor(elemento, valor, tipo, comDelta) {
    if (!elemento || valor === undefined || valor === null || isNaN(Number(valor))) {
        return Promise.resolve();
    }

    const novo = Number(valor);
    const anterior = elemento.dataset.iniciado === '1'
        ? Number(elemento.dataset.valor)
        : Number(elemento.textContent) || 0;
    const exibido = Number(elemento.textContent) || 0;

    if (elemento.dataset.iniciado !== '1') {
        elemento.textContent = novo;
        elemento.dataset.valor = novo;
        elemento.dataset.iniciado = '1';
        return Promise.resolve();
    }

    if (anterior === novo) {
        return Promise.resolve();
    }

    const animacao = animarNumero(elemento, exibido, novo);
    elemento.classList.remove('valor-pulso');
    void elemento.offsetWidth;
    elemento.classList.add('valor-pulso');
    setTimeout(function () {
        elemento.classList.remove('valor-pulso');
    }, 500);

    if (comDelta !== false) {
        mostrarDelta(elemento, novo - anterior, tipo);
    }
    elemento.dataset.valor = novo;
    return animacao;
}

/* ------------------------------- modal ------------------------------------ */

const MODAL_TIPOS = {
    vitoria: { classe: 'vitoria', selo: '✦', titulo: 'VITÓRIA!', duracao: 0 },
    derrota: { classe: 'derrota', selo: '✕', titulo: 'A FERA ESCAPOU', duracao: 0 },
    recompensa: { classe: 'recompensa', selo: '◆', titulo: 'RECOMPENSA', duracao: 0 },
    sucesso: { classe: 'recompensa', selo: '◆', titulo: 'SUCESSO', duracao: 0 },
    acerto: { classe: 'info', selo: '◆', titulo: 'ORDEM RECEBIDA', duracao: 4500 },
    erro: { classe: 'derrota', selo: '!', titulo: 'ATENÇÃO', duracao: 6000 },
    pergaminhos: { classe: 'pergaminhos', selo: '✦', titulo: 'PERGAMINHOS', duracao: 0 }
};

function mostrarMensagem(tipo, html, titulo) {
    if (!divMensagens) {
        return;
    }

    const config = MODAL_TIPOS[tipo] || MODAL_TIPOS.acerto;
    divMensagens.innerHTML =
        '<div class="modal-jogo modal-jogo--' + config.classe + '" role="alertdialog" aria-modal="true" aria-labelledby="modal-jogo-titulo">' +
        '<div class="modal-jogo__aura"></div>' +
        '<div class="modal-jogo__selo">' + config.selo + '</div>' +
        '<h2 class="modal-jogo__titulo" id="modal-jogo-titulo">' + (titulo || config.titulo) + '</h2>' +
        '<div class="modal-jogo__texto">' + html + '</div>' +
        '<button type="button" class="modal-jogo__botao" onclick="apagaMensagem()">Continuar</button>' +
        '</div>';

    animarLoot();

    clearTimeout(temporizadorMensagem);
    if (document.body) {
        document.body.classList.add('modal-aberto');
    }
    if (config.duracao > 0) {
        temporizadorMensagem = setTimeout(function () {
            apagaMensagem();
        }, config.duracao);
    }
}

function animarLoot() {
    if (!divMensagens) {
        return;
    }
    divMensagens.querySelectorAll('.loot-valor').forEach(function (elemento) {
        const alvo = Number(elemento.dataset.valor) || 0;
        elemento.textContent = 0;
        animarNumero(elemento, 0, alvo, 750);
    });
}

function montarLoot(concluidas) {
    const totais = {};
    (concluidas || []).forEach(function (concluida) {
        Object.keys(concluida.ganhos || {}).forEach(function (campo) {
            if (!ICONES_GANHO[campo]) {
                return;
            }
            totais[campo] = (totais[campo] || 0) + Number(concluida.ganhos[campo]);
        });
    });

    const campos = Object.keys(totais);
    if (!campos.length) {
        return '';
    }

    return '<div class="loot-grid">' + campos.map(function (campo, indice) {
        return '<div class="loot-card" style="animation-delay:' + (indice * 0.09) + 's">' +
            '<img src="' + ICONES_GANHO[campo] + '" alt="">' +
            '<span class="loot-valor" data-valor="' + totais[campo] + '">0</span>' +
            '<span class="loot-nome">' + (LABEL_GANHO[campo] || campo) + '</span>' +
            '</div>';
    }).join('') + '</div>';
}

/* ------------------------------- descrições -------------------------------- */

function descreverGanhos(ganhos) {
    return Object.keys(ganhos || {}).map(function (campo) {
        return '+' + ganhos[campo] + ' ' + (LABEL_GANHO[campo] || campo);
    }).join(', ');
}

function acharFera(id) {
    const feras = (usuario.jogo && usuario.jogo.feras) || [];
    return feras.find(function (fera) {
        return fera.id === id;
    }) || null;
}

function descreverConcluida(concluida) {
    const quantidade = concluida.quantidade;
    const ganhos = descreverGanhos(concluida.ganhos);

    switch (String(concluida.acao)) {
        case '1':
            return 'Seus ' + quantidade + ' aldeão(ões) voltaram da coleta com ' + ganhos + '.';
        case '2':
            return 'Seus ' + quantidade + ' enforcamento(s) foram concluídos: ' + ganhos + '.';
        case '3':
            return 'Seus ' + quantidade + ' aldeão(ões) concluíram o treinamento de história: ' + ganhos + '.';
        case '4':
            return 'Seus ' + quantidade + ' aldeão(ões) concluíram o treinamento de magia: ' + ganhos + '.';
        case '5': {
            const fera = acharFera(concluida.fera);
            const alvo = fera ? fera.artigo + ' ' + fera.nome : 'a fera';
            const ataque = Number.isFinite(concluida.ataque) ? concluida.ataque : quantidade * PODER_ALDEAO;
            const vida = Number.isFinite(concluida.vida) ? concluida.vida : (fera ? fera.vida : null);
            const minimo = Number.isFinite(concluida.minimo) ? concluida.minimo : (fera ? fera.minimo : null);

            if (concluida.vitoria) {
                const detalheVida = vida !== null ? ' (' + vida + ' de vida)' : '';
                return 'Seus ' + quantidade + ' aldeão(ões) somaram ' + ataque + ' de ataque e derrotaram ' +
                    alvo + detalheVida + '!' + (ganhos ? ' ' + ganhos + '.' : '');
            }

            if (vida !== null) {
                return 'Seus ' + quantidade + ' aldeão(ões) somaram ' + ataque + ' de ataque, mas ' +
                    alvo + ' tinha ' + vida + ' de vida. Envie pelo menos ' + minimo + ' aldeões.';
            }

            return 'Seus ' + quantidade + ' aldeão(ões) não foram suficientes contra ' + alvo + '. A fera escapou.';
        }
        default:
            return 'Ordem concluída: ' + ganhos + '.';
    }
}

/* ----------------------------- notificações -------------------------------- */

function lerNotificacoes() {
    const parametros = new URLSearchParams(window.location.search);
    switch (parametros.get('msg')) {
        case 'erro':
            mostrarMensagem('erro', 'Operação inválida, verifique se todos os campos foram informados!', 'ORDEM INVÁLIDA');
            break;
        case 'acerto':
            mostrarMensagem('acerto', 'Operação realizada com sucesso!', 'ORDEM RECEBIDA');
            break;
        case 'todoSutidosOcupados':
            mostrarMensagem('erro', 'Todos os súditos estão ocupados!', 'SÚDITOS OCUPADOS');
            break;
        case 'C':
            mostrarMensagem('acerto', 'Senhor, a ação ordenada foi finalizada!', 'ORDEM FINALIZADA');
            break;
        case 'Deleted':
            mostrarMensagem('acerto', 'Senhor, sua ordem foi revogada com sucesso!', 'ORDEM REVOGADA');
            break;
        case 'quantidadeDeveSerNumerica':
            mostrarMensagem('erro', 'A quantidade deve ser numérica!', 'QUANTIDADE INVÁLIDA');
            break;
        case 'semMoeda':
            mostrarMensagem('erro', 'Moedas insuficientes para essa ordem!', 'MOEDAS INSUFICIENTES');
            break;
        case 'acaoJaConcluida':
            mostrarMensagem('erro', 'Essa ordem já foi concluída e não pode ser revogada.', 'ORDEM JÁ CONCLUÍDA');
            break;
        case 'batalhaEmCurso':
            mostrarMensagem('erro', 'A batalha contra a fera já começou; não é possível revogar.', 'BATALHA EM CURSO');
            break;
        default:
            break;
    }

    /* consome o ?msg= uma única vez; recarregar a página não reabre o modal */
    if (parametros.has('msg')) {
        parametros.delete('msg');
        const query = parametros.toString();
        const urlLimpa = window.location.pathname + (query ? '?' + query : '') + window.location.hash;
        window.history.replaceState({}, document.title, urlLimpa);
    }
}

function apagaMensagem() {
    clearTimeout(temporizadorMensagem);
    if (document.body) {
        document.body.classList.remove('modal-aberto');
    }
    if (divMensagens) {
        divMensagens.innerHTML = '';
    }
}

/* -------------------------------- HUD ------------------------------------- */

function atualizarMoeda() {
    if (!usuario.jogo) {
        return;
    }
    atualizarValor(document.getElementById('hud-moeda'), usuario.jogo.moeda, 'moeda');
    const antigo = document.getElementById('moeda');
    if (antigo) {
        atualizarValor(antigo, usuario.jogo.moeda, 'moeda');
    }
}

async function atualizarHud() {
    if (!usuario.jogo) {
        return;
    }
    const jogo = usuario.jogo;

    const promessas = [
        atualizarValor(document.getElementById('hud-moeda'), jogo.moeda, 'moeda'),
        atualizarValor(document.getElementById('hud-suditos-livres'), jogo.suditos - jogo.suditosTrabalhando, 'aldeao'),
        atualizarValor(document.getElementById('hud-suditos-total'), jogo.suditos, 'aldeao'),
        atualizarValor(document.getElementById('hud-madeira'), (jogo.recursos && jogo.recursos.madeira) || 0, 'recurso'),
        atualizarValor(document.getElementById('hud-comida'), (jogo.recursos && jogo.recursos.comida) || 0, 'recurso'),
        atualizarValor(document.getElementById('hud-ferro'), (jogo.recursos && jogo.recursos.ferro) || 0, 'recurso'),
        atualizarValor(document.getElementById('valor-temor'), jogo.temor, 'habilidade'),
        atualizarValor(document.getElementById('valor-sabedoria'), jogo.sabedoria, 'habilidade'),
        atualizarValor(document.getElementById('valor-comercio'), jogo.comercio, 'habilidade'),
        atualizarValor(document.getElementById('valor-magia'), jogo.magia, 'habilidade')
    ];

    const trabalhando = document.getElementById('hud-suditos-trabalhando');
    if (trabalhando) {
        trabalhando.textContent = jogo.suditosTrabalhando + ' trab.';
    }

    const antigo = document.getElementById('moeda');
    if (antigo) {
        promessas.push(atualizarValor(antigo, jogo.moeda, 'moeda'));
    }

    atualizarBotaoAldeao();
    await Promise.all(promessas);
}

function atualizarBotaoAldeao() {
    const botao = document.getElementById('btn-comprar-aldeao');
    if (!botao || !usuario.jogo) {
        return;
    }

    const moeda = Number(usuario.jogo.moeda) || 0;
    const podeComprar = moeda >= CUSTO_ALDEAO;
    botao.disabled = comprandoAldeao;
    botao.title = podeComprar
        ? 'Comprar um novo aldeão por 10.000 moedas'
        : 'Você precisa de 10.000 moedas para comprar um aldeão';
}

function atualizarSuditos() {
    if (!usuario.jogo) {
        return;
    }

    const livres = usuario.jogo.suditos - usuario.jogo.suditosTrabalhando;
    const numeroSuditosLivre = document.getElementById('numero-de-suditos-livres');
    if (numeroSuditosLivre) {
        numeroSuditosLivre.textContent = livres;
    }
    const numeroSuditosTrab = document.getElementById('numero-de-suditos-trab');
    if (numeroSuditosTrab) {
        numeroSuditosTrab.textContent = usuario.jogo.suditosTrabalhando;
    }

    atualizarValor(document.getElementById('hud-suditos-livres'), livres, 'aldeao');
    atualizarValor(document.getElementById('hud-suditos-total'), usuario.jogo.suditos, 'aldeao');
    const trabalhando = document.getElementById('hud-suditos-trabalhando');
    if (trabalhando) {
        trabalhando.textContent = usuario.jogo.suditosTrabalhando + ' trab.';
    }

    /* mantém o formulário de ordens com os valores atuais do jogo */
    const campoJogo = document.getElementById('jogo');
    if (campoJogo) {
        campoJogo.value = JSON.stringify({
            _id: usuario.jogo._id,
            suditos: usuario.jogo.suditos,
            suditosTrabalhando: usuario.jogo.suditosTrabalhando,
            moeda: usuario.jogo.moeda
        });
    }

    atualizarFormularioOrdens();
}

/* ------------------------------- celeiro ---------------------------------- */

function montarCeleiro() {
    const container = document.getElementById('lista-recursos');
    if (!container || !usuario.jogo) {
        return;
    }
    if (container.dataset.montado === '1') {
        atualizarCeleiro();
        return;
    }

    const precos = usuario.jogo.precos || PRECOS_PADRAO;
    const comercio = Number(usuario.jogo.comercio) || 0;

    container.innerHTML = Object.keys(precos).map(function (recurso) {
        const preco = Math.max(1, Math.round(precos[recurso] * (1 + comercio / 1000)));
        const label = RECURSO_LABEL[recurso] || recurso;
        return '<div class="recurso-linha" data-recurso="' + recurso + '">' +
            '<img class="recurso-icone" src="images/icones/' + recurso + '.svg" alt="">' +
            '<span class="recurso-nome">' + label + '</span>' +
            '<span class="recurso-qtd" data-qtd="' + recurso + '">0</span>' +
            '<input type="number" class="recurso-input" min="1" value="1" aria-label="Quantidade de ' + label + '">' +
            '<button type="button" class="btn-vender" data-recurso="' + recurso + '">Vender</button>' +
            '<span class="recurso-preco">' + preco + ' moeda(s)/un</span>' +
            '</div>';
    }).join('');
    container.dataset.montado = '1';
    atualizarCeleiro();
}

async function atualizarCeleiro() {
    const container = document.getElementById('lista-recursos');
    if (!container || !usuario.jogo) {
        return;
    }
    if (container.dataset.montado !== '1') {
        montarCeleiro();
        return;
    }

    const recursos = usuario.jogo.recursos || {};
    const precos = usuario.jogo.precos || PRECOS_PADRAO;
    const comercio = Number(usuario.jogo.comercio) || 0;
    const promessas = [];

    container.querySelectorAll('.recurso-linha').forEach(function (linha) {
        const recurso = linha.dataset.recurso;
        const quantidade = Number(recursos[recurso]) || 0;
        const preco = Math.max(1, Math.round((precos[recurso] || 1) * (1 + comercio / 1000)));
        const input = linha.querySelector('.recurso-input');
        const botao = linha.querySelector('.btn-vender');

        promessas.push(atualizarValor(linha.querySelector('.recurso-qtd'), quantidade, 'recurso', false));
        linha.querySelector('.recurso-preco').textContent = preco + ' moeda(s)/un';
        input.max = quantidade > 0 ? quantidade : 1;

        if (quantidade > 0) {
            const valorAtual = parseInt(input.value, 10);
            const maximoAnterior = ultimosMaximos[recurso];
            if (!(valorAtual > 0) || (maximoAnterior !== undefined && valorAtual === maximoAnterior)) {
                input.value = quantidade;
            }
            input.disabled = false;
            botao.disabled = false;
        } else {
            input.value = 1;
            input.disabled = true;
            botao.disabled = true;
        }
        ultimosMaximos[recurso] = quantidade;
    });

    await Promise.all(promessas);
}

async function venderRecurso(recurso, linha) {
    const input = linha.querySelector('.recurso-input');
    const botao = linha.querySelector('.btn-vender');
    const disponivel = Number((usuario.jogo.recursos || {})[recurso]) || 0;
    let quantidade = parseInt(input.value, 10);

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        mostrarMensagem('erro', 'Informe uma quantidade válida para vender.');
        return;
    }
    if (quantidade > disponivel) {
        quantidade = disponivel;
    }
    if (quantidade <= 0) {
        return;
    }

    botao.disabled = true;
    try {
        const resposta = await fetch('/venderRecurso', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recurso: recurso, quantidade: quantidade })
        });
        const dados = await resposta.json();

        if (!resposta.ok || !dados.ok) {
            mostrarMensagem('erro', dados.msg || 'Não foi possível vender o recurso.');
            return;
        }

        usuario.jogo.moeda = dados.moeda;
        usuario.jogo.recursos = dados.recursos;
        await Promise.all([atualizarHud(), atualizarCeleiro()]);
        tocarSom('moeda');

        /* espera o contador terminar antes de abrir o modal */
        await pausa(PAUSA_ANTES_MODAL);
        mostrarMensagem('acerto', 'Vendidos ' + quantidade + ' de ' + (RECURSO_LABEL[recurso] || recurso).toLowerCase() + ' por ' + dados.ganho + ' moeda(s).', 'VENDA REALIZADA');
    } catch (erro) {
        console.error('Falha ao vender recurso:', erro);
        mostrarMensagem('erro', 'Não foi possível vender o recurso.');
    } finally {
        atualizarCeleiro();
    }
}

async function comprarAldeao() {
    const botao = document.getElementById('btn-comprar-aldeao');
    if (!botao || botao.disabled || !usuario.jogo) {
        return;
    }

    if ((Number(usuario.jogo.moeda) || 0) < CUSTO_ALDEAO) {
        mostrarMensagem('erro', 'Você precisa de 10.000 moedas para comprar um novo aldeão.', 'SEM MOEDAS SUFICIENTES');
        return;
    }

    comprandoAldeao = true;
    botao.disabled = true;

    try {
        const resposta = await fetch('/comprarAldeao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const dados = await resposta.json();

        if (!resposta.ok || !dados.ok) {
            const semMoedas = dados.msg === 'moedasInsuficientes';
            if (semMoedas && typeof dados.moeda === 'number') {
                usuario.jogo.moeda = dados.moeda;
                await atualizarHud();
            }
            const mensagem = semMoedas
                ? 'Você precisa de 10.000 moedas para comprar um novo aldeão.'
                : 'Não foi possível comprar o aldeão.';
            mostrarMensagem('erro', mensagem, semMoedas ? 'SEM MOEDAS SUFICIENTES' : 'COMPRA NÃO REALIZADA');
            return;
        }

        usuario.jogo.moeda = dados.moeda;
        usuario.jogo.suditos = dados.suditos;
        usuario.jogo.suditosTrabalhando = dados.suditosTrabalhando;

        await atualizarHud();
        atualizarSuditos();
        atualizarFormularioOrdens();
        atualizarBotaoAldeao();
        tocarSom('moeda');
        await pausa(400);

        mostrarMensagem(
            'acerto',
            'Um novo aldeão juntou-se ao seu povo. <strong>-10.000 moedas</strong>',
            'NOVO ALDEÃO'
        );
    } catch (erro) {
        console.error('Falha ao comprar aldeão:', erro);
        mostrarMensagem('erro', 'Não foi possível comprar o aldeão.');
    } finally {
        comprandoAldeao = false;
        atualizarBotaoAldeao();
    }
}

/* --------------------------- formulário de ordens -------------------------- */

function formularioOrdens() {
    return document.querySelector('#acoes form');
}

function atualizarFormularioOrdens() {
    const form = formularioOrdens();
    if (!form || !usuario.jogo) {
        return;
    }

    const painel = document.getElementById('painel-ordem');
    const range = document.getElementById('qtd-range');
    const qtdValor = document.getElementById('qtd-valor');
    const qtdMax = document.getElementById('qtd-max');
    const quantidade = document.getElementById('quantidade');
    const resumo = document.getElementById('ordem-resumo');
    const status = document.getElementById('ordem-status');
    const botao = document.getElementById('btn-enviar-ordem');
    const card = form.querySelector('.card-acao.selecionado');
    const livres = Math.max(0, Number(usuario.jogo.suditos) - Number(usuario.jogo.suditosTrabalhando));

    if (range) {
        range.max = Math.max(1, livres);
        range.disabled = livres <= 0;
        if (Number(range.value) > Math.max(1, livres)) {
            range.value = Math.max(1, livres);
        }
    }
    if (qtdMax) {
        qtdMax.textContent = livres;
    }

    if (status) {
        status.textContent = livres > 0
            ? livres + ' aldeão(ões) livre(s) · ' + usuario.jogo.suditosTrabalhando + ' em atividade'
            : 'Nenhum aldeão livre. Aguarde as ordens atuais.';
    }

    if (!card) {
        if (painel) {
            painel.classList.add('d-none');
        }
        if (quantidade) {
            quantidade.value = range ? range.value : '1';
        }
        if (botao) {
            botao.disabled = true;
        }
        return;
    }

    if (painel) {
        painel.classList.remove('d-none');
    }

    const numero = Math.max(1, parseInt(range ? range.value : 1, 10) || 1);
    if (quantidade) {
        quantidade.value = numero;
    }
    if (qtdValor) {
        qtdValor.textContent = numero;
    }

    const acao = String(card.dataset.acao);
    const custo = Number(card.dataset.custo) || CUSTOS_ACAO[acao] || 0;
    const duracao = Number(card.dataset.duracao) || DURACAO_BASE[acao] || 0;
    const totalCusto = custo * numero;
    const totalDuracao = duracao * numero;

    let linhas = '<div class="ordem-linha"><span>Custo</span><strong>' +
        '<img class="ordem-icone" src="images/icones/moeda.svg" alt=""> ' + totalCusto + ' moeda(s)</strong></div>' +
        '<div class="ordem-linha"><span>Tempo</span><strong>' + formatarDuracao(totalDuracao / 1000) + '</strong></div>';

    if (acao === '1') {
        linhas += '<div class="ordem-linha"><span>Produção</span><strong>+' + (numero * 5) +
            ' madeira · +' + (numero * 2) + ' comida · +' + numero + ' ferro</strong></div>';
    } else if (acao === '5') {
        linhas += '<div class="ordem-linha"><span>Força</span><strong>' + (numero * PODER_ALDEAO) +
            ' de ataque</strong></div>' +
            '<div class="ordem-linha"><span>Fera</span><strong>surpresa</strong></div>';
    } else {
        const habilidade = { '2': 'temor', '3': 'sabedoria', '4': 'magia' }[acao];
        if (habilidade) {
            linhas += '<div class="ordem-linha"><span>Recompensa</span><strong>+' +
                (numero * 5) + ' ' + habilidade + '</strong></div>';
        }
    }

    if (resumo) {
        resumo.innerHTML = linhas;
    }

    if (botao) {
        botao.disabled = livres <= 0 || numero < 1 || numero > livres;
    }
}

function inicializarFormularioOrdens() {
    const form = formularioOrdens();
    if (!form) {
        return;
    }
    if (form.dataset.eventos === '1') {
        atualizarFormularioOrdens();
        return;
    }
    form.dataset.eventos = '1';

    const cards = form.querySelectorAll('.card-acao');
    cards.forEach(function (card) {
        card.addEventListener('click', function () {
            form.querySelectorAll('.card-acao').forEach(function (outro) {
                outro.classList.remove('selecionado');
            });
            card.classList.add('selecionado');

            const campoAcao = document.getElementById('acao');
            if (campoAcao) {
                campoAcao.value = card.dataset.acao;
            }

            const range = document.getElementById('qtd-range');
            const livres = Math.max(0, Number(usuario.jogo.suditos) - Number(usuario.jogo.suditosTrabalhando));
            if (range) {
                range.value = Math.max(1, livres);
            }

            atualizarFormularioOrdens();
            tocarSom('clique');
        });
    });

    const range = document.getElementById('qtd-range');
    if (range) {
        range.addEventListener('input', function () {
            const quantidade = document.getElementById('quantidade');
            if (quantidade) {
                quantidade.value = range.value;
            }
            atualizarFormularioOrdens();
        });
    }

    form.addEventListener('submit', function (evento) {
        const campoAcao = document.getElementById('acao');
        if (!campoAcao || !campoAcao.value) {
            evento.preventDefault();
            return;
        }

        if (form.dataset.enviando === '1') {
            evento.preventDefault();
            return;
        }
        form.dataset.enviando = '1';

        evento.preventDefault();
        const botao = document.getElementById('btn-enviar-ordem');
        if (botao) {
            botao.disabled = true;
            botao.textContent = 'Enviando...';
        }

        tocarSom('ordem');
        const somLigado = window.SomJogo && typeof window.SomJogo.estaAtivo === 'function' && window.SomJogo.estaAtivo();
        const atraso = somLigado ? ATRASO_ENVIO_ORDEM : 0;
        setTimeout(function () {
            HTMLFormElement.prototype.submit.call(form);
        }, atraso);
    });

    atualizarFormularioOrdens();
}

function irParaCeleiro() {
    const celeiro = document.getElementById('celeiro');
    if (celeiro) {
        celeiro.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/* ------------------------------- atividades -------------------------------- */

function imagemDaAcao(tipo) {
    return IMAGENS_ACAO[String(tipo)] || 'walk.gif';
}

function renderizarAcoes() {
    const container = document.getElementById('pergaminhos');
    if (!container) {
        return;
    }

    if (!acoes.length) {
        container.innerHTML = '<h3>Atividades:</h3>' +
            '<div class="sem-atividades">' +
            '<img class="sem-atividades__icone" src="images/outros/pergaminho.jpg" alt="">' +
            '<p class="sem-atividades__titulo">Ninguém está trabalhando.</p>' +
            '<p class="sem-atividades__texto">Seu povo está ocioso — e cada minuto parado é moeda que não entra. Dê uma ordem e coloque os aldeões para trabalhar.</p>' +
            '<button type="button" class="btn btn-warning btn-sm" onclick="verSuditos()">Dar uma ordem</button>' +
            '</div>';
        return;
    }

    let conteudo = '<h3>Atividades:</h3>';

    acoes.forEach(function (acao) {
        const tipo = String(acao.acao);
        const quantidade = parseInt(acao.quantidade, 10) || 0;
        const termina = Number(acao.acao_termina_em);
        const duracao = Number(acao.duracao_ms) || (DURACAO_BASE[tipo] || 0) * quantidade;
        const inicio = Number(acao.acao_iniciada_em) || (termina - duracao);
        const fera = tipo === '5' ? acharFera(acao.fera) : null;

        let aldeoes = '';
        let cabecalho;

        if (tipo === '5') {
            const alvo = fera ? fera.artigo + ' ' + fera.nome : 'a fera';
            const imagemFera = fera ? fera.imagem : 'fera.svg';
            const vida = fera ? Number(fera.vida) || 0 : 0;
            const ataque = quantidade * PODER_ALDEAO;
            const repeticoes = Math.min(quantidade, 10);

            for (let i = 0; i < repeticoes; i++) {
                aldeoes += '<img class="imagem-acao aldeao" src="images/walk.gif" alt="" loading="lazy">';
            }
            if (quantidade > 10) {
                aldeoes += '<span class="aldeoes-mais">+' + (quantidade - 10) + '</span>';
            }

            const barraVida = vida > 0
                ? '<div class="vida-fera"><div class="vida-fera__barra"><span></span></div>' +
                  '<span class="vida-fera__texto">' + vida + '/' + vida + '</span></div>'
                : '';

            cabecalho = '<div class="batalha" data-vida="' + vida + '" data-ataque="' + ataque + '">' +
                '<div class="batalha-lado batalha-atacantes">' +
                '<div class="aldeoes">' + aldeoes + '</div>' +
                '<span class="batalha-contagem">' + quantidade + ' aldeão(ões)</span>' +
                '</div>' +
                '<div class="batalha-centro">VS</div>' +
                '<div class="batalha-lado batalha-fera">' +
                '<img class="fera-imagem" src="images/feras/' + imagemFera + '" alt="' + alvo + '" loading="lazy">' +
                '<span class="fera-nome">' + alvo + '</span>' +
                barraVida +
                '</div>' +
                '</div>';
        } else {
            /* coleta mostra um aldeão por unidade; demais ações mostram um ícone */
            const repeticoes = tipo === '1' ? Math.min(quantidade, 10) : 1;
            for (let i = 0; i < repeticoes; i++) {
                aldeoes += '<img class="imagem-acao aldeao" src="images/' + imagemDaAcao(tipo) + '" alt="" loading="lazy">';
            }
            if (tipo === '1' && quantidade > 10) {
                aldeoes += '<span class="aldeoes-mais">+' + (quantidade - 10) + '</span>';
            }
            cabecalho = '<div class="aldeoes">' + aldeoes + '</div>';
        }

        const descricao = tipo === '5'
            ? 'Batalha contra ' + (fera ? fera.artigo + ' ' + fera.nome : 'a fera')
            : quantidade + ' ' + (TEXTOS_ACAO[tipo] || 'ordem em andamento');

        const botaoRevogar = tipo === '5'
            ? '<span class="btn-acao btn-acao-bloqueado" title="A batalha já começou">batalha em curso</span>'
            : '<a class="btn-acao" href="/revogar_acao?id_acao=' + acao._id + '&jogoid=' + usuario.jogo._id + '">revogar ordem</a>';

        conteudo += '<div class="row acoes-pergaminho" data-id="' + acao._id + '" data-tipo="' + tipo + '" data-termina="' + termina + '" data-inicio="' + inicio + '" data-duracao="' + duracao + '">' +
            '<div class="col-10">' +
            cabecalho +
            '<div class="acao-descricao">' + descricao +
            ' - <small>restam <span class="tempo-restante">--</span></small></div>' +
            '<div class="progress acao-progresso"><div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" style="width:0%"></div></div>' +
            '</div>' +
            '<div class="col-2">' +
            botaoRevogar +
            '</div>' +
            '</div>';
    });

    container.innerHTML = conteudo;
}

function mostrarDanoFera(linha, dano) {
    const alvo = linha.querySelector('.batalha-fera');
    if (!alvo || dano <= 0) {
        return;
    }

    const numero = document.createElement('span');
    numero.className = 'dano-fera';
    numero.textContent = '-' + dano;
    numero.style.left = (35 + Math.random() * 30) + '%';
    alvo.appendChild(numero);

    alvo.classList.remove('acerto-fera');
    void alvo.offsetWidth;
    alvo.classList.add('acerto-fera');

    setTimeout(function () {
        numero.remove();
        alvo.classList.remove('acerto-fera');
    }, 800);
}

function atualizarVidaBatalha(linha, agora) {
    const batalha = linha.querySelector('.batalha');
    if (!batalha) {
        return;
    }

    const vida = Number(batalha.dataset.vida) || 0;
    const ataque = Number(batalha.dataset.ataque) || 0;
    if (!vida) {
        return;
    }

    const inicio = Number(linha.dataset.inicio);
    const duracao = Number(linha.dataset.duracao);
    const progresso = duracao > 0 ? Math.min(1, Math.max(0, (agora - inicio) / duracao)) : 0;
    const danoAplicado = Math.min(vida, ataque * progresso);
    const vidaAtual = Math.max(0, vida - danoAplicado);

    const barra = linha.querySelector('.vida-fera__barra span');
    if (barra) {
        barra.style.width = ((vidaAtual / vida) * 100).toFixed(1) + '%';
    }
    const texto = linha.querySelector('.vida-fera__texto');
    if (texto) {
        texto.textContent = Math.ceil(vidaAtual) + '/' + vida;
    }

    const base = linha.dataset.hpBase !== undefined ? Number(linha.dataset.hpBase) : vida;
    const ultimoDano = Number(linha.dataset.ultimoDano) || 0;
    if (vidaAtual < base - 0.6 && agora - ultimoDano > 900) {
        mostrarDanoFera(linha, Math.max(1, Math.ceil(base - vidaAtual)));
        linha.dataset.hpBase = vidaAtual;
        linha.dataset.ultimoDano = agora;
    } else if (linha.dataset.hpBase === undefined) {
        linha.dataset.hpBase = vida;
    }
}

function atualizarContadores() {
    const linhas = document.querySelectorAll('.acoes-pergaminho');
    const agora = Date.now();
    let algumaExpirou = false;

    linhas.forEach(function (linha) {
        const termina = Number(linha.dataset.termina);
        const inicio = Number(linha.dataset.inicio);
        const duracao = Number(linha.dataset.duracao);
        const restante = termina - agora;

        if (restante <= 0) {
            algumaExpirou = true;
        }

        const tempo = linha.querySelector('.tempo-restante');
        if (tempo) {
            tempo.textContent = formatarDuracao(restante / 1000);
        }

        const barra = linha.querySelector('.acao-progresso .progress-bar');
        if (barra) {
            const percentual = duracao > 0
                ? Math.min(100, Math.max(0, ((agora - inicio) / duracao) * 100))
                : 0;
            barra.style.width = percentual.toFixed(1) + '%';
            barra.setAttribute('aria-valuenow', Math.round(percentual));
        }

        if (linha.dataset.tipo === '5') {
            atualizarVidaBatalha(linha, agora);
        }
    });

    if (algumaExpirou) {
        sincronizar();
    }
}

async function carregarAcoes() {
    if (!usuario.jogo) {
        return;
    }

    const resposta = await fetch('/gerarPergaminhos?jogoid=' + encodeURIComponent(usuario.jogo._id));
    if (!resposta.ok) {
        throw new Error('HTTP ' + resposta.status);
    }
    const dados = await resposta.json();
    const lista = (dados && dados.acoes) || [];
    const assinatura = JSON.stringify(lista.map(function (acao) {
        return [acao._id, acao.acao, acao.quantidade, acao.acao_termina_em];
    }));

    if (assinatura === assinaturaAcoes) {
        atualizarContadores();
        return;
    }

    assinaturaAcoes = assinatura;
    acoes = lista;
    renderizarAcoes();
    atualizarContadores();
    atualizarSomBatalha();
}

function montarHistorico(historico) {
    if (!Array.isArray(historico) || !historico.length) {
        return '<div class="historico-vazio">' +
            '<img src="images/outros/pergaminho.jpg" alt="">' +
            '<p>Nenhum pergaminho escrito ainda.</p>' +
            '<small>Conclua uma ordem para começar a sua história.</small>' +
            '</div>';
    }

    const nomes = {
        '1': 'Coleta de recursos',
        '2': 'Enforcamento',
        '3': 'Treinamento de história',
        '4': 'Treinamento de magia'
    };

    return '<div class="historico-lista">' + historico.map(function (item, indice) {
        const tipo = String(item.acao);
        const fera = item.fera ? acharFera(item.fera) : null;
        const feraNome = item.feraNome || (fera ? fera.nome : 'fera');
        const imagem = tipo === '5'
            ? 'images/feras/' + (fera ? fera.imagem : 'fera.svg')
            : 'images/' + (IMAGENS_ACAO[tipo] || 'walk.gif');
        const titulo = tipo === '5' ? 'Caçada' : (nomes[tipo] || 'Ordem');
        const detalhe = tipo === '5'
            ? (item.vitoria ? 'Vitória contra ' : 'Derrota para ') + feraNome
            : item.quantidade + ' aldeão(ões)';
        const ganhos = descreverGanhos(item.ganhos);
        const recompensa = ganhos
            ? ganhos
            : (tipo === '5' && item.vitoria === false ? 'A fera escapou.' : 'Sem recompensa.');
        const data = item.terminado_em
            ? new Date(item.terminado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            : '';
        const classe = tipo === '5'
            ? (item.vitoria ? ' historico-item--vitoria' : ' historico-item--derrota')
            : '';

        return '<div class="historico-item' + classe + '" style="animation-delay:' + (indice * 0.04) + 's">' +
            '<img class="historico-item__icone" src="' + imagem + '" alt="">' +
            '<div class="historico-item__conteudo">' +
            '<div class="historico-item__titulo">' + titulo + '</div>' +
            '<div class="historico-item__meta">' + detalhe + (data ? ' · ' + data : '') + '</div>' +
            '<div class="historico-item__ganhos">' + recompensa + '</div>' +
            '</div>' +
            '</div>';
    }).join('') + '</div>';
}

function montarOpcoesSom(tipo, opcoes, selecionado, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    container.innerHTML = opcoes.map(function (opcao) {
        const marcado = opcao.id === selecionado;
        return '<div class="som-opcao' + (marcado ? ' som-opcao--selecionada' : '') + '" data-id="' + opcao.id + '">' +
            '<label class="som-opcao__escolha">' +
            '<input type="radio" name="som-' + tipo + '" value="' + opcao.id + '"' + (marcado ? ' checked' : '') + '>' +
            '<span class="som-opcao__texto"><strong>' + opcao.nome + '</strong><small>' + opcao.descricao + '</small></span>' +
            '</label>' +
            '<button type="button" class="som-opcao__ouvir" data-tipo="' + tipo + '" data-id="' + opcao.id + '">Ouvir</button>' +
            '</div>';
    }).join('');

    container.querySelectorAll('input[type="radio"]').forEach(function (entrada) {
        entrada.addEventListener('change', function () {
            if (!window.SomJogo) {
                return;
            }
            if (tipo === 'guerreiro') {
                window.SomJogo.selecionarGuerreiro(entrada.value);
            } else {
                window.SomJogo.selecionarFera(entrada.value);
            }
            container.querySelectorAll('.som-opcao').forEach(function (linha) {
                linha.classList.toggle('som-opcao--selecionada', linha.dataset.id === entrada.value);
            });
        });
    });

    container.querySelectorAll('.som-opcao__ouvir').forEach(function (botao) {
        botao.addEventListener('click', function () {
            if (!window.SomJogo) {
                return;
            }
            const tocou = tipo === 'guerreiro'
                ? window.SomJogo.previaGuerreiro(botao.dataset.id)
                : window.SomJogo.previaFera(botao.dataset.id);

            if (!tocou) {
                const textoOriginal = botao.textContent;
                botao.textContent = 'Som off';
                setTimeout(function () {
                    botao.textContent = textoOriginal;
                }, 1100);
            }
        });
    });
}

function abrirSonsBatalha() {
    const modal = document.getElementById('som-batalha-modal');
    if (!modal || !window.SomJogo) {
        return;
    }

    montarOpcoesSom(
        'guerreiro',
        window.SomJogo.opcoesGuerreiros(),
        window.SomJogo.guerreiroSelecionado(),
        'opcoes-guerreiros'
    );
    montarOpcoesSom(
        'fera',
        window.SomJogo.opcoesFeras(),
        window.SomJogo.feraSelecionada(),
        'opcoes-feras'
    );

    window.SomJogo.pararBatalha();
    const botaoMudo = document.getElementById('btn-mudo-batalha');
    if (botaoMudo) {
        botaoMudo.textContent = 'Som: ' + (window.SomJogo.estaAtivo() ? 'on' : 'off');
    }
    modal.hidden = false;
    document.body.classList.add('som-modal-aberto');
}

function alternarSomBatalha() {
    if (!window.SomJogo) {
        return;
    }
    window.SomJogo.alternar();
    const botaoMudo = document.getElementById('btn-mudo-batalha');
    if (botaoMudo) {
        botaoMudo.textContent = 'Som: ' + (window.SomJogo.estaAtivo() ? 'on' : 'off');
    }
}

function fecharSonsBatalha() {
    const modal = document.getElementById('som-batalha-modal');
    if (!modal || modal.hidden) {
        return;
    }
    modal.hidden = true;
    document.body.classList.remove('som-modal-aberto');
    atualizarSomBatalha();
}

function temBatalhaAtiva() {
    return acoes.some(function (acao) {
        return String(acao.acao) === '5';
    });
}

function atualizarSomBatalha() {
    if (!window.SomJogo) {
        return;
    }

    const modalSom = document.getElementById('som-batalha-modal');
    if (modalSom && !modalSom.hidden) {
        window.SomJogo.pararBatalha();
        return;
    }

    if (temBatalhaAtiva()) {
        window.SomJogo.iniciarBatalha();
    } else {
        window.SomJogo.pararBatalha();
    }
}

function animarTurnoBatalha(quem) {
    document.querySelectorAll('.batalha').forEach(function (batalha) {
        batalha.classList.remove('batalha-turno-guerreiro', 'batalha-turno-fera');
        void batalha.offsetWidth;
        batalha.classList.add('batalha-turno-' + quem);

        setTimeout(function () {
            batalha.classList.remove('batalha-turno-' + quem);
        }, 700);
    });
}

async function verPergaminhos() {
    try {
        const resposta = await fetch('/historicoAcoes');
        if (!resposta.ok) {
            throw new Error('HTTP ' + resposta.status);
        }
        const dados = await resposta.json();
        if (!dados || !dados.ok) {
            throw new Error(dados && dados.msg ? dados.msg : 'Histórico indisponível');
        }
        mostrarMensagem('pergaminhos', montarHistorico(dados.historico), 'PERGAMINHOS');
        tocarSom('clique');
    } catch (erro) {
        console.error('Falha ao carregar os pergaminhos:', erro);
        mostrarMensagem('erro', 'Não foi possível abrir os pergaminhos agora.', 'PERGAMINHOS');
    }
}

function verSuditos() {
    fetch('/gerarSuditos')
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error('HTTP ' + resposta.status);
            }
            return resposta.text();
        })
        .then(function (html) {
            document.getElementById('acoes').innerHTML = html;
            return buscaJogoUsuario();
        })
        .then(function () {
            inicializarFormularioOrdens();
            const formulario = formularioOrdens();
            if (formulario) {
                formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        })
        .catch(function (erro) {
            console.error('Falha ao carregar o formulário de ordens:', erro);
        });
}

async function buscaJogoUsuario() {
    const resposta = await fetch('/buscaJogoUsuario', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!resposta.ok) {
        throw new Error('HTTP ' + resposta.status);
    }

    const dados = await resposta.json();
    if (!dados || !dados.jogo) {
        throw new Error('Jogo não encontrado');
    }

    usuario = dados;
    const animacoes = Promise.all([atualizarHud(), atualizarCeleiro()]);
    atualizarSuditos();
    atualizarFormularioOrdens();
    await animacoes;
}

function efeitoBatalha(derrota) {
    const body = document.body;
    if (!body) {
        return;
    }

    body.classList.remove('tremor-jogo', 'flash-vitoria', 'flash-derrota');
    void body.offsetWidth;
    body.classList.add('tremor-jogo');
    body.classList.add(derrota ? 'flash-derrota' : 'flash-vitoria');

    clearTimeout(temporizadorFlash);
    temporizadorFlash = setTimeout(function () {
        body.classList.remove('tremor-jogo', 'flash-vitoria', 'flash-derrota');
    }, 900);
}

async function sincronizar() {
    if (sincronizando || !usuario.jogo) {
        return;
    }
    sincronizando = true;

    try {
        const resposta = await fetch('/atualizarAcoesDeJogo?jogoid=' + encodeURIComponent(usuario.jogo._id), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!resposta.ok) {
            throw new Error('HTTP ' + resposta.status);
        }

        const dados = await resposta.json();
        let resultadoModal = null;

        if (dados && dados.concluidas && dados.concluidas.length) {
            const batalhas = dados.concluidas.filter(function (concluida) {
                return String(concluida.acao) === '5';
            });
            const soBatalhas = batalhas.length === dados.concluidas.length;
            const todasDerrotas = soBatalhas && batalhas.every(function (concluida) {
                return concluida.vitoria === false;
            });
            const todasVitorias = soBatalhas && batalhas.every(function (concluida) {
                return concluida.vitoria === true;
            });

            let tipo = 'recompensa';
            let titulo = dados.concluidas.length === 1 ? 'ORDEM CONCLUÍDA' : 'ORDENS CONCLUÍDAS';

            if (todasDerrotas) {
                tipo = 'derrota';
                titulo = 'A FERA ESCAPOU';
            } else if (todasVitorias) {
                tipo = 'vitoria';
                titulo = 'VITÓRIA!';
            }

            const loot = montarLoot(dados.concluidas);
            const corpo = dados.concluidas.map(function (concluida) {
                return '<p class="modal-jogo__linha">' + descreverConcluida(concluida) + '</p>';
            }).join('');

            let imagem = '';
            if (soBatalhas && batalhas.length === 1 && batalhas[0].fera) {
                const fera = acharFera(batalhas[0].fera);
                if (fera) {
                    imagem = '<img class="modal-jogo__fera" src="images/feras/' + fera.imagem + '" alt="' + fera.nome + '">';
                }
            }

            resultadoModal = {
                tipo: tipo,
                titulo: titulo,
                html: imagem + loot + corpo,
                temBatalha: batalhas.length > 0,
                derrota: todasDerrotas
            };

            /* fecha um modal antigo para a animação dos recursos ficar visível */
            apagaMensagem();
        }

        await buscaJogoUsuario();
        try {
            await carregarAcoes();
        } catch (erroAcoes) {
            console.error('Falha ao recarregar as atividades:', erroAcoes);
        }

        if (resultadoModal) {
            /* deixa o contador e os deltas visíveis antes de cobrir a tela */
            await pausa(PAUSA_ANTES_MODAL);
            if (window.SomJogo) {
                window.SomJogo.pararBatalha();
            }

            if (resultadoModal.temBatalha) {
                efeitoBatalha(resultadoModal.derrota);
                tocarSom('batalha');
                tocarSom(resultadoModal.derrota ? 'derrota' : 'vitoria');
            } else {
                tocarSom('conclusao');
            }

            mostrarMensagem(resultadoModal.tipo, resultadoModal.html, resultadoModal.titulo);
        }
    } catch (erro) {
        console.error('Falha ao sincronizar as ações:', erro);
    } finally {
        sincronizando = false;
    }
}

async function iniciar() {
    await buscaJogoUsuario();
    montarCeleiro();
    await sincronizar();

    setInterval(function () {
        atualizarContadores();
    }, 1000);

    /* rede de segurança para ações que terminaram com a aba em segundo plano */
    setInterval(function () {
        sincronizar();
    }, 15000);
}

document.addEventListener('DOMContentLoaded', function () {
    divMensagens = document.getElementById('mensagens');
    lerNotificacoes();

    if (divMensagens) {
        divMensagens.addEventListener('click', function (evento) {
            if (evento.target === divMensagens) {
                apagaMensagem();
            }
        });
    }

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            apagaMensagem();
        }
    });

    const listaRecursos = document.getElementById('lista-recursos');
    if (listaRecursos) {
        listaRecursos.addEventListener('click', function (evento) {
            const botao = evento.target.closest('.btn-vender');
            if (!botao) {
                return;
            }
            venderRecurso(botao.dataset.recurso, botao.closest('.recurso-linha'));
        });
    }

    const modalSom = document.getElementById('som-batalha-modal');
    if (modalSom) {
        modalSom.addEventListener('click', function (evento) {
            if (evento.target === modalSom) {
                fecharSonsBatalha();
            }
        });
    }

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape') {
            fecharSonsBatalha();
        }
    });

    window.addEventListener('som-jogo-alterado', atualizarSomBatalha);
    window.addEventListener('batalha-som', function (evento) {
        if (evento.detail && evento.detail.quem) {
            animarTurnoBatalha(evento.detail.quem);
        }
    });

    iniciar().catch(function (erro) {
        console.error('Falha ao iniciar a tela do jogo:', erro);
    });
});
