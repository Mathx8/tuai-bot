const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { buscarJogos, normalizar } = require('./scraper');
const { formatarCanais } = require('./canais');

const PREFIX = process.env.PREFIX || '!';
const JOGOS_POR_PAGINA = 5;
const TIMEOUT_PAGINACAO = 60_000;

// ──────────────────────────────────────────
// Paleta de cores
// ──────────────────────────────────────────
const COR = {
    principal: 0x1db954,
    erro: 0xe53935,
    aviso: 0xffa726,
    info: 0x1e88e5,
    neutro: 0x455a64,
};

// ──────────────────────────────────────────
// Helpers de embed
// ──────────────────────────────────────────

function rodape(pagina, total) {
    const pag = total > 1 ? `  •  Página ${pagina}/${total}` : '';
    return { text: `⚽ TuaiSoccer  •  Dados: Mantos do Futebol${pag}` };
}

function embedErro(descricao) {
    return new EmbedBuilder()
        .setColor(COR.erro)
        .setDescription(`❌  ${descricao}`)
        .setFooter({ text: '⚽ TuaiSoccer  •  Dados: Mantos do Futebol' });
}

function embedAviso(descricao) {
    return new EmbedBuilder()
        .setColor(COR.aviso)
        .setDescription(`⚠️  ${descricao}`)
        .setFooter({ text: '⚽ TuaiSoccer  •  Dados: Mantos do Futebol' });
}

// ──────────────────────────────────────────
// Formatação de jogo
// ──────────────────────────────────────────

function jogoParaField(jogo) {
    return {
        name: `⚽  ${jogo.confronto || 'Confronto não informado'}`,
        value:
            `> ⏰ **Horário:** ${jogo.horario || '—'}\n` +
            `> 🏆 **Campeonato:** ${jogo.campeonato || '—'}\n` +
            `> 📺 **Canal:** ${formatarCanais(jogo.canal)}`,
        inline: false,
    };
}

// ──────────────────────────────────────────
// Monta embed de uma página
// ──────────────────────────────────────────

function montarEmbedJogos(jogos, filtro, pagina, totalPaginas) {
    const titulo = filtro
        ? `🔍  Jogos de hoje — ${filtro}`
        : '⚽  Jogos de Hoje';

    const fatia = jogos.slice(
        (pagina - 1) * JOGOS_POR_PAGINA,
        pagina * JOGOS_POR_PAGINA
    );

    return new EmbedBuilder()
        .setColor(COR.principal)
        .setTitle(titulo)
        .setDescription(
            `**${jogos.length}** jogo(s) encontrado(s)` +
            (filtro ? ` para **${filtro}**` : '')
        )
        .addFields(fatia.map(jogoParaField))
        .setFooter(rodape(pagina, totalPaginas))
        .setTimestamp();
}

// ──────────────────────────────────────────
// Monta botões de navegação
// ──────────────────────────────────────────

