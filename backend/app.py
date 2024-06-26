from flask import Flask, request, jsonify, abort, redirect, send_file
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
from tika import parser as p
import openai
import os
import csv
import ollama
import subprocess
import threading
import re


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

process_status_llama = {"running": False, "output": "", "error": ""}
process_status_mistral = {"running": False, "output": "", "error": ""}

@app.route('/test-flask', methods=['POST'])
def test_flask():
    print("hello world")
    test = "hello world"
    return jsonify(test=test)

#INSTALLATION
@app.route('/check-models', methods=['POST'])
def check_models():
    base_path = os.path.expanduser('~/.ollama/models/manifests/registry.ollama.ai/library')
    llama2_exists = os.path.isdir(os.path.join(base_path, 'llama2'))
    mistral_exists = os.path.isdir(os.path.join(base_path, 'mistral'))
    print("llama and mistral", llama2_exists, mistral_exists)
    return jsonify({'llama2_exists': llama2_exists, 'mistral_exists': mistral_exists})

def run_llama_async():
    ollama_path = '/usr/local/bin/ollama'
    command = [ollama_path, 'run', 'llama2']
    
    # Regular expression to match the time left message format
    time_left_regex = re.compile(r'\b\d+m\d+s\b')
    progress_regex = re.compile(r'(\d+)%')

    try:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Monitor the process output in real-time
        for line in iter(process.stderr.readline, ''):
            print(line, end='')  # Debug: print each line to server log
            match = time_left_regex.search(line)
            if match:
                process_status_llama["time_left"] = match.group()
                
            match_progress = progress_regex.search(line)
            if match_progress:
                process_status_llama["progress"] = int(match_progress.group(1))
        
        process.wait()  # Wait for the process to complete
        process_status_llama["running"] = False
        process_status_llama["completed"] = True
        process_status_llama["progress"] = 100
        print("proccess complete")
    except Exception as e:
        process_status_llama["running"] = False
        process_status_llama["completed"] = True
        process_status_llama["error"] = str(e)
        
def run_mistral_async():
    ollama_path = '/usr/local/bin/ollama'
    command = [ollama_path, 'run', 'mistral']
    
    # Regular expression to match the time left message format
    time_left_regex = re.compile(r'\b\d+m\d+s\b')
    progress_regex = re.compile(r'(\d+)%')

    try:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Monitor the process output in real-time
        for line in iter(process.stderr.readline, ''):
            print(line, end='')  # Debug: print each line to server log
            match = time_left_regex.search(line)
            if match:
                process_status_mistral["time_left"] = match.group()
                
            match_progress = progress_regex.search(line)
            if match_progress:
                process_status_mistral["progress"] = int(match_progress.group(1))
        
        process.wait()  # Wait for the process to complete
        print("proccess complete")
        process_status_mistral["running"] = False
        process_status_mistral["completed"] = True
        process_status_mistral["progress"] = 100
    except Exception as e:
        process_status_mistral["running"] = False
        process_status_mistral["completed"] = True
        process_status_mistral["error"] = str(e)
        

@app.route('/install-llama', methods=['POST'])
def run_llama():
    if not process_status_llama["running"]:
        process_status_llama["running"] = True
        process_status_llama["completed"] = False
        threading.Thread(target=run_llama_async()).start()
        return jsonify({"success": True, "message": "Ollama run initiated."})
    else:
        return jsonify({"success": False, "message": "Ollama run is already in progress."})
        
@app.route('/install-mistral', methods=['POST'])
def run_mistral():
    if not process_status_mistral["running"]:
        process_status_mistral["running"] = True
        process_status_mistral["completed"] = False
        threading.Thread(target=run_mistral_async).start()
        return jsonify({"success": True, "message": "Mistral run initiated."})
    else:
        return jsonify({"success": False, "message": "Ollama run is already in progress."})
# @app.route('/install-llama-and-mistral', methods=['POST'])
# def run_ollama():
#     try:
        
#         # Running the command 'ollama run llama2'
#         ollama_path = '/usr/local/bin/ollama'
#         print("running ollama run llama2")
#         result = subprocess.run([ollama_path, 'run', 'llama2'], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
#         print("running ollama run mistral")
#         result = subprocess.run([ollama_path, 'run', 'mistral'], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
#         # Return the standard output if the command was successful
#         return jsonify({"success": True, "message": "Ollama run successfully.", "output": result.stdout})
#     except subprocess.CalledProcessError as e:
#         # Return error message if the command failed
#         print(f"Ollama command failed with error: {e.stderr}")
#         print("test1")
#         return jsonify({"success": False, "message": "Failed to run Ollama.", "error": e.stderr}), 500
    
@app.route('/llama-status', methods=['POST'])
def llama_status():
    return jsonify(process_status_llama)

@app.route('/mistral-status', methods=['POST'])
def mistral_status():
    return jsonify(process_status_mistral)
    
""" @app.route('/install-mistral', methods=['POST'])
def run_mistral():
    try:
        print("test2")
        # Running the command 'ollama run llama2'
        result = subprocess.run(['ollama', 'run', 'mistral'], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        # Return the standard output if the command was successful
        return jsonify({"success": True, "message": "Ollama run successfully.", "output": result.stdout})
    except subprocess.CalledProcessError as e:
        # Return error message if the command failed
        print(f"Ollama command failed with error: {e.stderr}")
        print("test1")
        return jsonify({"success": False, "message": "Failed to run Ollama.", "error": e.stderr}), 500 """

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
        try:
            response = ollama.chat(model='llama2', messages=[
                {
                'role': 'user',
                'content': f'You are a factual chatbot that answers questions about uploaded documents. You only answer with answers you find in the text, no outside information. These are the sources from the text:{sources_str} And this is the question:{query}.',
                
                },
            ])
            answer = response['message']['content']
        except Exception as e:
            return jsonify({"error": "Error with llama2"}), 500
    else:
        print("using mistral")
        try:
            response = ollama.chat(model='mistral', messages=[
                {
                'role': 'user',
                'content': f'You are a factual chatbot that answers questions about uploaded documents. You only answer with answers you find in the text, no outside information. These are the sources from the text:{sources_str} And this is the question:{query}.',
                
                },
            ])
            answer = response['message']['content']
        except Exception as e:
            return jsonify({"error": "Error with Mistral"}), 500

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
