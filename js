document.getElementById("chat-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const userInput = document.getElementById("user-input").value;
    document.getElementById("user-input").value = ''; // Clear input field

    // Display user message in chat window
    displayMessage(userInput, 'user-message');

    // Send message to server
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
    })
    .then(response => response.json())
    .then(data => {
        const botResponse = data.response; // Use the server's response
        displayMessage(botResponse, 'bot-message');
        updateMentalState(data.endangered ? "endangered" : data.sentiment_score > 0.1 ? "strong" : data.sentiment_score < -0.1 ? "endangered" : "neutral");
    });
});

// Function to display messages in the chat window
function displayMessage(message, className) {
    const chatWindow = document.getElementById("chat-window");
    const messageElement = document.createElement("div");
    messageElement.className = className;
    messageElement.textContent = message;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the bottom
}

// Function to update the mental state meter and label based on detected emotion
function updateMentalState(emotion) {
    const progressRing = document.getElementById("progress-ring");
    const stateLabel = document.getElementById("state-label");

    // Ensure that elements exist before modifying them
    if (progressRing && stateLabel) {
        // Reset meter's styling
        progressRing.style.background = "";
        stateLabel.textContent = "";

        // Update label and color based on the detected emotion
        switch (emotion) {
            case "endangered":
                progressRing.style.background = "conic-gradient(#F44336 0% 100%)"; // Red
                stateLabel.textContent = "Endangered";
                provideSupport(); // Call support function for endangered state
                break;
            case "strong":
                progressRing.style.background = "conic-gradient(#4CAF50 0% 100%)"; // Green
                stateLabel.textContent = "Strong";
                break;
            case "happy":
                progressRing.style.background = "conic-gradient(#FFD700 0% 100%)"; // Gold
                stateLabel.textContent = "Happy";
                break;
            case "neutral":
                progressRing.style.background = "conic-gradient(#90A4AE 0% 100%)"; // Gray
                stateLabel.textContent = "Neutral";
                break;
            case "mixed":
                progressRing.style.background = "conic-gradient(#9C27B0 0% 100%)"; // Purple
                stateLabel.textContent = "Mixed";
                break;
            default:
                progressRing.style.background = "conic-gradient(#FFEB3B 0% 100%)"; // Yellow
                stateLabel.textContent = "Neutral"; // Set default to neutral instead of weak
        }
    } else {
        console.error("Progress ring or state label element not found.");
    }
}

// Function to provide user support when endangered
function provideSupport() {
    const supportMessage = "It seems you may be feeling overwhelmed. Please consider talking to someone who can help.";
    displayMessage(supportMessage, 'support-message');
}

// Emotion detectiozn logic using predefined word lists
const negativeWordsSet = new Set([
    "sad", "angry", "upset", "frustrated", "stressed", "anxious", "worried", "depressed",
    "lonely", "hopeless", "heartbroken", "betrayed", "guilty", "ashamed", "resentful",
    "envious", "jealous", "afraid", "scared", "terrified", "hate", "despise", "loathe",
    "detest", "dislike", "regret", "miss", "long for", "wish", "crave", "cry", "scream",
    "yell", "shout", "argue", "fight", "isolate", "withdraw", "avoid", "neglect",
    "I feel like", "I'm so", "I can't believe", "I wish", "I'm tired of", "It's unfair that",
    "I'm not good enough"
]);

const positiveWordsSet = new Set([
    "happy", "joyful", "enthusiastic", "grateful", "optimistic", "hopeful", "satisfied",
    "content", "proud", "loved", "appreciated", "accepted", "respected", "confident",
    "successful", "accomplished", "fulfilled", "inspired", "motivated", "smile", "laugh",
    "celebrate", "enjoy", "relax", "meditate", "exercise", "spend time with loved ones",
    "help others"
]);

const neutralWordsSet = new Set([
    "calm", "relaxed", "indifferent", "unconcerned", "neutral", "objective", "impartial",
    "detached", "unemotional", "apathetic", "okay", "alright", "fine", "so-so", "meh",
    "whatever", "I don't care", "going about their day", "doing routine tasks"
]);

const mixedWordsSet = new Set([
    "conflicted", "ambivalent", "torn", "undecided", "uncertain", "confused", "perplexed",
    "puzzled", "hesitant", "reluctant", "vacillating", "indecisiveness", "I'm feeling a mix of emotions",
    "I'm torn between", "I'm on the fence about", "I'm conflicted about"
]);

const greetingsSet = new Set([
    "hello", "hi", "hey", "good morning", "good afternoon", "good evening"
]);

function detectEmotion(userMessage) {
    userMessage = userMessage.toLowerCase(); // Ensure comparison is case-insensitive
    let negativeScore = 0;
    let positiveScore = 0;

    // Check if the message is a greeting
    if (greetingsSet.has(userMessage)) {
        updateMentalState("neutral");
        return;
    }

    // Calculate scores based on word sets
    negativeWordsSet.forEach(word => {
        if (userMessage.includes(word)) {
            negativeScore++;
        }
    });

    positiveWordsSet.forEach(word => {
        if (userMessage.includes(word)) {
            positiveScore++;
        }
    });

    // Determine mental state based on scores
    if (negativeScore > 0) {
        updateMentalState(negativeScore > 2 ? "endangered" : "mixed");
    } else if (positiveScore > 0) {
        if (userMessage.includes("happy")) {
            updateMentalState("happy");
        } else {
            updateMentalState("strong");
        }
    } else {
        updateMentalState("neutral");
    }
}
