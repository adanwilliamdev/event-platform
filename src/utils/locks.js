'use strict';
/**
 * Locks em memória por ingresso, para evitar condições de corrida quando
 * duas requisições tentam reservar/vender o mesmo assento ao mesmo tempo.
 * Equivalente a app/locks.py (que usava threading.Lock por ticket_id).
 *
 * Implementado como um mutex assíncrono por ticket_id: cada ticket_id tem
 * uma fila (Promise chain) que serializa as operações concorrentes.
 */
const _tails = new Map(); // ticketId -> Promise (cauda da fila)

/**
 * Executa `fn` com exclusividade para o `ticketId` informado.
 * @param {string} ticketId
 * @param {() => Promise<any>} fn
 * @returns {Promise<any>}
 */
function withTicketLock(ticketId, fn) {
  const tail = _tails.get(ticketId) || Promise.resolve();

  const run = tail.then(fn, fn); // roda fn após a anterior terminar (sucesso ou erro)

  // A nova cauda nunca rejeita, só serve para encadear a ordem.
  const nextTail = run.then(
    () => {},
    () => {}
  );
  _tails.set(ticketId, nextTail);

  // Limpeza: se ninguém mais encadeou depois de nós, remove a entrada.
  nextTail.then(() => {
    if (_tails.get(ticketId) === nextTail) {
      _tails.delete(ticketId);
    }
  });

  return run;
}

module.exports = { withTicketLock };
