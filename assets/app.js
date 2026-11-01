(function () {
  var WA = '56981749481';

  function track(name, params) {
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {}
  }

  function store(key, val) {
    try { if (val !== undefined) sessionStorage.setItem(key, val); return sessionStorage.getItem(key); } catch (e) { return null; }
  }

  // Atribución: guarda UTMs y referrer de la primera visita de la sesión
  (function captureAttribution() {
    var p = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
      if (p.get(k)) store(k, p.get(k));
    });
    if (!store('landing')) store('landing', location.pathname);
    if (!store('ref') && document.referrer) store('ref', document.referrer);
  })();

  function attribution() {
    var o = { landing: store('landing') || location.pathname, referrer: store('ref') || '' };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
      var v = store(k); if (v) o[k] = v;
    });
    return o;
  }

  function waLink(text) {
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
  }

  // Eventos de clic: data-track="nombre_evento" data-loc="ubicacion"
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el) return;
    track(el.getAttribute('data-track'), { location: el.getAttribute('data-loc') || '', page: location.pathname });
  });

  // Preselección de rubro por ?sector=
  var sectorSel = document.getElementById('form-industry');
  if (sectorSel) {
    var s = new URLSearchParams(location.search).get('sector');
    if (s) { sectorSel.value = s; if (sectorSel.value !== s) sectorSel.value = ''; }
  }

  // Formulario de leads
  var form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      var data = {
        nombre: form.nombre.value.trim(),
        whatsapp: form.whatsapp.value.trim(),
        rubro: form.rubro.value,
        email: form.email.value.trim(),
        origen: attribution(),
        fecha: new Date().toISOString()
      };
      var rubroTxt = form.rubro.options[form.rubro.selectedIndex].text;
      var msg = 'Hola Strata Factory, quiero un diagnóstico de eficiencia operativa.\n' +
        '- Nombre: ' + data.nombre + '\n- WhatsApp: ' + data.whatsapp + '\n- Rubro: ' + rubroTxt +
        (data.email ? '\n- Email: ' + data.email : '');
      var endpoint = form.getAttribute('data-endpoint');
      var wa = document.getElementById('successWa');
      var note = document.getElementById('successNote');
      wa.href = waLink(msg);

      function done(saved) {
        track('generate_lead', { form: 'diagnostico', saved: saved ? 'endpoint' : 'whatsapp_only', rubro: data.rubro });
        form.classList.add('hidden');
        document.getElementById('formSuccess').classList.remove('hidden');
        note.textContent = saved
          ? 'Recibimos tus datos. Un ingeniero te contactará en un máximo de 24 horas hábiles. Si prefieres acelerarlo, escríbenos ahora:'
          : 'Último paso: envía tu solicitud por WhatsApp para que llegue directo a ingeniería.';
        wa.focus();
      }

      btn.disabled = true;
      btn.textContent = 'Enviando…';
      if (!endpoint) { done(false); return; }
      // Google Apps Script no responde CORS: se envía como text/plain en modo no-cors
      // (respuesta opaca; si el fetch no falla, la solicitud llegó al servidor).
      fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
        keepalive: true
      }).then(function () { done(true); }).catch(function () { done(false); });
    });
  }

  // Calculadora de costo de procesos manuales
  var calc = document.getElementById('calc');
  if (calc) {
    var fmt = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
    var used = false;
    function num(id) { return Math.max(0, parseFloat(calc.querySelector('#' + id).value) || 0); }
    function render() {
      var personas = num('c-personas'), horas = num('c-horas'), costo = num('c-costo');
      var red = num('c-red');
      var mensual = personas * horas * 4.33 * costo;
      var ahorro = mensual * red / 100;
      document.getElementById('c-red-val').textContent = red + '%';
      document.getElementById('c-mensual').textContent = fmt.format(mensual);
      document.getElementById('c-ahorro').textContent = fmt.format(ahorro);
      document.getElementById('c-anual').textContent = fmt.format(ahorro * 12);
      var cta = document.getElementById('c-cta');
      cta.href = waLink('Hola Strata Factory, usé la calculadora: ' + personas + ' persona(s) dedican ' + horas +
        ' h/semana a una tarea manual (' + fmt.format(costo) + '/hora) ≈ ' + fmt.format(mensual) +
        ' al mes. Quiero validar cuánto se puede automatizar.');
    }
    calc.addEventListener('input', function () {
      render();
      if (!used) { used = true; track('calculator_used', { page: location.pathname }); }
    });
    render();
  }

  // Barra inferior móvil: se oculta cuando el formulario está a la vista
  var bar = document.getElementById('stickyBar');
  var contact = document.getElementById('contacto');
  if (bar && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      bar.classList.toggle('translate-y-full', en[0].isIntersecting);
    }, { threshold: 0.15 }).observe(contact);
  }
  // Menú hamburguesa (móvil)
  var menuBtn = document.getElementById('menuBtn');
  var menu = document.getElementById('mobileMenu');
  if (menuBtn && menu) {
    function setMenu(open) {
      menu.classList.toggle('hidden', !open);
      document.getElementById('iconOpen').classList.toggle('hidden', open);
      document.getElementById('iconClose').classList.toggle('hidden', !open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    }
    menuBtn.addEventListener('click', function () { setMenu(menu.classList.contains('hidden')); track('menu_toggle'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }
})();
