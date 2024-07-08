const chatMessages = document.querySelector('.chat-messages');
const chatForm = document.querySelector('.chat-form');
const chatInput = document.querySelector('.chat-input');
const voiceInputBtn = document.querySelector('.voice-input-btn');

const userId = 'user_' + Math.random().toString(36).substr(2, 9);

// Speech recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.continuous = true;
recognition.interimResults = true;

let isListening = false;
let finalTranscript = '';

chatForm.addEventListener('submit', sendMessage);
voiceInputBtn.addEventListener('click', toggleVoiceInput);

function toggleVoiceInput() {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

function startListening() {
    finalTranscript = '';
    recognition.start();
    isListening = true;
    voiceInputBtn.textContent = '🎤 Listening...';
    voiceInputBtn.classList.add('listening');
}

function stopListening() {
    recognition.stop();
    isListening = false;
    voiceInputBtn.textContent = '🎤';
    voiceInputBtn.classList.remove('listening');
    if (finalTranscript.trim()) {
        chatInput.value = finalTranscript;
        sendMessage(new Event('submit'));
    }
}

recognition.onresult = function(event) {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
        } else {
            interimTranscript += event.results[i][0].transcript;
        }
    }
    chatInput.value = finalTranscript + interimTranscript;
};

recognition.onend = function() {
    if (isListening) {
        recognition.start();
    }
};

async function sendMessage(event) {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (message) {
        addMessage('user', message);
        chatInput.value = '';
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, message })
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            addMessage('bot', data.response);
        } catch (error) {
            console.error('Error:', error);
            addMessage('bot', 'Oops, something went wrong. Please try again later.');
        }
    }
}

function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (sender === 'bot') {
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('chat-message', 'typing');
        typingIndicator.textContent = '...';
        chatMessages.appendChild(typingIndicator);
        setTimeout(() => {
            chatMessages.removeChild(typingIndicator);
            messageElement.classList.add('visible');
        }, 1000);
    } else {
        messageElement.classList.add('visible');
    }
}

addMessage('bot', 'Hello! How can I assist you with your hotel booking today?');