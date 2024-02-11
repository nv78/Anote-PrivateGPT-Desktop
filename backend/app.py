from flask import Flask, request, jsonify, abort, redirect, send_file
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
from tika import parser as p
import openai
import os
import csv
import ollama


from api_endpoints.financeGPT.chatbot_endpoints import add_chat_to_db, retrieve_chats_from_db, retrieve_message_from_db, retrieve_docs_from_db, delete_doc_from_db, \
                                                        find_most_recent_chat_from_db, add_document_to_db, chunk_document, update_chat_name_db, delete_chat_from_db, \
                                                        reset_chat_db, change_chat_mode_db, add_message_to_db, get_relevant_chunks, add_sources_to_db, add_model_key_to_db, \
                                                        check_valid_api, reset_uploaded_docs, add_ticker_to_chat_db, download_10K_url_ticker, download_filing_as_pdf, \
                                                        get_text_from_single_file


#load_dotenv()

app = Flask(__name__)

# TODO: Replace with your URLs.
config = {
  'ORIGINS': [
    'http://localhost:3000',  # React
    'http://dashboard.localhost:3000',  # React
  ],
}
CORS(app, resources={ r'/*': {'origins': config['ORIGINS']}}, supports_credentials=True)

@app.route('/test-flask', methods=['POST'])
def test_flask():
    print("hello world")
    test = "hello world"
    return jsonify(test=test)

@app.route('/download-chat-history', methods=['POST'])
def download_chat_history():

    try:
        chat_type = request.json.get('chat_type')
        chat_id = request.json.get('chat_id')

        messages = retrieve_message_from_db(chat_id, chat_type)

        paired_messages = []
        for i in range(len(messages) - 1):
            if messages[i]['sent_from_user'] == 1 and messages[i+1]['sent_from_user'] == 0:
                paired_messages.append((messages[i]['message_text'], messages[i+1]['message_text']))

        output_directory = 'output_document'
        if not os.path.exists(output_directory):
            os.makedirs(output_directory)

        file_path = os.path.join(output_directory, 'chat_history.csv')

        with open(file_path, 'w', newline='', encoding='utf-8') as file:
          writer = csv.writer(file)
          writer.writerow(['Query', 'Response'])  # Header
          writer.writerows(paired_messages)

        return "success"
    except:
       return "error"

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
    print("chat is", chat_id)

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
           chunk_document(text, MAX_CHUNK_SIZE, doc_id)

    
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
    sources_str = " ".join([", ".join(str(elem) for elem in source) for source in sources])
    print("sources_str", sources_str)

    if (model_type == 0):
        #if model_key:
        #   model_use = model_key
        #else:
        #   model_use = "gpt-4"

        print("using LLama2")
        response = ollama.chat(model='llama2', messages=[
            {
              'role': 'user',
              'content': f'You are a factual chatbot that answers questions about uploaded documents. You only answer with answers you find in the text, no outside information. These are the sources from the text:{sources_str} And this is the question:{query}.',
              
            },
        ])
        answer = response['message']['content']
    else:
        print("using mistral")

        response = ollama.chat(model='mistral', messages=[
            {
              'role': 'user',
              'content': f'You are a factual chatbot that answers questions about uploaded documents. You only answer with answers you find in the text, no outside information. These are the sources from the text:{sources_str} And this is the question:{query}.',
              
            },
        ])
        answer = response['message']['content']

    #This adds bot message
    message_id = add_message_to_db(answer, chat_id, 0)
    
    try:
        add_sources_to_db(message_id, sources)
    except:
        print("error adding sources to db or no sources")

    return jsonify(answer=answer)

@app.route('/add-model-key', methods=['POST'])
def add_model_key():
    model_key = request.json.get('model_key')
    chat_id = request.json.get('chat_id')

    add_model_key_to_db(model_key, chat_id)

    return "success"


#Edgar
@app.route('/check-valid-ticker', methods=['POST'])
def check_valid_ticker():
   ticker = request.json.get('ticker')
   result = check_valid_api(ticker)
   return jsonify({'isValid': result})

@app.route('/add-ticker-to-chat', methods=['POST'])
def add_ticker():

    ticker = request.json.get('ticker')
    chat_id = request.json.get('chat_id')
    isUpdate = request.json.get('isUpdate')

    return add_ticker_to_chat_db(chat_id, ticker, isUpdate)


@app.route('/process-ticker-info', methods=['POST'])
def process_ticker_info():
    chat_id = request.json.get('chat_id')
    ticker = request.json.get('ticker')

    if ticker:
        MAX_CHUNK_SIZE = 1000

        reset_uploaded_docs(chat_id)

        url, ticker = download_10K_url_ticker(ticker)
        filename = download_filing_as_pdf(url, ticker)

        text = get_text_from_single_file(filename)

        doc_id, doesExist = add_document_to_db(text, filename, chat_id)

        if not doesExist:
            chunk_document(text, MAX_CHUNK_SIZE, doc_id)

        if os.path.exists(filename):
            os.remove(filename)
            print(f"File '{filename}' has been deleted.")
        else:
            print(f"The file '{filename}' does not exist.")


    return jsonify({"error": "Invalid JWT"}), 200

if __name__ == '__main__':
    app.run(port=5000)
