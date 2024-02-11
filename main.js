const { app, BrowserWindow } = require("electron");
const express = require("express");
const path = require("path");

const { spawn } = require("child_process");

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

    // Start the Flask backend
    const backendPath = path.join(__dirname, "backend/dist/app");
    flaskProcess = spawn(backendPath);

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
