from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groq import Groq  

app = Flask(__name__)
CORS(app)   
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
#print("API KEY:", os.environ.get("GROQ_API_KEY"))


@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        conversation_id = data.get('conversation_id', '')

        # Get AI response from Groq
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant. Keep responses concise."
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            model="llama3-70b-8192",  # Groq's fastest model
            temperature=0.7,
            max_tokens=1024
        )

        response = chat_completion.choices[0].message.content

        return jsonify({
            "response": response,
            "conversation_id": conversation_id or "new-conversation"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
    
    
    
#in terminal run:    
#$env:GROQ_API_KEY = "your_real_groq_api_key"
#python app.py
    