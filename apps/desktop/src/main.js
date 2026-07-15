/**
 * AutoCore ERP — Electron Main Process
 * 
 * Fluxo ao iniciar:
 * 1. Mostra splash screen
 * 2. Inicia o servidor NestJS (API) como processo filho
 * 3. Aguarda a API estar pronta (porta 3333)
 * 4. Abre a janela principal carregando o frontend React
 */

const { app, BrowserWindow, Menu, shell, dialog, ipcMain, Tray, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// ---- CONFIGURAÇÃO ----------------------------------------------------------

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const API_PORT = 3333;
const WEB_PORT = 5173;

log.transports.file.level = 'info';
log.info('AutoCore ERP iniciando...', { version: app.getVersion(), isDev });

// ---- VARIÁVEIS GLOBAIS -----------------------------------------------------

let mainWindow = null;
let splashWindow = null;
let apiProcess = null;
let tray = null;
let isQuitting = false;

// ---- SPLASH SCREEN ---------------------------------------------------------

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 350,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

// ---- JANELA PRINCIPAL -------------------------------------------------------

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    show: false,
    title: 'AutoCore ERP',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    titleBarStyle: 'default',
    autoHideMenuBar: false,
  });

  // Carregar o frontend
  const webUrl = isDev
    ? `http://localhost:${WEB_PORT}`
    : `http://localhost:${API_PORT}`;

  mainWindow.loadURL(webUrl);

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
    }
    mainWindow.show();
    mainWindow.focus();
    log.info('Janela principal aberta');
  });

  // Fechar para bandeja do sistema (não encerrar)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      showTrayNotification();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Abrir links externos no browser padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  buildMenu();
}

// ---- MENU -------------------------------------------------------------------

function buildMenu() {
  const template = [
    {
      label: 'AutoCore ERP',
      submenu: [
        { label: 'Sobre o AutoCore ERP', click: showAbout },
        { type: 'separator' },
        { label: 'Verificar Atualizações', click: () => autoUpdater.checkForUpdatesAndNotify() },
        { type: 'separator' },
        { label: 'Sair', accelerator: 'Alt+F4', click: quitApp },
      ],
    },
    {
      label: 'Visualizar',
      submenu: [
        { label: 'Recarregar', accelerator: 'F5', role: 'reload' },
        { label: 'Forçar Recarregar', accelerator: 'Ctrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Zoom +', accelerator: 'Ctrl+=', role: 'zoomIn' },
        { label: 'Zoom -', accelerator: 'Ctrl+-', role: 'zoomOut' },
        { label: 'Zoom Padrão', accelerator: 'Ctrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Tela Cheia', accelerator: 'F11', role: 'togglefullscreen' },
        ...(isDev ? [
          { type: 'separator' },
          { label: 'DevTools', accelerator: 'F12', role: 'toggleDevTools' },
        ] : []),
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        { label: 'Documentação', click: () => shell.openExternal('https://docs.autocore.com') },
        { label: 'Suporte', click: () => shell.openExternal('mailto:suporte@autocore.com') },
        { type: 'separator' },
        { label: 'Logs do Sistema', click: () => shell.openPath(log.transports.file.getFile().path) },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---- BANDEJA DO SISTEMA (Tray) ----------------------------------------------

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
  const icon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();
  
  tray = new Tray(icon);
  tray.setToolTip('AutoCore ERP');

  const menu = Menu.buildFromTemplate([
    { label: 'Abrir AutoCore ERP', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: 'separator' },
    { label: 'Sair', click: quitApp },
  ]);

  tray.setContextMenu(menu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

function showTrayNotification() {
  if (tray) {
    tray.displayBalloon?.({
      title: 'AutoCore ERP',
      content: 'O sistema continua rodando em segundo plano.',
      iconType: 'info',
    });
  }
}

// ---- SERVIDOR API (NestJS) --------------------------------------------------

function startApiServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      log.info('Modo DEV: API deve estar rodando em http://localhost:3333');
      resolve();
      return;
    }

    const apiPath = path.join(process.resourcesPath, 'api', 'main.js');
    
    if (!fs.existsSync(apiPath)) {
      log.error('API não encontrada em:', apiPath);
      reject(new Error('Servidor API não encontrado'));
      return;
    }

    log.info('Iniciando servidor API:', apiPath);

    // Definir variáveis de ambiente para a API embutida
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(API_PORT),
      // Banco: usa SQLite local por padrão na versão desktop
      // Para usar Supabase: configurar nas Configurações do app
      DATABASE_URL: getDatabaseUrl(),
      ELECTRON_APP: 'true',
      APP_VERSION: app.getVersion(),
    };

    apiProcess = spawn(process.execPath, [apiPath], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    apiProcess.stdout.on('data', (data) => log.info('[API]', data.toString().trim()));
    apiProcess.stderr.on('data', (data) => log.error('[API]', data.toString().trim()));
    
    apiProcess.on('error', (err) => {
      log.error('Erro ao iniciar API:', err);
      reject(err);
    });

    apiProcess.on('exit', (code) => {
      if (!isQuitting) {
        log.error(`API encerrou inesperadamente com código ${code}`);
        dialog.showErrorBox('Erro', 'O servidor interno parou inesperadamente. O sistema será reiniciado.');
        app.relaunch();
        app.exit();
      }
    });

    // Aguardar API estar pronta
    waitForApi(API_PORT, 30000).then(resolve).catch(reject);
  });
}

function waitForApi(port, timeout) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(`http://localhost:${port}/api/v1/health/liveness`, (res) => {
        if (res.statusCode === 200) {
          log.info(`API pronta na porta ${port}`);
          resolve();
        } else {
          retry();
        }
      });
      req.on('error', retry);
      req.setTimeout(1000);
    };

    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error(`API não respondeu em ${timeout}ms`));
      } else {
        setTimeout(check, 500);
      }
    };

    check();
  });
}

