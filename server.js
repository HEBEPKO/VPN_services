const net = require('net');

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

const server = net.createServer((clientSocket) => {
    let remoteSocket = null;
    let isConnected = false;

    console.log('[Сервер]: Получено новое подключение.');

    clientSocket.on('data', (data) => {
        const decryptedData = XORTransform(data);

        if (!isConnected) {
            const requestString = decryptedData.toString('utf8');
            if (requestString.includes('CONNECT')) {
                const match = requestString.match(/CONNECT ([^\s/]+)/);
                if (match) {
                    const [hostname, portStr] = match[1].split(':');
                    const port = parseInt(portStr) || 443;

                    console.log(`[Сервер]: Подключаюсь к сайту -> ${hostname}:${port}`);
                    
                    remoteSocket = net.connect(port, hostname, () => {
                        isConnected = true;
                        // Отправляем успешный статус туннеля (шифруем, так как клиент его расшифрует)
                        const successResponse = Buffer.from('HTTP/1.1 200 Connection Established\(\r\n\r\\)n');
                        clientSocket.write(XORTransform(successResponse));
                    });

                    remoteSocket.on('data', (remoteData) => {
                        clientSocket.write(XORTransform(remoteData));
                    });

                    remoteSocket.on('error', () => clientSocket.end());
                    remoteSocket.on('close', () => clientSocket.end());
                }
            }
        } else {
            if (remoteSocket) remoteSocket.write(decryptedData);
        }
    });

    clientSocket.on('error', () => { if (remoteSocket) remoteSocket.end(); });
    clientSocket.on('close', () => { if (remoteSocket) remoteSocket.end(); });
});

server.listen(SERVER_PORT, () => {
    console.log(`Учебный Сервер запущен на порту ${SERVER_PORT}`);
});
