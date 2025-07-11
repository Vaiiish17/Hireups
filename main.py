
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from app.signaling import signaling_endpoint
from app.meeting_manager import validate_meeting_code

app = FastAPI()
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/", response_class=HTMLResponse)
async def get():
    with open("frontend/index.html") as f:
        return f.read()

app.websocket_route("/ws/{meeting_id}")(signaling_endpoint)
