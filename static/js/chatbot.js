// Add an event listener to the chat form
const chatForm = document.getElementById("chat-form");

if (chatForm) {
    chatForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const userInputField = document.getElementById("user-input");
        if (!userInputField) {
            console.error("User input field not found.");
            return;
        }

        const userInput = userInputField.value;
        userInputField.value = ''; // Clear the input field

        // Display user message in chat window
        displayMessage(userInput, 'user-message');

        // Send the message to the server
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userInput }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const botResponse = data.response || "I'm sorry, I didn't understand that.";
            displayMessage(botResponse, 'bot-message');

            // Update the mental state based on the response
            const isEndangered = data.endangered || false;
            const sentimentScore = data.sentiment_score || 0;
            updateMentalState(isEndangered ? "endangered" : sentimentScore > 0.1 ? "strong" : sentimentScore < -0.1 ? "endangered" : "neutral");
        })
        .catch(error => {
            console.error('Error during fetch:', error);
            displayMessage("Sorry, something went wrong. Please try again later.", 'bot-message');
        });
    });
} else {
    console.error("Chat form not found in the document.");
}

// Function to display messages in the chat window
function displayMessage(message, className) {
    const chatWindow = document.getElementById("chat-window");
    if (chatWindow) {
        const messageElement = document.createElement("div");
        messageElement.className = className;
        messageElement.textContent = message;
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the bottom
    } else {
        console.error("Chat window not found in the document.");
    }
}

// Function to update the user's mental state
function updateMentalState(state) {
    console.log(`Mental state updated to: ${state}`);
    // You can implement UI changes or additional actions based on the mental state here
}

// Function to detect emotions in the user's message
function detectEmotion(userMessage) {
    const greetingsSet = new Set(["hello", "hi", "hey", "greetings"]);
    const negativeWordsSet = new Set(["sad", "angry", "upset", "worried"]);
    const positiveWordsSet = new Set(["happy", "joyful", "excited", "cheerful"]);

    let negativeScore = 0;
    let positiveScore = 0;

    userMessage = userMessage.toLowerCase(); // Ensure comparison is case-insensitive

    // Check if the message is a greeting
    if (greetingsSet.has(userMessage)) {
        updateMentalState("neutral");
        return;
    }

    // Calculate scores based on word sets
    for (const word of negativeWordsSet) {
        if (userMessage.includes(word)) {
            negativeScore++;
        }
    }

    for (const word of positiveWordsSet) {
        if (userMessage.includes(word)) {
            positiveScore++;
        }
    }

    // Determine mental state based on scores
    if (negativeScore > 0) {
        updateMentalState(negativeScore > 2 ? "endangered" : "mixed");
    } else if (positiveScore > 0) {
        updateMentalState("strong");
    } else {
        updateMentalState("neutral");
    }
}
