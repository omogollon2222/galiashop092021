import json, re, pathlib
src = pathlib.Path('/mnt/user-data/uploads/GaliaShop_GitHub/GaliaShop/public')
pages = {}
for name in ['registro','inventario','analisis']:
    h = (src/f'{name}.html').read_text(encoding='utf-8')
    h = re.sub(r'\s*<a href="/signin-with-chatgpt\?return_to=[^"]*">Iniciar sesión</a>', '', h)
    h = h.replace('Inicia sesión con ChatGPT', 'Abre Galia Shop desde tu cuenta de Claude')
    h = h.replace('src="/api/inventory/photo?key=${encodeURIComponent(x.photoKey)}"', 'src="${blobUrl(x.photoKey)}"')
    h = h.replace("'/api/inventory/photo?key='+encodeURIComponent(photoKey)", 'blobUrl(photoKey)')
    assert '/api/inventory/photo?key' not in h, name
    assert 'ChatGPT' not in h, name
    h = h.replace('function download(blob,name){', 'function download(blob,name){return parent.galiaSave(blob,name);')
    h = re.sub(r'(?<![\w.])confirm\(', 'await galiaConfirm(', h)
    h = re.sub(r'(?<![\w.])prompt\(', 'await galiaPrompt(', h)
    h = h.replace("$('items').addEventListener('click',e=>{", "$('items').addEventListener('click',async e=>{")
    pages[name] = h
shim = open('/home/claude/galia/shim.js').read()
host = open('/home/claude/galia/host.html').read()
data = json.dumps({'pages': pages, 'shim': shim}, ensure_ascii=False).replace('</', '<\\/')
out = host.replace('/*__DATA__*/', data)
pathlib.Path('/home/claude/galia/galia-shop.html').write_text(out, encoding='utf-8')
print(len(out))
