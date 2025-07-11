from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict

# Store single connection per meeting_id (1-to-1 call)
connections: Dict[str, WebSocket] = {}


async def signaling_endpoint(websocket: WebSocket, meeting_id: str):
    await websocket.accept()
    print(f"🔗 Client connected to meeting {meeting_id}")

    if meeting_id not in connections:
        # First user joins
        connections[meeting_id] = websocket
        try:
            while True:
                data = await websocket.receive_text()
                print(f"📩 Waiting for second peer... (got: {data})")
                await websocket.send_text("Waiting for peer...")
        except WebSocketDisconnect:
            print(f"❌ First peer disconnected from {meeting_id}")
            del connections[meeting_id]
        except Exception as e:
            print(f"❗ Error (first peer): {e}")
            del connections[meeting_id]
    else:
        # Second user joins
        peer = connections[meeting_id]
        try:
            while True:
                # Receive from second peer
                data = await websocket.receive_text()
                print(f"➡️ Second peer sent: {data}")
                await peer.send_text(data)

                # Receive reply from first peer
                peer_data = await peer.receive_text()
                print(f"⬅️ First peer replied: {peer_data}")
                await websocket.send_text(peer_data)
        except WebSocketDisconnect:
            print(f"❌ Second peer disconnected from {meeting_id}")
            del connections[meeting_id]
        except Exception as e:
            print(f"❗ Error (second peer): {e}")
            del connections[meeting_id]
