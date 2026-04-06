const http = require('http');

const PORT = process.env.PORT || 3000;

function iniciarServidor() {
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end('OK');
    }).listen(PORT, () => {
        console.log(`[Server] ✅ Keep-alive escutando na porta ${PORT}`);
    });
}

module.exports = { iniciarServidor };