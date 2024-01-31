from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.llms import OpenAI
from langchain.vectorstores import Chroma
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from dotenv import load_dotenv
import ray
import openai
import datetime
import shutil
import time
import numpy as np
import PyPDF2
from sec_api import QueryApi, RenderApi
import requests

# from openai import OpenAI

# """Module for fetching data from the SEC EDGAR Archives"""
import json
import os
import re
import requests
import webbrowser
from typing import List, Optional, Tuple, Union
from ratelimit import limits, sleep_and_retry
import sys
if sys.version_info < (3, 8):
    from typing_extensions import Final
else:
    from typing import Final

from database.db import get_db_connection

load_dotenv()
API_KEY = os.getenv('OPENAI_API_KEY')
embeddings = OpenAIEmbeddings(openai_api_key= API_KEY)
sec_api_key = os.getenv('SEC_API_KEY')

MAX_CHUNK_SIZE = 1000

## General for all chatbots
# Chat_type is an integer where 0=chatbot, 1=Edgar, 2=PDFUploader, etc
def add_chat_to_db(user_email, chat_type, model_type): #intake the current userID and the model type into the chat table
    conn, cursor = get_db_connection()

    cursor.execute("SELECT id FROM users WHERE email = %s", [user_email])
    user_id = cursor.fetchone()['id']

    cursor.execute('INSERT INTO chats (user_id, model_type, associated_task) VALUES (%s, %s, %s)', (user_id, model_type, chat_type))
    chat_id = cursor.lastrowid

    name = f"Chat {chat_id}"
    cursor.execute('UPDATE chats SET chat_name = %s WHERE id = %s', (name, chat_id))

    conn.commit()
    conn.close()

    return chat_id

## General for all chatbots
# Worflow_type is an integer where 2=FinancialReports
def add_workflow_to_db(user_email, workflow_type): #intake the current userID into the workflow table
    conn, cursor = get_db_connection()

    cursor.execute("SELECT id FROM users WHERE email = %s", [user_email])
    user_id = cursor.fetchone()['id']

    cursor.execute('INSERT INTO workflows (user_id, associated_task) VALUES (%s, %s)', (user_id, workflow_type))
    workflow_id = cursor.lastrowid

    name = f"Workflow {workflow_id}"
    cursor.execute('UPDATE workflows SET workflow_name = %s WHERE id = %s', (name, workflow_id))

    conn.commit()
    conn.close()

    return workflow_id

def update_chat_name_db(user_email, chat_id, new_name):
    conn, cursor = get_db_connection()

    query = """
    UPDATE chats
    JOIN users ON chats.user_id = users.id
    SET chats.chat_name = %s
    WHERE chats.id = %s AND users.email = %s;
    """
    cursor.execute(query, (new_name, chat_id, user_email))

    conn.commit()
    conn.close()

    return

def retrieve_chats_from_db(user_email):
    conn, cursor = get_db_connection()

    query = """
        SELECT chats.id, chats.model_type, chats.chat_name, chats.associated_task, chats.ticker, chats.custom_model_key
        FROM chats
        JOIN users ON chats.user_id = users.id
        WHERE users.email = %s;
        """

    # Execute the query
    cursor.execute(query, [user_email])
    chat_info = cursor.fetchall()

    conn.commit()
    conn.close()

    return chat_info

def find_most_recent_chat_from_db(user_email):
    conn, cursor = get_db_connection()

    query = """
        SELECT chats.id, chats.chat_name
        FROM chats
        JOIN users ON chats.user_id = users.id
        WHERE users.email = %s
        ORDER BY chats.created DESC
        LIMIT 1;
    """

    # Execute the query
    cursor.execute(query, [user_email])
    chat_info = cursor.fetchone()

    conn.commit()
    conn.close()

    return chat_info


def retrieve_message_from_db(user_email, chat_id, chat_type):
    conn, cursor = get_db_connection()

    query = """
        SELECT messages.created, messages.message_text, messages.sent_from_user, messages.relevant_chunks
        FROM messages
        JOIN chats ON messages.chat_id = chats.id
        JOIN users ON chats.user_id = users.id
        WHERE chats.id = %s AND users.email = %s AND chats.associated_task = %s;
        """


    # Execute the query
    cursor.execute(query, (chat_id, user_email, chat_type))
    messages = cursor.fetchall()

    conn.commit()
    conn.close()

    return messages

