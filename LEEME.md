# Galia Shop en Claude

Versión de Galia Shop que funciona como artefacto de Claude (ventas, inventario con fotos, análisis y cierre diario).
Los datos se guardan en la base de datos del artefacto en Claude; el acceso se controla con el botón **Compartir** del artefacto.

- `galia-shop.html` — la página publicada (generada).
- `host.html` — contenedor: reemplaza la API del servidor anterior por la base de datos de Claude.
- `shim.js` — se inyecta en cada pantalla (navegación, fotos, ventanas de confirmación).
- `build.py` — une `registro.html`, `inventario.html` y `analisis.html` (carpeta `public/` del sistema original) en `galia-shop.html`.

Esta versión solo funciona dentro de Claude; GitHub Pages no tiene la base de datos.
