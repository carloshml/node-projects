const { randomUUID } = require('crypto');

const LIMITE_HISTORICO = 50;
const TAMANHO_MAXIMO = 500;
const INTERVALO_MINIMO = 600;

function iniciarChat(io) {
    const online = new Map();
    const historico = [];

    function listarOnline() {
        return Array.from(online.values())
            .sort(function (a, b) {
                return a.nome.localeCompare(b.nome, 'pt-BR');
            })
            .map(function (registro) {
                return {
                    usuario: registro.usuario,
                    nome: registro.nome,
                    casa: registro.casa
                };
            });
    }

    io.on('connection', function (socket) {
        const sessao = socket.request.session;

        if (!sessao || !sessao.autorizado || !sessao.usuario) {
            socket.emit('chat:erro', { msg: 'Faça login para usar o chat.' });
            socket.disconnect(true);
            return;
        }

        const usuario = {
            usuario: String(sessao.usuario),
            nome: sessao.nome || sessao.usuario,
            casa: sessao.casa || 'stark'
        };

        let registro = online.get(usuario.usuario);
        if (!registro) {
            registro = {
                usuario: usuario.usuario,
                nome: usuario.nome,
                casa: usuario.casa,
                sockets: new Set()
            };
            online.set(usuario.usuario, registro);
        }
        registro.sockets.add(socket.id);

        socket.data.chatUsuario = usuario.usuario;
        socket.data.ultimaMensagem = 0;

        socket.emit('chat:estado', {
            usuario: usuario.usuario,
            online: listarOnline(),
            historico: historico
        });
        io.emit('chat:online', { online: listarOnline() });

        socket.on('chat:mensagem', function (dados) {
            const agora = Date.now();
            if (agora - socket.data.ultimaMensagem < INTERVALO_MINIMO) {
                socket.emit('chat:erro', { msg: 'Espere um instante antes de enviar outra mensagem.' });
                return;
            }

            const texto = dados && typeof dados.texto === 'string' ? dados.texto.trim() : '';
            if (!texto) {
                return;
            }
            if (texto.length > TAMANHO_MAXIMO) {
                socket.emit('chat:erro', { msg: 'A mensagem deve ter no máximo 500 caracteres.' });
                return;
            }

            socket.data.ultimaMensagem = agora;

            const mensagem = {
                id: randomUUID(),
                usuario: usuario.usuario,
                nome: usuario.nome,
                casa: usuario.casa,
                texto: texto,
                enviadaEm: agora
            };

            historico.push(mensagem);
            if (historico.length > LIMITE_HISTORICO) {
                historico.shift();
            }

            io.emit('chat:mensagem', mensagem);
        });

        socket.on('disconnect', function () {
            const atual = online.get(usuario.usuario);
            if (!atual) {
                return;
            }

            atual.sockets.delete(socket.id);
            if (atual.sockets.size === 0) {
                online.delete(usuario.usuario);
            }

            io.emit('chat:online', { online: listarOnline() });
        });
    });
}

module.exports = iniciarChat;
