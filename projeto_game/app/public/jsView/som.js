(function () {
    const CHAVE = 'got-som-ativo';
    let ctx = null;
    let somAtivo = false;
    let ambiente = null;
    let botao = null;

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

    function ruido(duracao, volume) {
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
        filtro.frequency.value = 900;
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

    function alternar() {
        somAtivo = !somAtivo;
        salvar();
        if (somAtivo) {
            iniciarAmbiente();
            tom(520, 0, 0.08, 'triangle', 0.04);
        } else {
            pararAmbiente();
        }
        atualizarBotao();
    }

    function aoPrimeiroGesto() {
        if (somAtivo) {
            iniciarAmbiente();
        }
    }

    window.SomJogo = {
        estaAtivo: function () { return somAtivo; },

        alternar: alternar,

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
