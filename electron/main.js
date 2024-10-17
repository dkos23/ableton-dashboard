const { app, BrowserWindow } = require('electron');
const path = require('path');

// Use dynamic import for ESM module 'electron-is-dev'
async function createWindow() {
  const isDev = (await import('electron-is-dev')).default;  // Dynamically import the module
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:3001');  // Development URL
  } else {
    win.loadURL('http://localhost:3001');  // Production URL (your Express server)
  }
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
