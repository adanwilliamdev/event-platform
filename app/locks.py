"""Locks em memória por ingresso, para emular o lock pessimista usado no
backend original (findByIdWithPessimisticLock) e evitar condições de corrida
quando duas pessoas tentam reservar o mesmo assento ao mesmo tempo."""
import threading
from collections import defaultdict

_global_guard = threading.Lock()
_ticket_locks: dict[str, threading.Lock] = defaultdict(threading.Lock)


def ticket_lock(ticket_id: str) -> threading.Lock:
    with _global_guard:
        return _ticket_locks[ticket_id]
