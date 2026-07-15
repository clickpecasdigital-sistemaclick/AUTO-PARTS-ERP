/**
 * Preload — AutoCore ERP Desktop
 * Expõe APIs seguras do Electron para o frontend React via contextBridge.
 * NUNCA expor nodeIntegration diretamente — usar apenas o que está aqui.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Info do app
  getVersion: () => ipcRenderer.invoke('app:version'),
  
  // Controles da janela
  quit:     () => ipcRenderer.invoke('app:quit'),
  minimize: () => ipcRenderer.invoke('app:minimize'),
  maximize: () => ipcRenderer.invoke('app:maximize'),
  
  // Utilitários
  openLogs:      () => ipcRenderer.invoke('app:open-logs'),
  checkUpdates:  () => ipcRenderer.invoke('app:check-updates'),

  // Detectar se está rodando no Electron
  isElectron: true,
  platform: process.platform,
});
