require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { registrarComandos } = require('./commands');
const { iniciarCron } = require('./cron');

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error('[Config] ❌ DISCORD_TOKEN não definido. Crie um arquivo .env baseado no .env.example');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log(`[Bot] ✅ Online como ${client.user.tag}`);
    iniciarCron(client);
});

client.on('error', (err) => {
    console.error('[Discord] Erro no client:', err);
});

registrarComandos(client);

client.login(TOKEN);