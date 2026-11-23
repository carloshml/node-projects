const MISSOES = [
    {
        tipo: 'coleta',
        titulo: 'Provisões para o inverno',
        descricao: 'Conclua 2 ordens de coleta de recursos.',
        alvo: 2,
        recompensa: { moeda: 300 }
    },
    {
        tipo: 'caca',
        titulo: 'A fera do dia',
        descricao: 'Vença 2 caçadas contra feras.',
        alvo: 2,
        recompensa: { moeda: 500 }
    },
    {
        tipo: 'treino',
        titulo: 'Mentes afiadas',
        descricao: 'Conclua 2 treinamentos de história ou magia.',
        alvo: 2,
        recompensa: { moeda: 250, sabedoria: 10 }
    },
    {
        tipo: 'campeao',
        titulo: 'Orgulho da casa',
        descricao: 'Conclua 1 treinamento de campeão.',
        alvo: 1,
        recompensa: { moeda: 400, madeira: 20 }
    },
    {
        tipo: 'venda',
        titulo: 'Bom negócio',
        descricao: 'Venda 5 recursos no celeiro.',
        alvo: 5,
        recompensa: { moeda: 250, comida: 5 }
    }
];

const LABEL_RECOMPENSA = {
    moeda: 'moedas',
    madeira: 'madeira',
    comida: 'comida',
    ferro: 'ferro',
    temor: 'temor',
    sabedoria: 'sabedoria',
    magia: 'magia'
};

function dataHoje() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return hoje.getFullYear() + '-' + mes + '-' + dia;
}

function sortearMissao() {
    const modelo = MISSOES[Math.floor(Math.random() * MISSOES.length)];
    return {
        tipo: modelo.tipo,
        titulo: modelo.titulo,
        descricao: modelo.descricao,
        alvo: modelo.alvo,
        recompensa: Object.assign({}, modelo.recompensa)
    };
}

function incrementoDoEvento(missao, evento) {
    if (!missao || !evento) {
        return 0;
    }

    if (missao.tipo === 'venda') {
        return evento.tipo === 'venda' ? Number(evento.quantidade) || 0 : 0;
    }

    const acao = String(evento.acao);

    if (missao.tipo === 'coleta') {
        return acao === '1' ? 1 : 0;
    }
    if (missao.tipo === 'caca') {
        return acao === '5' && evento.vitoria === true ? 1 : 0;
    }
    if (missao.tipo === 'treino') {
        return acao === '3' || acao === '4' ? 1 : 0;
    }
    if (missao.tipo === 'campeao') {
        return acao === '6' ? 1 : 0;
    }

    return 0;
}

function incrementosRecompensa(recompensa) {
    const incrementos = {};
    Object.keys(recompensa || {}).forEach(function (campo) {
        const valor = Number(recompensa[campo]) || 0;
        if (valor <= 0) {
            return;
        }
        if (campo === 'moeda' || campo === 'temor' || campo === 'sabedoria' || campo === 'magia') {
            incrementos[campo] = valor;
        } else if (LABEL_RECOMPENSA[campo]) {
            incrementos['recursos.' + campo] = valor;
        }
    });
    return incrementos;
}

function descreverRecompensa(recompensa) {
    return Object.keys(recompensa || {}).map(function (campo) {
        return Number(recompensa[campo]) + ' ' + (LABEL_RECOMPENSA[campo] || campo);
    }).join(' · ');
}

module.exports = {
    MISSOES,
    dataHoje,
    sortearMissao,
    incrementoDoEvento,
    incrementosRecompensa,
    descreverRecompensa
};
