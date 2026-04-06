# ⚽ Discord Bot – Jogos de Futebol

Bot para buscar jogos do dia, com filtros de time e campeonato. Todos os dados do site Mantos do Futebol.

## Instalação

```bash
npm install
cp .env.example .env
# Edite o .env e adicione seu DISCORD_TOKEN
```

## Uso

```bash
# Produção
npm start

# Desenvolvimento (recarrega automaticamente ao salvar)
npm run dev
```

## Comandos

| Comando | Descrição |
|---|---|
| `!jogos` | Lista os jogos de hoje |
| `!jogos <time>` | Jogos pelo nome do time informado |
| `!campeonato <nome>` | Jogos pelo nome do campeonato |
| `!ajuda` | Lista todos os comandos |

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `DISCORD_TOKEN` | Token do bot no Discord | — |
| `PREFIX` | Prefixo dos comandos | `!` |
| `CRON_INTERVAL` | Intervalo de verificação (cron) | `0 8 * * *` |