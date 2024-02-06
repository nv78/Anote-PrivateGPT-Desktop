import sqlite3
import os
import openai
from langchain.embeddings.openai import OpenAIEmbeddings
import os


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
            WHERE u.id = %s AND d.id = %s
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
