/* Galia Shop · Ingreso de compras a proveedor (factura o pedido en Excel, CSV o PDF).
   Las cantidades se SUMAN a las prendas que ya existen (mismo código) y se crean las nuevas.
   Antes de guardar se muestra una tabla editable para revisar y corregir. */
(function(){
  var IMP = window.galiaImp;
  if (!IMP) return;
  var norm = IMP.norm, plain = IMP.plain, toNum = IMP.toNum;
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  var r2 = function(n){ return Math.round((Number(n) || 0) * 100) / 100; };
  var money = function(n){ return '$' + (Number(n) || 0).toFixed(2); };
  var uid = function(){ return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); };

  /* ---------- Estilos ---------- */
  var st = document.createElement('style');
  st.textContent =
    '.pc-card{border-color:#d9b9c6;background:linear-gradient(180deg,#fff,#fdf6f8)}' +
    '.pc-head{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 0 12px}' +
    '.pc-head label{font-size:12.5px;color:#806a73;font-weight:600;display:block}' +
    '.pc-head input{margin-top:4px;width:100%;box-sizing:border-box;min-height:40px;border:1px solid #e3d2d8;border-radius:10px;padding:8px 10px;font:inherit;font-size:14px;background:#fff}' +
    '.pc-table td{padding:4px 5px!important;vertical-align:middle}' +
    '.pc-table td input{width:100%;box-sizing:border-box;min-height:34px;border:1px solid #eadde2;border-radius:8px;padding:5px 7px;font:inherit;font-size:13px;background:#fff}' +
    '.pc-table td input:focus{outline:none;border-color:#ad6880;box-shadow:0 0 0 2px #f0d5df}' +
    '.pc-table td input.bad{border-color:#d07185;background:#fff5f6}' +
    '.pc-table .c-code{width:110px}.pc-table .c-qty{width:62px}.pc-table .c-num{width:84px}.pc-table .c-desc{min-width:200px}' +
    '.pc-table td.st{font-size:11.5px;color:#6f5c64;white-space:normal;min-width:120px;line-height:1.3}' +
    '.pc-del{border:0;background:none;color:#a3324f;font-size:18px;cursor:pointer;padding:2px 6px}' +
    '.pc-add{border:1px dashed #cfa9b8;background:#fff;color:#8f526a;border-radius:10px;padding:9px 14px;font:600 14px inherit;cursor:pointer;margin-top:10px}' +
    '.pc-note{font-size:12.5px;color:#76666d;margin:8px 2px;line-height:1.5}' +
    '.pc-warn{background:#fff4e5;border:1px solid #f1d3a6;color:#7a4b12;border-radius:12px;padding:9px 12px;font-size:13px;margin:0 0 10px}' +
    '@media (max-width:700px){.pc-head{grid-template-columns:1fr 1fr}}';
  document.head.appendChild(st);

  /* ---------- Tarjeta ---------- */
  var pc = document.createElement('section');
  pc.className = 'import-card pc-card';
  pc.innerHTML = '<div class="ic-text"><strong>Compra a proveedor</strong><small>Sube la factura o el pedido (Excel, CSV o PDF). Las cantidades se suman a las prendas que ya tienes.</small></div>' +
    '<div class="ic-btns"><button type="button" class="btn" id="pcPick">Subir factura o pedido</button><button type="button" class="btn subtle" id="pcManual">Ingresar a mano</button></div>' +
    '<input type="file" id="pcFile" accept=".xlsx,.csv,.pdf,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>';
  function stick(){ var ic = document.querySelector('.import-card:not(.pc-card)'); if (ic && ic.nextSibling !== pc) ic.parentNode.insertBefore(pc, ic.nextSibling); }
  stick();
  var mq = window.matchMedia('(min-width:1024px)');
  if (mq.addEventListener) mq.addEventListener('change', function(){ setTimeout(stick, 0); });

  /* ---------- Ventana ---------- */
  var ov = document.createElement('div');
  ov.className = 'im-overlay';
  ov.innerHTML = '<div class="im-box" role="dialog" aria-modal="true" style="width:min(100%,980px)"><h2>Ingreso de compra</h2><p class="sub" id="pcName"></p>' +
    '<div id="pcWarn"></div>' +
    '<div class="pc-head"><label>Proveedor<input id="pcSupplier" placeholder="Ej. SHEIN"></label><label>Fecha de compra<input id="pcDate" type="date"></label>' +
    '<label>N° de factura o pedido<input id="pcDoc" placeholder="Opcional"></label><label>Margen para prendas nuevas (%)<input id="pcMargin" type="number" min="0" step="1" value="80"></label></div>' +
    '<div class="im-stats" id="pcStats"></div>' +
    '<div class="im-table pc-table" style="max-height:46vh"><table><thead><tr><th>Código</th><th>Descripción</th><th class="num">Cant.</th><th class="num">Costo unit.</th><th class="num">Precio venta</th><th>Qué pasará</th><th></th></tr></thead><tbody id="pcBody"></tbody></table></div>' +
    '<button type="button" class="pc-add" id="pcAdd">+ Agregar fila</button>' +
    '<p class="pc-note">Si el código ya existe se <b>suman</b> las unidades y se actualiza el costo (la descripción de la prenda no cambia). Sin código, se busca por descripción igual; si no aparece, se crea con un código automático (GS-0001…). ' +
    'Las prendas nuevas sin precio de venta se calculan con el margen: costo × (1 + margen), redondeado a $0,50.</p>' +
    '<div class="im-actions"><button type="button" class="btn subtle" id="pcCancel">Cancelar</button><button type="button" class="btn" id="pcGo">Registrar compra</button></div></div>';
  document.body.appendChild(ov);
  var $ = function(id){ return document.getElementById(id); };
  var rows = [];
  function close(){ ov.classList.remove('show'); $('pcFile').value = ''; rows = []; }
  $('pcCancel').addEventListener('click', close);
  $('pcPick').addEventListener('click', function(){ $('pcFile').click(); });
  $('pcManual').addEventListener('click', function(){ open([], 'Ingreso manual', ''); });
  $('pcAdd').addEventListener('click', function(){ rows.push(blank()); paint(); var ins = $('pcBody').querySelectorAll('tr:last-child input'); if (ins[0]) ins[0].focus(); });

  function blank(){ return {code: '', description: '', quantity: 1, cost: '', sale: ''}; }

  /* ---------- Coincidencias con el inventario ---------- */
  function index(){
    var list = load(), byCode = {}, byDesc = {};
    list.forEach(function(x){ byCode[norm(x.code)] = x; var d = plain(x.description); if (d && !byDesc[d]) byDesc[d] = x; });
    return {byCode: byCode, byDesc: byDesc};
  }
  function match(r, ix){
    var c = norm(r.code);
    if (c && ix.byCode[c]) return ix.byCode[c];
    if (!c && r.description) return ix.byDesc[plain(r.description)] || null;
    return null;
  }
  function margin(){ var m = toNum($('pcMargin').value); return Number.isFinite(m) && m >= 0 ? m : 80; }
  function suggested(cost){ var c = toNum(cost); if (!Number.isFinite(c) || c <= 0) return NaN; return Math.ceil(c * (1 + margin() / 100) * 2) / 2; }
  function check(r, ix){
    var q = toNum(r.quantity), cost = r.cost === '' ? 0 : toNum(r.cost), sale = r.sale === '' ? NaN : toNum(r.sale), m = match(r, ix), errs = [];
    if (!Number.isFinite(q) || q <= 0 || Math.round(q) !== q) errs.push('quantity');
    if (!Number.isFinite(cost) || cost < 0) errs.push('cost');
    if (r.sale !== '' && (!Number.isFinite(sale) || sale < 0)) errs.push('sale');
    if (!m) {
      if (!String(r.description || '').trim() && !norm(r.code)) errs.push('description');
      if (r.sale === '' && !Number.isFinite(suggested(r.cost))) errs.push('sale');
    }
    return {m: m, q: q, cost: cost, sale: sale, errs: errs};
  }
  function empty(r){ return !norm(r.code) && !String(r.description || '').trim() && (r.cost === '' || r.cost == null) && (r.sale === '' || r.sale == null); }

  /* ---------- Tabla ---------- */
  function paint(){
    var ix = index();
    $('pcBody').innerHTML = rows.map(function(r, i){
      var c = check(r, ix), bad = function(f){ return c.errs.indexOf(f) >= 0 ? ' bad' : ''; };
      var salePh = c.m ? money(c.m.salePrice) : (Number.isFinite(suggested(r.cost)) ? money(suggested(r.cost)) : 'Requerido');
      return '<tr data-i="' + i + '">' +
        '<td class="c-code"><input data-f="code" value="' + esc(r.code) + '" placeholder="Código"></td>' +
        '<td class="c-desc"><input data-f="description" class="' + bad('description') + '" value="' + esc(r.description) + '" placeholder="' + (c.m ? esc(c.m.description) : 'Descripción') + '"></td>' +
        '<td class="c-qty"><input data-f="quantity" class="' + bad('quantity') + '" inputmode="numeric" value="' + esc(r.quantity) + '" style="text-align:right"></td>' +
        '<td class="c-num"><input data-f="cost" class="' + bad('cost') + '" inputmode="decimal" value="' + esc(r.cost) + '" placeholder="' + (c.m ? money(c.m.purchasePrice) : '0.00') + '" style="text-align:right"></td>' +
        '<td class="c-num"><input data-f="sale" class="' + bad('sale') + '" inputmode="decimal" value="' + esc(r.sale) + '" placeholder="' + salePh + '" style="text-align:right"></td>' +
        '<td class="st">' + status(r, c) + '</td>' +
        '<td><button type="button" class="pc-del" data-del="' + i + '" aria-label="Quitar fila">×</button></td></tr>';
    }).join('') || '<tr><td colspan="7" style="padding:18px;color:#8a6876;white-space:normal">No hay filas. Pulsa “+ Agregar fila” para escribirlas.</td></tr>';
    stats();
  }
  function status(r, c){
    if (empty(r)) return '<span style="color:#a8939b">Fila vacía (se ignora)</span>';
    if (c.errs.length) return '<span class="im-tag err">Revisar</span>';
    if (c.m) { var before = Number(c.m.quantity) || 0; return '<span class="im-tag upd">Suma</span> ' + esc(c.m.code) + ' · ' + esc(c.m.description) + ': ' + before + ' → ' + (before + c.q) + ' u'; }
    return '<span class="im-tag new">Nueva</span>' + (norm(r.code) ? '' : ' (código automático)');
  }
  function stats(){
    var ix = index(), ok = 0, nuevas = 0, suma = 0, units = 0, total = 0, bad = 0;
    rows.forEach(function(r){ if (empty(r)) return; var c = check(r, ix); if (c.errs.length) { bad++; return; } ok++; if (c.m) suma++; else nuevas++; units += c.q; total += c.q * (r.cost === '' && c.m ? (Number(c.m.purchasePrice) || 0) : c.cost); });
    $('pcStats').innerHTML = '<div class="im-stat"><small>Prendas que suman</small><strong>' + suma + '</strong></div><div class="im-stat"><small>Prendas nuevas</small><strong>' + nuevas + '</strong></div>' +
      '<div class="im-stat"><small>Unidades · costo total</small><strong>' + units + ' · ' + money(total) + '</strong></div><div class="im-stat' + (bad ? ' bad' : '') + '"><small>Filas por revisar</small><strong>' + bad + '</strong></div>';
    $('pcGo').disabled = !ok || !!bad;
    $('pcGo').textContent = bad ? 'Corrige las filas en rojo' : 'Registrar compra (' + units + ' u)';
  }
  $('pcBody').addEventListener('input', function(e){
    var t = e.target, tr = t.closest('tr'); if (!tr || !t.dataset.f) return;
    rows[Number(tr.dataset.i)][t.dataset.f] = t.value;
    // Repinta solo el estado y las marcas de la fila para no perder el cursor
    var r = rows[Number(tr.dataset.i)], c = check(r, index());
    tr.querySelectorAll('input').forEach(function(inp){ inp.classList.toggle('bad', c.errs.indexOf(inp.dataset.f) >= 0); });
    tr.querySelector('.st').innerHTML = status(r, c);
    var sale = tr.querySelector('[data-f=sale]');
    sale.placeholder = c.m ? money(c.m.salePrice) : (Number.isFinite(suggested(r.cost)) ? money(suggested(r.cost)) : 'Requerido');
    stats();
  });
  $('pcBody').addEventListener('change', function(e){ if (e.target.dataset.f === 'code') paint(); });
  $('pcBody').addEventListener('click', function(e){ var b = e.target.closest('[data-del]'); if (!b) return; rows.splice(Number(b.dataset.del), 1); paint(); });
  $('pcMargin').addEventListener('input', paint);

  function open(list, name, warn, meta){
    rows = list.length ? list : [blank()];
    meta = meta || {};
    $('pcName').textContent = name;
    $('pcWarn').innerHTML = warn ? '<div class="pc-warn">' + esc(warn) + '</div>' : '';
    $('pcSupplier').value = meta.supplier || '';
    $('pcDate').value = meta.date || today();
    $('pcDoc').value = meta.doc || '';
    paint();
    ov.classList.add('show');
  }

  /* ---------- Registrar ---------- */
  $('pcGo').addEventListener('click', function(){
    var ix = index(), list = load(), pos = {}, now = new Date().toISOString(), date = $('pcDate').value || today(), sup = $('pcSupplier').value.trim();
    list.forEach(function(x, i){ pos[x.id] = i; });
    var maxAuto = list.reduce(function(n, x){ var m = /^GS-(\d+)$/.exec(norm(x.code)); return m ? Math.max(n, Number(m[1])) : n; }, 0);
    var added = 0, summed = 0, units = 0;
    for (var k = 0; k < rows.length; k++) {
      var r = rows[k]; if (empty(r)) continue;
      var c = check(r, ix); if (c.errs.length) { msg('Hay filas por revisar'); return; }
      units += c.q;
      if (c.m) {
        var x = list[pos[c.m.id]];
        x.quantity = (Number(x.quantity) || 0) + c.q;
        if (r.cost !== '' && c.cost > 0) x.purchasePrice = r2(c.cost);
        if (r.sale !== '') x.salePrice = r2(c.sale);
        if (sup) x.supplier = sup;
        x.purchaseDate = date;
      } else {
        var code = norm(r.code) || ('GS-' + String(++maxAuto).padStart(4, '0'));
        var item = {id: uid(), created: now, photoKey: '', code: code, description: String(r.description || '').trim() || code,
          quantity: c.q, purchasePrice: r2(c.cost), salePrice: r2(r.sale === '' ? suggested(r.cost) : c.sale),
          category: '', color: '', supplier: sup, purchaseDate: date, lastSaleDate: ''};
        list.push(item); pos[item.id] = list.length - 1; ix.byCode[code] = item; added++;
        continue;
      }
      summed++;
    }
    persist(list); render(); close();
    var rec = document.getElementById('records'); if (rec) rec.open = true;
    msg('Compra registrada: ' + units + ' unidades · ' + summed + ' sumadas, ' + added + ' nuevas');
  });

  /* ---------- Lectura de archivos ---------- */
  $('pcFile').addEventListener('change', async function(e){
    var file = e.target.files && e.target.files[0]; if (!file) return;
    var name = file.name;
    try {
      if (/\.pdf$/i.test(name) || file.type === 'application/pdf') {
        msg('Leyendo el PDF…');
        var res = await readPdf(await file.arrayBuffer());
        open(res.rows, name + ' · ' + res.rows.length + ' fila(s) encontradas',
          res.rows.length ? 'Revisa cada fila contra la factura antes de registrar: la lectura de PDF puede confundir columnas.' :
            'No pude reconocer productos en este PDF (puede ser una imagen escaneada). Escribe las filas a mano o pide la factura en Excel.', res.meta);
        return;
      }
      var data;
      if (/\.csv$/i.test(name) || file.type === 'text/csv') data = IMP.readCsv(await file.text());
      else {
        if (!('DecompressionStream' in window)) throw Error('Este navegador no puede leer .xlsx. Guarda el Excel como CSV.');
        data = await IMP.readXlsx(await file.arrayBuffer());
      }
      var h = IMP.findHeader(data);
      if (!h) throw Error('No encontré los encabezados (Código, Descripción, Cantidad…) en las primeras filas del archivo.');
      if (h.map.quantity == null) throw Error('Falta la columna Cantidad');
      var list = fromTable(data.slice(h.i + 1), h.map);
      var meta = {};
      if (h.map.supplier != null) { var s = data.slice(h.i + 1).map(function(r){ return r && r[h.map.supplier]; }).filter(Boolean)[0]; if (s) meta.supplier = String(s).trim(); }
      open(list, name + ' · ' + list.length + ' fila(s)', '', meta);
    } catch(err) { msg(err.message || 'No se pudo leer el archivo'); e.target.value = ''; }
  });

  function cellNum(v){ var n = toNum(v); return Number.isFinite(n) ? String(r2(n)) : ''; }
  function fromTable(data, map){
    var out = [];
    data.forEach(function(r){
      if (!r || r.every(function(v){ return v === '' || v == null; })) return;
      var get = function(f){ return map[f] == null ? '' : r[map[f]]; };
      var row = {code: norm(get('code')), description: String(get('description') || '').trim(), quantity: get('quantity') === '' ? '' : String(toNum(get('quantity'))),
        cost: map.purchasePrice == null ? '' : cellNum(get('purchasePrice')), sale: ''};
      // En una factura, "precio" o "precio unitario" suele ser el costo de compra
      if (map.purchasePrice == null && map.salePrice != null) row.cost = cellNum(get('salePrice'));
      else if (map.salePrice != null) row.sale = cellNum(get('salePrice'));
      if (/^(sub)?total|^iva|^descuento|^envio/i.test(plain(row.description)) && !row.code) return;
      if (!row.code && !row.description) return;
      out.push(row);
    });
    return out;
  }

  /* ---------- PDF ---------- */
  var pdfLib = null;
  function loadPdfJs(){
    if (pdfLib) return pdfLib;
    pdfLib = new Promise(function(res, rej){
      var s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js';
      s.onload = async function(){
        try {
          var lib = window.pdfjsLib;
          var w = await fetch(PDFJS + 'pdf.worker.min.js').then(function(r){ return r.text(); });
          lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([w], {type: 'text/javascript'}));
          res(lib);
        } catch(e) { pdfLib = null; rej(Error('No se pudo cargar el lector de PDF. Revisa la conexión.')); }
      };
      s.onerror = function(){ pdfLib = null; rej(Error('No se pudo cargar el lector de PDF. Revisa la conexión.')); };
      document.head.appendChild(s);
    });
    return pdfLib;
  }
  async function pdfLines(buf){
    var lib = await loadPdfJs(), doc = await lib.getDocument({data: new Uint8Array(buf)}).promise, lines = [];
    for (var p = 1; p <= doc.numPages; p++) {
      var page = await doc.getPage(p), tc = await page.getTextContent(), items = [];
      tc.items.forEach(function(it){ if (it.str && it.str.trim()) items.push({x: it.transform[4], y: it.transform[5], w: it.width, t: it.str}); });
      items.sort(function(a, b){ return b.y - a.y || a.x - b.x; });
      var cur = null;
      items.forEach(function(it){
        if (!cur || Math.abs(cur.y - it.y) > 3) { cur = {y: it.y, page: p, items: []}; lines.push(cur); }
        cur.items.push(it);
      });
    }
    // Une los fragmentos cercanos en celdas
    lines.forEach(function(l){
      l.items.sort(function(a, b){ return a.x - b.x; });
      var cells = [];
      l.items.forEach(function(it){
        var last = cells[cells.length - 1];
        if (last && it.x - last.x2 < 6) { last.t += (it.x - last.x2 > 1.5 ? ' ' : '') + it.t; last.x2 = it.x + it.w; }
        else cells.push({x: it.x, x2: it.x + it.w, t: it.t});
      });
      l.cells = cells.map(function(c){ c.t = c.t.replace(/\s+/g, ' ').trim(); return c; }).filter(function(c){ return c.t; });
      l.text = l.cells.map(function(c){ return c.t; }).join('  ');
    });
    return lines.filter(function(l){ return l.cells.length; });
  }
  var NUM = /^\$?\s?-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?$|^\$?\s?-?\d+(?:[.,]\d{1,2})?$/;
  var isNum = function(t){ return NUM.test(String(t).trim()); };
  var hasDigit = function(t){ return /\d/.test(t); };

  async function readPdf(buf){
    var lines = await pdfLines(buf), meta = {};
    var all = lines.map(function(l){ return l.text; }).join('\n');
    var mDoc = /(?:factura|pedido|order|orden)\s*(?:number|n[°ºo]\.?|no\.?|#)?\s*[:#]?\s*([A-Z0-9][A-Z0-9\-]{3,})/i.exec(all); if (mDoc) meta.doc = mDoc[1];
    if (/shein/i.test(all)) meta.supplier = 'SHEIN';
    var rows = byHeader(lines);
    if (!rows.length) rows = byShein(lines);
    if (!rows.length) rows = byPattern(lines);
    return {rows: rows, meta: meta};
  }
  // 1) Tabla con encabezados (Código · Descripción · Cantidad · Precio…)
  function byHeader(lines){
    for (var i = 0; i < lines.length; i++) {
      var heads = lines[i].cells.map(function(c){ return c.t; }), map = IMP.mapHeader(heads);
      // "Cant." y "P. Unit." abreviados
      heads.forEach(function(h, k){ var p = plain(h);
        if (map.quantity == null && /^(cant|qty|cantidad|unid|uds?)\b/.test(p)) map.quantity = k;
        if (map.purchasePrice == null && map.salePrice == null && /^(p ?unit|precio|valor unit|v ?unit|costo|unit price|price)/.test(p)) map.purchasePrice = k;
        if (map.description == null && /^(descrip|detalle|producto|articulo|concepto|item)/.test(p)) map.description = k;
        if (map.code == null && /^(cod|sku|ref|item no|art)/.test(p)) map.code = k;
      });
      if (map.quantity == null || (map.code == null && map.description == null)) continue;
      var cols = lines[i].cells.map(function(c){ return (c.x + c.x2) / 2; }), out = [];
      for (var j = i + 1; j < lines.length; j++) {
        var l = lines[j], txt = plain(l.text);
        if (/^(sub ?total|total|iva|son:|observaciones|forma de pago)/.test(txt)) break;
        var r = [];
        l.cells.forEach(function(c){
          var mid = (c.x + c.x2) / 2, best = 0, bd = Infinity;
          cols.forEach(function(x, k){ var d = Math.abs(x - mid); if (c.x <= x && c.x2 >= x) d = 0; if (d < bd) { bd = d; best = k; } });
          r[best] = r[best] ? r[best] + ' ' + c.t : c.t;
        });
        var q = toNum(r[map.quantity]);
        if (!Number.isFinite(q) || q <= 0) {
          // Descripción que sigue en la línea siguiente
          var prev = out[out.length - 1], d = map.description != null ? r[map.description] : '';
          if (prev && d && r.filter(Boolean).length === 1) prev.description += ' ' + d;
          continue;
        }
        out.push(fromTable([r], map)[0]);
      }
      out = out.filter(Boolean);
      if (out.length) return out;
    }
    return [];
  }
  // 2) Pedidos tipo SHEIN: nombre del producto, "SKU: xxx", talla, cantidad (x1 / Qty) y precio
  function byShein(lines){
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var m = /\bSKU\s*[:：]?\s*([A-Za-z0-9\-]{5,})/i.exec(lines[i].text);
      if (!m) continue;
      var desc = lines[i].text.slice(0, m.index).trim();
      if (!desc && i > 0) desc = lines[i - 1].text;
      var q = 1, price = '', size = '';
      for (var k = i; k < Math.min(lines.length, i + 5); k++) {
        if (k > i && /\bSKU\b/i.test(lines[k].text)) break;
        var t = lines[k].text, mq = /(?:^|\s)[x×]\s?(\d{1,3})\b|(?:qty|cantidad|cant\.?)\s*[:：]?\s*(\d{1,3})/i.exec(t);
        if (mq) q = Number(mq[1] || mq[2]);
        var mp = /(?:US)?\$\s?(\d+[.,]\d{2})/.exec(t); if (mp && !price) price = String(toNum(mp[1]));
        var ms = /(?:talla|size)\s*[:：]?\s*([A-Z0-9]{1,4})\b/i.exec(t); if (ms && !size) size = ms[1];
      }
      out.push({code: norm(m[1]), description: (desc + (size ? ' talla ' + size : '')).replace(/\s+/g, ' ').trim(), quantity: String(q), cost: price, sale: ''});
    }
    return out;
  }
  // 3) Líneas sueltas: [código] descripción cantidad precio [total]  ó  cantidad [código] descripción precio total
  function byPattern(lines){
    var out = [];
    lines.forEach(function(l){
      var c = l.cells.map(function(x){ return x.t; });
      if (c.length < 3) { c = l.text.split(/\s{2,}|\s(?=\$?\d+[.,]\d{2}\b)/); }
      var nums = []; while (c.length && isNum(c[c.length - 1])) nums.unshift(c.pop());
      if (!c.length || !nums.length) return;
      var head = c.slice(), q = NaN, unit = '', code = '';
      if (nums.length >= 3) { q = toNum(nums[nums.length - 3]); unit = nums[nums.length - 2]; }
      else if (nums.length === 2) {
        var a = toNum(nums[0]), b = toNum(nums[1]);
        if (Number.isInteger(a) && a > 0 && a < 1000 && !/[.,]\d{2}$/.test(nums[0])) { q = a; unit = nums[1]; }
        else if (isNum(head[0]) && Number.isInteger(toNum(head[0]))) { q = toNum(head.shift()); unit = nums[0]; if (Math.abs(q * a - b) > 0.05 * b) return; }
        else return;
      } else {
        if (isNum(head[0]) && Number.isInteger(toNum(head[0]))) { q = toNum(head.shift()); unit = nums[0]; } else return;
      }
      if (!Number.isFinite(q) || q <= 0 || q > 999) return;
      if (head.length > 1 && hasDigit(head[0]) && !/\s/.test(head[0])) code = head.shift();
      var desc = head.join(' ').trim();
      if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]{3,}/.test(desc) || /^(sub ?total|total|iva|descuento|envio|subtotal)/i.test(plain(desc))) return;
      out.push({code: norm(code), description: desc, quantity: String(q), cost: String(r2(toNum(unit))), sale: ''});
    });
    return out;
  }

  window.galiaCompras = {readPdf: readPdf, open: open};
})();
