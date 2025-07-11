let pc = new RTCPeerConnection();
let ws;
let localStream = null;

async function joinMeeting() {
  const meetingId = document.getElementById("meetingId").value;
  const server = window.location.host; // Automatically gets current host
  const wsUrl = `wss://${server}/ws/${meetingId}`;
  console.log("📡 Connecting to WebSocket:", wsUrl);

  ws = new WebSocket(wsUrl);

  ws.onopen = () => console.log("✅ WebSocket connected");
  ws.onerror = (e) => console.error("❌ WebSocket error:", e);
  ws.onclose = () => console.warn("⚠️ WebSocket closed");

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.answer) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify({ answer }));
    } else if (data.candidate) {
      await pc.addIceCandidate(data.candidate);
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      ws.send(JSON.stringify({ candidate: event.candidate }));
    }
  };

  pc.ontrack = (event) => {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  document.getElementById("localVideo").srcObject = localStream;

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({ offer }));
}