def delete_chat_from_db(chat_id, user_email):
    print("delete chat from db")
    conn, cursor = get_db_connection()

    delete_chunks_query = """
    DELETE chunks
    FROM chunks
    INNER JOIN documents ON chunks.document_id = documents.id
    INNER JOIN chats ON documents.chat_id = chats.id
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = %s AND users.email = %s;
    """
    cursor.execute(delete_chunks_query, (chat_id, user_email))

    delete_documents_query = """
    DELETE documents
    FROM documents
    INNER JOIN chats ON documents.chat_id = chats.id
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = %s AND users.email = %s;
    """
    cursor.execute(delete_documents_query, (chat_id, user_email))

    delete_messages_query = """
    DELETE messages
    FROM messages
    INNER JOIN chats ON messages.chat_id = chats.id
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = %s AND users.email = %s;
    """
    cursor.execute(delete_messages_query, (chat_id, user_email))

    query = """
    DELETE chats
    FROM chats
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = %s AND users.email = %s;
    """
    cursor.execute(query, (chat_id, user_email))

    conn.commit()

    if cursor.rowcount > 0:
        print(f"Deleted chat with ID {chat_id} for user {user_email}.")
        conn.close()
        cursor.close()
        return 'Successfully deleted'
    else:
        print(f"No chat deleted. Chat ID {chat_id} may not exist or does not belong to user {user_email}.")
        conn.close()
        cursor.close()
        return 'Could not delete'

def reset_chat_db(chat_id, user_email):
    print("reset chat")
    conn, cursor = get_db_connection()

    delete_messages_query = """
    DELETE messages
    FROM messages
    INNER JOIN chats ON messages.chat_id = chats.id
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = %s AND users.email = %s;
    """
    cursor.execute(delete_messages_query, (chat_id, user_email))

    conn.commit()

    if cursor.rowcount > 0:
        print(f"Deleted chat with ID {chat_id} for user {user_email}.")
        conn.close()
        cursor.close()
        return 'Successfully deleted'
    else:
        print(f"No chat deleted. Chat ID {chat_id} may not exist or does not belong to user {user_email}.")
        conn.close()
        cursor.close()
        return 'Could not delete'
    
def reset_uploaded_docs(chat_id, user_email):
    conn, cursor = get_db_connection()

    delete_chunks_query = """
    DELETE chunks
    FROM chunks
    INNER JOIN documents ON chunks.document_id = documents.id
    INNER JOIN chats ON documents.chat_id = chats.id
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = %s AND users.email = %s;
    """
    cursor.execute(delete_chunks_query, (chat_id, user_email))

    delete_documents_query = """
    DELETE documents
    FROM documents
    INNER JOIN chats ON documents.chat_id = chats.id
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = %s AND users.email = %s;
    """
    cursor.execute(delete_documents_query, (chat_id, user_email))

    conn.commit()

    conn.close()
    cursor.close()

def reset_uploaded_docs_for_workflow(workflow_id, user_email):
    conn, cursor = get_db_connection()

    delete_chunks_query = """
    DELETE chunks
    FROM chunks
    INNER JOIN documents ON chunks.document_id = documents.id
    WHERE documents.workflow_id = %s;
    """
    cursor.execute(delete_chunks_query, (workflow_id,))

    delete_documents_query = """
    DELETE documents
    FROM documents
    WHERE documents.workflow_id = %s;
    """
    cursor.execute(delete_documents_query, (workflow_id,))

    conn.commit()

    conn.close()
    cursor.close()



def change_chat_mode_db(chat_mode_to_change_to, chat_id, user_email):
    conn, cursor = get_db_connection()

    query = """
    UPDATE chats
    JOIN users ON chats.user_id = users.id
    SET chats.model_type = %s
    WHERE chats.id = %s AND users.email = %s;
    """
    
    # Execute the query
    cursor.execute(query, (chat_mode_to_change_to, chat_id, user_email))

    conn.commit()
    conn.close()
    cursor.close()



# def add_document_to_db(text, document_name, chat_id):
#     conn, cursor = get_db_connection()

#     cursor.execute("SELECT id, document_text FROM documents WHERE document_name = %s AND chat_id = %s", (document_name, chat_id))
#     existing_doc = cursor.fetchone()

#     if existing_doc:
#         existing_doc_id, existing_doc_text = existing_doc
#         print("Doc named ", document_name, " exists. Do not create a new entry")
#         conn.close()
#         return existing_doc_id, True  # Returning the ID of the existing document


