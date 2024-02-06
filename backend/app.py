from flask import Flask, request, jsonify, abort, redirect, send_file
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
from tika import parser as p
import openai
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
import os


from api_endpoints.financeGPT.chatbot_endpoints import add_chat_to_db, retrieve_chats_from_db, retrieve_message_from_db, retrieve_docs_from_db, delete_doc_from_db, \
                                                        find_most_recent_chat_from_db, add_document_to_db, chunk_document, update_chat_name_db, delete_chat_from_db, \
                                                        reset_chat_db, change_chat_mode_db, add_message_to_db, get_relevant_chunks, add_sources_to_db, add_model_key_to_db



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

    chat_type = request.json.get('chat_type')
    model_type = request.json.get('model_type')

    chat_id = add_chat_to_db(chat_type, model_type) #for now hardcode the model type as being 0

    return jsonify(chat_id=chat_id)


@app.route('/retrieve-all-chats', methods=['POST'])
def retrieve_chats():

    chat_info = retrieve_chats_from_db()

    return jsonify(chat_info=chat_info)


@app.route('/retrieve-messages-from-chat', methods=['POST'])
def retrieve_messages_from_chat():

    chat_type = request.json.get('chat_type')
    chat_id = request.json.get('chat_id')

    messages = retrieve_message_from_db(chat_id, chat_type)

    return jsonify(messages=messages)

@app.route('/update-chat-name', methods=['POST'])
def update_chat_name():

    chat_name = request.json.get('chat_name')
    chat_id = request.json.get('chat_id')

    update_chat_name_db(chat_id, chat_name)

    return "Chat name updated"

@app.route('/delete-chat', methods=['POST'])
def delete_chat():
    chat_id = request.json.get('chat_id')

    return delete_chat_from_db(chat_id)

@app.route('/find-most-recent-chat', methods=['POST'])
def find_most_recent_chat():
    chat_info = find_most_recent_chat_from_db()

    return jsonify(chat_info=chat_info)


@app.route('/ingest-pdf', methods=['POST'])
def ingest_pdfs():
    chat_id = request.form.getlist('chat_id')[0]

    files = request.files.getlist('files[]')

    MAX_CHUNK_SIZE = 1000


    for file in files:
        result = p.from_buffer(file)
        text = result["content"].strip()

        filename = file.filename

        doc_id, doesExist = add_document_to_db(text, filename, chat_id=chat_id)

        if not doesExist:
           chunk_document.remote(text, MAX_CHUNK_SIZE, doc_id)

    
    return jsonify({"error": "Invalid JWT"}), 200

@app.route('/retrieve-current-docs', methods=['POST'])
def retrieve_current_docs():
    chat_id = request.json.get('chat_id')

    doc_info = retrieve_docs_from_db(chat_id)

    return jsonify(doc_info=doc_info)


@app.route('/delete-doc', methods=['POST'])
def delete_doc():
    doc_id = request.json.get('doc_id')

    delete_doc_from_db(doc_id)

    return "success"

@app.route('/change-chat-mode', methods=['POST'])
def change_chat_mode_and_reset_chat():
    chat_mode_to_change_to = request.json.get('model_type')
    chat_id = request.json.get('chat_id')

    try:
        reset_chat_db(chat_id)
        change_chat_mode_db(chat_mode_to_change_to, chat_id)

        return "Success"
    except:
        return "Error"

@app.route('/reset-chat', methods=['POST'])
def reset_chat():
    chat_id = request.json.get('chat_id')

    return reset_chat_db(chat_id)


@app.route('/process-message-pdf', methods=['POST'])
def process_message_pdf():
    message = request.json.get('message')
    chat_id = request.json.get('chat_id')
    model_type = request.json.get('model_type')
    model_key = request.json.get('model_key')

    ##Include part where we verify if user actually owns the chat_id later

    query = message.strip()

    #This adds user message to db
    add_message_to_db(query, chat_id, 1)

    #Get most relevant section from the document
    sources = get_relevant_chunks(2, query, chat_id)

    if (model_type == 0):
        if model_key:
           model_use = model_key
        else:
           model_use = "gpt-4"

        print("using OpenAI and model is", model_use)
        client = openai.OpenAI()
        try:
            completion = client.chat.completions.create(
                model=model_use,
                messages=[
                    {"role": "user",
                     "content": f"You are a factual chatbot that answers questions about 10-K documents. You only answer with answers you find in the text, no outside information. These are the sources from the text:{sources[0]}{sources[1]} And this is the question:{query}."}
                ]
            )
            print("using fine tuned model")
            answer = str(completion.choices[0].message.content)
        except openai.NotFoundError:
            print(f"The model `{model_use}` does not exist. Falling back to 'gpt-4'.")
            completion = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "user",
                     "content": f"First, tell the user that their given model key does not exist, and that you have resorted to using GPT-4 before answering their question, then add a line break and answer their question. You are a factual chatbot that answers questions about 10-K documents. You only answer with answers you find in the text, no outside information. These are the sources from the text:{sources[0]}{sources[1]} And this is the question:{query}."}
                ]
            )
            answer = str(completion.choices[0].message.content)
    else:
        print("using Claude")

        anthropic = Anthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY")
        )

        completion = anthropic.completions.create(
            model="claude-2",
            max_tokens_to_sample=700,
            prompt = (
              f"{HUMAN_PROMPT} "
              f"You are a factual chatbot that answers questions about 10-K documents. You only answer with answers you find in the text, no outside information. "
              f"please address the question: {query}. "
              f"Consider the provided text as evidence: {sources[0]}{sources[1]}. "
              f"{AI_PROMPT}")
        )
        answer = completion.completion

    #This adds bot message
    message_id = add_message_to_db(answer, chat_id, 0)
    
    try:
        add_sources_to_db(message_id, sources)
    except:
        print("no sources")

    return jsonify(answer=answer)

@app.route('/add-model-key', methods=['POST'])
def add_model_key():
    model_key = request.json.get('model_key')
    chat_id = request.json.get('chat_id')

    add_model_key_to_db(model_key, chat_id)

    return "success"


if __name__ == '__main__':
    app.run(port=5000)
