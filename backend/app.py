from flask import Flask, request, jsonify, abort, redirect, send_file
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv

from api_endpoints.financeGPT.chatbot_endpoints import add_prompt_to_workflow_db, add_workflow_to_db, add_chat_to_db, add_message_to_db, chunk_document, get_text_from_single_file, add_document_to_db, get_relevant_chunks, remove_prompt_from_workflow_db, remove_ticker_from_workflow_db, reset_uploaded_docs_for_workflow, retrieve_chats_from_db, delete_chat_from_db, retrieve_message_from_db, retrieve_docs_from_db, add_sources_to_db, delete_doc_from_db, reset_chat_db, change_chat_mode_db, update_chat_name_db, get_text_from_edgar, add_ticker_to_chat_db, download_filing_as_pdf, reset_uploaded_docs, add_model_key_to_db, get_text_pages_from_single_file, add_ticker_to_workflow_db, add_chat_to_db, add_message_to_db, chunk_document, get_text_from_single_file, add_document_to_db, get_relevant_chunks, retrieve_chats_from_db, delete_chat_from_db, retrieve_message_from_db, retrieve_docs_from_db, add_sources_to_db, delete_doc_from_db, reset_chat_db, change_chat_mode_db, update_chat_name_db, get_text_from_edgar, add_ticker_to_chat_db, download_filing_as_pdf, reset_uploaded_docs, add_model_key_to_db, get_text_pages_from_single_file, find_most_recent_chat_from_db



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

@app.route('/create-new-chat', methods=['POST'])
def create_new_chat():

    chat_type = request.json.get('chat_type')
    model_type = request.json.get('model_type')

    chat_id = add_chat_to_db(chat_type, model_type) #for now hardcode the model type as being 0

    return jsonify(chat_id=chat_id)


if __name__ == '__main__':
    app.run(port=5000)
