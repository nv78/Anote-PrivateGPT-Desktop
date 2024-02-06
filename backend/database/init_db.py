import sqlite3

connection = sqlite3.connect('database.db')


with open('schema.sql') as f:
    connection.executescript(f.read())

cur = connection.cursor()

sql="""
INSERT INTO users (
    session_token, 
    session_token_expiration, 
    password_reset_token, 
    password_reset_token_expiration, 
    credits, 
    credits_updated, 
    chat_gpt_date, 
    num_chatgpt_requests
) VALUES (
    'sessionToken123', 
    '2023-01-01 00:00:00', 
    'passwordResetToken123', 
    '2023-01-01 00:00:00', 
    10, 
    '2023-01-01 00:00:00', 
    '2023-01-01 00:00:00', 
    5
);
"""

cur.execute(sql)

connection.commit()
connection.close()