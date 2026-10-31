(function () {
    let socket = null;
    let usuarioAtual = null;
    let conectado = false;

    function elemento(id) {
        return document.getElementById(id);
    }

    function definirStatus(texto, erro) {
        const status = elemento('chat-status');
        if (!status) {
            return;
        }
        status.textContent = texto || '';
        status.classList.toggle('chat-status--erro', Boolean(erro));
    }

    function atualizarContadores(quantidade) {
        ['chat-online', 'chat-online-count', 'chat-online-badge'].forEach(function (id) {
            const alvo = elemento(id);
            if (alvo) {
                alvo.textContent = String(quantidade);
            }
        });
    }

    function renderizarOnline(lista) {
        const container = elemento('chat-online-lista');
        if (!container) {
            return;
        }

        const jogadores = Array.isArray(lista) ? lista : [];
        atualizarContadores(jogadores.length);
        container.innerHTML = '';

        if (!jogadores.length) {
            const vazio = document.createElement('li');
            vazio.className = 'chat-online-vazio';
            vazio.textContent = 'Ninguém online agora.';
            container.appendChild(vazio);
            return;
        }

        jogadores.forEach(function (jogador) {
            const item = document.createElement('li');
            item.className = 'chat-online-item' + (jogador.usuario === usuarioAtual ? ' chat-online-item--voce' : '');

            const imagem = document.createElement('img');
            imagem.src = 'images/casa_' + (jogador.casa || 'stark') + '.jpg';
            imagem.alt = 'Casa ' + (jogador.casa || 'stark');
            imagem.loading = 'lazy';

            const dados = document.createElement('span');
            dados.className = 'chat-online-item__dados';

            const nome = document.createElement('strong');
            nome.textContent = jogador.nome || jogador.usuario;

            const usuario = document.createElement('small');
            usuario.textContent = '@' + jogador.usuario + (jogador.usuario === usuarioAtual ? ' · você' : '');

            dados.appendChild(nome);
            dados.appendChild(usuario);
            item.appendChild(imagem);
            item.appendChild(dados);
            container.appendChild(item);
        });
    }

    function rolarMensagens() {
        const container = elemento('chat-mensagens');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    function removerVazio() {
        const vazio = elemento('chat-vazio');
        if (vazio) {
            vazio.remove();
        }
    }

    function adicionarMensagem(mensagem) {
        const container = elemento('chat-mensagens');
        if (!container || !mensagem) {
            return;
        }

        removerVazio();

        const artigo = document.createElement('article');
        artigo.className = 'chat-mensagem' + (mensagem.usuario === usuarioAtual ? ' chat-mensagem--minha' : '');

        const topo = document.createElement('div');
        topo.className = 'chat-mensagem__topo';

        const nome = document.createElement('span');
        nome.className = 'chat-mensagem__nome';
        nome.textContent = mensagem.nome || mensagem.usuario;

        const hora = document.createElement('span');
        hora.className = 'chat-mensagem__hora';
        hora.textContent = new Date(mensagem.enviadaEm).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const texto = document.createElement('p');
        texto.className = 'chat-mensagem__texto';
        texto.textContent = mensagem.texto;

        topo.appendChild(nome);
        topo.appendChild(hora);
        artigo.appendChild(topo);
        artigo.appendChild(texto);
        container.appendChild(artigo);
        rolarMensagens();
    }

    function renderizarHistorico(historico) {
        const container = elemento('chat-mensagens');
        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (!Array.isArray(historico) || !historico.length) {
            const vazio = document.createElement('div');
            vazio.id = 'chat-vazio';
            vazio.className = 'chat-vazio';
            vazio.textContent = 'Nenhuma mensagem ainda. Diga olá aos Sete Reinos.';
            container.appendChild(vazio);
            return;
        }

        historico.forEach(function (mensagem) {
            adicionarMensagem(mensagem);
        });
    }

    function enviarMensagem(evento) {
        evento.preventDefault();

        const input = elemento('chat-input');
        if (!input) {
            return;
        }

        const texto = input.value.trim();
        if (!texto) {
            return;
        }

        if (!socket || !conectado) {
            definirStatus('Chat reconectando. Tente novamente em instantes.', true);
            return;
        }

        socket.emit('chat:mensagem', { texto: texto });
        input.value = '';
        input.focus();
        definirStatus('');
    }

    function abrirChat() {
        const modal = elemento('chat-modal');
        if (!modal) {
            return;
        }

        modal.hidden = false;
        document.body.classList.add('chat-aberto');

        const input = elemento('chat-input');
        if (input) {
            input.focus();
        }
        rolarMensagens();

        if (socket && !socket.connected) {
            socket.connect();
        }
    }

    function fecharChat() {
        const modal = elemento('chat-modal');
        if (!modal || modal.hidden) {
            return;
        }

        modal.hidden = true;
        document.body.classList.remove('chat-aberto');
    }

    function conectar() {
        if (typeof window.io !== 'function') {
            definirStatus('Chat indisponível neste momento.', true);
            return;
        }

        socket = window.io();

        socket.on('connect', function () {
            conectado = true;
            definirStatus('Conectado à sala global.');
        });

        socket.on('chat:estado', function (dados) {
            usuarioAtual = dados.usuario;
            renderizarOnline(dados.online);
            renderizarHistorico(dados.historico);
            definirStatus('Conectado à sala global.');
        });

        socket.on('chat:online', function (dados) {
            renderizarOnline(dados.online);
        });

        socket.on('chat:mensagem', function (mensagem) {
            adicionarMensagem(mensagem);
        });

        socket.on('chat:erro', function (dados) {
            definirStatus(dados && dados.msg ? dados.msg : 'Não foi possível enviar a mensagem.', true);
        });

        socket.on('disconnect', function () {
            conectado = false;
            atualizarContadores(0);
            definirStatus('Conexão perdida. Tentando reconectar...', true);
        });

        socket.on('connect_error', function () {
            conectado = false;
            definirStatus('Não foi possível conectar ao chat.', true);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        const modal = elemento('chat-modal');
        const form = elemento('chat-form');

        if (modal) {
            modal.addEventListener('click', function (evento) {
                if (evento.target === modal) {
                    fecharChat();
                }
            });
        }

        if (form) {
            form.addEventListener('submit', enviarMensagem);
        }

        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape') {
                fecharChat();
            }
        });

        window.abrirChat = abrirChat;
        window.fecharChat = fecharChat;

        conectar();
    });
})();
