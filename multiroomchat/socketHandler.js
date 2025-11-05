const apelidosParticipantes = [];

function adicionarApelido(apelido) {
    if (!apelidosParticipantes.includes(apelido)) {
        apelidosParticipantes.push(apelido);
    }
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
    });
};

module.exports.apelidosParticipantes = apelidosParticipantes;
module.exports.adicionarApelido = adicionarApelido;

