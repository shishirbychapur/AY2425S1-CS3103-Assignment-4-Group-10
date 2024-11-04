// server.js
const { WebSocketServer } = require('ws');  // Changed this line
const Speaker = require('speaker');
const { Readable } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

const server = new WebSocketServer({ port: 8765 });  // And this line

server.on('connection', socket => {
    console.log('Client connected');
    
    // Create a single persistent speaker instance for this connection
    const speaker = new Speaker({
        channels: 1,
        bitDepth: 16,
        sampleRate: 16000
    });

    // Create a readable stream that will be used throughout the connection
    const audioStream = new Readable({
        read() {}
    });

    // Set up the ffmpeg process for this connection
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
        
        // Push new data to the stream
        audioStream.push(data);
    });

    socket.on('close', () => {
        console.log('Client disconnected');
        // Clean up resources
        audioStream.push(null);
        speaker.end();
    });
});

console.log("WebSocket server started on ws://localhost:8765");
