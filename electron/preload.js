const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message', message),
  onReceiveMessage: (callback) => ipcRenderer.on('reply', (event, message) => callback(message)),
});