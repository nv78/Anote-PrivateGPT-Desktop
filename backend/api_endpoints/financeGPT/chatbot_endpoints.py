import sqlite3
import os
import openai
from langchain.embeddings.openai import OpenAIEmbeddings
import os
import ray
import numpy as np


API_KEY = os.getenv('OPENAI_API_KEY')
embeddings = OpenAIEmbeddings(openai_api_key= API_KEY)
sec_api_key = os.getenv('SEC_API_KEY')

USER_ID = 1

def get_db_connection():
    db_path = './database/database.db'
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    return conn, cursor

## General for all chatbots
# Chat_type is an integer where 0=chatbot, 1=Edgar, 2=PDFUploader, etc
def add_chat_to_db(chat_type, model_type): #intake the current userID and the model type into the chat table
    conn, cursor = get_db_connection()

    cursor.execute('INSERT INTO chats (user_id, model_type, associated_task) VALUES (?, ?, ?)', (USER_ID, model_type, chat_type))
    chat_id = cursor.lastrowid

    name = f"Chat {chat_id}"
    cursor.execute('UPDATE chats SET chat_name = ? WHERE id = ?', (name, chat_id))

    conn.commit()
    conn.close() 

    return chat_id

def update_chat_name_db(chat_id, new_name):
    conn, cursor = get_db_connection()

    query = """
    UPDATE chats
    JOIN users ON chats.user_id = users.id
    SET chats.chat_name = ?
    WHERE chats.id = ? AND users.id = ?;
    """
    cursor.execute(query, (new_name, chat_id, USER_ID))

    conn.commit()
    conn.close()

    return

def retrieve_chats_from_db():
    conn, cursor = get_db_connection()

    query = """
        SELECT chats.id, chats.model_type, chats.chat_name, chats.associated_task, chats.ticker, chats.custom_model_key
        FROM chats
        JOIN users ON chats.user_id = users.id
        WHERE users.id = ?;
        """

    # Execute the query
    cursor.execute(query, (USER_ID,))
    chat_info = cursor.fetchall()

    conn.close()

    return chat_info


def retrieve_message_from_db(chat_id, chat_type):
    conn, cursor = get_db_connection()

    query = """
        SELECT messages.created, messages.message_text, messages.sent_from_user, messages.relevant_chunks
        FROM messages
        JOIN chats ON messages.chat_id = chats.id
        JOIN users ON chats.user_id = users.id
        WHERE chats.id = ? AND users.id = ? AND chats.associated_task = ?;
        """


    # Execute the query
    cursor.execute(query, (chat_id, USER_ID, chat_type))
    messages = cursor.fetchall()

    conn.commit()
    conn.close()

    return messages


def delete_chat_from_db(chat_id):
    print("delete chat from db")
    conn, cursor = get_db_connection()

    delete_chunks_query = """
    DELETE chunks
    FROM chunks
    INNER JOIN documents ON chunks.document_id = documents.id
    INNER JOIN chats ON documents.chat_id = chats.id
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = ? AND users.id = ?;
    """
    cursor.execute(delete_chunks_query, (chat_id, USER_ID))

    delete_documents_query = """
    DELETE documents
    FROM documents
    INNER JOIN chats ON documents.chat_id = chats.id
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = ? AND users.id = ?;
    """
    cursor.execute(delete_documents_query, (chat_id, USER_ID))

    delete_messages_query = """
    DELETE messages
    FROM messages
    INNER JOIN chats ON messages.chat_id = chats.id
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = ? AND users.id = ?;
    """
    cursor.execute(delete_messages_query, (chat_id, USER_ID))

    query = """
    DELETE chats
    FROM chats
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = ? AND users.id = ?;
    """
    cursor.execute(query, (chat_id, USER_ID))

    conn.commit()

    if cursor.rowcount > 0:
        print(f"Deleted chat with ID {chat_id} for user {USER_ID}.")
        conn.close()
        cursor.close()
        return 'Successfully deleted'
    else:
        print(f"No chat deleted. Chat ID {chat_id} may not exist or does not belong to user {USER_ID}.")
        conn.close()
        cursor.close()
        return 'Could not delete'


def reset_chat_db(chat_id):
    print("reset chat")
    conn, cursor = get_db_connection()

    delete_messages_query = """
    DELETE messages
    FROM messages
    INNER JOIN chats ON messages.chat_id = chats.id
    INNER JOIN users ON chats.user_id = users.id
    WHERE chats.id = ? AND users.id = ?;
    """
    cursor.execute(delete_messages_query, (chat_id, USER_ID))

    conn.commit()

    if cursor.rowcount > 0:
        print(f"Deleted chat with ID {chat_id} for user {USER_ID}.")
        conn.close()
        cursor.close()
        return 'Successfully deleted'
    else:
        print(f"No chat deleted. Chat ID {chat_id} may not exist or does not belong to user {USER_ID}.")
        conn.close()
        cursor.close()
        return 'Could not delete'
    

def find_most_recent_chat_from_db():
    conn, cursor = get_db_connection()

    query = """
        SELECT chats.id, chats.chat_name
        FROM chats
        JOIN users ON chats.user_id = users.id
        WHERE users.id = ?
        ORDER BY chats.created DESC
        LIMIT 1;
    """

    # Execute the query
    cursor.execute(query, (USER_ID,))
    chat_info = cursor.fetchone()

    conn.commit()
    conn.close()

    return chat_info

