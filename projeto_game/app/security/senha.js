const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const PARAMETROS = {
    N: 16384,
    r: 8,
    p: 1,
    tamanhoChave: 64,
    tamanhoSalt: 16,
    maxmem: 64 * 1024 * 1024
};

function senhaValida(senha) {
    return typeof senha === 'string' && senha.length > 0 && senha.length <= 1024;
}

function compararHex(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
        return false;
    }
    const bufferA = Buffer.from(a, 'hex');
    const bufferB = Buffer.from(b, 'hex');
    if (bufferA.length !== bufferB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufferA, bufferB);
}

function ehMd5Legado(valor) {
    return typeof valor === 'string' && /^[a-f0-9]{32}$/i.test(valor);
}

function gerarSenhaTemporaria() {
    return crypto.randomBytes(12).toString('base64url');
}

async function hashSenha(senha) {
    if (!senhaValida(senha)) {
        throw new Error('Senha inválida.');
    }

    const salt = crypto.randomBytes(PARAMETROS.tamanhoSalt).toString('hex');
    const derivada = await scrypt(senha, salt, PARAMETROS.tamanhoChave, {
        N: PARAMETROS.N,
        r: PARAMETROS.r,
        p: PARAMETROS.p,
        maxmem: PARAMETROS.maxmem
    });

    return [
        'scrypt',
        PARAMETROS.N,
        PARAMETROS.r,
        PARAMETROS.p,
        salt,
        derivada.toString('hex')
    ].join('$');
}

async function verificarSenha(senha, armazenada) {
    if (!senhaValida(senha) || typeof armazenada !== 'string' || !armazenada) {
        return { valida: false, precisaRehash: false, legado: false };
    }

    /* compatibilidade temporária com usuários antigos em MD5 */
    if (ehMd5Legado(armazenada)) {
        const hashMd5 = crypto.createHash('md5').update(senha).digest('hex');
        const valida = compararHex(hashMd5, armazenada);
        return {
            valida: valida,
            precisaRehash: valida,
            legado: true
        };
    }

    const partes = armazenada.split('$');
    if (partes.length !== 6 || partes[0] !== 'scrypt') {
        return { valida: false, precisaRehash: false, legado: false };
    }

    const N = Number(partes[1]);
    const r = Number(partes[2]);
    const p = Number(partes[3]);
    const salt = partes[4];
    const hashEsperado = partes[5];

    if (!Number.isInteger(N) || N < 16384 || N > 1048576 ||
        !Number.isInteger(r) || r < 1 || r > 32 ||
        !Number.isInteger(p) || p < 1 || p > 16 ||
        !/^[a-f0-9]{16,128}$/i.test(salt) ||
        !/^[a-f0-9]{32,256}$/i.test(hashEsperado)) {
        return { valida: false, precisaRehash: false, legado: false };
    }

    try {
        const derivada = await scrypt(senha, salt, hashEsperado.length / 2, {
            N: N,
            r: r,
            p: p,
            maxmem: PARAMETROS.maxmem
        });
        const valida = compararHex(derivada.toString('hex'), hashEsperado);
        return { valida: valida, precisaRehash: false, legado: false };
    } catch (erro) {
        return { valida: false, precisaRehash: false, legado: false };
    }
}

module.exports = {
    hashSenha,
    verificarSenha,
    ehMd5Legado,
    gerarSenhaTemporaria
};
