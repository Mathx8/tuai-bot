const cron = require('node-cron');
const { buscarJogos } = require('./scraper');
const { buscarJogosBasquete } = require('./scraperBasquete');

/**
 * Inicia o agendamento — atualmente apenas loga os jogos encontrados.
 * Expanda esta função para adicionar notificações futuras se necessário.
 * @param {import('discord.js').Client} client
 */
function iniciarCron(client) {
    const intervalo = process.env.CRON_INTERVAL || '0 8 * * *';

    if (!cron.validate(intervalo)) {
        console.error(`[Cron] Expressão inválida: "${intervalo}".`);
        return;
    }

    cron.schedule(intervalo, async () => {
        console.log('[Cron] Verificando jogos do dia...');

        const [futebol, basquete] = await Promise.allSettled([
            buscarJogos(),
            buscarJogosBasquete(),
        ]);

        if (futebol.status === 'fulfilled') {
            console.log(`[Cron] Futebol: ${futebol.value.length} jogo(s) encontrado(s).`);
        } else {
            console.error('[Cron] Falha ao buscar jogos de futebol:', futebol.reason?.message);
        }

        if (basquete.status === 'fulfilled') {
            console.log(`[Cron] Basquete: ${basquete.value.length} jogo(s) encontrado(s).`);
        } else {
            console.error('[Cron] Falha ao buscar jogos de basquete:', basquete.reason?.message);
        }
    });

    console.log(`[Cron] Agendado com intervalo: "${intervalo}"`);
}

module.exports = { iniciarCron };