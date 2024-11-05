let controlSocket = new WebSocket('ws://localhost:8766') // Control socket

let isEnabled = true
document.getElementById('speakButton').addEventListener('click', () => {
  if (isEnabled && controlSocket.readyState === WebSocket.OPEN) {
    controlSocket.send(JSON.stringify({ type: 'disable' }))
    isEnabled = false
    console.log('disable event sent')
    disableButton("DISABLED")
  } else if (!isEnabled && controlSocket.readyState === WebSocket.OPEN) {
    controlSocket.send(JSON.stringify({ type: 'enable' }))
    isEnabled = true
    console.log('enable event sent')
    enableButton()
  }
})

const status = document.getElementById('status')
const speakButton = document.getElementById('speakButton')

// Function to disable the push-to-talk button
function disableButton(text) {
    status.innerText = text
    status.classList.add('inactive')
    speakButton.classList.add('inactive')
}

// Function to enable the push-to-talk button
function enableButton() {
    status.innerText = 'ENABLED'
    status.classList.remove('inactive')
    speakButton.classList.remove('inactive')
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
