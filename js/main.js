(function () {
  'use strict';

  // ===== Burger menu (mobile) =====
  var burger = document.querySelector('.burger');
  var body = document.body;
  if (burger) {
    burger.addEventListener('click', function () {
      var open = !body.classList.contains('is-burger-open');
      body.classList.toggle('is-burger-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!body.classList.contains('is-burger-open')) return;
      var t = e.target;
      if (t.closest && (t.closest('.mobile-nav a') || (!t.closest('.burger') && !t.closest('.mobile-nav')))) {
        body.classList.remove('is-burger-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 820 && body.classList.contains('is-burger-open')) {
        body.classList.remove('is-burger-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ===== Asset rail (market field) =====
  var assetButtons = document.querySelectorAll('[data-asset]');
  var fieldScore = document.getElementById('fieldScore');
  var assetOut = document.getElementById('assetOut');
  var biasOut = document.getElementById('biasOut');
  var flowOut = document.getElementById('flowOut');
  var routeOut = document.getElementById('routeOut');
  var contextOut = document.getElementById('contextOut');
  var temperatureOut = document.getElementById('temperatureOut');
  assetButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      assetButtons.forEach(function (item) { item.classList.remove('is-active'); });
      btn.classList.add('is-active');
      if (fieldScore) fieldScore.textContent = btn.getAttribute('data-score');
      if (assetOut) assetOut.textContent = btn.getAttribute('data-asset');
      if (biasOut) biasOut.textContent = btn.getAttribute('data-bias');
      if (flowOut) flowOut.textContent = btn.getAttribute('data-flow');
      if (routeOut) routeOut.textContent = btn.getAttribute('data-route');
      if (contextOut) contextOut.textContent = btn.getAttribute('data-context');
      if (temperatureOut) temperatureOut.textContent = btn.getAttribute('data-temp');
    });
  });

  // ===== Tools tabs =====
  var toolButtons = document.querySelectorAll('[data-tool]');
  var toolTitle = document.getElementById('toolTitle');
  var toolCopy = document.getElementById('toolCopy');
  var toolStat = document.getElementById('toolStat');
  var toolBullets = document.getElementById('toolBullets');
  toolButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      toolButtons.forEach(function (item) { item.classList.remove('is-active'); });
      btn.classList.add('is-active');
      if (toolTitle) toolTitle.textContent = btn.getAttribute('data-tool');
      if (toolCopy) toolCopy.textContent = btn.getAttribute('data-copy');
      if (toolStat) toolStat.textContent = btn.getAttribute('data-stat');
      if (toolBullets) {
        toolBullets.innerHTML = '';
        ['data-b1', 'data-b2', 'data-b3', 'data-b4'].forEach(function (attr) {
          var label = btn.getAttribute(attr);
          if (!label) return;
          var item = document.createElement('li');
          item.textContent = label;
          toolBullets.appendChild(item);
        });
      }
    });
  });

  // ===== Allocator =====
  var deposit = document.getElementById('depositRange');
  var target = document.getElementById('targetRange');
  var profile = document.getElementById('profileSelect');
  var depositOut = document.getElementById('depositOut');
  var targetOut = document.getElementById('targetOut');
  var scenarioOut = document.getElementById('scenarioOut');
  var scenarioNote = document.getElementById('scenarioNote');
  if (deposit && target && profile) {
    var money = function (value) {
      return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(value);
    };
    var render = function () {
      var base = Number(deposit.value);
      var pct = Number(target.value);
      var modifier = Number(profile.value);
      var label = profile.options[profile.selectedIndex].text;
      depositOut.textContent = money(base);
      targetOut.textContent = pct + '%';
      scenarioOut.textContent = money(base * (1 + (pct / 100) * modifier));
      scenarioNote.textContent = label + ' / ' + pct + '%';
    };
    deposit.addEventListener('input', render);
    target.addEventListener('input', render);
    profile.addEventListener('change', render);
    render();
  }

  // ===== Floating brief =====
  var floatingBrief = document.getElementById('floatingBrief');
  function updateFloatingBrief() {
    if (!floatingBrief) return;
    floatingBrief.classList.toggle('is-visible', window.scrollY > 140);
  }
  if (floatingBrief) {
    window.addEventListener('scroll', updateFloatingBrief, { passive: true });
    window.addEventListener('load', updateFloatingBrief);
    updateFloatingBrief();
  }

  // ===== Reveal on scroll =====
  var revealItems = document.querySelectorAll('.reveal-item');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-inview'); });
  }

  // ===== Lead form: validate + redirect to /thank-you/ =====
  var forms = document.querySelectorAll('form.lead-form');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  forms.forEach(function (form) {
    if (form._leadInit) return;
    form._leadInit = true;
    var first = form.querySelector('[name="first_name"]');
    var last = form.querySelector('[name="last_name"]');
    var email = form.querySelector('[name="email"]');
    var phone = form.querySelector('.phone_input');
    var inputs = [first, last, email, phone].filter(Boolean);

    function groupFor(input) {
      var node = input;
      while (node && node !== form) {
        if (node.classList && node.classList.contains('input_group')) return node;
        node = node.parentNode;
      }
      return null;
    }
    function setError(input, hasError) {
      var group = groupFor(input);
      if (!group) return;
      group.classList.toggle('has-error', hasError);
      var phoneMsg = group.querySelector('.error-msg');
      if (phoneMsg) phoneMsg.classList.toggle('hide', !hasError);
    }
    function validPhone(el) {
      if (!el) return true;
      var raw = (el.value || '').replace(/\D+/g, '');
      if (!raw) return false;
      try {
        if (el._intlTelInput) return el._intlTelInput.isValidNumber();
      } catch (e) {}
      return raw.length >= 6;
    }
    function validate(input) {
      var value = (input.value || '').trim();
      var ok;
      if (input === phone) ok = validPhone(input);
      else if (input.type === 'email') ok = EMAIL_RE.test(value);
      else ok = !!value;
      setError(input, !ok);
      return ok;
    }
    inputs.forEach(function (input) {
      input.addEventListener('input', function () { setError(input, false); });
      input.addEventListener('blur', function () { validate(input); });
    });
    form.addEventListener('submit', function (event) {
      var firstInvalid = null;
      inputs.forEach(function (input) {
        if (!validate(input) && !firstInvalid) firstInvalid = input;
      });
      event.preventDefault();
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      window.location.href = '/thank-you/';
    });
  });

  // ===== Scroll-to-form for #contact links =====
  function headerOffset() {
    var h = document.querySelector('.topbar');
    return (h ? h.getBoundingClientRect().height : 0) + 16;
  }
  function focusForm(behavior) {
    var target = document.getElementById('contact');
    if (!target) return false;
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    window.scrollTo({ top: top < 0 ? 0 : top, behavior: behavior || 'smooth' });
    var firstInput = target.querySelector('input:not([type=hidden]):not([disabled])');
    if (firstInput) setTimeout(function () { try { firstInput.focus({ preventScroll: true }); } catch (e) { firstInput.focus(); } }, behavior === 'auto' ? 0 : 400);
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!/#contact$/.test(href)) return;
    var url = new URL(a.href, location.href);
    if (url.pathname.replace(/\/+$/, '') !== location.pathname.replace(/\/+$/, '')) return;
    if (focusForm('smooth')) e.preventDefault();
  });
  if (location.hash === '#contact') {
    window.addEventListener('load', function () { focusForm('auto'); });
  }

  // ===== Init intl-tel-input with default = CH =====
  function initPhone() {
    var phones = document.querySelectorAll('.phone_input');
    if (!phones.length || !window.intlTelInput) return;
    phones.forEach(function (el) {
      if (el._intlTelInput) return;
      try {
        el._intlTelInput = window.intlTelInput(el, {
          initialCountry: 'ch',
          preferredCountries: ['ch', 'de', 'at', 'li'],
          separateDialCode: true,
          autoPlaceholder: 'aggressive',
          utilsScript: ''
        });
      } catch (e) {}
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhone);
  } else {
    initPhone();
  }
  window.addEventListener('load', initPhone);
})();
