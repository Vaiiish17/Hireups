from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict

connections: Dict[str, WebSocket] = {}


async def signaling_endpoint(websocket: WebSocket, meeting_id: str):
    await websocket.accept()
    if meeting_id not in connections:
        connections[meeting_id] = websocket
        try:
            while True:
                data = await websocket.receive_text()
                await websocket.send_text("Waiting for peer...")
        except WebSocketDisconnect:
            del connections[meeting_id]
    else:
        peer = connections[meeting_id]
        try:
            while True:
                data = await websocket.receive_text()
                await peer.send_text(data)
                peer_data = await peer.receive_text()
                await websocket.send_text(peer_data)
        except WebSocketDisconnect:
            del connections[meeting_id]
