'use strict';
const express = require('express');
const eventService = require('../services/eventService');
const ticketService = require('../services/ticketService');
const { EventRequest } = require('../schemas');
const { validateBody } = require('../middleware/validate');
const { requireRoles } = require('../middleware/auth');
const { Role } = require('../models/enums');
const { asyncHandler } = require('../utils/errors');

const router = express.Router();

router.post(
  '/',
  ...requireRoles(Role.ADMIN, Role.ORGANIZER),
  validateBody(EventRequest),
  asyncHandler(async (req, res) => {
    const result = eventService.createEvent(req.validated, req.user);
    res.status(201).json(result);
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(eventService.getAllEvents());
  })
);

router.get(
  '/upcoming',
  asyncHandler(async (req, res) => {
    res.json(eventService.getUpcomingEvents());
  })
);

router.get(
  '/:eventId',
  asyncHandler(async (req, res) => {
    res.json(eventService.getEvent(req.params.eventId));
  })
);

router.get(
  '/:eventId/tickets',
  asyncHandler(async (req, res) => {
    res.json(ticketService.getAvailableTickets(req.params.eventId));
  })
);

module.exports = router;
