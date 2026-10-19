const net = require('net');

const CLIENT_PORT = 8080;
const SERVER_PORT = 9090;
const KEY = 0x5A;

const XORTransform = (data) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const result = Buffer.alloc(buf.length);
    for (let i = 0; i < buf.length; i++) {
        result[i] = buf[i] ^ KEY;
    }
    return result;
};

const clientProxy = net.createServer((browserSocket) => {
    console.log('[Клиент]: Новый запрос.');

    const serverSocket = net.connect(SERVER_PORT, '127.0.0.1', () => {
        browserSocket.on('data', (data) => {
            serverSocket.write(XORTransform(data));
        });

        serverSocket.on('data', (data) => {
            browserSocket.write(XORTransform(data));
        });
    });

    serverSocket.on('error', () => browserSocket.end());
    browserSocket.on('close', () => browserSocket.end());
    browserSocket.on('error', () => serverSocket.end());
    browserSocket.on('close', () => browserSocket.end());
});

clientProxy.listen(CLIENT_PORT, () => {
    console.log(`Локальный Клиент запущен на порту ${CLIENT_PORT}`);
});