#     storage_key = "temp"
#     cursor.execute("INSERT INTO documents (chat_id, document_name, document_text, storage_key) VALUES (%s, %s, %s, %s)", (chat_id, document_name, text, storage_key))

#     doc_id = cursor.lastrowid

#     conn.commit()
#     conn.close()
#     cursor.close()

#     return doc_id, False

def add_document_to_db(text, document_name, chat_id=None, workflow_id=None):
    conn, cursor = get_db_connection()

    # Check if the document with the same name already exists for the given chat_id or workflow_id
    try:
        if chat_id is not None:
            cursor.execute("SELECT id, document_text FROM documents WHERE document_name = %s AND chat_id = %s", (document_name, chat_id))
        elif workflow_id is not None:
            cursor.execute("SELECT id, document_text FROM documents WHERE document_name = %s AND workflow_id = %s", (document_name, workflow_id))
        else:
            raise ValueError("Either chat_id or workflow_id must be provided.")

        existing_doc = cursor.fetchone()

        #if existing_doc:
        #    existing_doc_id, existing_doc_text = existing_doc
        #    print("Doc named", document_name, "exists. Do not create a new entry")
        #    conn.close()
        #    return existing_doc_id, True  # Returning the ID of the existing document

        storage_key = "temp"

        # Check if chat_id or workflow_id is provided and insert the document accordingly
        if chat_id is not None:
            cursor.execute("INSERT INTO documents (chat_id, document_name, document_text, storage_key) VALUES (%s, %s, %s, %s)", (chat_id, document_name, text, storage_key))
        elif workflow_id is not None:
            cursor.execute("INSERT INTO documents (workflow_id, document_name, document_text, storage_key) VALUES (%s, %s, %s, %s)", (workflow_id, document_name, text, storage_key))

        doc_id = cursor.lastrowid

        conn.commit()
    except:
        print("error")

    conn.close()
    cursor.close()

    return doc_id, False


@ray.remote
def chunk_document(text_pages, maxChunkSize, document_id):
    print("start chunk doc")

    conn, cursor = get_db_connection()

    globalStartIndex = 0
    page_number = 1

    for page_text in text_pages:
        startIndex = 0  # Start index for each page
        while startIndex < len(page_text):
            endIndex = startIndex + min(maxChunkSize, len(page_text) - startIndex)

            chunkText = page_text[startIndex:endIndex]
            chunkText = chunkText.replace("\n", "")

            embeddingVector = openai.embeddings.create(input=chunkText, model="text-embedding-ada-002").data[0].embedding
            embeddingVector = np.array(embeddingVector)
            blob = embeddingVector.tobytes()

            cursor.execute('INSERT INTO chunks (start_index, end_index, document_id, embedding_vector, page_number) VALUES (%s,%s,%s,%s,%s)', 
                           [globalStartIndex + startIndex, globalStartIndex + endIndex, document_id, blob, page_number])

            startIndex += maxChunkSize

        globalStartIndex += len(page_text)
        page_number += 1




    #chunks = []
    #startIndex = 0
#
    #while startIndex < len(unchunkedText):
    #    endIndex = startIndex + min(maxChunkSize, len(unchunkedText))
    #    chunkText = unchunkedText[startIndex:endIndex]
    #    chunkText = chunkText.replace("\n", "")
#
    #    embeddingVector = openai.embeddings.create(input=chunkText, model="text-embedding-ada-002").data[0].embedding
    #    embeddingVector = np.array(embeddingVector)
    #    blob = embeddingVector.tobytes()
    #    chunks.append({
    #        "text": chunkText,
    #        "start_index": startIndex,
    #        "end_index": endIndex,
    #        "embedding_vector": embeddingVector,
    #        "embedding_vector_blob": blob,
    #    })
    #    startIndex += maxChunkSize

    print("end chunk doc")


    #for chunk in chunks:
    #    cursor.execute('INSERT INTO chunks (start_index, end_index, document_id, embedding_vector) VALUES (%s,%s,%s,%s)', [chunk["start_index"], chunk["end_index"], document_id, chunk["embedding_vector_blob"]])

    conn.commit()
    conn.close()




