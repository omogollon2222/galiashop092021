# Galia Shop · App de escritorio para Windows

Envoltura de escritorio (Electron) que abre la app web oficial
`https://omogollon2222.github.io/galiashop092021/`. Los datos siguen en la hoja
"Inventario_oficialGaliashop" de Google Drive (vía Apps Script), así que computadora,
celular y tablet ven lo mismo. Cualquier cambio publicado en `index.html` llega solo
a la app instalada: no hay que reinstalar.

## Construir el instalador (Linux)
```
npm i -D electron@31.7.7 electron-builder@24.13.3 resedit@2.0.3
npx electron-builder --win --x64 --dir           # crea dist/win-unpacked
node patch-exe.js dist/win-unpacked/GaliaShop.exe icon.ico   # ícono y datos del .exe
NSISDIR=~/.cache/electron-builder/nsis/nsis-3.0.4.1 ~/.cache/electron-builder/nsis/nsis-3.0.4.1/linux/makensis installer.nsi
```
Resultado: `dist/GaliaShop-Instalador-1.0.0.exe` (instala por usuario, sin administrador,
con acceso directo en el escritorio y el menú Inicio).
