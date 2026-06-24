const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.WS_PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const httpServer = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', clients: connectedClients.size }));
    return;
  }

  if (req.method === 'POST' && req.url === '/emit') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const notification = JSON.parse(body);
        const id = notification.id || uuidv4();
        const timestamp = notification.timestamp || new Date().toISOString();
        const payload = { ...notification, id, timestamp };

        io.to(payload.studentId).emit('notification', payload);
        io.to('admin').emit('notification', payload);

        console.log(`[WS] Notification emitted to ${payload.studentId}: ${payload.type}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id }));
      } catch (e) {
        console.error('[WS] Invalid emit payload:', e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
  pingInterval: 25000,
  pingTimeout: 20000,
});

const connectedClients = new Map();

io.on('connection', (socket) => {
  const studentId = socket.handshake.query.studentId || 'anonymous';
  connectedClients.set(socket.id, { studentId, joinedAt: Date.now() });

  console.log(`[WS] Client connected: ${socket.id} (student: ${studentId})`);

  socket.join(studentId);
  socket.join('all');

  socket.emit('connected', { socketId: socket.id, studentId });

  socket.on('disconnect', (reason) => {
    connectedClients.delete(socket.id);
    console.log(`[WS] Client disconnected: ${socket.id} (reason: ${reason})`);
  });
});

setInterval(() => {
  io.emit('heartbeat', { time: Date.now() });
}, 30000);

httpServer.listen(PORT, () => {
  console.log(`[WS] WebSocket server running on port ${PORT}`);
  console.log(`[WS] CORS origin: ${CORS_ORIGIN}`);
});

module.exports = { io, connectedClients };
