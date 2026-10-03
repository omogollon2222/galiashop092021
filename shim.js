(function(){
  var P = window.parent;
  var realFetch = window.fetch.bind(window);
  window.fetch = function(u, o){
    var s = typeof u === 'string' ? u : (u && u.url) || String(u);
    if (s.indexOf('/api/') === 0) return P.galiaApi(s, o || {});
    return realFetch(u, o);
  };
  window.blobUrl = function(k){ return P.galiaBlob(k); };
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var m = (a.getAttribute('href') || '').match(/^\/(registro|inventario|analisis)\.html/);
    if (m) { e.preventDefault(); P.galiaShow(m[1]); }
  }, true);
})();
(function(){
  // Ventanas de confirmación propias (los avisos del navegador pueden estar bloqueados dentro de Claude)
  function box(text, withInput){
    return new Promise(function(res){
      var o = document.createElement('div');
      o.style.cssText = 'position:fixed;inset:0;background:#241d20aa;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:-apple-system,Segoe UI,sans-serif';
      var c = document.createElement('div');
      c.style.cssText = 'background:#fff;border-radius:18px;padding:20px;max-width:380px;width:100%;box-shadow:0 12px 40px #0004;color:#241d20';
      var p = document.createElement('p'); p.style.cssText = 'margin:0 0 14px;font-size:16px;line-height:1.45;white-space:pre-line'; p.textContent = text; c.appendChild(p);
      var inp = null;
      if (withInput) { inp = document.createElement('input'); inp.inputMode = 'decimal'; inp.style.cssText = 'width:100%;box-sizing:border-box;min-height:46px;border:1px solid #ddcdd2;border-radius:12px;padding:10px 12px;font-size:16px;margin-bottom:14px'; c.appendChild(inp); }
      var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px';
      function b(label, primary, val){ var x = document.createElement('button'); x.type = 'button'; x.textContent = label;
        x.style.cssText = 'flex:1;min-height:46px;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;border:' + (primary ? '0;background:#a8617b;color:#fff' : '1px solid #dfc5cf;background:#fff;color:#713c51');
        x.onclick = function(){ o.remove(); res(val === 'input' ? inp.value : val); }; row.appendChild(x); return x; }
      b('Cancelar', false, withInput ? null : false);
      var ok = b('Aceptar', true, withInput ? 'input' : true);
      c.appendChild(row); o.appendChild(c); document.body.appendChild(o);
      (inp || ok).focus();
    });
  }
  window.galiaConfirm = function(t){ return box(t, false); };
  window.galiaPrompt = function(t){ return box(t, true); };
})();
