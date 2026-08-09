"""Gerenciador de conexões WebSocket para atualizações em tempo real
(substitui o STOMP/SimpMessagingTemplate do backend original)."""
import json
from collections import defaultdict
from typing import Dict, Set

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: Dict[str, Set[WebSocket]] = defaultdict(set)

    async def connect(self, event_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[event_id].add(websocket)

    def disconnect(self, event_id: str, websocket: WebSocket) -> None:
        self._connections[event_id].discard(websocket)
        if not self._connections[event_id]:
            self._connections.pop(event_id, None)

    async def broadcast(self, event_id: str, message: dict) -> None:
        dead = []
        for ws in list(self._connections.get(event_id, [])):
            try:
                await ws.send_text(json.dumps(message, default=str))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(event_id, ws)


manager = ConnectionManager()
