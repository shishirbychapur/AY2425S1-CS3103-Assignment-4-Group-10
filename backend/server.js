const { WebSocketServer } = require('ws');
const Speaker = require('speaker');
const { Readable } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

let isTalking = false;

// Audio WebSocket server
const audioServer = new WebSocketServer({ port: 8765 });
audioServer.on('connection', socket => {
    console.log('Audio client connected');
    
    const speaker = new Speaker({
        channels: 1,
        bitDepth: 16,
        sampleRate: 16000
    });

    const audioStream = new Readable({
        read() {}
    });

    const ffmpegProcess = ffmpeg(audioStream)
        .inputFormat('webm')
        .audioFrequency(16000)
        .audioChannels(1)
        .format('s16le')
        .pipe(speaker)
        .on('error', err => {
            console.error('Error processing audio:', err);
        });

    socket.on('message', data => {
        if (!data || data.length === 0) {
            console.error('Received empty or invalid audio data');
            return;
        }
        
        audioStream.push(data);
    });

    socket.on('close', () => {
        console.log('Audio client disconnected');
        audioStream.push(null);
        speaker.end();
    });
});

// Control WebSocket server
const controlServer = new WebSocketServer({ port: 8766 });
controlServer.on('connection', socket => {
    console.log('Control client connected');

    socket.on('message', data => {
        try {
            const message = JSON.parse(data);
            if (message.type === "mouseDown" || message.type === "mouseUp") {
                // Broadcast control events to all connected control clients except the sender
                broadcastControlMessage(controlServer, message, socket);
                console.log(message);
            }
        } catch (error) {
            console.error("Error parsing control message:", error);
        }
    });

    socket.on('close', () => {
        console.log('Control client disconnected');
    });
});

// Function to broadcast control messages to all connected clients except the sender
function broadcastControlMessage(server, message, sender) {
    server.clients.forEach(client => {
        if (client !== sender && client.readyState === client.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}


console.log("Audio WebSocket server started on ws://localhost:8765");
console.log("Control WebSocket server started on ws://localhost:8766");