def knn(x, y):
    x = np.expand_dims(x, axis=0)
    # Calculate cosine similarity
    similarities = np.dot(x, y.T) / (np.linalg.norm(x) * np.linalg.norm(y))
    # Convert similarities to distances
    distances = 1 - similarities.flatten()
    nearest_neighbors = np.argsort(distances)

    results = []
    for i in range(len(nearest_neighbors)):
        item = {
            "index": nearest_neighbors[i],
            "similarity_score": distances[nearest_neighbors[i]]
        }
        results.append(item)

    return results

def get_relevant_chunks(k, question, chat_id, user_email):
    conn, cursor = get_db_connection()

    query = """
    SELECT c.start_index, c.end_index, c.embedding_vector, c.document_id, c.page_number, d.document_name
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    JOIN chats ch ON d.chat_id = ch.id
    JOIN users u ON ch.user_id = u.id
    WHERE u.email = %s AND ch.id = %s
    """

    cursor.execute(query, (user_email, chat_id))
    rows = cursor.fetchall()

    embeddings = []
    for row in rows:
        embeddingVectorBlob = row["embedding_vector"]
        embeddingVector = np.frombuffer(embeddingVectorBlob)
        embeddings.append(embeddingVector)

    if (len(embeddings) == 0):
        res_list = []
        for i in range(k):
            res_list.append("No text found")
        return res_list

    embeddings = np.array(embeddings)

    embeddingVector = openai.embeddings.create(input=question, model="text-embedding-ada-002").data[0].embedding
    embeddingVector = np.array(embeddingVector)

    res = knn(embeddingVector, embeddings)

    #Get the k most relevant chunks
    source_chunks = []
    for i in range(k):
        source_id = res[i]['index']

        document_id = rows[source_id]['document_id']
        page_number = rows[source_id]['page_number']
        document_name = rows[source_id]['document_name']


        cursor.execute('SELECT document_text FROM documents WHERE id = %s', [document_id])
        doc_text = cursor.fetchone()['document_text']

        source_chunk = doc_text[rows[source_id]['start_index']:rows[source_id]['end_index']]
        source_chunks.append((source_chunk, page_number, document_name))
        #source_chunks.append(source_chunk)

    return source_chunks

def get_relevant_chunks_wf(k, question, workflow_id):
    conn, cursor = get_db_connection()

    query = """
    SELECT c.start_index, c.end_index, c.embedding_vector, c.document_id, c.page_number, d.document_name
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    JOIN workflows w ON d.workflow_id = w.id
    WHERE w.id = %s
    """

    cursor.execute(query, (workflow_id,))
    rows = cursor.fetchall()

    embeddings = []
    for row in rows:
        embeddingVectorBlob = row["embedding_vector"]
        embeddingVector = np.frombuffer(embeddingVectorBlob)
        embeddings.append(embeddingVector)

    if len(embeddings) == 0:
        res_list = ["No text found"] * k
        return res_list

    embeddings = np.array(embeddings)

    # Assuming that openai.embeddings.create is used to generate embeddings for the question
    embeddingVector = openai.embeddings.create(input=question, model="text-embedding-ada-002").data[0].embedding
    embeddingVector = np.array(embeddingVector)

    res = knn(embeddingVector, embeddings)

    # Get the k most relevant chunks
    source_chunks = []
    for i in range(k):
        source_id = res[i]['index']

        document_id = rows[source_id]['document_id']
        page_number = rows[source_id]['page_number']
        document_name = rows[source_id]['document_name']

        cursor.execute('SELECT document_text FROM documents WHERE id = %s', [document_id])
        doc_text = cursor.fetchone()['document_text']

        source_chunk = doc_text[rows[source_id]['start_index']:rows[source_id]['end_index']]
        source_chunks.append((source_chunk, page_number, document_name))

    return source_chunks

def add_sources_to_db(message_id, sources):
    combined_sources = ""

    for source in sources:
        chunk_text, page_number, document_name = source
        combined_sources += f"Document: {document_name}, Page {page_number}: {chunk_text}\n\n"

    conn, cursor = get_db_connection()

    cursor.execute('UPDATE messages SET relevant_chunks = %s WHERE id = %s', (combined_sources, message_id))

    conn.commit()

    cursor.close()
    conn.close()

def add_wf_sources_to_db(answer_id, sources):
    combined_sources = ""

    for source in sources:
        chunk_text, page_number, document_name = source
        combined_sources += f"Document: {document_name}, Page {page_number}: {chunk_text}\n\n"

    conn, cursor = get_db_connection()

    cursor.execute('UPDATE messages SET relevant_chunks = %s WHERE id = %s', (combined_sources, message_id))

    conn.commit()

    cursor.close()
    conn.close()
    

