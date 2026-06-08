const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Shared state
let currentCode = '    ';
let currentBg = '#FFE500';

const COLORS = [
  '#FFE500', '#FF3D00', '#00E5FF', '#76FF03',
  '#FF6D00', '#D500F9', '#00BFA5', '#FF4081',
  '#FFAB00', '#00B0FF', '#69F0AE', '#EA80FC',
  '#F4FF81', '#FF80AB', '#82B1FF', '#CCFF90',
];

function randomColor(exclude) {
  const options = COLORS.filter(c => c !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

// Broadcast to all connected clients
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', (ws) => {
  // Send current state to new client
  ws.send(JSON.stringify({ type: 'init', code: currentCode, bg: currentBg }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'update') {
        // Validate: alphanumeric only, max 4, uppercase
        const cleaned = String(data.code).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
        currentCode = cleaned;
        currentBg = randomColor(currentBg);
        broadcast({ type: 'update', code: currentCode, bg: currentBg });
      }
    } catch (e) {}
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 CodeShare running at http://localhost:${PORT}\n`);
});