function getDatabaseUrl() {
  // Banco SQLite local (para modo offline/desktop)
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'autocore.db');
  return `file:${dbPath}`;
}

// ---- ATUALIZAÇÕES AUTOMÁTICAS -----------------------------------------------

function setupAutoUpdater() {
  autoUpdater.logger = log;
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização disponível',
      message: `Uma nova versão (${info.version}) está disponível. Deseja baixar agora?`,
      buttons: ['Sim, baixar', 'Depois'],
    }).then(({ response }) => {
      if (response === 0) autoUpdater.downloadUpdate();
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização pronta',
      message: 'A atualização foi baixada. O sistema será reiniciado para aplicar.',
      buttons: ['Reiniciar agora'],
    }).then(() => {
      isQuitting = true;
      autoUpdater.quitAndInstall();
    });
  });
}

// ---- DIÁLOGOS ---------------------------------------------------------------

function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Sobre o AutoCore ERP',
    message: 'AutoCore ERP',
    detail: [
      `Versão: ${app.getVersion()}`,
      `Electron: ${process.versions.electron}`,
      `Node.js: ${process.versions.node}`,
      '',
      'Sistema de Gestão para Oficinas Mecânicas',
      'e Distribuidoras de Autopeças.',
      '',
      '© 2026 AutoCore Tecnologia',
    ].join('\n'),
    buttons: ['Fechar'],
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
  });
}

function quitApp() {
  isQuitting = true;
  if (apiProcess) {
    apiProcess.kill('SIGTERM');
  }
  app.quit();
}

// ---- INICIALIZAÇÃO ----------------------------------------------------------

app.whenReady().then(async () => {
  createSplash();
  createTray();

  try {
    await startApiServer();
    createMainWindow();
    if (!isDev) setupAutoUpdater();
  } catch (error) {
    log.error('Falha na inicialização:', error);
    dialog.showErrorBox(
      'Erro ao iniciar',
      `Não foi possível iniciar o servidor interno:\n${error.message}\n\nConsulte os logs para mais detalhes.`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // No Windows: manter rodando na bandeja
  }
});

app.on('activate', () => {
  if (mainWindow === null) createMainWindow();
  else { mainWindow.show(); mainWindow.focus(); }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('quit', () => {
  if (apiProcess) apiProcess.kill();
  log.info('AutoCore ERP encerrado');
});

// ---- IPC (comunicação com o frontend) ---------------------------------------

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:quit', quitApp);
ipcMain.handle('app:minimize', () => mainWindow?.minimize());
ipcMain.handle('app:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('app:open-logs', () => shell.openPath(log.transports.file.getFile().path));
ipcMain.handle('app:check-updates', () => autoUpdater.checkForUpdatesAndNotify());
