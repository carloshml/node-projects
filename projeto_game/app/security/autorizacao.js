const env = require('../../config/env');

function ehAdminUsuario(usuario) {
    if (!usuario) {
        return false;
    }
    return env.adminUsers.indexOf(String(usuario)) !== -1;
}

function papelDoUsuario(conta) {
    if (!conta) {
        return 'jogador';
    }
    if (conta.papel === 'admin' || ehAdminUsuario(conta.usuario)) {
        return 'admin';
    }
    return 'jogador';
}

function ehAdmin(req) {
    if (!req.session || !req.session.autorizado) {
        return false;
    }
    return req.session.papel === 'admin' || ehAdminUsuario(req.session.usuario);
}

module.exports = {
    ehAdminUsuario,
    papelDoUsuario,
    ehAdmin
};
