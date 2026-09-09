'use strict';
require('dotenv').config();

const path = require('path');
const express = require('express');

const authRouter = require('./routers/auth');
const eventsRouter = require('./routers/events');
const ticketsRouter = require('./routers/tickets');
const ordersRouter = require('./routers/orders');
const webhooksRouter = require('./routers/webhooks');

const { HttpError } = require('./utils/errors');

const app = express();

app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/webhooks/stripe', webhooksRouter);

const staticDir = path.join(__dirname, '..', 'public');
app.use('/static', express.static(staticDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 para rotas de API não encontradas.
app.use('/api', (req, res) => {
  res.status(404).json({ detail: 'Não encontrado' });
});

// Middleware de erro (equivalente ao tratamento de HTTPException do FastAPI).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ detail: err.detail });
  }
  console.error(err);
  res.status(500).json({ detail: 'Erro interno do servidor' });
});

module.exports = app;
