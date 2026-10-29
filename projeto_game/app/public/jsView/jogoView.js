let usuario = {};
let acoes = [];
let assinaturaAcoes = '';
let sincronizando = false;
let divMensagens = null;
let temporizadorMensagem = null;
let ultimosMaximos = {};

const DURACAO_BASE = { '1': 10000, '2': 120000, '3': 180000, '4': 240000, '5': 30000 };
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
const RECURSO_LABEL = { madeira: 'Madeira', comida: 'Comida', ferro: 'Ferro' };
const PRECOS_PADRAO = { madeira: 1, comida: 2, ferro: 3 };

function formatarDuracao(segundos) {
    const total = Math.max(0, Math.ceil(segundos));
    const minutos = Math.floor(total / 60);
    const resto = total % 60;
    if (minutos > 0) {
        return minutos + 'min ' + String(resto).padStart(2, '0') + 's';
    }
    return resto + 's';
}

const MODAL_TIPOS = {
    vitoria: { classe: 'vitoria', selo: '✦', titulo: 'VITÓRIA!', duracao: 0 },
    derrota: { classe: 'derrota', selo: '✕', titulo: 'A FERA ESCAPOU', duracao: 0 },
    recompensa: { classe: 'recompensa', selo: '◆', titulo: 'RECOMPENSA', duracao: 0 },
    sucesso: { classe: 'recompensa', selo: '◆', titulo: 'SUCESSO', duracao: 0 },
    acerto: { classe: 'info', selo: '◆', titulo: 'ORDEM RECEBIDA', duracao: 4500 },
    erro: { classe: 'derrota', selo: '!', titulo: 'ATENÇÃO', duracao: 6000 }
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
            if (concluida.vitoria) {
                return 'Seus ' + quantidade + ' aldeão(ões) derrotaram ' + alvo + '!' + (ganhos ? ' ' + ganhos + '.' : '');
            }
            return 'Seus ' + quantidade + ' aldeão(ões) não foram suficientes contra ' + alvo + '. A fera escapou.';
        }
        default:
            return 'Ordem concluída: ' + ganhos + '.';
    }
}

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

function atualizarMoeda() {
    const elemento = document.getElementById('moeda');
    if (elemento && usuario.jogo) {
        elemento.textContent = usuario.jogo.moeda;
    }
}

function atualizarSuditos() {
    if (!usuario.jogo) {
        return;
    }
    const numeroSuditosLivre = document.getElementById('numero-de-suditos-livres');
    if (numeroSuditosLivre) {
        numeroSuditosLivre.innerHTML = usuario.jogo.suditos - usuario.jogo.suditosTrabalhando;
    }
    const numeroSuditosTrab = document.getElementById('numero-de-suditos-trab');
    if (numeroSuditosTrab) {
        numeroSuditosTrab.innerHTML = usuario.jogo.suditosTrabalhando;
    }
    const suditosTrabalhando = document.getElementById('suditosTrabalhando');
    if (suditosTrabalhando) {
        suditosTrabalhando.innerHTML = usuario.jogo.suditosTrabalhando;
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
}

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

function atualizarCeleiro() {
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

    container.querySelectorAll('.recurso-linha').forEach(function (linha) {
        const recurso = linha.dataset.recurso;
        const quantidade = Number(recursos[recurso]) || 0;
        const preco = Math.max(1, Math.round((precos[recurso] || 1) * (1 + comercio / 1000)));
        const input = linha.querySelector('.recurso-input');
        const botao = linha.querySelector('.btn-vender');

        linha.querySelector('.recurso-qtd').textContent = quantidade;
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
        atualizarMoeda();
        mostrarMensagem('acerto', 'Vendidos ' + quantidade + ' de ' + (RECURSO_LABEL[recurso] || recurso).toLowerCase() + ' por ' + dados.ganho + ' moeda(s).', 'VENDA REALIZADA');
    } catch (erro) {
        console.error('Falha ao vender recurso:', erro);
        mostrarMensagem('erro', 'Não foi possível vender o recurso.');
    } finally {
        atualizarCeleiro();
    }
}

function imagemDaAcao(tipo) {
    return IMAGENS_ACAO[String(tipo)] || 'walk.gif';
}

function renderizarAcoes() {
    const container = document.getElementById('pergaminhos');
    if (!container) {
        return;
    }

    if (!acoes.length) {
        container.innerHTML = '<h3>Atividades:</h3><p class="sem-atividades">Nenhuma atividade em andamento.</p>';
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
            const repeticoes = Math.min(quantidade, 10);
            for (let i = 0; i < repeticoes; i++) {
                aldeoes += '<img class="imagem-acao aldeao" src="images/outros/suditos.jpg" alt="" loading="lazy">';
            }
            if (quantidade > 10) {
                aldeoes += '<span class="aldeoes-mais">+' + (quantidade - 10) + '</span>';
            }
            cabecalho = '<div class="batalha">' +
                '<div class="batalha-lado batalha-atacantes">' +
                '<div class="aldeoes">' + aldeoes + '</div>' +
                '<span class="batalha-contagem">' + quantidade + ' aldeão(ões)</span>' +
                '</div>' +
                '<div class="batalha-centro">VS</div>' +
                '<div class="batalha-lado batalha-fera">' +
                '<img class="fera-imagem" src="images/feras/' + imagemFera + '" alt="' + alvo + '" loading="lazy">' +
                '<span class="fera-nome">' + alvo + '</span>' +
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
            '<div class="col-xs-10">' +
            cabecalho +
            '<div class="acao-descricao">' + descricao +
            ' - <small>restam <span class="tempo-restante">--</span></small></div>' +
            '<div class="progress acao-progresso"><div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" style="width:0%"></div></div>' +
            '</div>' +
            '<div class="col-xs-2">' +
            botaoRevogar +
            '</div>' +
            '</div>';
    });

    container.innerHTML = conteudo;
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
}

function verPergaminhos() {
    carregarAcoes().catch(function (erro) {
        console.error('Falha ao carregar atividades:', erro);
    });
}

function verSuditos() {
    $.ajax({
        url: '/gerarSuditos',
        method: 'get',
        success: function (htmlRequisicao) {
            $('#acoes').html(htmlRequisicao);
            buscaJogoUsuario().catch(function (erro) {
                console.error('Falha ao atualizar o jogo:', erro);
            });
        }
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
    atualizarSuditos();
    atualizarMoeda();
    atualizarCeleiro();
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

            mostrarMensagem(tipo, imagem + corpo, titulo);
        }

        await buscaJogoUsuario();
        await carregarAcoes();
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

    iniciar().catch(function (erro) {
        console.error('Falha ao iniciar a tela do jogo:', erro);
    });
});
