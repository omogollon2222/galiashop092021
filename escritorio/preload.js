// Galia Shop · avisa a la app web que se está usando la versión de escritorio
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('galiaDesktop', { version: '1.0.0', plataforma: 'windows' });
