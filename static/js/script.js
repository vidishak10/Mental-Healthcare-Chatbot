// Handle form submission and chatbot interaction
document.getElementById('chat-form').onsubmit = function(e) {
    e.preventDefault();

    const userMessage = document.getElementById('user-input').value;

    if (userMessage.trim() === '') {
        return; // Don't process empty messages
    }

    // Append the user's message to the chat window
    const chatWindow = document.getElementById('chat-window');
    chatWindow.innerHTML += `<div class="user-message">${userMessage}</div>`;

    // Clear the input field
    document.getElementById('user-input').value = '';

    // Send the message to the server
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `message=${encodeURIComponent(userMessage)}`
    })
    .then(response => response.json())
    .then(data => {
        // Append the bot's response to the chat window
        chatWindow.innerHTML += `<div class="bot-message">${data.response}</div>`;
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
    });
};
