from flask import Flask, request, jsonify, abort, redirect, send_file
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv


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
    test = "hello world"
    return jsonify(test=test)


if __name__ == '__main__':
    app.run(port=5000)
