module.exports = function (io) {
    const apelidosParticipantes = [];

    io.on('connection', function (socket) {
        console.log('usuario conectou');

        socket.on('disconnect', function () {
            console.log('usuario desconectou');
        });

        socket.on('msgParaServidor', function (data) {
            if (!apelidosParticipantes.includes(data.apelido)) {
                apelidosParticipantes.push(data.apelido);
            }

            socket.emit('msgParaCliente', {
                apelido: data.apelido,
                mensagem: data.mensagem
            });

            socket.broadcast.emit('msgParaCliente', {
                apelido: data.apelido,
                mensagem: data.mensagem
            });

            io.emit('participantesParaCliente', {
                apelido: data.apelido,
                apelidosParticipantes
            });
        });
    });
};