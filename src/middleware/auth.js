'use strict';
/**
 * Dependências de autenticação/autorização para as rotas.
 * Equivalente a app/deps.py.
 */
const UserModel = require('../models/User');
const { decodeToken } = require('../utils/security');
const { HttpError } = require('../utils/errors');

function getBearerToken(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

/**
 * Middleware Express: exige um usuário autenticado e o expõe em req.user.
 */
function getCurrentUser(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return next(new HttpError(401, 'Não autenticado'));
  }

  const payload = decodeToken(token);
  if (!payload || payload.type !== 'access') {
    return next(new HttpError(401, 'Token inválido ou expirado'));
  }

  const user = UserModel.findById(payload.sub);
  if (!user) {
    return next(new HttpError(401, 'Usuário não encontrado'));
  }

  req.user = user;
  next();
}

/**
 * Middleware factory: exige que o usuário autenticado tenha um dos papéis informados.
 * @param  {...string} roles
 */
function requireRoles(...roles) {
  return [
    getCurrentUser,
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(new HttpError(403, 'Você não tem permissão para executar esta ação'));
      }
      next();
    },
  ];
}

module.exports = { getCurrentUser, requireRoles };
