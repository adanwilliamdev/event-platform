'use strict';
const express = require('express');
const orderService = require('../services/orderService');
const { HttpError, asyncHandler } = require('../utils/errors');

const router = express.Router();

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Corpo bruto é necessário para validar a assinatura do Stripe.
router.post(
  '/',
  express.raw({ type: '*/*' }),
  asyncHandler(async (req, res) => {
    const signature = req.header('Stripe-Signature');
    const payload = req.body; // Buffer (por causa de express.raw)

    let event;
    try {
      // Dependência opcional: só é necessária com STRIPE_SECRET_KEY configurada.
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
      event = stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
    } catch (exc) {
      console.error('Erro ao processar webhook:', exc.message || exc);
      throw new HttpError(400, 'Falha ao processar webhook');
    }

    console.log('Evento de webhook recebido:', event.type);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await orderService.processSuccessfulPayment(paymentIntent.id);
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      console.warn('Pagamento falhou:', paymentIntent.id);
    }

    res.json({ status: 'Webhook processado com sucesso' });
  })
);

module.exports = router;
