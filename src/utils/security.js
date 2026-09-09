'use strict';
/**
 * Hashing de senha e emissão/validação de tokens JWT.
 * Equivalente a app/security.py.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'dev-secret-change-me-in-production-please';
const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24; // 24h
const REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7; // 7 dias

function hashPassword(password) {
  // bcrypt trunca em 72 bytes, igual ao comportamento do backend original.
  const truncated = Buffer.from(password, 'utf-8').slice(0, 72).toString('utf-8');
  return bcrypt.hashSync(truncated, 10);
}

function verifyPassword(plain, hashed) {
  try {
    const truncated = Buffer.from(plain, 'utf-8').slice(0, 72).toString('utf-8');
    return bcrypt.compareSync(truncated, hashed);
  } catch (err) {
    return false;
  }
}

function _createToken(subject, role, expiresMinutes, tokenType) {
  const payload = { sub: subject, role, type: tokenType };
  return jwt.sign(payload, SECRET_KEY, {
    algorithm: ALGORITHM,
    expiresIn: `${expiresMinutes}m`,
  });
}

function createAccessToken(userId, role) {
  return _createToken(userId, role, ACCESS_TOKEN_EXPIRE_MINUTES, 'access');
}

function createRefreshToken(userId, role) {
  return _createToken(userId, role, REFRESH_TOKEN_EXPIRE_MINUTES, 'refresh');
}

function decodeToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] });
  } catch (err) {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  decodeToken,
};
