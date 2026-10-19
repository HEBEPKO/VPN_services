const { error } = require('console');
const http = require('http');
const { hostname } = require('os');

const PORT = 8080;

const server = http.createServer((req, res) => {
    console.log(`[Запрос]; ${req.method} -> ${req.url}`);

    const targetUrl = new URL(req.url);

    const options = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 80,
        path: targetUrl.pathname + targetUrl.search,
        method: req.method,
        headers: req.headers
    };

    const proxyReq = http.request(options, (proxyReq) => {
        res.writeHead(proxyReq.statusCode, proxyReq.headers);

        proxyReq.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error(`[Ошибка проксирования]: ${err.message}`);
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Bad Geteway: Proxy error');        
    });

    req.pipe(proxyReq);
});

server.listen(PORT, () => {
    console.log(`Прокси-сервер запущен локально на http://localhost:${PORT}`);
});