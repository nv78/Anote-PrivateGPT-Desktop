const { app, BrowserWindow } = require("electron");
const express = require("express");
const path = require("path");

const { spawn } = require("child_process");

const log = require('electron-log');
const http = require('http');

console.log = log.log;
console.error = log.error;

//console.log(log.transports.file.getFile().path);

let flaskProcess = null;
let mainWindow = null;

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

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show: false // Initially don't show the window
    });

    mainWindow.loadURL(`http://localhost:${PORT}`);
    mainWindow.once('ready-to-show', () => {
        console.log("Main window is ready to show, waiting for delay...");
        // Do not call mainWindow.show() here
    });

    mainWindow.webContents.openDevTools();
}

function createWindow() {
    let appDistPath = process.env.NODE_ENV === 'production' ? path.join(process.resourcesPath, 'appdist') : path.join(__dirname, 'appdist');
    const dbPath = path.join(appDistPath, 'database.db');
    let backendPath = path.join(appDistPath, 'app');

    flaskProcess = spawn(backendPath, [], {
        env: { ...process.env, DB_PATH: dbPath }
    });

    flaskProcess.stdout.on('data', (data) => {
        console.log(`Flask stdout: ${data.toString()}`);
    });
    
    flaskProcess.stderr.on('data', (data) => {
        console.error(`Flask stderr: ${data.toString()}`);
    });

    flaskProcess.on("error", (err) => {
        console.error("Failed to start Flask process:", err);
    });

    createMainWindow(); // Initialize the window but don't show it yet

    function pingServer() {
        http.get(`http://localhost:${PORT}`, (res) => {
            if (res.statusCode === 200 && !mainWindow.isVisible()) {
                console.log("Flask server is ready. Waiting an additional 2 seconds before showing the main window.");
                // Wait an additional 2 seconds before showing the main window
                setTimeout(() => {
                    mainWindow.show();
                    console.log("Main window shown.");
                }, 2000); // Additional 2 seconds delay
            } else {
                setTimeout(pingServer, 2000);
            }
        }).on('error', () => {
            setTimeout(pingServer, 2000);
        });
    }


    setTimeout(pingServer, 5000); // Initial delay before starting to ping

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
