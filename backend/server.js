const WebSocket = require('ws');
const Speaker = require('speaker');
const { Readable } = require('stream');
const ffmpeg = require('fluent-ffmpeg');

const server = new WebSocket.Server({ port: 8765 });

server.on('connection', socket => {
    console.log('Client connected');

    socket.on('message', data => {
        // Check if data is valid before processing
        if (!data || data.length === 0) {
            console.error('Received empty or invalid audio data');
            return;
        }

        // Create a new readable stream for each incoming audio message
        const audioStream = new Readable({
            read() {}
        });

        audioStream.push(data);
        audioStream.push(null);

        // Create a new Speaker instance for playback
        const speaker = new Speaker({
            channels: 1,          // Mono audio
            bitDepth: 16,        // 16-bit audio
            sampleRate: 16000    // 16kHz sample rate
        });

        // Use ffmpeg to decode WebM/Opus to PCM for Speaker playback
        const ffmpegProcess = ffmpeg(audioStream)
            .inputFormat('webm')       // Input format
            .audioFrequency(16000)     // Match sample rate
            .audioChannels(1)          // Mono audio
            .format('s16le')           // PCM format
            .pipe(speaker)
            .on('error', err => {
                console.error('Error processing audio:', err);
            })
            .on('finish', () => {
                console.log('Playback finished');
            });
    });

    socket.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log("WebSocket server started on ws://localhost:8765");