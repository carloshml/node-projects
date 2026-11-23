const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
    path: path.resolve(__dirname, '..', '.env'),
    quiet: true
});

function obrigatorio(nome) {
    const valor = process.env[nome];
    if (!valor || !String(valor).trim()) {
        throw new Error('Variável de ambiente obrigatória ausente: ' + nome);
    }
    return String(valor).trim();
}

const sessionSecret = obrigatorio('SESSION_SECRET');
if (sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET deve ter pelo menos 32 caracteres.');
}

const port = Number(process.env.PORT) || 8200;
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT inválida.');
}

const adminUsers = String(process.env.ADMIN_USERS || '')
    .split(',')
    .map(function (usuario) { return usuario.trim(); })
    .filter(Boolean);

module.exports = Object.freeze({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: port,
    mongoUri: obrigatorio('MONGODB_URI'),
    mongoDb: process.env.MONGODB_DB || 'got',
    sessionSecret: sessionSecret,
    sessionName: process.env.SESSION_NAME || 'got.sid',
    sessionMaxAge: 7 * 24 * 60 * 60 * 1000,
    secureCookie: process.env.NODE_ENV === 'production',
    adminUsers: adminUsers
});