def add_message_to_db(text, chat_id, isUser):
    #If isUser is 0, it is a bot message, 1 is a user message
    conn, cursor = get_db_connection()

    cursor.execute('INSERT INTO messages (message_text, chat_id, sent_from_user) VALUES (%s,%s,%s)', (text, chat_id, isUser))
    message_id = cursor.lastrowid

    conn.commit()
    conn.close()
    cursor.close()

    return message_id

def retrieve_docs_from_db(chat_id, user_email):
    conn, cursor = get_db_connection()

    query = """
        SELECT documents.document_name, documents.id
        FROM documents
        JOIN chats ON documents.chat_id = chats.id
        JOIN users ON chats.user_id = users.id
        WHERE chats.id = %s AND users.email = %s;
        """

    # Execute the query
    cursor.execute(query, (chat_id, user_email))
    docs = cursor.fetchall()

    conn.commit()
    conn.close()

    return docs

def delete_doc_from_db(doc_id, user_email):
    #Deletes the document and the associated chunks in the db
    conn, cursor = get_db_connection()

    verification_query = """
            SELECT d.id
            FROM documents d
            JOIN chats c ON d.chat_id = c.id
            JOIN users u ON c.user_id = u.id
            WHERE u.email = %s AND d.id = %s
        """
    cursor.execute(verification_query, (user_email, doc_id))
    verification_result = cursor.fetchone()

    if verification_result:
        delete_chunks_query = "DELETE FROM chunks WHERE document_id = %s"
        cursor.execute(delete_chunks_query, (doc_id,))
        delete_document_query = "DELETE FROM documents WHERE id = %s"
        cursor.execute(delete_document_query, (doc_id,))
        conn.commit()
    else:
        print("Document does not belong to the user or does not exist.")

    cursor.close()
    conn.close()

    return "success"

def add_model_key_to_db(model_key, chat_id, user_email):
    conn, cursor = get_db_connection()

    update_query = """
        UPDATE chats
        JOIN users ON chats.user_id = users.id
        SET chats.custom_model_key = %s
        WHERE chats.id = %s AND users.email = %s;
        """

    cursor.execute(update_query, (model_key, chat_id, user_email))

    conn.commit()

#For edgar
queryApi = QueryApi(api_key=sec_api_key)

def check_valid_api(ticker):
    print("ticker backend is", ticker)
    year = 2023

    ticker_query = 'ticker:({})'.format(ticker)
    query_string = '{ticker_query} AND filedAt:[{year}-01-01 TO {year}-12-31] AND formType:"10-K" AND NOT formType:"10-K/A" AND NOT formType:NT'.format(ticker_query=ticker_query, year=year)

    query = {
        "query": { "query_string": { 
            "query": query_string,
            "time_zone": "America/New_York"
        } },
        "from": "0",
        "size": "200",
        "sort": [{ "filedAt": { "order": "desc" } }]
      }


    response = queryApi.get_filings(query)

    filings = response['filings']

    if not filings:
        return False
    else:
        return True
    

def download_10K_url_ticker(ticker):
    year = 2023

    ticker_query = 'ticker:({})'.format(ticker)
    query_string = '{ticker_query} AND filedAt:[{year}-01-01 TO {year}-12-31] AND formType:"10-K" AND NOT formType:"10-K/A" AND NOT formType:NT'.format(ticker_query=ticker_query, year=year)

    query = {
        "query": { "query_string": { 
            "query": query_string,
            "time_zone": "America/New_York"
        } },
        "from": "0",
        "size": "200",
        "sort": [{ "filedAt": { "order": "desc" } }]
      }


    response = queryApi.get_filings(query)

    filings = response['filings']

    if filings:
       ticker=filings[0]['ticker']
       url=filings[0]['linkToFilingDetails']
    else:
       ticker = None
       url = None
    
    return url, ticker

def download_filing_as_pdf(url, ticker):
    API_ENDPOINT = "https://api.sec-api.io/filing-reader"

    api_url = API_ENDPOINT + "?token=" + sec_api_key + "&url=" + url + "&type=pdf"

    response = requests.get(api_url)

    file_name = f"{ticker}.pdf"

    with open(file_name, 'wb') as f:
        f.write(response.content)

    return file_name

