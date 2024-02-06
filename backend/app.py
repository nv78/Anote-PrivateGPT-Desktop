from flask import Flask, request, jsonify, abort, redirect, send_file
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv

from api_endpoints.financeGPT.chatbot_endpoints import add_chat_to_db



load_dotenv()

app = Flask(__name__)

# TODO: Replace with your URLs.
config = {
  'ORIGINS': [
    'http://localhost:3000',  # React
    'http://dashboard.localhost:3000',  # React
    'https://anote.ai', # Frontend prod URL,
    'https://privategpt.anote.ai', # Frontend prod URL,
  ],
}
CORS(app, resources={ r'/*': {'origins': config['ORIGINS']}}, supports_credentials=True)

@app.route('/test-flask', methods=['POST'])
def test_flask():
    print("hello world")
    test = "hello world"
    return jsonify(test=test)

@app.route('/create-new-chat', methods=['POST'])
def create_new_chat():

    print("a123")

    chat_type = request.json.get('chat_type')
    model_type = request.json.get('model_type')

    print("b123")

    chat_id = add_chat_to_db(chat_type, model_type) #for now hardcode the model type as being 0

    print("c123")

    return jsonify(chat_id=chat_id)


if __name__ == '__main__':
    app.run(port=5000)
