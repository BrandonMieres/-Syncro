import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { setupAuthHandlers } from './ipc/auth.js';
import { setupYoutubeHandlers } from './ipc/youtube.js';
import { setupSocialHandlers } from './ipc/social.js';
import { setupPublishHandlers } from './ipc/publish.js';
import { setupHistoryHandlers } from './ipc/history.js';
import { initLocalDb, closeLocalDb } from '../lib/localDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Establecer el ID del modelo de usuario de la aplicación para Windows
// Esto mejora cómo se ve y se agrupa la app en la barra de tareas
if (process.platform === 'win32') {
  app.setAppUserModelId('com.syncro.automation');
}

// Desactivar caché de shaders en disco para evitar errores inofensivos de "Acceso denegado" en desarrollo
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

function createWindow() {
  let iconPath = process.env.VITE_DEV_SERVER_URL 
    ? path.join(__dirname, '../src/assets/icon.png')
    : path.join(__dirname, '../dist/assets/icon.png');
    
  if (!fs.existsSync(iconPath)) {
    console.warn('⚠️ Icono no encontrado en:', iconPath);
    iconPath = undefined;
  }

  // Ruta absoluta garantizada para el preload
  const preloadPath = path.isAbsolute(path.join(__dirname, 'preload.cjs'))
    ? path.join(__dirname, 'preload.cjs')
    : path.resolve(app.getAppPath(), 'dist-electron', 'preload.cjs');

  const win = new BrowserWindow({
    width: 440,
    height: 620,
    title: 'Syncro',
    icon: iconPath,
    backgroundColor: '#0e0e12',
    resizable: false,
    frame: false,
    hasShadow: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Log de diagnóstico mejorado para el Preload
  if (!fs.existsSync(preloadPath)) {
    console.error('❌ ERROR CRÍTICO: Preload no encontrado en:', preloadPath);
    // Intentar ruta alternativa de respaldo
    const fallbackPath = path.join(process.cwd(), 'dist-electron', 'preload.cjs');
    console.log('🔍 Probando ruta de respaldo:', fallbackPath);
  } else {
    console.log('✅ Preload localizado correctamente en:', preloadPath);
  }

  // Interceptar enlaces externos para que se abran en el navegador por defecto (Chrome, Edge, etc.)
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

setupAuthHandlers();
setupYoutubeHandlers();
setupSocialHandlers();
setupPublishHandlers();
setupHistoryHandlers();

// Window Resize Handler (Registered once at top level)
ipcMain.handle('window:resize', (event, { width, height, resizable }) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.setResizable(resizable ?? true);
    window.setSize(width, height, true);
    window.center();
  }
  return { success: true };
});

// Window Controls Handlers
ipcMain.on('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
});

ipcMain.on('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

app.whenReady().then(() => {
  try {
    initLocalDb();
    createWindow();
  } catch (error) {
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Error Crítico de Inicio',
      `La aplicación no pudo iniciarse correctamente:\n\n${error.message}\n\nPor favor, contacta con soporte.`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  closeLocalDb();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});