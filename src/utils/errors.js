'use strict';
/**
 * Erro HTTP simples, equivalente ao uso de HTTPException no FastAPI.
 */
class HttpError extends Error {
  constructor(statusCode, detail) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail));
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

/** Envolve um handler async para propagar erros ao middleware de erro do Express. */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { HttpError, asyncHandler };
