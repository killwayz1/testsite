(function () {
  'use strict';

  // ---- burger menu ----
  var burger = document.querySelector('[data-burger]');
  var drawer = document.querySelector('[data-drawer]');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        drawer.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', function (e) {
      if (!drawer.classList.contains('is-open')) return;
      if (drawer.contains(e.target) || burger.contains(e.target)) return;
      drawer.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  }

  // ---- FAQ accordion ----
  document.querySelectorAll('.faq__item').forEach(function (item) {
    var btn = item.querySelector('.faq__q');
    if (!btn) return;
    btn.addEventListener('click', function () {
      item.classList.toggle('is-open');
    });
  });

  // ---- highlight active nav link ----
  var path = location.pathname.replace(/\/index\.html$/, '/');
  if (path === '') path = '/';
  document.querySelectorAll('[data-nav]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (href !== '/' && path.indexOf(href) === 0)) {
      a.classList.add('is-active');
    }
  });

  // ---- ticker duplicate for seamless loop ----
  document.querySelectorAll('.ticker__inner').forEach(function (t) {
    t.innerHTML = t.innerHTML + t.innerHTML;
  });

  // ---- forms ----
  document.querySelectorAll('form[data-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      f.querySelectorAll('[data-required]').forEach(function (input) {
        var field = input.closest('.field');
        var val = (input.value || '').trim();
        var valid = val.length > 0;
        if (input.type === 'email') {
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        }
        if (input.type === 'tel' || input.getAttribute('data-phone') !== null) {
          valid = /^[0-9+()\-\s]{6,}$/.test(val);
        }
        if (input.type === 'checkbox') valid = input.checked;
        if (field) field.classList.toggle('is-error', !valid);
        if (!valid) ok = false;
      });
      if (ok) {
        f.classList.add('is-sent');
        f.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
})();
