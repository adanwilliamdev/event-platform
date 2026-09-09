'use strict';
const express = require('express');
const authService = require('../services/authService');
const { RegisterRequest, LoginRequest } = require('../schemas');
const { validateBody } = require('../middleware/validate');
const { getCurrentUser } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errors');

const router = express.Router();

router.post(
  '/register',
  validateBody(RegisterRequest),
  asyncHandler(async (req, res) => {
    const result = authService.register(req.validated);
    res.status(201).json(result);
  })
);

router.post(
  '/login',
  validateBody(LoginRequest),
  asyncHandler(async (req, res) => {
    const result = authService.login(req.validated);
    res.json(result);
  })
);

router.get('/me', getCurrentUser, (req, res) => {
  const user = req.user;
  res.json({ user_id: user.id, name: user.name, email: user.email, role: user.role });
});

module.exports = router;
