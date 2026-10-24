const axios = require('axios');

const URL_LUTA = 'https://www.jogosdehojenatv.com.br/esporte/combate';
const FUSO = 'America/Sao_Paulo';

const fmtData = new Intl.DateTimeFormat('sv-SE', { timeZone: FUSO });
const fmtHora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
});

/**
 * @typedef {Object} JogoLuta
 * @property {string} horario
 * @property {string} confronto
 * @property {string} campeonato
 * @property {string} canal
 */

function extrairObjeto(texto, inicio) {
    let nivel = 0;
    let emString = false;
    let escape = false;

    for (let i = inicio; i < texto.length; i++) {
        const c = texto[i];

        if (emString) {
            if (escape) escape = false;
            else if (c === '\\') escape = true;
            else if (c === '"') emString = false;
            continue;
        }

        if (c === '"') emString = true;
        else if (c === '{') nivel++;
        else if (c === '}') {
            nivel--;
            if (nivel === 0) return texto.slice(inicio, i + 1);
        }
    }
    return null;
}

function extrairSnapshot(html) {
    const texto = html.replace(/\\"/g, '"');
    const chave = '"snapshot":';

    let pos = texto.indexOf(chave);
    while (pos !== -1) {
        const inicio = texto.indexOf('{', pos);
        if (inicio !== -1) {
            const bruto = extrairObjeto(texto, inicio);
            if (bruto) {
                try {
                    const snap = JSON.parse(bruto);
                    if (snap?.data) return snap;
                } catch (_) { /* tenta a próxima ocorrência */ }
            }
        }
        pos = texto.indexOf(chave, pos + chave.length);
    }
    return null;
}

/**
 * Jogos de luta de HOJE (fuso de São Paulo).
 * @returns {Promise<JogoLuta[]>}
 */

async function buscarJogosLuta() {
    const { data } = await axios.get(URL_LUTA, {
        timeout: 10_000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)' },
    });

    const snapshot = extrairSnapshot(String(data));
    if (!snapshot) {
        throw new Error('Não foi possível extrair o snapshot da página de luta.');
    }

    const hoje = fmtData.format(new Date());
    const vistos = new Set();
    const jogos = [];

    for (const dia of Object.values(snapshot.data)) {
        for (const f of dia?.newFixtures ?? []) {
            if (vistos.has(f.fixture_id)) continue;

            const quando = new Date(f.date);
            if (Number.isNaN(quando.getTime())) continue;
            if (fmtData.format(quando) !== hoje) continue;

            vistos.add(f.fixture_id);

            jogos.push({
                _ts: quando.getTime(),
                horario: fmtHora.format(quando),
                confronto: String(f.title || `${f.home_team} - ${f.visiting_team}`).replace(' - ', ' x '),
                campeonato: f.league || '',
                canal: (f.channels ?? []).map((c) => c.shortname || c.name).join(', '),
            });
        }
    }

    return jogos
        .sort((a, b) => a._ts - b._ts)
        .map(({ _ts, ...jogo }) => jogo);
}

module.exports = { buscarJogosLuta };