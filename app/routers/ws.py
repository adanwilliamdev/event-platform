from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..ws_manager import manager

router = APIRouter()


@router.websocket("/ws/events/{event_id}/tickets")
async def event_ticket_updates(websocket: WebSocket, event_id: str):
    await manager.connect(event_id, websocket)
    try:
        while True:
            # Mantém a conexão viva; o cliente não precisa enviar nada.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(event_id, websocket)
    except Exception:
        manager.disconnect(event_id, websocket)
