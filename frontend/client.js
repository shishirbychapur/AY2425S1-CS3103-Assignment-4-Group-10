let audioContext = new (window.AudioContext || window.webkitAudioContext)()
let audioSocket = new WebSocket('ws://localhost:8765') // Audio socket
let controlSocket = new WebSocket('ws://localhost:8766') // Control socket

// Configure audio socket for binary data
audioSocket.binaryType = 'arraybuffer'

navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
        let mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 32000,
        })

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && audioSocket.readyState === WebSocket.OPEN) {
                audioSocket.send(event.data)
            }
        }

        document.getElementById('speakButton').addEventListener('mousedown', () => {
            // Send control message on controlSocket
            if (controlSocket.readyState === WebSocket.OPEN && !document.getElementById('status').classList.contains('disabled')) {
                controlSocket.send(JSON.stringify({ type: 'mouseDown' }))
                console.log('mousedown event sent')
            }
            mediaRecorder.start(100)
            disableButton()
        })

        document.getElementById('speakButton').addEventListener('mouseup', () => {
            mediaRecorder.stop()
            if (controlSocket.readyState === WebSocket.OPEN && !document.getElementById('status').classList.contains('disabled')) {
                controlSocket.send(JSON.stringify({ type: 'mouseUp' }))
                console.log('mouseup event sent')
            }
            enableButton()
        })
    })
    .catch((error) => {
        console.error('Error accessing audio stream:', error)
        alert('Could not access the audio stream. Please check microphone permissions.')
    })

// Listen for mouseDown and mouseUp events from the control socket
controlSocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'disable') {
        console.log('disable event received')
        profDisableButton()
    } else if (data.type === 'enable') {
        console.log('enable event received')
        enableButton()
    } else if (data.type === 'mouseDown') {
        console.log('mouseDown event received')
        disableButton()
    } else if (data.type === 'mouseUp') {
        console.log('mouseUp event received')
        enableButton()
    }
}

const instruction = document.getElementById('instruction')
const status = document.getElementById('status')
const speakButton = document.getElementById('speakButton')

// Function to disable the push-to-talk button
function disableButton() {
    instruction.innerText = 'Student speaking!'
    status.innerText = 'CHANNEL IN USE'
    status.classList.add('active')
}

// Function to enable the push-to-talk button
function enableButton() {
    instruction.innerText = 'Press and hold to speak'
    status.innerText = 'AVAILABLE'
    status.classList.remove('active')
    status.classList.remove('disabled')
    speakButton.classList.remove('disabled')
    speakButton.disabled = false
}

function profDisableButton() {
    instruction.innerText = 'Push-to-Talk has been disabled by the professor!'
    status.innerText = 'DISABLED'
    status.classList.add('disabled')
    speakButton.classList.add('disabled')
    speakButton.disabled = true
}

// Add error handling for WebSocket connections
audioSocket.onerror = (error) => {
    console.error('Audio WebSocket Error:', error)
}

audioSocket.onclose = (event) => {
    console.log('Audio WebSocket connection closed:', event.code, event.reason)
}

controlSocket.onerror = (error) => {
    console.error('Control WebSocket Error:', error)
}

controlSocket.onclose = (event) => {
    console.log('Control WebSocket connection closed:', event.code, event.reason)
}