function montarBotoes(pagina, totalPaginas) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('primeira')
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pagina === 1),
        new ButtonBuilder()
            .setCustomId('anterior')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pagina === 1),
        new ButtonBuilder()
            .setCustomId('pagina')
            .setLabel(`${pagina} / ${totalPaginas}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('proxima')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pagina === totalPaginas),
        new ButtonBuilder()
            .setCustomId('ultima')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pagina === totalPaginas),
    );
}

// ──────────────────────────────────────────
// Lógica de paginação interativa
// ──────────────────────────────────────────

async function enviarComPaginacao(message, jogos, filtro) {
    const totalPaginas = Math.ceil(jogos.length / JOGOS_POR_PAGINA);
    let pagina = 1;

    const payload = (p) => ({
        embeds: [montarEmbedJogos(jogos, filtro, p, totalPaginas)],
        components: totalPaginas > 1 ? [montarBotoes(p, totalPaginas)] : [],
    });

    const msg = await message.reply(payload(pagina));

    // Se só tem uma página, não precisa de collector
    if (totalPaginas <= 1) return;

    const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: TIMEOUT_PAGINACAO,
        // Só o autor do comando pode navegar
        filter: (i) => i.user.id === message.author.id,
    });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'primeira') pagina = 1;
        else if (interaction.customId === 'anterior') pagina = Math.max(1, pagina - 1);
        else if (interaction.customId === 'proxima') pagina = Math.min(totalPaginas, pagina + 1);
        else if (interaction.customId === 'ultima') pagina = totalPaginas;

        await interaction.update(payload(pagina));
    });

    collector.on('end', async () => {
        // Remove os botões ao expirar
        try {
            await msg.edit({
                embeds: [montarEmbedJogos(jogos, filtro, pagina, totalPaginas)],
                components: [],
            });
        } catch (_) {
            // Mensagem pode ter sido deletada
        }
    });
}

// ──────────────────────────────────────────
// Registro dos comandos
// ──────────────────────────────────────────

function registrarComandos(client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        if (!message.content.startsWith(PREFIX)) return;

        const [comando, ...args] = message.content
            .slice(PREFIX.length)
            .trim()
            .split(/\s+/);

        try {
            switch (comando.toLowerCase()) {

                // ──────────────────────────────
                // !jogos [time]
                // ──────────────────────────────
                case 'jogos': {
                    const filtro = args.join(' ').trim();

                    const buscando = new EmbedBuilder()
                        .setColor(COR.neutro)
                        .setDescription(
                            filtro
                                ? `🔎  Buscando jogos de **${filtro}**, aguarde...`
                                : '🔎  Buscando jogos do dia, aguarde...'
                        )
                        .setFooter({ text: '⚽ TuaiSoccer  •  Dados: Mantos do Futebol' });

                    const msg = await message.reply({ embeds: [buscando] });

                    let jogos = await buscarJogos();

                    if (filtro) {
                        jogos = jogos.filter((j) =>
                            normalizar(j.confronto).includes(normalizar(filtro))
                        );
                    }

                    if (!jogos.length) {
                        await msg.edit({
                            embeds: [
                                embedAviso(
                                    filtro
                                        ? `Nenhum jogo encontrado para **${filtro}** hoje.`
                                        : 'Nenhum jogo encontrado para hoje.'
                                ),
                            ],
                        });
                        return;
                    }

                    // Deleta o "buscando" e envia a paginação como nova mensagem
                    await msg.delete().catch(() => { });
                    await enviarComPaginacao(message, jogos, filtro || null);
                    break;
                }

                // ──────────────────────────────
                // !campeonato [nome]
                // ──────────────────────────────
                case 'campeonato': {
                    const filtro = args.join(' ').trim();

                    if (!filtro) {
                        return message.reply({
                            embeds: [embedErro(`Uso correto: \`${PREFIX}campeonato <nome>\``)],
                        });
                    }

                    const buscando = new EmbedBuilder()
                        .setColor(COR.neutro)
                        .setDescription(`🔎  Buscando jogos do campeonato **${filtro}**, aguarde...`)
                        .setFooter({ text: '⚽ TuaiSoccer  •  Dados: Mantos do Futebol' });

                    const msg = await message.reply({ embeds: [buscando] });

                    let jogos = await buscarJogos();

                    jogos = jogos.filter((j) =>
                        normalizar(j.campeonato).includes(normalizar(filtro))
                    );

                    if (!jogos.length) {
                        await msg.edit({
                            embeds: [embedAviso(`Nenhum jogo encontrado para o campeonato **${filtro}** hoje.`)],
                        });
                        return;
                    }

                    await msg.delete().catch(() => { });
                    await enviarComPaginacao(message, jogos, `🏆 ${filtro}`);
                    break;
                }

                // ──────────────────────────────
                // !ajuda
                // ──────────────────────────────
                case 'ajuda': {
                    const embed = new EmbedBuilder()
                        .setColor(COR.info)
                        .setTitle('📖  Comandos Disponíveis')
                        .setDescription('Todos os comandos do TuaiSoccer.')
                        .addFields(
                            {
                                name: `\`${PREFIX}jogos\``,
                                value: 'Lista todos os jogos de hoje com paginação interativa.',
                                inline: false,
                            },
                            {
                                name: `\`${PREFIX}jogos <time>\``,
                                value: 'Filtra os jogos de hoje pelo nome do time informado.',
                                inline: false,
                            },
                            {
                                name: `\`${PREFIX}campeonato <nome>\``,
                                value: 'Filtra os jogos de hoje pelo nome do campeonato informado.',
                                inline: false,
                            },
                            {
                                name: `\`${PREFIX}ajuda\``,
                                value: 'Exibe esta mensagem.',
                                inline: false,
                            }
                        )
                        .setFooter({ text: '⚽ TuaiSoccer  •  Dados: Mantos do Futebol' })
                        .setTimestamp();

                    await message.reply({ embeds: [embed] });
                    break;
                }

                default:
                    break;
            }
        } catch (err) {
            console.error(`[Comando: ${comando}] Erro:`, err);
            await message.reply({
                embeds: [embedErro('Ocorreu um erro inesperado. Tente novamente mais tarde.')],
            });
        }
    });
}

module.exports = { registrarComandos, jogoParaField, COR };