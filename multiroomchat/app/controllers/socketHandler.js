const apelidosParticipantes = [];

function adicionarApelido(apelido) {
    if (apelidosParticipantes.includes(apelido)) {
        return false;
    }
    apelidosParticipantes.push(apelido);
    return true;
}


module.exports = function (io) {
    io.on('connection', function (socket) {
        console.log('usuario conectou');

        socket.on('disconnect', function () {
            console.log('usuario desconectou');
        });

        socket.on('msgParaServidor', function (data) {
            adicionarApelido(data.apelido);

            io.emit('participantesParaCliente', {
                apelido: data.apelido,
                apelidosParticipantes
            });

            socket.emit('msgParaCliente', {
                apelido: data.apelido,
                mensagem: data.mensagem
            });

            socket.broadcast.emit('msgParaCliente', {
                apelido: data.apelido,
                mensagem: data.mensagem
            });


        });


        socket.on('logout', function (data) {
            const index = apelidosParticipantes.indexOf(data.apelido);
            if (index !== -1) {
                apelidosParticipantes.splice(index, 1);
                console.log(`${data.apelido} saiu do chat`);
            }

            io.emit('participantesParaCliente', {
                apelido: data.apelido,
                apelidosParticipantes
            });

            io.emit('msgParaCliente', {
                apelido: data.apelido,
                mensagem: 'saiu do chat',
                apelidosParticipantes
            });
        });

    });
};

module.exports.apelidosParticipantes = apelidosParticipantes;
module.exports.adicionarApelido = adicionarApelido;

