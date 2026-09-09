'use strict';
const express = require('express');
const ticketService = require('../services/ticketService');
const { TicketHoldRequest } = require('../schemas');
const { validateBody } = require('../middleware/validate');
const { getCurrentUser } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errors');

const router = express.Router();

router.post(
  '/hold',
  getCurrentUser,
  validateBody(TicketHoldRequest),
  asyncHandler(async (req, res) => {
    const result = await ticketService.holdTicket(req.validated, req.user);
    res.json(result);
  })
);

router.post(
  '/:ticketId/release',
  getCurrentUser,
  asyncHandler(async (req, res) => {
    await ticketService.releaseTicketHold(req.params.ticketId);
    res.status(204).send();
  })
);

module.exports = router;
