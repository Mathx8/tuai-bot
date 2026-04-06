// src/canais.js

const BASE = 'https://meuplayeronlinehd.com/myplay/watch.html?id=';

/**
 * Canais que NÃO devem ter link (gratuitos, sem stream, etc.)
 * A checagem é feita por substring em lowercase.
 */
const SEM_LINK = ['youtube', 'sportynet'];

/**
 * Mapeamento canal → um ou mais IDs do player.
 * A chave é uma substring do nome do canal em lowercase.
 * O valor é um array de { label, id }.
 */
const MAPA = [
    { match: 'sportv 1', links: [{ label: 'SporTV 1', id: 'sportv' }] },
    { match: 'sportv 2', links: [{ label: 'SporTV 2', id: 'sportv2' }] },
    { match: 'sportv 3', links: [{ label: 'SporTV 3', id: 'sportv3' }] },
    { match: 'sportv', links: [{ label: 'SporTV', id: 'sportv' }] },
    { match: 'espn 1', links: [{ label: 'ESPN 1', id: 'espn' }] },
    { match: 'espn 2', links: [{ label: 'ESPN 2', id: 'espn2' }] },
    { match: 'espn 3', links: [{ label: 'ESPN 3', id: 'espn3' }] },
    { match: 'espn 4', links: [{ label: 'ESPN 4', id: 'espn4' }] },
    { match: 'espn', links: [{ label: 'ESPN', id: 'espn' }] },
    { match: 'tnt', links: [{ label: 'TNT', id: 'tnt' }] },
    { match: 'tnt sports', links: [{ label: 'TNT Sports', id: 'tnt' }] },
    {
        match: 'disney+', links: [{ label: 'Disney+ 1', id: 'ds1' },
        { label: 'Disney+ 2', id: 'ds2' }]
    },
    {
        match: 'disney plus', links: [{ label: 'Disney+ 1', id: 'ds1' },
        { label: 'Disney+ 2', id: 'ds2' }]
    },
    {
        match: 'star+', links: [{ label: 'Star+ 1', id: 'starplus' },
        { label: 'Star+ 2', id: 'starplus2' }]
    },
    {
        match: 'star plus', links: [{ label: 'Star+ 1', id: 'starplus' },
        { label: 'Star+ 2', id: 'starplus2' }]
    },
    { match: 'paramount', links: [{ label: 'Paramount+', id: 'paramount1' }] },
    { match: 'prime video', links: [{ label: 'Prime Video', id: 'amazon' }] },
];

/**
 * Recebe a string bruta do campo canal e retorna os links formatados para o Discord.
 * Canais sem mapeamento mostram só o nome, sem link.
 *
 * @param {string} canalRaw  - valor bruto do campo canal (ex: "SporTV 2, ESPN 1")
 * @returns {string}         - string pronta para embed (com markdown de links)
 */
function formatarCanais(canalRaw) {
    if (!canalRaw) return 'Não informado';

    // O campo pode ter múltiplos canais separados por vírgula
    const nomes = canalRaw.split(',').map((c) => c.trim()).filter(Boolean);

    const partes = nomes.flatMap((nome) => {
        const lower = nome.toLowerCase();

        // Canais sem link
        if (SEM_LINK.some((s) => lower.includes(s))) return [nome];

        // Busca no mapa (mais específico primeiro — ordem do array importa)
        const entrada = MAPA.find((m) => lower.includes(m.match));
        if (!entrada) return [nome]; // sem mapeamento → exibe só o nome

        return entrada.links.map((l) => `[${l.label}](${BASE}${l.id})`);
    });

    return partes.join('  •  ');
}

module.exports = { formatarCanais };