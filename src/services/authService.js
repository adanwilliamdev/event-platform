'use strict';
const UserModel = require('../models/User');
const { Role } = require('../models/enums');
const { HttpError } = require('../utils/errors');
const {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
} = require('../utils/security');

function register(data) {
  if (UserModel.findByEmail(data.email)) {
    throw new HttpError(400, `E-mail já cadastrado: ${data.email}`);
  }

  const user = UserModel.create({
    name: data.name,
    email: data.email,
    passwordHash: hashPassword(data.password),
    role: Role.CLIENT,
  });

  return buildAuthResponse(user);
}

function login(data) {
  const user = UserModel.findByEmail(data.email);
  if (!user || !verifyPassword(data.password, user.password_hash)) {
    throw new HttpError(401, 'Credenciais inválidas');
  }
  return buildAuthResponse(user);
}

function buildAuthResponse(user) {
  return {
    access_token: createAccessToken(user.id, user.role),
    refresh_token: createRefreshToken(user.id, user.role),
    user_id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

module.exports = { register, login };
