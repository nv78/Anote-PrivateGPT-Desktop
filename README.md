# Anote-PrivateGPT-Desktop

## How to run it locally
1. Clone the repo `git clone https://github.com/nv78/Anote-PrivateGPT-Desktop` and `cd Anote-Private-GPT`

### Backend
First, compile the backend
1. `cd backend`
2. Create a virtual env in 
`python -m venv venv`
`source venv/bin/activate`

3. Install requirements
`pip install -r requirements.txt`

4. Compile
`pyinstaller --onefile app.py --add-data "database.db:."`

5. Now, you should have an output in ./backend/dist called app. You will copy this into ./appdist

### Frontend
1. `cd frontend`
2. Install dependencies and Build react app
`npm install --force`
`npm run build`

### Install Ollama
1. Go to https://ollama.com/download and download Ollama for Mac.

2. Once you have followed installation instructions, you will want to run `ollama run llama2` and `ollama run mistral`

### Running the whole app
1. In the home directory (/Anote-Private-GPT), you will install dependencies:
`npm install --force`

2. Then you will run the app by doing `npm run start`

## Dev stuff
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

Put the flask app, which is in the folder backend/dist in appdist

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

10. To package/bundle, run for mac: `npm run make`, and for Linux: `sudo npx electron-forge make --platform=linux --arch=x64`


Install private models (should include this under installation instructions under the app later):
1. Follow installation instructions at https://github.com/ollama/ollama
2. On your terminal, run `ollama run llama2` (let's make this a shell script that is spawned as a child function?)