def get_text_from_edgar(ticker):
    try:
        text = get_form_by_ticker(ticker, '10-K', company='Anote', email='vidranatan@gmail.com')
    except Exception as e:
        print(f"Error. This ticker is not valid. Please input a valid ticker")
        return

    text = re.sub('<[^>]+>', '', text)

    #get rid of blank lines
    lines = text.split('\n')
    non_blank_lines = [line for line in lines if line.strip()]
    text = '\n'.join(non_blank_lines)

    #Get rid of certain sections
    pattern = r'^X.*?\n-.*?\n(\+.*?\n)+.*?Period Type.*?\n'
    text = re.sub(pattern, '', text, flags=re.DOTALL|re.MULTILINE)

    #remove css
    pattern = r'\..*?\{.*?\}'
    text = re.sub(pattern, '', text, flags=re.DOTALL)

    #remove json like text
    pattern = r'\{.*?\}'
    text = re.sub(pattern, '', text, flags=re.DOTALL)

    # pattern = r'\.xlsx.*'
    #text = re.sub(pattern, '', text, flags=re.DOTALL)



    return text

def add_ticker_to_chat_db(chat_id, ticker, user_email, isUpdate):
    conn, cursor = get_db_connection()

    if isUpdate:
        try: 
            reset_chat_db(chat_id, user_email)
        except:
            return "Error"
    
    query = """UPDATE chats
    JOIN users ON chats.user_id = users.id
    SET chats.ticker = %s
    WHERE users.email = %s AND chats.id = %s"""

    cursor.execute(query, (ticker, user_email, chat_id))

    conn.commit()

    cursor.close()
    conn.close()

    return "Success"


#specific to PDF reader
def get_text_from_single_file(file):
    reader = PyPDF2.PdfReader(file)
    text = ""

    for page_num in range(len(reader.pages)):

        text += reader.pages[page_num].extract_text()

    return text

def get_text_pages_from_single_file(file):
    reader = PyPDF2.PdfReader(file)
    pages_text = []

    for page_num in range(len(reader.pages)):
        page_text = reader.pages[page_num].extract_text()
        pages_text.append(page_text)


    return pages_text #text

def add_ticker_to_workflow_db(workflow_id, ticker, user_email):
    conn, cursor = get_db_connection()

    # Retrieve existing tickers
    cursor.execute("SELECT tickers FROM workflows WHERE id = %s", (workflow_id,))
    existing_tickers = cursor.fetchone()

    if existing_tickers:
        existing_tickers = existing_tickers[0]
        existing_tickers.append(ticker)
    else:
        existing_tickers = [ticker]

    # Update the tickers field
    query = """UPDATE workflows
               SET tickers = %s
               WHERE id = %s"""

    cursor.execute(query, (existing_tickers, workflow_id))

    conn.commit()

    cursor.close()
    conn.close()

    return "Success"

# Adding a prompt to a workflow
def add_prompt_to_workflow_db(workflow_id, prompt_text):
    conn, cursor = get_db_connection()

    query = """INSERT INTO prompts (workflow_id, prompt_text) VALUES (%s, %s)"""
    cursor.execute(query, (workflow_id, prompt_text))

    conn.commit()
    cursor.close()
    conn.close()

    return "Success"

def remove_ticker_from_workflow_db(workflow_id, ticker, user_email):
    conn, cursor = get_db_connection()

    # Retrieve existing tickers
    cursor.execute("SELECT tickers FROM workflows WHERE id = %s", (workflow_id,))
    existing_tickers = cursor.fetchone()

    if existing_tickers:
        existing_tickers = existing_tickers[0]
        if ticker in existing_tickers:
            existing_tickers.remove(ticker)
        else:
            # Ticker not found in the array
            return "Ticker not found"
    else:
        # No existing tickers
        return "No tickers to remove"

    # Update the tickers field
    query = """UPDATE workflows
               SET tickers = %s
               WHERE id = %s"""

    cursor.execute(query, (existing_tickers, workflow_id))

    conn.commit()

    cursor.close()
    conn.close()

    return "Success"

# Removing a prompt from a workflow
def remove_prompt_from_workflow_db(prompt_id):
    conn, cursor = get_db_connection()

    query = """DELETE FROM prompts WHERE id = %s"""
    cursor.execute(query, (prompt_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return "Success"


