/**
 * trackbox.js — universal client-side bridge from any landing-page form to
 * the local PHP proxy (/api/send.php), which forwards the lead to Trackbox.
 *
 * Template-agnostic: intercepts form submits in the CAPTURE phase on
 * `document`, so it runs BEFORE each site's own submit handler and replaces
 * it. Fields are detected heuristically, so it works on every landing in this
 * batch regardless of input names or markup.
 *
 * Classification:
 *   - lead  : email AND (phone OR a name field)  -> /api/send.php
 *   - login : password AND no phone              -> /api/login.php
 *   - else  : left untouched.
 *
 * Secret Trackbox headers live ONLY in the PHP proxy, never in the browser.
 */
(function () {
  'use strict';

  var SEND_URL = '/api/send.php';
  var LOGIN_URL = '/api/login.php';

  function digits(s) { return (s || '').replace(/[^\d]/g, ''); }
  function txt(el) { return el ? (el.textContent || '').trim() : ''; }
  function lc(s) { return (s || '').toLowerCase(); }

  function fieldKey(el) {
    return lc((el.getAttribute('name') || '') + ' ' + (el.id || '') +
      ' ' + (el.getAttribute('placeholder') || '') +
      ' ' + (el.getAttribute('autocomplete') || ''));
  }

  function controls(form) {
    var out = [], els = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], type = lc(el.getAttribute('type') || el.tagName);
      if (type === 'hidden' || type === 'submit' || type === 'button' ||
        type === 'checkbox' || type === 'radio' || type === 'range' ||
        type === 'file' || type === 'image' || type === 'reset') continue;
      out.push(el);
    }
    return out;
  }

  function findEmail(list) {
    for (var i = 0; i < list.length; i++) if (lc(list[i].type) === 'email') return list[i];
    for (var j = 0; j < list.length; j++) if (/e-?mail|correo|почт/.test(fieldKey(list[j]))) return list[j];
    return null;
  }

  function findPhone(form, list) {
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (lc(el.type) === 'tel' || el.hasAttribute('data-phone')) return el;
    }
    for (var j = 0; j < list.length; j++)
      if (/phone|phon|fph|tel|tele|m[oó]vil|celular|whats|телеф/.test(fieldKey(list[j]))) return list[j];
    return null;
  }

  function findPassword(list) {
    for (var i = 0; i < list.length; i++) if (lc(list[i].type) === 'password') return list[i];
    return null;
  }

  function findNames(list, emailEl, phoneEl, passEl) {
    var first = null, last = null, full = null;
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el === emailEl || el === phoneEl || el === passEl) continue;
      var tag = el.tagName.toLowerCase();
      if (tag === 'select' || tag === 'textarea') continue;
      var k = fieldKey(el);
      if (/last|lname|surname|apellido|family|secondname|фамил/.test(k)) { if (!last) last = el; continue; }
      if (/first|fname|given|nombre|forename|имя/.test(k)) { if (!first) first = el; continue; }
      if (/full.?name|your.?name|fullname|^name$|\bname\b|tu.?nombre/.test(k)) { if (!full) full = el; continue; }
    }
    if (!first && !full) {
      var texts = [];
      for (var j = 0; j < list.length; j++) {
        var e = list[j];
        if (e === emailEl || e === phoneEl || e === passEl) continue;
        if (e.tagName.toLowerCase() === 'input' && (lc(e.type) === 'text' || !e.getAttribute('type'))) texts.push(e);
      }
      if (texts.length === 1) full = texts[0];
      else if (texts.length >= 2) { first = texts[0]; last = texts[1]; }
    }
    return { first: first, last: last, full: full };
  }

  // ISO-2 country -> calling code (covers the geos these landings target).
  var ISO2DIAL = {
    CA:'1', US:'1', AR:'54', MX:'52', BR:'55', CL:'56', UY:'598', PY:'595',
    BO:'591', PE:'51', CO:'57', EC:'593', VE:'58', ES:'34', GB:'44', UK:'44',
    DE:'49', FR:'33', IT:'39', PT:'351'
  };

  // Returns { num: <digits, with country code when determinable>, known: bool }.
  function readPhone(form, phoneEl) {
    if (!phoneEl) return { num: '', known: false };
    var raw = digits(phoneEl.value);

    // combine a dial code with the national part (drop trunk "0", avoid doubling)
    function combine(dialRaw) {
      var dial = digits(dialRaw);
      if (!dial) return null;
      var nat = raw.replace(/^0+/, '');
      if (nat.indexOf(dial) === 0 && nat.length > dial.length) return nat;
      return dial + nat;
    }

    // 0) a hidden field already holding the full international number.
    var hf = form.querySelector('input[type="hidden"][name*="phonenum" i], input[type="hidden"][name*="phone_full" i], input[type="hidden"][name*="full_phone" i], input[type="hidden"][name*="e164" i], input[type="hidden"][name*="international" i]');
    if (hf) { var hv = (hf.value || '').trim(); if (/^\+?\d{8,15}$/.test(hv)) return { num: digits(hv), known: true }; }

    // 1) intl-tel-input instance (several versions/access paths).
    try {
      var g = window.intlTelInputGlobals;
      var iti = (g && g.getInstance && g.getInstance(phoneEl)) ||
        (window.intlTelInput && window.intlTelInput.getInstance && window.intlTelInput.getInstance(phoneEl)) ||
        phoneEl.iti || null;
      if (iti && typeof iti.getNumber === 'function') {
        var n = digits(iti.getNumber());
        if (n && n.length >= 8) return { num: n, known: true };
      }
    } catch (e) {}

    // 2) intl-tel-input separate dial-code element.
    var diaEl = (phoneEl.closest && phoneEl.closest('.iti')) ? phoneEl.closest('.iti').querySelector('.iti__selected-dial-code') : null;
    if (diaEl) { var c = combine(txt(diaEl)); if (c) return { num: c, known: true }; }

    // 3) inside an actual phone-widget container only (avoid catching stray
    //    "+NN" text elsewhere on the page), read a visible dial like "+1"/"+54"
    //    or a [data-dial] attribute.
    var box = phoneEl.closest && phoneEl.closest('.iti, .iti-wrap, .phone-select, .phone-flag, [class*="phone"], [class*="iti"]');
    if (box) {
      var els = box.querySelectorAll('[data-dial], span, div, button, li, small, b, strong');
      for (var i = 0; i < els.length; i++) {
        var dd = els[i].getAttribute && els[i].getAttribute('data-dial');
        var t = (dd || els[i].textContent || '').trim();
        if (/^\+\d{1,4}$/.test(t)) { var c2 = combine(t); if (c2) return { num: c2, known: true }; }
      }
    }

    // 4) a country / dial <select>: accept a "+NN" value, a data-dial on the
    //    selected option, a 2-letter ISO value, or the select's data-default ISO.
    var sels = form.querySelectorAll('select');
    for (var j = 0; j < sels.length; j++) {
      var sel = sels[j];
      var cand = (sel.value || '').trim();
      var phoneish = (sel.matches && sel.matches('[data-phone-country], [class*="country" i], [class*="dial" i], [class*="phone" i], [name*="dial" i], [name*="country" i], [name*="phone" i]')) || /^\+\d{1,4}$/.test(cand);
      if (!phoneish) continue;
      var opt = (sel.options && sel.selectedIndex >= 0) ? sel.options[sel.selectedIndex] : null;
      var optDial = opt && opt.getAttribute ? (opt.getAttribute('data-dial') || '') : '';
      var dialStr = '';
      if (/^\+\d{1,4}$/.test(cand)) dialStr = cand;
      else if (/^\+\d{1,4}$/.test(optDial)) dialStr = optDial;
      else if (/^[A-Za-z]{2}$/.test(cand) && ISO2DIAL[cand.toUpperCase()]) dialStr = ISO2DIAL[cand.toUpperCase()];
      else { var dd = (sel.getAttribute('data-default') || '').toUpperCase(); if (ISO2DIAL[dd]) dialStr = ISO2DIAL[dd]; }
      if (dialStr) { var c3 = combine(dialStr); if (c3) return { num: c3, known: true }; }
    }

    // 5) a hidden ISO country code -> calling code.
    var isoEl = form.querySelector('input[type="hidden"][name*="phonecountry" i], input[type="hidden"][name*="country" i], input[type="hidden"][name*="isocode" i]');
    if (isoEl) {
      var iso = (isoEl.value || '').trim().toUpperCase();
      if (ISO2DIAL[iso]) { var c4 = combine(ISO2DIAL[iso]); if (c4) return { num: c4, known: true }; }
    }

    // nothing determined -> national digits, country code unknown.
    return { num: raw, known: false };
  }

  function tracking() {
    var q = new URLSearchParams(window.location.search);
    function g() {
      for (var i = 0; i < arguments.length; i++) { var v = q.get(arguments[i]); if (v) return v; }
      return '';
    }
    var p = {
      sub: g('sub', 'subid', 'sub_id', 'clickid', 'click_id'),
      ad: g('ad', 'utm_ad', 'utm_content'),
      term: g('term', 'utm_term'),
      campaign: g('campaign', 'utm_campaign'),
      medium: g('medium', 'utm_medium'),
      utm_source: g('utm_source', 'so', 'funnel')
    };
    for (var i = 1; i <= 12; i++) p['MPC_' + i] = g('MPC_' + i, 'mpc_' + i, 'mpc' + i);
    return p;
  }

  function ensureToastCss() {
    if (document.getElementById('tb-toast-css')) return;
    var s = document.createElement('style');
    s.id = 'tb-toast-css';
    s.textContent =
      '.tb-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);max-width:92%;' +
      'z-index:2147483000;padding:14px 20px;border-radius:12px;font:500 15px/1.4 system-ui,sans-serif;' +
      'box-shadow:0 8px 30px rgba(0,0,0,.18);color:#fff;background:#16a34a;opacity:0;transition:opacity .25s;}' +
      '.tb-toast.tb-show{opacity:1;}.tb-toast.tb-err{background:#dc2626;}';
    document.head.appendChild(s);
  }

  function toast(msg, isErr) {
    ensureToastCss();
    var el = document.createElement('div');
    el.className = 'tb-toast' + (isErr ? ' tb-err' : '');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('tb-show'); });
    setTimeout(function () { el.classList.remove('tb-show'); setTimeout(function () { el.remove(); }, 400); }, isErr ? 5000 : 3500);
  }

  function showMessage(form, msg, isErr) {
    var box = form.querySelector('[data-form-message]');
    if (box) {
      var content = box.querySelector('[data-form-message-content]');
      if (content) content.innerHTML = msg; else box.textContent = msg;
      box.setAttribute('data-active', '');
      box.toggleAttribute('data-error', !!isErr);
      return;
    }
    var local = form.querySelector('.form-msg, .form-message, [data-form-msg]');
    if (local) {
      local.textContent = msg;
      local.className = (local.className.replace(/\b(ok|err|success|error)\b/g, '').trim()) + ' ' + (isErr ? 'err' : 'ok');
      local.style.display = '';
      return;
    }
    toast(msg, isErr);
  }

  var MSG = {
    es: { bad: 'Por favor, complete correctamente todos los campos.',
      ok: '¡Gracias! Hemos recibido sus datos. Un especialista se pondrá en contacto en breve.',
      dup: 'Este correo ya está registrado.',
      err: 'No se pudo completar su solicitud. Inténtelo de nuevo.',
      redir: 'Registro completado. Redirigiendo…' },
    en: { bad: 'Please fill in all fields correctly.',
      ok: 'Thank you! Your details were received. A specialist will contact you shortly.',
      dup: 'This email is already registered.',
      err: 'Your request could not be completed. Please try again.',
      redir: 'Registration completed. Redirecting…' }
  };
  function lang() {
    var l = lc(document.documentElement.getAttribute('lang') || 'en');
    return l.indexOf('es') === 0 ? MSG.es : MSG.en;
  }

  function setBusy(form, busy) {
    var btns = form.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])');
    for (var i = 0; i < btns.length; i++) btns[i].disabled = busy;
    form.toggleAttribute('data-loading', busy);
  }

  function classify(form) {
    var list = controls(form);
    var email = findEmail(list);
    var phone = findPhone(form, list);
    var pass = findPassword(list);
    var names = findNames(list, email, phone, pass);
    var hasName = names.first || names.full;
    if (pass && !hasName) return { kind: 'login', email: email, pass: pass };
    // A Trackbox lead REQUIRES a phone. Forms with email+name but no phone
    // (contact / report / newsletter) are left to the site's own handler.
    if (email && phone) return { kind: 'lead', email: email, phone: phone, names: names };
    return { kind: 'skip' };
  }

  function validate(form) {
    var req = form.querySelectorAll('[required]');
    for (var i = 0; i < req.length; i++) {
      var el = req[i], t = lc(el.type);
      if (t === 'checkbox') { if (!el.checked) return false; }
      else if (!String(el.value || '').trim()) return false;
    }
    return true;
  }

  async function handleLead(form, info) {
    var L = lang();
    if (!validate(form)) { showMessage(form, L.bad, true); return; }
    var firstVal = info.names.first ? info.names.first.value.trim() : (info.names.full ? info.names.full.value.trim() : '');
    var lastVal = info.names.last ? info.names.last.value.trim() : '';
    if (!info.names.first && info.names.full && firstVal.indexOf(' ') > 0) {
      var parts = firstVal.split(/\s+/); firstVal = parts.shift(); lastVal = lastVal || parts.join(' ');
    }
    var emailVal = info.email ? info.email.value.trim() : '';
    var ph = readPhone(form, info.phone);
    var phoneVal = ph.num;
    if (!firstVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal) || phoneVal.length < 6) { showMessage(form, L.bad, true); return; }
    var payload = {
      first_name: firstVal, last_name: lastVal, email: emailVal, phone: phoneVal,
      phone_cc_known: ph.known ? 1 : 0,
      page_url: window.location.href, referrer: document.referrer || '',
      language: document.documentElement.getAttribute('lang') || ''
    };
    var tr = tracking();
    for (var k in tr) if (tr[k]) payload[k] = tr[k];
    setBusy(form, true);
    try {
      var res = await fetch(SEND_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      var data = await res.json().catch(function () { return {}; });
      setBusy(form, false);
      if (res.ok && data.ok) {
        try { form.reset(); } catch (e) {}
        if (data.redirect) { showMessage(form, L.redir, false); setTimeout(function () { window.location.href = data.redirect; }, 1200); }
        else showMessage(form, L.ok, false);
      } else showMessage(form, data.code === 'already_reg' ? L.dup : L.err, true);
    } catch (e) { setBusy(form, false); showMessage(form, L.err, true); }
  }

  async function handleLogin(form, info) {
    var L = lang();
    setBusy(form, true);
    try {
      var res = await fetch(LOGIN_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: info.email ? info.email.value.trim() : '', password: info.pass ? info.pass.value : '' }) });
      var data = await res.json().catch(function () { return {}; });
      setBusy(form, false);
      if (res.ok && data.ok && data.redirect) window.location.href = data.redirect;
      else showMessage(form, L.err, true);
    } catch (e) { setBusy(form, false); showMessage(form, L.err, true); }
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    if (form.hasAttribute('data-tb-skip')) return;
    var info = classify(form);
    if (info.kind === 'skip') return;
    e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
    if (info.kind === 'login') handleLogin(form, info);
    else handleLead(form, info);
  }, true);
})();
