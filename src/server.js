'use strict';
require('dotenv').config();

const http = require('http');
const app = require('./app');
const { seedDemoData } = require('./utils/seed');
const { attachWebSocketServer } = require('./routers/ws');
const {
  startReservationCleanupLoop,
  stopReservationCleanupLoop,
} = require('./utils/background');

const PORT = process.env.PORT || 8000;

seedDemoData();

const server = http.createServer(app);
attachWebSocketServer(server);
startReservationCleanupLoop();

server.listen(PORT, () => {
  console.log(`Event Platform API rodando em http://localhost:${PORT}`);
});

function shutdown() {
  stopReservationCleanupLoop();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
