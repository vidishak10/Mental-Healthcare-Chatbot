from flask import Flask, request, jsonify, render_template
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, AutoModelForSequenceClassification
import json
import torch
import random

# Load BlenderBot for fallback responses
blenderbot_model_name = "facebook/blenderbot-400M-distill"
blenderbot_tokenizer = AutoTokenizer.from_pretrained(blenderbot_model_name)
blenderbot_model = AutoModelForSeq2SeqLM.from_pretrained(blenderbot_model_name)

# Load BERT for symptom classification
bert_model_name = "emilyalsentzer/Bio_ClinicalBERT"
bert_tokenizer = AutoTokenizer.from_pretrained(bert_model_name)
bert_model = AutoModelForSequenceClassification.from_pretrained(bert_model_name, num_labels=3)

# Load custom JSON data
with open("conversation_data.json", "r") as f:
    custom_responses = json.load(f)

# Flask app
app = Flask(__name__)

# Maintain session context
chat_context = {}

# Dynamic greetings
greetings = ["Hi there! How can I help you today?",
             "Hello! What’s on your mind?",
             "Hey! How are you feeling today?"]

# Crisis resources
CRISIS_RESOURCES = [
    "Dr. Rajesh Rathi - 07383315978 (Dhantoli, Nagpur)",
    "Dr. Kumar Kamble - Umang Clinic, Dhantoli, Nagpur",
    "Suicide Prevention Helpline: 1800-599-0019 (India)"
]

# Function for symptom classification
def classify_symptoms(user_message):
    inputs = bert_tokenizer(user_message, return_tensors="pt", truncation=True, max_length=512)
    outputs = bert_model(**inputs)
    probabilities = torch.softmax(outputs.logits, dim=1).tolist()[0]
    labels = ["stress", "depression", "anxiety"]
    return labels[probabilities.index(max(probabilities))]

# Fetch custom response
def get_custom_response(user_message):
    user_message = user_message.lower()
    for category, data in custom_responses.items():
        if any(keyword in user_message for keyword in data["keywords"]):
            return data["response"], data["follow_up"]
    return None, None

# Generate response using BlenderBot
def get_blenderbot_response(user_message):
    inputs = blenderbot_tokenizer(user_message, return_tensors="pt", truncation=True, max_length=512)
    outputs = blenderbot_model.generate(**inputs, max_length=512, pad_token_id=blenderbot_tokenizer.pad_token_id)
    return blenderbot_tokenizer.decode(outputs[0], skip_special_tokens=True)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message').strip()
    user_id = data.get('user_id', "default_user")

    # Initialize context if not present
    if user_id not in chat_context:
        chat_context[user_id] = {"follow_up": None, "symptom_category": None, "crisis_mode": False}

    user_context = chat_context[user_id]

    # Step 1: Greeting handling
    if user_message.lower() in {"hi", "hello", "hey", "hii", "heyy", "good morning", "good afternoon", "good evening"}:
        return jsonify({"response": random.choice(greetings), "follow_up": None})

    # Step 2: Crisis mode handling
    if any(term in user_message.lower() for term in ["suicide", "self-harm", "end my life", "kill myself"]):
        user_context["crisis_mode"] = True
        response = (
            "I'm so sorry you're feeling this way. Please know you're not alone. "
            "Here are some resources that can help:\n" +
            "\n".join(CRISIS_RESOURCES) +
            "\nCan I assist you further in connecting with someone or finding support?"
        )
        return jsonify({"response": response, "follow_up": None})

    # Step 3: Follow-up handling
    if user_context["follow_up"]:
        if user_message.lower() in {"yes", "please"}:
            tips = {
                "connection_ideas": "Reach out to friends, join a club, or try new hobbies.",
                "stress_tips": "Take deep breaths, practice mindfulness, or exercise regularly.",
                "depression_tips": "Talk to someone, set small goals, or engage in activities you enjoy.",
                "anxiety_tips": "Practice deep breathing, limit caffeine, and try journaling."
            }
            response = tips.get(user_context["follow_up"], "Let me find some useful tips for you.")
            user_context["follow_up"] = None
            return jsonify({"response": response, "follow_up": None})
        else:
            user_context["follow_up"] = None
            return jsonify({"response": "Alright, let me know if there's anything else I can help with.", "follow_up": None})

    # Step 4: Predefined responses
    custom_response, follow_up = get_custom_response(user_message)
    if custom_response:
        user_context["follow_up"] = follow_up
        return jsonify({"response": custom_response, "follow_up": follow_up})

    # Step 5: Symptom classification
    if any(keyword in user_message.lower() for keyword in ["stressed", "depressed", "anxious", "worried", "weak", "lonely"]):
        symptom_category = classify_symptoms(user_message)
        if symptom_category:
            user_context["follow_up"] = f"{symptom_category}_tips"
            return jsonify({
                "response": f"It seems like you're feeling {symptom_category}. Would you like some tips to manage it?",
                "follow_up": f"{symptom_category}_tips"
            })

    # Step 6: Fallback to BlenderBot
    model_response = get_blenderbot_response(user_message)
    return jsonify({"response": model_response, "follow_up": None})

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
