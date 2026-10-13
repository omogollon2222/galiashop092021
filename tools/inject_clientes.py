"""Agrega el módulo Clientes (CRM) a index.html: nueva pantalla tools/clientes.html + pestaña "Clientes" en las demás.
Uso: python3 tools/inject_clientes.py   (se puede ejecutar varias veces: reemplaza la versión anterior)"""
import json, re, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
idx = root / 'index.html'
html = idx.read_text(encoding='utf-8')
m = re.search(r'(<script type="application/json" id="galia-data">)(.*?)(</script>)', html, re.S)
data = json.loads(m.group(2))
pages = data['pages']

# 1) Pantalla de clientes
pages['clientes'] = (root / 'tools' / 'clientes.html').read_text(encoding='utf-8')

# 2) Pestaña "Clientes" en Ventas, Inventario y Análisis
LINK = '<a href="/clientes.html">Clientes</a>'
for name in ('registro', 'inventario', 'analisis'):
    p = pages[name]
    if LINK not in p:
        n = 0
        for a in ('<a href="/analisis.html">Análisis</a>', '<a class="active" href="/analisis.html" aria-current="page">Análisis</a>'):
            n += p.count(a)
            p = p.replace(a, a + LINK)
        assert n >= 1, 'no se encontró la pestaña Análisis en ' + name
    pages[name] = p

# 3) Análisis: al guardar sus ajustes relee la hoja para no borrar los datos del CRM
an = pages['analisis']
OLD = "saveTimer = setTimeout(function(){ fetch('/api/settings', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({settings: settings})}).catch(function(){}); }, 400);"
NEW = ("saveTimer = setTimeout(async function(){ try { var g = await fetch('/api/settings', {cache: 'no-store'}); if (!g.ok) return; "
       "var cur = (await g.json()).settings || {}; cur.lastReview = settings.lastReview; "
       "cur.contacted = Object.assign({}, cur.contacted || {}, settings.contacted); cur.tpl = Object.assign({}, cur.tpl || {}, settings.tpl); "
       "settings = cur; await fetch('/api/settings', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({settings: cur})}); } catch(_){} }, 400);")
if OLD in an:
    an = an.replace(OLD, NEW)
assert NEW in an, 'no se pudo ajustar el guardado de Análisis'
# Enlace desde "Clientes para reactivar" al módulo nuevo
HINT = '<details class="cx-tpl-box"><summary>Editar mensaje de reactivación</summary>'
GO = '<p class="cx-sub" style="margin-top:10px"><a href="/clientes.html" style="color:#8c4c65;font-weight:650">Ver seguimiento completo en Clientes →</a></p>'
if GO not in an:
    an = an.replace(HINT, GO + HINT, 1)
pages['analisis'] = an

# 4) Navegación interna entre pantallas
data['shim'] = data['shim'].replace('(registro|inventario|analisis)\\.html', '(registro|inventario|analisis|clientes)\\.html')
assert 'clientes)' in data['shim'], 'no se pudo ajustar la navegación'

enc = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')
html = html[:m.start(2)] + enc + html[m.end(2):]
idx.write_text(html, encoding='utf-8')
print('ok', {k: len(v) for k, v in pages.items()})
