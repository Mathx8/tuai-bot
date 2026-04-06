const cron = require('node-cron');
const { buscarJogos } = require('./scraper');

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
        try {
            const jogos = await buscarJogos();
            console.log(`[Cron] ${jogos.length} jogo(s) encontrado(s).`);
        } catch (err) {
            console.error('[Cron] Falha ao buscar jogos:', err.message);
        }
    });

    console.log(`[Cron] Agendado com intervalo: "${intervalo}"`);
}

module.exports = { iniciarCron };