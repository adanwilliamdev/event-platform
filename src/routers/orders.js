'use strict';
const express = require('express');
const orderService = require('../services/orderService');
const { OrderRequest } = require('../schemas');
const { validateBody } = require('../middleware/validate');
const { getCurrentUser } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errors');

const router = express.Router();

router.post(
  '/',
  getCurrentUser,
  validateBody(OrderRequest),
  asyncHandler(async (req, res) => {
    const result = await orderService.createOrder(req.validated, req.user);
    res.status(201).json(result);
  })
);

router.get(
  '/me',
  getCurrentUser,
  asyncHandler(async (req, res) => {
    const orders = orderService.getMyOrders(req.user);
    const withQr = await Promise.all(orders.map((o) => orderService.attachQrCodes(o)));
    res.json(withQr);
  })
);

router.get(
  '/:orderId',
  getCurrentUser,
  asyncHandler(async (req, res) => {
    const order = orderService.getOrder(req.params.orderId, req.user);
    res.json(await orderService.attachQrCodes(order));
  })
);

router.post(
  '/:orderId/confirm',
  getCurrentUser,
  asyncHandler(async (req, res) => {
    const order = await orderService.confirmPayment(req.params.orderId, req.user);
    res.json(await orderService.attachQrCodes(order));
  })
);

module.exports = router;
