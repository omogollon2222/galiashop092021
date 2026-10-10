"""Inserta tools/compras.js en el módulo Inventario de index.html (datos embebidos en #galia-data).
Uso: python3 tools/inject_compras.py   (se puede ejecutar varias veces: reemplaza la versión anterior)"""
import json, re, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'index.html'
html = idx.read_text(encoding='utf-8')
m = re.search(r'(<script type="application/json" id="galia-data">)(.*?)(</script>)', html, re.S)
data = json.loads(m.group(2))
inv = data['pages']['inventario']

# 1) Expone las funciones de lectura de Excel/CSV del importador existente
EXPORT = "window.galiaImp = {readXlsx: readXlsx, readCsv: readCsv, findHeader: findHeader, mapHeader: mapHeader, toNum: toNum, toDate: toDate, norm: norm, plain: plain};"
if EXPORT not in inv:
    anchor = "msg('Inventario importado: ' + added + ' nuevas' + (changed ? ', ' + changed + ' actualizadas' : ''));\n  });\n"
    assert inv.count(anchor) == 1, 'no se encontró el final del importador'
    inv = inv.replace(anchor, anchor + '  ' + EXPORT + '\n')

# 2) Mensaje de guardado: ahora se guarda directo en la hoja de Google Drive
inv = inv.replace("Inventario guardado en el sitio; exporta el Excel para subirlo a Drive", "Inventario guardado en Google Drive ✓")
inv = inv.replace("Sin conexión: abre Inventario con internet para guardar en el sitio", "Sin conexión: abre Inventario con internet para guardar en Google Drive")

# 3) Módulo de compras (reemplaza la versión anterior si existe)
code = (root / 'tools' / 'compras.js').read_text(encoding='utf-8')
block = '<script data-galia="compras">\n' + code + '\n</script>'
inv = re.sub(r'<script data-galia="compras">.*?</script>', lambda _: block, inv, flags=re.S) if 'data-galia="compras"' in inv \
    else inv.replace('</body></html>', block + '\n</body></html>')
assert 'data-galia="compras"' in inv

data['pages']['inventario'] = inv
enc = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')
html = html[:m.start(2)] + enc + html[m.end(2):]
idx.write_text(html, encoding='utf-8')
print('ok', len(inv))
