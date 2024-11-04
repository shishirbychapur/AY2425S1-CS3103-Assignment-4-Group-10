// client.js
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let socket = new WebSocket("ws://localhost:8765");

// Configure socket for binary data
socket.binaryType = "arraybuffer";

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    // Configure MediaRecorder with smaller time slice and appropriate MIME type
    let mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 32000
    });

    // Handle data as it becomes available
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
        }
    };
    
    // Start recording with a small timeslice (100ms chunks)
    document.getElementById('pushToTalkButton').addEventListener('mousedown', () => {
        mediaRecorder.start(100);
    });

    document.getElementById('pushToTalkButton').addEventListener('mouseup', () => {
        mediaRecorder.stop();
    });
});

// Add error handling for WebSocket connection
socket.onerror = (error) => {
    console.error('WebSocket Error:', error);
};

socket.onclose = (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
};

