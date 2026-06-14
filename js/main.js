/* Talmorux — main.js */
(function () {
  'use strict';

  /* ----- mobile menu toggle ----- */
  var toggle = document.querySelector('.menu-toggle');
  var navMain = document.querySelector('.nav-main');
  if (toggle && navMain) {
    toggle.addEventListener('click', function () {
      navMain.classList.toggle('open');
      toggle.setAttribute('aria-expanded',
        navMain.classList.contains('open') ? 'true' : 'false');
    });
  }

  /* ----- country dial codes (compact list, dial + flag) ----- */
  var COUNTRIES = [
    {c:'CA', n:'Canada',         d:'+1',   f:'🇨🇦'},
    {c:'US', n:'United States',  d:'+1',   f:'🇺🇸'},
    {c:'GB', n:'United Kingdom', d:'+44',  f:'🇬🇧'},
    {c:'AU', n:'Australia',      d:'+61',  f:'🇦🇺'},
    {c:'DE', n:'Germany',        d:'+49',  f:'🇩🇪'},
    {c:'FR', n:'France',         d:'+33',  f:'🇫🇷'},
    {c:'IT', n:'Italy',          d:'+39',  f:'🇮🇹'},
    {c:'ES', n:'Spain',          d:'+34',  f:'🇪🇸'},
    {c:'NL', n:'Netherlands',    d:'+31',  f:'🇳🇱'},
    {c:'BE', n:'Belgium',        d:'+32',  f:'🇧🇪'},
    {c:'CH', n:'Switzerland',    d:'+41',  f:'🇨🇭'},
    {c:'AT', n:'Austria',        d:'+43',  f:'🇦🇹'},
    {c:'DK', n:'Denmark',        d:'+45',  f:'🇩🇰'},
    {c:'NO', n:'Norway',         d:'+47',  f:'🇳🇴'},
    {c:'SE', n:'Sweden',         d:'+46',  f:'🇸🇪'},
    {c:'FI', n:'Finland',        d:'+358', f:'🇫🇮'},
    {c:'PL', n:'Poland',         d:'+48',  f:'🇵🇱'},
    {c:'IE', n:'Ireland',        d:'+353', f:'🇮🇪'},
    {c:'PT', n:'Portugal',       d:'+351', f:'🇵🇹'},
    {c:'GR', n:'Greece',         d:'+30',  f:'🇬🇷'},
    {c:'CZ', n:'Czech Republic', d:'+420', f:'🇨🇿'},
    {c:'RO', n:'Romania',        d:'+40',  f:'🇷🇴'},
    {c:'JP', n:'Japan',          d:'+81',  f:'🇯🇵'},
    {c:'KR', n:'South Korea',    d:'+82',  f:'🇰🇷'},
    {c:'SG', n:'Singapore',      d:'+65',  f:'🇸🇬'},
    {c:'HK', n:'Hong Kong',      d:'+852', f:'🇭🇰'},
    {c:'NZ', n:'New Zealand',    d:'+64',  f:'🇳🇿'},
    {c:'AE', n:'UAE',            d:'+971', f:'🇦🇪'},
    {c:'MX', n:'Mexico',         d:'+52',  f:'🇲🇽'},
    {c:'BR', n:'Brazil',         d:'+55',  f:'🇧🇷'}
  ];

  function findCountryByCode(code) {
    code = (code || '').toUpperCase();
    for (var i = 0; i < COUNTRIES.length; i++) {
      if (COUNTRIES[i].c === code) return COUNTRIES[i];
    }
    return null;
  }

  /* ----- custom phone country dropdown ----- */
  function setupPhoneSelector(wrap) {
    var trigger = wrap.querySelector('.phone-select-trigger');
    var dropdown = wrap.querySelector('.phone-select-dropdown');
    var hidden = wrap.querySelector('input[type="hidden"]');
    var ul = wrap.querySelector('.phone-select-dropdown ul');
    if (!trigger || !dropdown || !hidden || !ul) return;

    var triggerFlag = trigger.querySelector('.flag');
    var triggerDial = trigger.querySelector('.dial');

    // populate options
    ul.innerHTML = '';
    for (var i = 0; i < COUNTRIES.length; i++) {
      var co = COUNTRIES[i];
      var li = document.createElement('li');
      li.setAttribute('data-code', co.c);
      li.setAttribute('data-dial', co.d);
      li.setAttribute('data-flag', co.f);
      li.setAttribute('role', 'option');
      li.innerHTML =
        '<span class="flag">' + co.f + '</span>' +
        '<span class="code">' + co.c + '</span>' +
        '<span class="dial">' + co.d + '</span>' +
        '<span class="name">' + co.n + '</span>';
      ul.appendChild(li);
    }

    function setSelected(code) {
      var co = findCountryByCode(code);
      if (!co) co = COUNTRIES[0];
      if (triggerFlag) triggerFlag.textContent = co.f;
      if (triggerDial) triggerDial.textContent = co.d;
      hidden.value = co.c;
      var items = ul.querySelectorAll('li');
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle('active', items[i].getAttribute('data-code') === co.c);
      }
    }

    // default Canada
    setSelected('CA');

    // best-effort locale detection
    try {
      var lang = (navigator.language || '').toUpperCase();
      var iso = lang.split('-')[1];
      if (iso && findCountryByCode(iso)) setSelected(iso);
    } catch (e) { /* ignore */ }

    // open/close
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      // close other open dropdowns
      var others = document.querySelectorAll('.phone-select.open');
      for (var i = 0; i < others.length; i++) {
        if (others[i] !== wrap) others[i].classList.remove('open');
      }
      wrap.classList.toggle('open');
      trigger.setAttribute('aria-expanded',
        wrap.classList.contains('open') ? 'true' : 'false');
    });

    // pick
    ul.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      if (!li) return;
      setSelected(li.getAttribute('data-code'));
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  // close on outside click
  document.addEventListener('click', function (e) {
    var opens = document.querySelectorAll('.phone-select.open');
    for (var i = 0; i < opens.length; i++) {
      if (!opens[i].contains(e.target)) opens[i].classList.remove('open');
    }
  });

  var phoneWraps = document.querySelectorAll('.phone-select');
  for (var i = 0; i < phoneWraps.length; i++) setupPhoneSelector(phoneWraps[i]);

  /* ----- simple form validation + fake submit ----- */
  function bindForm(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
      var ok = true;
      for (var i = 0; i < inputs.length; i++) {
        var inp = inputs[i];
        if (!inp.value || (inp.type === 'email' && !/.+@.+\..+/.test(inp.value))) {
          inp.style.borderColor = '#ef4444';
          ok = false;
        } else {
          inp.style.borderColor = '';
        }
      }
      if (!ok) return;
      var btn = form.querySelector('button[type=submit], .btn[type=submit]');
      if (btn) {
        btn.disabled = true;
        var orig = btn.textContent;
        btn.textContent = 'Submitting…';
        setTimeout(function () {
          form.reset();
          btn.disabled = false;
          btn.textContent = orig;
          var msg = document.createElement('div');
          msg.style.cssText = 'margin-top:14px;padding:12px 14px;border-radius:8px;background:#dcfce7;color:#166534;font-weight:600;font-size:.9rem;text-align:center';
          msg.textContent = '✓ Thank you — our team will contact you shortly.';
          form.appendChild(msg);
          setTimeout(function () { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 5000);
        }, 700);
      }
    });
  }
  var forms = document.querySelectorAll('form[data-app-form]');
  for (var j = 0; j < forms.length; j++) bindForm(forms[j]);

  /* ----- mini live ticker (dashboard mock) ----- */
  var ticker = document.querySelector('.dash-rows');
  if (ticker) {
    setInterval(function () {
      var prices = ticker.querySelectorAll('.price');
      var changes = ticker.querySelectorAll('.change');
      for (var k = 0; k < prices.length; k++) {
        var cur = parseFloat(prices[k].getAttribute('data-base') || prices[k].textContent.replace(/[^\d.-]/g, '')) || 0;
        var delta = (Math.random() - 0.45) * (cur * 0.0008);
        var nv = Math.max(0, cur + delta);
        var minDecimals = cur < 1 ? 4 : 2;
        prices[k].textContent = '$' + nv.toLocaleString('en-US', { minimumFractionDigits: minDecimals, maximumFractionDigits: minDecimals });
        prices[k].setAttribute('data-base', nv.toFixed(minDecimals));
        if (changes[k]) {
          var pct = ((delta / cur) * 100).toFixed(2);
          if (delta >= 0) {
            changes[k].textContent = '▲ +' + Math.abs(pct) + '%';
            changes[k].className = 'change up';
          } else {
            changes[k].textContent = '▼ -' + Math.abs(pct) + '%';
            changes[k].className = 'change down';
          }
        }
      }
    }, 2200);
  }
})();
