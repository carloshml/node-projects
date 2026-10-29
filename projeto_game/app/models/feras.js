/* Feras disponíveis para a ordem "matar a fera".
   Cada aldeão contribui com PODER_ALDEAO pontos de ataque. */
const PODER_ALDEAO = 5;

const FERAS = [
    {
        id: 'lobo',
        nome: 'Lobo Gigante',
        artigo: 'o',
        vida: 20,
        recompensa: 100,
        imagem: 'lobo.svg',
        descricao: 'Ronda as florestas ao norte; rápido e faminto.'
    },
    {
        id: 'urso',
        nome: 'Urso-Sombra',
        artigo: 'o',
        vida: 30,
        recompensa: 160,
        imagem: 'urso.svg',
        descricao: 'Criatura das cavernas, resistente e brutal.'
    },
    {
        id: 'serpente',
        nome: 'Serpente Marinha',
        artigo: 'a',
        vida: 35,
        recompensa: 200,
        imagem: 'serpente.svg',
        descricao: 'Ataca das águas profundas, sem fazer barulho.'
    },
    {
        id: 'kraken',
        nome: 'Kraken',
        artigo: 'o',
        vida: 40,
        recompensa: 240,
        imagem: 'kraken.svg',
        descricao: 'Tentáculos capazes de afundar navios inteiros.'
    },
    {
        id: 'dragao',
        nome: 'Dragão',
        artigo: 'o',
        vida: 50,
        recompensa: 300,
        imagem: 'dragao.svg',
        descricao: 'O troféu definitivo; exige quase todos os seus aldeões.'
    }
];

FERAS.forEach(function (fera) {
    fera.minimo = Math.ceil(fera.vida / PODER_ALDEAO);
});

function obterFera(id) {
    return FERAS.find(function (fera) {
        return fera.id === id;
    }) || null;
}

module.exports = {
    FERAS: FERAS,
    PODER_ALDEAO: PODER_ALDEAO,
    obterFera: obterFera
};
