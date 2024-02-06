import sqlite3
import os
import openai
from langchain.embeddings.openai import OpenAIEmbeddings
import os


API_KEY = os.getenv('OPENAI_API_KEY')
embeddings = OpenAIEmbeddings(openai_api_key= API_KEY)
sec_api_key = os.getenv('SEC_API_KEY')

def get_db_connection():
    db_path = './database/database.db'

    db_absolute_path = os.path.abspath(db_path)
    
    # Print the absolute path for debugging
    print(f"Database absolute path: {db_absolute_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    return conn, cursor

## General for all chatbots
# Chat_type is an integer where 0=chatbot, 1=Edgar, 2=PDFUploader, etc
def add_chat_to_db(chat_type, model_type): #intake the current userID and the model type into the chat table
    conn, cursor = get_db_connection()


    user_id = 1

    cursor.execute('INSERT INTO chats (user_id, model_type, associated_task) VALUES (?, ?, ?)', (user_id, model_type, chat_type))
    chat_id = cursor.lastrowid

    name = f"Chat {chat_id}"
    cursor.execute('UPDATE chats SET chat_name = ? WHERE id = ?', (name, chat_id))

    conn.commit()
    conn.close() 

    return chat_id