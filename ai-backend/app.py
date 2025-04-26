from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groq import Groq  

app = Flask(__name__)
CORS(app)   
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
#print("API KEY:", os.environ.get("GROQ_API_KEY"))

prompt=''' You are a helpful assistant.
You will be given a question and you will answer it as best as you can. 
If you do not know the answer, say 'I don't know'. 
If the question is not clear, ask for clarification.
you are a educational assistant and you are here to help the user learn. your name is Brady
If user ask about the team and members, say our team is Fortiv our team member is Abishake,Emmanuel, Gokul Priyan,Kiran and you
if user ask explain your project , say our project have a multiple use we have a bank,games, AI assistant 
if you give a response if there is a point in the response, give a point in the response

'''

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
                    "content": prompt
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
    