# Galia Shop · Sistema de ventas e inventario

Código fuente exportado de la versión 24 del sistema existente.
Commit de origen: d70e116d03618ad92debaa4a0702cd1c8e791608.

## Subir a GitHub

1. Descomprime GaliaShop_GitHub.zip.
2. Crea un repositorio en tu cuenta de GitHub, preferiblemente privado.
3. Sube el contenido de la carpeta GaliaShop, incluyendo sus carpetas y archivos ocultos. package.json debe quedar en la raíz del repositorio.
4. Confirma la carga con un commit.

También puedes usar Git desde la carpeta descomprimida:

```bash
git init
git add .
git commit -m "Sistema Galia Shop"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

## Qué incluye

- Formularios de ventas con varios productos, formas de pago y crédito.
- Inventario con códigos y fotografías.
- Análisis y cierre diario.
- API del servidor, migraciones de base de datos y recursos visuales.
- Código de Google Apps Script para sincronización de ventas con Drive.
- Dependencias y archivo de bloqueo originales.

## Guardar el código y publicar la aplicación

Subir estos archivos a GitHub guarda el código. No publica automáticamente una aplicación funcional.
Este sistema usa Vinext/React, Cloudflare Workers, D1 (binding DB), R2 (binding PHOTOS) y autenticación de ChatGPT gestionada por Sites. GitHub Pages solo sirve archivos estáticos y no puede ejecutar las API de este sistema.

La configuración .openai/hosting.json conserva la identidad del sitio original. El sitio actual no se modifica al descargar o subir este paquete.
Para alojarlo fuera de Sites, un desarrollador debe configurar Workers, D1, R2 y migraciones, y adaptar la autenticación gestionada por Sites. El paquete no es un despliegue independiente ya configurado.

## Desarrollo

Requisitos: Node.js >=22.13.0 y pnpm 11.25.0 (versiones declaradas en package.json).

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
```

La vista local usa la configuración de desarrollo del proyecto. No debe usarse la autenticación simulada del desarrollo en un despliegue público.

## Google Drive

Configura GALIA_DRIVE_WEBHOOK_URL y GALIA_DRIVE_WEBHOOK_TOKEN como secretos del servidor, nunca dentro del código público.
En integrations/GaliaDriveSync.gs sustituye TU_ID_DE_GOOGLE_SHEETS por el identificador de tu hoja, que debe tener una pestaña Ventas. Configura GALIA_SYNC_TOKEN en las propiedades de Apps Script con el mismo token del servidor.
El script reemplaza las filas de la pestaña Ventas con las ventas recibidas; revisa la hoja de destino antes de activarlo.

## Alcance de esta entrega

Se verificó la integridad del ZIP y la presencia del código y configuraciones principales. No se hizo un nuevo despliegue ni una prueba de funcionamiento en GitHub u otro alojamiento. No se incluyen datos de clientes, ventas, fotos almacenadas en la base de datos, secretos, node_modules ni archivos comprimidos históricos.
