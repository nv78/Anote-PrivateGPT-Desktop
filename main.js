const { app, BrowserWindow } = require("electron");
const express = require("express");
const path = require("path");

const { spawn } = require("child_process");

const log = require('electron-log');

console.log = log.log;
console.error = log.error;

//console.log(log.transports.file.getFile().path);

let flaskProcess = null;

// Create Express app
const server = express();

// Serve static files from the React app
const staticPath = path.join(__dirname, "./frontend/build");
server.use(express.static(staticPath));

// Start the server
const PORT = 3000; // You can choose any port
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    log.info("create window created")

    // Start the Flask backend
    //const backendPath = path.join(__dirname, "backend/dist/app");
    //console.log("backend path is", backendPath)

    let appDistPath;
    if (process.env.NODE_ENV === 'production') {
        appDistPath = path.join(process.resourcesPath, 'appdist');
        console.log('appDistPath', appDistPath);
    } else {
        appDistPath = path.join(__dirname, '..', 'appdist');
        console.log('appDistPath', appDistPath);
    }

    const dbPath = path.join(appDistPath, 'database.db');

    let backendPath = executablePath = path.join(appDistPath, 'app');
    log.info('backendPath', backendPath);

    flaskProcess = spawn(backendPath, [], {
        env: {
            ...process.env, // Pass existing environment variables
            DB_PATH: dbPath // Pass the database path as an environment variable
        }
    });
    

    flaskProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(`Flask stdout: ${message}`);
        log.info(`Flask stdout: ${message}`);
    });
    
    flaskProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error(`Flask stderr: ${message}`);
        log.info(`Flask stderr: ${message}`);
    });


    flaskProcess.on("error", (err) => {
        console.error("Failed to start Flask process:", err);
    });

    // Load the local server URL
    win.loadURL(`http://localhost:${PORT}`);

    // Open the DevTools.
    win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on("will-quit", () => {
    // Ensure Flask process is killed when Electron app closes
    if (flaskProcess) flaskProcess.kill();
});