def change_chat_mode_db(chat_mode_to_change_to, chat_id):
    conn, cursor = get_db_connection()

    query = """
    UPDATE chats
    JOIN users ON chats.user_id = users.id
    SET chats.model_type = ?
    WHERE chats.id = ? AND users.id = ?;
    """
    
    # Execute the query
    cursor.execute(query, (chat_mode_to_change_to, chat_id, USER_ID))

    conn.commit()
    conn.close()

def add_document_to_db(text, document_name, chat_id):
    conn, cursor = get_db_connection()

    cursor.execute("SELECT id, document_text FROM documents WHERE document_name = ? AND chat_id = ?", (document_name, chat_id))
    existing_doc = cursor.fetchone()

    if existing_doc:
        existing_doc_id, existing_doc_text = existing_doc
        print("Doc named ", document_name, " exists. Do not create a new entry")
        conn.close()
        return existing_doc_id, True  # Returning the ID of the existing document


    storage_key = "temp"
    cursor.execute("INSERT INTO documents (chat_id, document_name, document_text, storage_key) VALUES (?, ?, ?, ?)", (chat_id, document_name, text, storage_key))

    doc_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return doc_id, False

@ray.remote
def chunk_document(text, maxChunkSize, document_id):
    conn, cursor = get_db_connection()

    chunks = []
    startIndex = 0

    while startIndex < len(text):
        endIndex = startIndex + min(maxChunkSize, len(text))
        chunkText = text[startIndex:endIndex]
        chunkText = chunkText.replace("\n", "")

        embeddingVector = openai.embeddings.create(input=chunkText, model="text-embedding-ada-002").data[0].embedding
        embeddingVector = np.array(embeddingVector)
        blob = embeddingVector.tobytes()
        chunks.append({
            "text": chunkText,
            "start_index": startIndex,
            "end_index": endIndex,
            "embedding_vector": embeddingVector,
            "embedding_vector_blob": blob,
        })
        startIndex += maxChunkSize

    for chunk in chunks:
        cursor.execute('INSERT INTO chunks (start_index, end_index, document_id, embedding_vector) VALUES (?,?,?,?)', [chunk["start_index"], chunk["end_index"], document_id, chunk["embedding_vector_blob"]])

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

def get_relevant_chunks(k, question, chat_id):
    conn, cursor = get_db_connection()

    query = """
    SELECT c.start_index, c.end_index, c.embedding_vector, c.document_id, c.page_number, d.document_name
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    JOIN chats ch ON d.chat_id = ch.id
    JOIN users u ON ch.user_id = u.id
    WHERE u.id = ? AND ch.id = ?
    """

    cursor.execute(query, (USER_ID, chat_id))
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


        cursor.execute('SELECT document_text FROM documents WHERE id = ?', (document_id,))
        doc_text = cursor.fetchone()['document_text']

        source_chunk = doc_text[rows[source_id]['start_index']:rows[source_id]['end_index']]
        source_chunks.append((source_chunk, page_number, document_name))
        #source_chunks.append(source_chunk)

    return source_chunks

def add_sources_to_db(message_id, sources):
    combined_sources = ""

    for source in sources:
        chunk_text, page_number, document_name = source
        combined_sources += f"Document: {document_name}, Page {page_number}: {chunk_text}\n\n"

    conn, cursor = get_db_connection()

    cursor.execute('UPDATE messages SET relevant_chunks = ? WHERE id = ?', (combined_sources, message_id))

    conn.commit()

    cursor.close()
    conn.close()

def add_message_to_db(text, chat_id, isUser):
    #If isUser is 0, it is a bot message, 1 is a user message
    conn, cursor = get_db_connection()

    cursor.execute('INSERT INTO messages (message_text, chat_id, sent_from_user) VALUES (?,?,?)', (text, chat_id, isUser))
    message_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return message_id


def retrieve_docs_from_db(chat_id):
    conn, cursor = get_db_connection()

    query = """
        SELECT documents.document_name, documents.id
        FROM documents
        JOIN chats ON documents.chat_id = chats.id
        JOIN users ON chats.user_id = users.id
        WHERE chats.id = ? AND users.id = ?;
        """

    # Execute the query
    cursor.execute(query, (chat_id, USER_ID))
    docs = cursor.fetchall()

    conn.commit()
    conn.close()

    return docs


def delete_doc_from_db(doc_id):
    #Deletes the document and the associated chunks in the db
    conn, cursor = get_db_connection()

    verification_query = """
            SELECT d.id
            FROM documents d
            JOIN chats c ON d.chat_id = c.id
            JOIN users u ON c.user_id = u.id
            WHERE u.id = ? AND d.id = ?
        """
    cursor.execute(verification_query, (USER_ID, doc_id))
    verification_result = cursor.fetchone()

    if verification_result:
        delete_chunks_query = "DELETE FROM chunks WHERE document_id = ?"
        cursor.execute(delete_chunks_query, (doc_id,))
        delete_document_query = "DELETE FROM documents WHERE id = ?"
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
        SET chats.custom_model_key = ?
        WHERE chats.id = ? AND users.email = ?;
        """

    cursor.execute(update_query, (model_key, chat_id, USER_ID))

    conn.commit()