const crypto = require('crypto');

const METODOS_PROTEGIDOS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const TAMANHO_TOKEN = 32;

function tokensIguais(recebido, esperado) {
    if (typeof recebido !== 'string' || typeof esperado !== 'string') {
        return false;
    }
    if (recebido.length !== esperado.length) {
        return false;
    }
    const bufferRecebido = Buffer.from(recebido, 'utf8');
    const bufferEsperado = Buffer.from(esperado, 'utf8');
    if (bufferRecebido.length !== bufferEsperado.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufferRecebido, bufferEsperado);
}

function csrfProtection(req, res, next) {
    if (!req.session) {
        return res.status(403).send('Sessão indisponível. Recarregue a página e tente novamente.');
    }

    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(TAMANHO_TOKEN).toString('hex');
    }

    res.locals.csrfToken = req.session.csrfToken;

    if (!METODOS_PROTEGIDOS.has(req.method)) {
        return next();
    }

    const recebido = (req.body && (req.body._csrf || req.body.csrfToken)) ||
        req.get('x-csrf-token') ||
        req.get('x-xsrf-token');

    if (!tokensIguais(recebido, req.session.csrfToken)) {
        if (req.is('application/json')) {
            return res.status(403).json({ ok: false, msg: 'csrfInvalido' });
        }
        return res.status(403).send('Requisição inválida ou sessão expirada. Recarregue a página e tente novamente.');
    }

    next();
}

module.exports = csrfProtection;
