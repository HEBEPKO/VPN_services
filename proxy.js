const { error } = require('console');
const http = require('http');
const { hostname } = require('os');
const net = require('net');

const PORT = 8080;

const server = http.createServer((req, res) => {

    try {
        console.log(`[HTTP Запрос]; ${req.method} -> ${req.url}`);

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

        proxyReq.on('error', () => {
            console.error(`[Ошибка проксирования]: ${err.message}`);
            res.writeHead(502);
            res.end();        
        });

        req.pipe(proxyReq);
    } catch (e) {
        res.writeHead(400);
        res.end('Invalid URL');
    }    
});

server.on('connect', (req, clientSocket, head) => {
    console.log(`[HTTPS Туннель]: ${req.url}`);

    const [hostname, potr] = req.url.split(':');

    const serverSocket = net.connect(PORT || 443, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Establised\(\r\n\r\\)n');

        serverSocket.write(head);

        clientSocket.pipe(serverSocket);
        serverSocket.pipe(clientSocket);
    });

    serverSocket.on('error', (err) => {
        console.error(`[Ошибка TCP]: ${hostname} - ${err.message}`);
        clientSocket.end('HTTP/1.1 502 Bad Gateway\(\r\n\r\\)n');
    });

    clientSocket.on('error', () => serverSocket.end());
    serverSocket.on('error', () => clientSocket.end());
});

server.listen(PORT, () => {
    console.log(`Прокси-сервер запущен локально на http://localhost:${PORT}`);
});