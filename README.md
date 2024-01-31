To Run the code:
1. Open backend folder in terminal
`cd backend`

2. Create a virtual env in 
`python3 -m venv venv`
`source venv/bin/activate`

3. Install pyinstaller
`pip install pyinstaller`

4. Build the backend
`pyinstaller --onefile app.py`

5. Open frontend folder in terminal
`cd ..`
`cd frontend`

6. Install dependencies and Build react app
`npm install --force`
`npm run build`

7. Go back to main folder
`cd ..`

8. Install all dependencies and run electron
`npm install`
`npm start`
