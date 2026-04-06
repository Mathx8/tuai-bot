const axios = require('axios');
const cheerio = require('cheerio');

const URL_JOGOS = 'https://mantosdofutebol.com.br/guia-de-jogos-tv-hoje-ao-vivo/';

/**
 * @typedef {Object} Jogo
 * @property {string} horario
 * @property {string} confronto
 * @property {string} campeonato
 * @property {string} canal
 */

function normalizar(str) {
    return str
        .normalize('NFD')               // decompõe "á" em "a" + acento
        .replace(/[\u0300-\u036f]/g, '') // remove os acentos
        .toLowerCase();
}

/**
 * Busca os jogos do dia no site Mantos do Futebol.
 * @returns {Promise<Jogo[]>}
 */
async function buscarJogos() {
    const { data } = await axios.get(URL_JOGOS, {
        timeout: 10_000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)' },
    });

    const $ = cheerio.load(data);

    const linhas = $('body')
        .text()
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const jogos = [];

    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];

        const isJogo =
            linha.includes(' x ') &&
            (linha.match(/\d{1,2}h\d{0,2}/) || linha.match(/\d{2}:\d{2}/));

        if (!isJogo) continue;

        const partes = linha.split('–').map((p) => p.trim());
        const horario = partes[0] ?? '';
        const confronto = partes[1] ?? '';
        const campeonato = partes[2] ?? '';

        const proximaLinha = linhas[i + 1] ?? '';
        const canal = proximaLinha.includes('Canais')
            ? proximaLinha.replace('Canais:', '').trim()
            : '';

        jogos.push({ horario, confronto, campeonato, canal });
    }

    return jogos;
}

module.exports = { buscarJogos, normalizar };