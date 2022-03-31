let usuario = {};
let timerId = null;
function cronometro() {
    if (document.getElementById('pergaminhos') !== null) {
        gerarPergaminhos();
        const tempo_restante = document.getElementById('tempo_restante'); 
        if (tempo_restante && (tempo_restante.innerText === '0')) {           
            atualizarAcoesDeJogo()
                .then(() => buscaJogoUsuario());
        }
    }
    timerId = setTimeout(function () { cronometro(); }, 1000);
}

function cronometro10seg() {
    atualizarAcoesDeJogo()
        .then(() => buscaJogoUsuario());
    timerId = setTimeout(function () { cronometro10seg(); }, 10000);
}

const verPergaminhos = function () {
    clearTimeout(timerId);
    gerarPergaminhos();
    cronometro();
}


const verSudutos = function () {
    $('#msg').hide();
    $.ajax({
        url: "/gerarSuditos",
        method: "get",
        success: function (htmlRequisicao) {
            $('#acoes').html(htmlRequisicao);
            buscaJogoUsuario();
        }
    });
}

function atualizarAcoesDeJogo() {

    return fetch(`/atualizarAcoesDeJogo?jogoid=${usuario.jogo._id}`,
        {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(function (response) {
            const contentType = response.headers.get("content-type");
            if (contentType && (contentType.indexOf("application/json") !== -1)) {
                return response
                    .json()
                    .then(function (atualizarAcoesDeJogo) {
                        // process your JSON further
                        // onsole.log(" atualizarAcoesDeJogo :: ", atualizarAcoesDeJogo);

                    });
            } else {
                alert(' Deu erro ');
                console.log("Oops, we haven't got JSON!");
            }
        })
        .catch(e => {
            alert(' Deu erro 500');
            console.log("Oops, we haven't got JSON!");
        });
}

function buscaJogoUsuario() {
    return fetch('http://localhost:8200/buscaJogoUsuario',
        {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(function (response) {
            const contentType = response.headers.get("content-type");
            if (contentType && (contentType.indexOf("application/json") !== -1)) {
                return response
                    .json()
                    .then(function (respBuscarUsuario) {
                        // process your JSON further                      
                        usuario = respBuscarUsuario;
                        atualizarSuditos();
                    });
            } else {
                alert(' Deu erro ');
                console.log("Oops, we haven't got JSON!");
            }
        })
        .catch(e => {
            alert(' Deu erro 500');
            console.log("Oops, we haven't got JSON!");
        });
}

function atualizarSuditos() {
    const numeroSuditosLivre = document.getElementById('numero-de-suditos-livres');
    // do compomente pergaminho
    if (numeroSuditosLivre) {
        numeroSuditosLivre.innerHTML = usuario.jogo.suditos - usuario.jogo.suditosTrabalhando;
    }
    // do compomente pergaminho
    const numeroSuditosTrab = document.getElementById('numero-de-suditos-trab');
    if (numeroSuditosTrab) {
        numeroSuditosTrab.innerHTML = usuario.jogo.suditosTrabalhando;
    }
    // corpo principal
    const suditosTrabalhando = document.getElementById('suditosTrabalhando');
    if (suditosTrabalhando) {
        suditosTrabalhando.innerHTML = usuario.jogo.suditosTrabalhando;
    }
}

function lerNotificacoes() {
    const parametros = new URLSearchParams(window.location.search);
    const divMensagens = document.getElementById('mensagens');
    switch (parametros.get('msg')) {
        case 'erro':
            divMensagens.innerHTML = ` <div class="alert alert-danger" id='msg'>
                                                    <ul>
                                                        <li> <strong> Operação Invalida, verifique se todos os campos foram informados! </strong></li>
                                                    </ul>
                                                </div>`
            break;
        case 'acerto':
            divMensagens.innerHTML = ` <div class="alert alert-info" id='msg'>
                                                    <ul>
                                                        <li> <strong> Operação realizada com sucesso! </strong> </li>
                                                    </ul>
                                                </div>`
            break;
        case 'todoSutidosOcupados':
            divMensagens.innerHTML = `   <div class="alert alert-info" id='msg'>
                                                <ul>
                                                    <li> <strong> Todos os suditos estão ocupados! </strong> </li>
                                                </ul>
                                            </div>`
            break;
        case 'C':
            divMensagens.innerHTML = `<div class="alert alert-info" id='msg'>
                                                    <ul>
                                                        <li> <strong> Senhor, ação ordenada foi finalizada! </strong> </li>
                                                    </ul>
                                                </div>`
            break;
        case 'Deleted':
            divMensagens.innerHTML = ` <div class="alert alert-info" id='msg'>
                                                    <ul>
                                                        <li> <strong> Senhor, sua ordem foi revogada com sucesso! </strong> </li>
                                                    </ul>
                                                </div>`
            break;

        case 'quantidadeDeveSerNumerica':
            divMensagens.innerHTML = ` <div class="alert alert-info" id='msg'>
                                                    <ul>
                                                        <li> <strong> Quantidade deve ser numerica! </strong> </li>
                                                    </ul>
                                                </div>`
            break;



        default:
            break;
    }

    setTimeout(() => {
        divMensagens.innerHTML = '';
    }, 6000);
}

function gerarPergaminhos(usarClearTimeOut) {
    $('#msg').hide();
    return fetch(`/gerarPergaminhos?jogoid=${usuario.jogo._id}`,
        {
            method: "GET",
        })
        .then(function (response) {
            return response
                .text()
                .then(function (response) {
                    response = JSON.parse(response);
                    if (response) {                        
                        // apenas se pergaminhos estiver na tela
                        const acoes = response.acoes;
                        let conteudo = ` <div id="pergaminhos">
                                                      <h3>Pergaminhos</h3>`;
                        for (let i = 0; i < acoes.length; i++) {
                            let txt_acao = '';
                            let imagem = '';
                            switch (acoes[i].acao) {
                                case '1': txt_acao = 'aldeão(ões) coletando recursos';
                                    imagem = 'walk.gif';
                                    break;
                                case '2': txt_acao = 'enforcamento(s) programado';
                                    imagem = 'dead.gif';
                                    break;
                                case '3': txt_acao = 'aldeão(ões) em treinamento de história';
                                    imagem = 'book.gif';
                                    break;
                                case '4': txt_acao = 'aldeão(ões) em treinamento de magia';
                                    imagem = 'fire.gif';
                                    break;
                                default: console.log("error");
                                    break;
                            }
                            const momentoAtual = new Date().getTime();
                            const segundosRestantes = Math.round((acoes[i].acao_termina_em - momentoAtual) / 1000);
                            conteudo += `<div class="row acoes-pergaminho">
                                                <div class="col-xs-10">`;
                            if (imagem) {
                                conteudo += `	<img class="imagem-acao" src="images/${imagem}" loading=lazy>`
                            }
                            conteudo += `${acoes[i].quantidade} ${txt_acao} - <small>restam`;
                            if (parseInt(segundosRestantes) > 59) {
                                conteudo += `	${Math.round(segundosRestantes / 60)}   minutos`;
                            }
                            conteudo += `<span class="tempo_restante" id="tempo_restante">${segundosRestantes % 60}</span> segundos

                                                </small>
                                                </div>
                                                <div class="col-xs-2">
                                                    <a class="btn-acao" href="/revogar_acao?id_acao=${acoes[i]._id}&jogoid=${usuario.jogo._id}">revogar ordem</a>
                                                </div>
                                            </div>`;

                        }
                        conteudo += `</div>`;
                        $('#acoes').html(conteudo);
                    }
                });
        })
        .catch(e => {
            alert(' Deu erro 500');
            console.log("Oops, we haven't got JSON!");
        });
}

document.addEventListener("DOMContentLoaded", function () {
    // inicar atualizando a tela  
    buscaJogoUsuario()
        .then(() => {
            atualizarAcoesDeJogo()
                .then(() => buscaJogoUsuario())
            cronometro();
            cronometro10seg();
        });
    lerNotificacoes();

});
