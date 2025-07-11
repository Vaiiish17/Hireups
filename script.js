let pc = new RTCPeerConnection();
let ws;
let localStream = null;

async function joinMeeting() {
    console.log("✅ Join button clicked");

    const meetingId = document.getElementById("meetingId").value;
    const serverIp = "10.125.97.214"; // 🔁 Replace with your actual host IP
    const wsUrl = `ws://${serverIp}:8080/ws/${meetingId}`;
    console.log("📡 Connecting to WebSocket:", wsUrl);

    ws = new WebSocket(wsUrl);

    ws.onopen = async () => {
        console.log("✅ WebSocket connected");

        // Get camera + mic
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            document.getElementById("localVideo").srcObject = localStream;
            console.log("🎥 Local stream started");
        } catch (err) {
            console.error("❌ Failed to access camera/mic:", err);
            alert("Please allow camera and microphone access.");
            return;
        }

        // ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ candidate: event.candidate }));
                console.log("📨 Sent ICE candidate");
            }
        };

        // Remote video
        pc.ontrack = (event) => {
            console.log("📺 Remote stream received");
            document.getElementById("remoteVideo").srcObject = event.streams[0];
        };

        // Send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ offer }));
            console.log("📤 Sent offer");
        }
    };

    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("📨 Received:", data);

        if (data.answer) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log("📥 Set remote answer");
        } else if (data.offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ answer }));
            console.log("📤 Sent answer");
        } else if (data.candidate) {
            await pc.addIceCandidate(data.candidate);
            console.log("📥 Added ICE candidate");
        }
    };

    ws.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
    };

    ws.onclose = () => {
        console.warn("⚠️ WebSocket closed");
    };
}

// ✅ Bind button click after DOM loads
document.addEventListener("DOMContentLoaded", () => {
    const joinBtn = document.getElementById("joinBtn");
    if (joinBtn) {
        joinBtn.addEventListener("click", joinMeeting);
    }
});
