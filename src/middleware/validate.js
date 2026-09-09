'use strict';
/**
 * Middleware de validação de corpo de requisição usando um schema Zod.
 * Em caso de erro, responde 422 no mesmo espírito do FastAPI/Pydantic.
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        detail: result.error.issues.map((issue) => ({
          loc: ['body', ...issue.path],
          msg: issue.message,
          type: issue.code,
        })),
      });
    }
    req.validated = result.data;
    next();
  };
}

module.exports = { validateBody };
