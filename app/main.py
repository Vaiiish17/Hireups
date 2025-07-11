from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from signaling_endpoint import signaling_endpoint

app = FastAPI()

app.mount("/", StaticFiles(directory="static", html=True), name="static")


@app.websocket("/ws/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str):
    await signaling_endpoint(websocket, meeting_id)
