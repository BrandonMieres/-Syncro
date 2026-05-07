const { contextBridge, ipcRenderer } = require('electron');

const validChannels = [
  'auth:login', 'auth:register', 
  'youtube:getVideos', 'youtube:addChannel', 'youtube:getChannels',
  'social:saveAccount', 'social:getAccountsStatus', 'social:deleteAccount', 'social:getAllAccountsCredentials',
  'publish:video', 'templates:save', 'templates:get',
  'history:getLogs', 'history:clearLogs', 'window:resize',
  'window:minimize', 'window:maximize', 'window:close',
  'settings:save', 'settings:get'
];

// Flag que permite al renderer detectar que está dentro de Electron
contextBridge.exposeInMainWorld('__ELECTRON__', true);

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  invoke: (channel, data) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Canal no válido: ${channel}`));
  },
  on: (channel, func) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  off: (channel, func) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  }
});

console.log('✅ Syncro API Bridge cargado correctamente');