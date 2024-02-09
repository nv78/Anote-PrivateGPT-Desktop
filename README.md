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
