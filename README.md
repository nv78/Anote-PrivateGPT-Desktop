<<<<<<< HEAD
# Anote-PrivateGPT-Desktop
=======
To Run the code:
1. Open backend folder in terminal
`cd backend`

2. Create a virtual env in 
`python3 -m venv venv`
`source venv/bin/activate`

3. Install pyinstaller
`pip install pyinstaller`

4. Build the backend

To include the db: `pyinstaller --onefile app.py --add-data "database.db:."`

Note: might have to do `pyinstaller --onefile app.py --hidden-import flask`

6. Open frontend folder in terminal
`cd ..`
`cd frontend`

7. Install dependencies and Build react app
`npm install --force`
`npm run build`

8. Go back to main folder
`cd ..`

9. Install all dependencies and run electron
`npm install`
`npm start`


Install private models (should include this under installation instructions under the app later):
1. Follow installation instructions at https://github.com/ollama/ollama
2. On your terminal, run `ollama run llama2` (let's make this a shell script that is spawned as a child function?)
>>>>>>> c8153177aef46f27e6e61fb50dd6da7e06732879
