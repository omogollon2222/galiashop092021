// Galia Shop · App de escritorio para Windows
// Abre la app web oficial (GitHub Pages). Los datos viven en la hoja de Google Drive
// "Inventario_oficialGaliashop" a través del Apps Script, así que la computadora,
// el celular y la tablet ven siempre lo mismo. Cualquier mejora publicada en GitHub
// llega sola a la app instalada (no hay que reinstalar).
const { app, BrowserWindow, Menu, shell, session, dialog } = require('electron');
const path = require('path');

const APP_URL = 'https://omogollon2222.github.io/galiashop092021/';
const APP_HOST = 'omogollon2222.github.io';

let win = null;

// Una sola ventana: si se abre otra vez, se enfoca la existente
if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

function isAppUrl(u) {
  try { const x = new URL(u); return x.host === APP_HOST && x.pathname.startsWith('/galiashop092021'); }
  catch (e) { return false; }
}

function loadApp() {
  win.loadURL(APP_URL, { extraHeaders: 'pragma: no-cache\n' }).catch(() => {});
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 380, minHeight: 600,
    title: 'Galia Shop', backgroundColor: '#f7eef1', show: false,
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, spellcheck: true }
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });

  // Sin internet: muestra una pantalla con botón para reintentar
  win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => {
    if (!isMain || code === -3) return; // -3 = navegación cancelada (normal)
    win.loadFile(path.join(__dirname, 'offline.html'));
  });

  // Enlaces externos (Drive, WhatsApp, ChatGPT, etc.) se abren en el navegador normal
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url)) return { action: 'allow' };
    if (/^https?:|^mailto:|^tel:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (isAppUrl(url) || url.startsWith('file:')) return;
    e.preventDefault(); shell.openExternal(url);
  });

  loadApp();
}

function buildMenu() {
  const tpl = [
    { label: 'Galia Shop', submenu: [
      { label: 'Recargar', accelerator: 'F5', click: () => loadApp() },
      { label: 'Abrir en el navegador', click: () => shell.openExternal(APP_URL) },
      { label: 'Abrir hoja de Google Drive', click: () => shell.openExternal('https://docs.google.com/spreadsheets/d/1Q9UL6HR8ILsuO_5aiqIjbW9oiXoj1uhj9Nn4VANB5lE/edit') },
      { type: 'separator' },
      { label: 'Salir', role: 'quit' }
    ]},
    { label: 'Editar', submenu: [
      { role: 'undo', label: 'Deshacer' }, { role: 'redo', label: 'Rehacer' }, { type: 'separator' },
      { role: 'cut', label: 'Cortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Pegar' }, { role: 'selectAll', label: 'Seleccionar todo' }
    ]},
    { label: 'Ver', submenu: [
      { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' }, { role: 'resetZoom', label: 'Tamaño normal' },
      { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' },
      { role: 'toggleDevTools', label: 'Herramientas de diagnóstico', accelerator: 'Ctrl+Shift+I' }
    ]},
    { label: 'Ayuda', submenu: [
      { label: 'Abrir ChatGPT (pedir mejoras o editar fotos)', click: () => shell.openExternal('https://chatgpt.com/') },
      { label: 'Ver el código de la app en GitHub', click: () => shell.openExternal('https://github.com/omogollon2222/galiashop092021') },
      { type: 'separator' },
      { label: 'Acerca de Galia Shop', click: () => dialog.showMessageBox(win, {
        type: 'info', title: 'Galia Shop', message: 'Galia Shop ' + app.getVersion(),
        detail: 'Ventas, inventario y análisis.\nLos datos se guardan en la hoja "Inventario_oficialGaliashop" de Google Drive.\nLas mejoras publicadas se cargan solas al abrir la app.'
      }) }
    ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

app.whenReady().then(() => {
  // Permite cámara (lector de códigos y fotos) y portapapeles solo para la app oficial
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, details) => {
    const ok = ['media', 'clipboard-sanitized-write', 'clipboard-read', 'notifications'].includes(perm);
    cb(ok && isAppUrl(details.requestingUrl || wc.getURL()));
  });
  buildMenu();
  createWindow();
});

app.on('window-all-closed', () => app.quit());
