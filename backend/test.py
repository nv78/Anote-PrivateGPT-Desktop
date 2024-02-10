import ollama

response = ollama.chat(model='llama2', messages=[
  {
    'role': 'user',
    'content': 'Where was world cup 2010?',
  },
])
print(response['message']['content'])