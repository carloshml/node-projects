(function () {
    const CHAVE = 'got-som-ativo';
    const CHAVE_GUERREIRO = 'got-som-guerreiro';
    const CHAVE_FERA = 'got-som-fera';
    let ctx = null;
    let somAtivo = false;
    let ambiente = null;
    let botao = null;
    let batalhaAtiva = false;
    let batalhaTimer = null;
    let turnoBatalha = 'guerreiro';

    const GUERREIROS = [
        { id: 'trompa', nome: 'Trompa de guerra', descricao: 'Chamado grave de corneta' },
        { id: 'tambores', nome: 'Tambores de marcha', descricao: 'Batida pesada e cadente' },
        { id: 'grito', nome: 'Grito de batalha', descricao: 'Vozes e ruído de investida' },
        { id: 'acos', nome: 'Aço e escudos', descricao: 'Metal, impacto e clangor' }
    ];

    const FERAS = [
        { id: 'rugido', nome: 'Rugido grave', descricao: 'Grunhido profundo e ameaçador' },
        { id: 'rosnado', nome: 'Rosnado', descricao: 'Ameaça baixa e gutural' },
        { id: 'bramido', nome: 'Bramido selvagem', descricao: 'Urro longo e feroz' },
        { id: 'sibilo', nome: 'Sibilo agudo', descricao: 'Assobio e grito estridente' }
    ];

    function lerEscolha(chave, opcoes, padrao) {
        try {
            const salvo = localStorage.getItem(chave);
            return opcoes.some(function (opcao) { return opcao.id === salvo; }) ? salvo : padrao;
        } catch (erro) {
            return padrao;
        }
    }

    let guerreiroSelecionado = lerEscolha(CHAVE_GUERREIRO, GUERREIROS, GUERREIROS[0].id);
    let feraSelecionada = lerEscolha(CHAVE_FERA, FERAS, FERAS[0].id);

    try {
        const salvo = localStorage.getItem(CHAVE);
        somAtivo = salvo === null ? true : salvo === '1';
    } catch (erro) {
        somAtivo = true;
    }

    function garantirContexto() {
        if (!ctx) {
            const AudioContexto = window.AudioContext || window.webkitAudioContext;
            if (!AudioContexto) {
                return null;
            }
            ctx = new AudioContexto();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    function tom(frequencia, atraso, duracao, tipo, volume) {
        const c = garantirContexto();
        if (!c) {
            return;
        }
        const inicio = c.currentTime + (atraso || 0);
        const osc = c.createOscillator();
        const ganho = c.createGain();
        osc.type = tipo || 'sine';
        osc.frequency.setValueAtTime(frequencia, inicio);
        ganho.gain.setValueAtTime(0.0001, inicio);
        ganho.gain.exponentialRampToValueAtTime(volume || 0.05, inicio + 0.015);
        ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
        osc.connect(ganho);
        ganho.connect(c.destination);
        osc.start(inicio);
        osc.stop(inicio + duracao + 0.03);
    }

    function ruido(duracao, volume, frequencia) {
        const c = garantirContexto();
        if (!c) {
            return;
        }
        const tamanho = Math.floor(c.sampleRate * duracao);
        const buffer = c.createBuffer(1, tamanho, c.sampleRate);
        const dados = buffer.getChannelData(0);
        for (let i = 0; i < tamanho; i++) {
            dados[i] = (Math.random() * 2 - 1) * (1 - i / tamanho);
        }
        const fonte = c.createBufferSource();
        const ganho = c.createGain();
        const filtro = c.createBiquadFilter();
        fonte.buffer = buffer;
        filtro.type = 'lowpass';
        filtro.frequency.value = frequencia || 900;
        ganho.gain.value = volume || 0.05;
        fonte.connect(filtro);
        filtro.connect(ganho);
        ganho.connect(c.destination);
        fonte.start();
    }

    function iniciarAmbiente() {
        if (ambiente || !somAtivo) {
            return;
        }
        const c = garantirContexto();
        if (!c) {
            return;
        }

        const master = c.createGain();
        master.gain.value = 0.018;

        const osc1 = c.createOscillator();
        const osc2 = c.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = 55;
        osc2.frequency.value = 82.5;

        const g1 = c.createGain();
        const g2 = c.createGain();
        g1.gain.value = 0.5;
        g2.gain.value = 0.22;
        osc1.connect(g1);
        osc2.connect(g2);
        g1.connect(master);
        g2.connect(master);

        const tamanho = Math.floor(c.sampleRate * 2);
        const buffer = c.createBuffer(1, tamanho, c.sampleRate);
        const dados = buffer.getChannelData(0);
        let anterior = 0;
        for (let i = 0; i < tamanho; i++) {
            const branco = Math.random() * 2 - 1;
            anterior = (anterior + 0.02 * branco) / 1.02;
            dados[i] = anterior * 3;
        }
        const fonteRuido = c.createBufferSource();
        fonteRuido.buffer = buffer;
        fonteRuido.loop = true;
        const filtro = c.createBiquadFilter();
        filtro.type = 'lowpass';
        filtro.frequency.value = 260;
        const ganhoRuido = c.createGain();
        ganhoRuido.gain.value = 0.12;
        fonteRuido.connect(filtro);
        filtro.connect(ganhoRuido);
        ganhoRuido.connect(master);

        master.connect(c.destination);
        osc1.start();
        osc2.start();
        fonteRuido.start();

        ambiente = { master: master, osc1: osc1, osc2: osc2, ruido: fonteRuido };
    }

    function pararAmbiente() {
        if (!ambiente) {
            return;
        }
        try {
            ambiente.osc1.stop();
            ambiente.osc2.stop();
            ambiente.ruido.stop();
        } catch (erro) {
            /* já parados */
        }
        ambiente = null;
    }

    function atualizarBotao() {
        if (!botao) {
            return;
        }
        botao.textContent = 'Som: ' + (somAtivo ? 'on' : 'off');
        botao.setAttribute('aria-pressed', somAtivo ? 'true' : 'false');
        botao.classList.toggle('btn-outline-success', somAtivo);
        botao.classList.toggle('btn-outline-secondary', !somAtivo);
    }

    function salvar() {
        try {
            localStorage.setItem(CHAVE, somAtivo ? '1' : '0');
        } catch (erro) {
            /* armazenamento indisponível */
        }
    }

    function salvarEscolha(chave, valor) {
        try {
            localStorage.setItem(chave, valor);
        } catch (erro) {
            /* armazenamento indisponível */
        }
    }

    function tocarGuerreiro(id) {
        if (!somAtivo) {
            return;
        }
        switch (id) {
            case 'tambores':
                tom(80, 0, 0.16, 'sine', 0.075);
                ruido(0.08, 0.035, 320);
                tom(80, 0.27, 0.16, 'sine', 0.075);
                ruido(0.08, 0.035, 320);
                tom(80, 0.54, 0.22, 'sine', 0.08);
                ruido(0.12, 0.04, 280);
                break;
            case 'grito':
                ruido(0.52, 0.05, 1100);
                tom(220, 0, 0.28, 'sawtooth', 0.032);
                tom(330, 0.12, 0.38, 'sawtooth', 0.028);
                break;
            case 'acos':
                ruido(0.1, 0.05, 3200);
                tom(1250, 0, 0.1, 'square', 0.022);
                tom(1680, 0.09, 0.14, 'square', 0.02);
                ruido(0.12, 0.03, 2100);
                break;
            case 'trompa':
            default:
                tom(110, 0, 0.4, 'sawtooth', 0.045);
                tom(146.83, 0.16, 0.48, 'sawtooth', 0.038);
                tom(220, 0.34, 0.5, 'triangle', 0.032);
                break;
        }
    }

    function tocarFera(id) {
        if (!somAtivo) {
            return;
        }
        switch (id) {
            case 'rosnado':
                ruido(0.85, 0.05, 700);
                tom(85, 0, 0.75, 'square', 0.03);
                tom(110, 0.24, 0.6, 'sawtooth', 0.02);
                break;
            case 'bramido':
                tom(90, 0, 0.85, 'sawtooth', 0.045);
                tom(140, 0.18, 0.85, 'sawtooth', 0.04);
                ruido(0.55, 0.03, 600);
                break;
            case 'sibilo':
                ruido(0.9, 0.045, 2600);
                tom(420, 0, 0.42, 'sawtooth', 0.02);
                tom(300, 0.28, 0.55, 'sawtooth', 0.018);
                break;
            case 'rugido':
            default:
                tom(65, 0, 1.05, 'sawtooth', 0.05);
                tom(48, 0.15, 1.05, 'sine', 0.045);
                ruido(0.65, 0.035, 450);
                break;
        }
    }

    function notificarBatalha(quem) {
        try {
            window.dispatchEvent(new CustomEvent('batalha-som', {
                detail: { quem: quem }
            }));
        } catch (erro) {
            /* navegador sem CustomEvent */
        }
    }

    function passoBatalha() {
        if (!batalhaAtiva) {
            return;
        }
        if (!somAtivo) {
            pararBatalha();
            return;
        }

        const quem = turnoBatalha;
        if (quem === 'guerreiro') {
            tocarGuerreiro(guerreiroSelecionado);
        } else {
            tocarFera(feraSelecionada);
        }
        notificarBatalha(quem);

        turnoBatalha = quem === 'guerreiro' ? 'fera' : 'guerreiro';
        batalhaTimer = setTimeout(passoBatalha, quem === 'guerreiro' ? 1850 : 2150);
    }

    function iniciarBatalha() {
        if (batalhaAtiva || !somAtivo) {
            return;
        }
        batalhaAtiva = true;
        turnoBatalha = 'guerreiro';
        passoBatalha();
    }

    function pararBatalha() {
        batalhaAtiva = false;
        if (batalhaTimer) {
            clearTimeout(batalhaTimer);
            batalhaTimer = null;
        }
    }

    function alternar() {
        somAtivo = !somAtivo;
        salvar();
        if (somAtivo) {
            iniciarAmbiente();
            tom(520, 0, 0.08, 'triangle', 0.04);
        } else {
            pararBatalha();
            pararAmbiente();
        }
        atualizarBotao();
        try {
            window.dispatchEvent(new CustomEvent('som-jogo-alterado', {
                detail: { ativo: somAtivo }
            }));
        } catch (erro) {
            /* navegador sem CustomEvent */
        }
    }

    function aoPrimeiroGesto() {
        if (somAtivo) {
            iniciarAmbiente();
        }
    }

    window.SomJogo = {
        estaAtivo: function () { return somAtivo; },

        alternar: alternar,

        opcoesGuerreiros: function () {
            return GUERREIROS.map(function (opcao) { return Object.assign({}, opcao); });
        },

        opcoesFeras: function () {
            return FERAS.map(function (opcao) { return Object.assign({}, opcao); });
        },

        guerreiroSelecionado: function () {
            return guerreiroSelecionado;
        },

        feraSelecionada: function () {
            return feraSelecionada;
        },

        selecionarGuerreiro: function (id) {
            const existe = GUERREIROS.some(function (opcao) { return opcao.id === id; });
            if (existe) {
                guerreiroSelecionado = id;
                salvarEscolha(CHAVE_GUERREIRO, id);
            }
        },

        selecionarFera: function (id) {
            const existe = FERAS.some(function (opcao) { return opcao.id === id; });
            if (existe) {
                feraSelecionada = id;
                salvarEscolha(CHAVE_FERA, id);
            }
        },

        previaGuerreiro: function (id) {
            if (!somAtivo) {
                return false;
            }
            tocarGuerreiro(id);
            return true;
        },

        previaFera: function (id) {
            if (!somAtivo) {
                return false;
            }
            tocarFera(id);
            return true;
        },

        iniciarBatalha: iniciarBatalha,

        pararBatalha: pararBatalha,

        estaEmBatalha: function () {
            return batalhaAtiva;
        },

        clique: function () {
            if (somAtivo) {
                tom(380, 0, 0.05, 'square', 0.025);
            }
        },

        moeda: function () {
            if (!somAtivo) {
                return;
            }
            tom(1180, 0, 0.08, 'sine', 0.05);
            tom(1620, 0.07, 0.1, 'sine', 0.04);
        },

        batalha: function () {
            if (!somAtivo) {
                return;
            }
            ruido(0.18, 0.07);
            tom(85, 0.02, 0.22, 'triangle', 0.06);
        },

        vitoria: function () {
            if (!somAtivo) {
                return;
            }
            tom(523.25, 0, 0.16, 'triangle', 0.05);
            tom(659.25, 0.12, 0.16, 'triangle', 0.05);
            tom(783.99, 0.24, 0.2, 'triangle', 0.05);
            tom(1046.5, 0.4, 0.35, 'sine', 0.05);
        },

        derrota: function () {
            if (!somAtivo) {
                return;
            }
            tom(392, 0, 0.18, 'sawtooth', 0.035);
            tom(329.63, 0.16, 0.22, 'sawtooth', 0.035);
            tom(261.63, 0.36, 0.4, 'sine', 0.04);
        },

        ordem: function () {
            if (!somAtivo) {
                return;
            }
            /* sequência marcial de ~4s, grave e sem notas alegres */
            tom(73.42, 0, 3.8, 'sine', 0.03);          // drone grave
            tom(73.42, 0, 0.25, 'sine', 0.06);         // tambor
            tom(146.83, 0, 0.35, 'triangle', 0.05);    // D3
            tom(174.61, 0.45, 0.35, 'triangle', 0.05); // F3
            tom(110, 0.95, 0.5, 'sine', 0.055);        // A2
            tom(73.42, 1.1, 0.25, 'sine', 0.06);       // tambor
            tom(146.83, 1.8, 0.35, 'triangle', 0.05);  // D3
            tom(174.61, 2.25, 0.35, 'triangle', 0.05); // F3
            tom(73.42, 2.1, 0.25, 'sine', 0.06);       // tambor
            tom(110, 2.75, 0.9, 'sine', 0.055);        // A2
            tom(73.42, 3.1, 0.3, 'sine', 0.06);        // tambor final
            ruido(0.08, 0.02);
        },

        conclusao: function () {
            if (!somAtivo) {
                return;
            }
            tom(1046.5, 0, 0.12, 'sine', 0.05);
            tom(1318.5, 0.13, 0.16, 'sine', 0.05);
            tom(1568, 0.3, 0.38, 'sine', 0.045);
        },

        recompensa: function () {
            if (!somAtivo) {
                return;
            }
            tom(880, 0, 0.1, 'sine', 0.04);
            tom(1174.66, 0.09, 0.14, 'sine', 0.04);
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        botao = document.getElementById('btn-som');
        atualizarBotao();

        if (botao) {
            botao.addEventListener('click', alternar);
        }

        if (somAtivo) {
            document.addEventListener('pointerdown', aoPrimeiroGesto, { once: true });
            document.addEventListener('keydown', aoPrimeiroGesto, { once: true });
        }
    });
})();
