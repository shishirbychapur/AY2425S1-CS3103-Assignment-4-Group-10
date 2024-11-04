let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let audioSocket = new WebSocket("ws://localhost:8765");  // Audio socket
let controlSocket = new WebSocket("ws://localhost:8766");  // Control socket

// Configure audio socket for binary data
audioSocket.binaryType = "arraybuffer";

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    let mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 32000
    });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && audioSocket.readyState === WebSocket.OPEN) {
            audioSocket.send(event.data);
        }
    };
    
    document.getElementById('pushToTalkButton').addEventListener('mousedown', () => {
        // Send control message on controlSocket
        if (controlSocket.readyState === WebSocket.OPEN) {
            controlSocket.send(JSON.stringify({ type: "mouseDown" }));
            console.log("mousedown event sent");
        }
        mediaRecorder.start(100);
    });

    document.getElementById('pushToTalkButton').addEventListener('mouseup', () => {
        mediaRecorder.stop();
        // Send control message on controlSocket
        if (controlSocket.readyState === WebSocket.OPEN) {
            controlSocket.send(JSON.stringify({ type: "mouseUp" }));
            console.log("mouseup event sent");
        }
    });
});

// Listen for mouseDown and mouseUp events from the control socket
controlSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "mouseDown") {
        console.log("mouseDown event received");
        disableButton();
    } else if (data.type === "mouseUp") {
        console.log("mouseUp event received");
        enableButton();
    }
};

// Function to disable the push-to-talk button
function disableButton() {
    const button = document.getElementById('pushToTalkButton');
    button.disabled = true; // Disable the button
}

// Function to enable the push-to-talk button
function enableButton() {
    const button = document.getElementById('pushToTalkButton');
    button.disabled = false; // Enable the button
}

// Add error handling for WebSocket connections
audioSocket.onerror = (error) => {
    console.error('Audio WebSocket Error:', error);
};

audioSocket.onclose = (event) => {
    console.log('Audio WebSocket connection closed:', event.code, event.reason);
};

controlSocket.onerror = (error) => {
    console.error('Control WebSocket Error:', error);
};

controlSocket.onclose = (event) => {
    console.log('Control WebSocket connection closed:', event.code, event.reason);
};
