/**
 * forms.js — Bondmere -> Trackbox integration (client side)
 * ----------------------------------------------------------
 * Handles the registration forms ([data-form] with action="/send")
 * and the sign-in form (action="/login").
 *
 * Registration flow:
 *   1. Validate fields (required + data-regexp).
 *   2. Collect name, email, phone (international, no "+") + tracking
 *      params taken from the URL query string (utm_*, sub, click id...).
 *   3. POST as JSON to the backend proxy (BACKEND_URL). The proxy is
 *      what talks to Trackbox; the secret headers NEVER live in the
 *      browser.
 *   4. Show loading / success / error states and redirect the user to
 *      the broker auto-login URL returned by the proxy.
 *
 * Loaded as an ES module; the page loader then calls window.forms.init().
 */

// === CONFIG ==============================================================
const BACKEND_URL = '/api/send.php'; // registration (push lead) endpoint
const LOGIN_URL   = '/api/login.php'; // optional sign-in endpoint
// =========================================================================

const t = (key, fallback = '') =>
  (window.translations && window.translations[key]) || fallback;

// Collect tracking params from the URL. Trackbox fields:
// so, sub, MPC_1..MPC_12, ad, term, campaign, medium.
const getTrackingParams = () => {
  const q = new URLSearchParams(window.location.search);
  const get = (...names) => {
    for (const n of names) {
      const v = q.get(n);
      if (v) return v;
    }
    return '';
  };

  const params = {
    so: get('so', 'funnel', 'utm_source'),
    sub: get('sub', 'subid', 'sub_id', 'clickid', 'click_id'),
    ad: get('ad', 'utm_ad', 'utm_content'),
    term: get('term', 'utm_term'),
    campaign: get('campaign', 'utm_campaign'),
    medium: get('medium', 'utm_medium'),
  };
  for (let i = 1; i <= 12; i++) {
    params['MPC_' + i] = get('MPC_' + i, 'mpc_' + i, 'mpc' + i);
  }
  return params;
};

const phoneInstances = new WeakMap();

const initPhone = (input) => {
  if (!window.intlTelInput || phoneInstances.has(input)) return;
  const iti = window.intlTelInput(input, {
    initialCountry: (window.userCountry || 'gb').toLowerCase(),
    separateDialCode: true,
    loadUtils: () =>
      import('https://cdn.jsdelivr.net/npm/intl-tel-input@25.12.5/build/js/utils.min.js'),
  });
  phoneInstances.set(input, iti);
};

// Full international number WITHOUT leading "+" (e.g. "4407012259886").
const getPhoneValue = (input) => {
  const iti = phoneInstances.get(input);
  const raw = iti ? iti.getNumber() : input.value;
  return (raw || '').replace(/[^\d]/g, '');
};

const validateField = (field) => {
  const value = (field.value || '').trim();
  if (field.hasAttribute('required') && !value) return false;
  if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return false;
  const re = field.dataset.regexp;
  if (re && value && !new RegExp(re).test(value)) return false;
  if (field.hasAttribute('data-phone') && field.hasAttribute('required')) {
    if (getPhoneValue(field).length < 6) return false;
  }
  return true;
};

const validateForm = (form) => {
  let ok = true;
  form.querySelectorAll('[data-should-validate], [required]').forEach((f) => {
    if (!validateField(f)) ok = false;
  });
  form.toggleAttribute('data-novalid', !ok);
  return ok;
};

const showMessage = (form, title, content, isError = false) => {
  const box = form.querySelector('[data-form-message]');
  if (!box) {
    if (isError) alert(content || title);
    return;
  }
  const titleEl = box.querySelector('[data-form-message-title]');
  const contentEl = box.querySelector('[data-form-message-content]');
  if (titleEl) titleEl.textContent = title || '';
  if (contentEl) contentEl.innerHTML = content || '';
  box.toggleAttribute('data-active', true);
  box.toggleAttribute('data-error', isError);
};

const setLoading = (form, state) => form.toggleAttribute('data-loading', state);

const errorMessage = (code) => {
  switch (code) {
    case 'already_reg':  return t('already_reg', 'You have already registered');
    case 'no_user_found': return t('no_user_found', 'No user found with that email');
    case 'ask_support':  return t('ask_support', 'Please reach out to our support team');
    default:             return t('try_again', 'Your request could not be completed. Please make another attempt.');
  }
};

const redirectWithCountdown = (form, url, seconds = 3) => {
  const tmpl = t('redirect_timer', 'In {{timer}} seconds you will be redirected...');
  let left = seconds;
  const render = () =>
    showMessage(form, t('reg_complete', 'Registration completed'), tmpl.replace('{{timer}}', left));
  render();
  const id = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearInterval(id);
      window.location.href = url;
      return;
    }
    render();
  }, 1000);
};

const handleRegister = async (form) => {
  if (!validateForm(form)) return;
  setLoading(form, true);

  const fd = new FormData(form);
  const phoneInput = form.querySelector('[data-phone]');

  const payload = {
    first_name: (fd.get('first_name') || '').trim(),
    last_name: (fd.get('last_name') || '').trim(),
    email: (fd.get('email') || '').trim(),
    phone: phoneInput ? getPhoneValue(phoneInput) : (fd.get('phone') || '').trim(),
    form_id: fd.get('id') || '',
    country: fd.get('country') || window.userCountry || '',
    language: fd.get('language') || window.currentLang || 'en',
    subid: fd.get('subid') || '',
    page_url: window.location.href,
    referrer: document.referrer || '',
    ...getTrackingParams(),
  };

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(form, false);

    if (res.ok && data.ok) {
      form.reset();
      if (data.redirect) redirectWithCountdown(form, data.redirect);
      else showMessage(form, t('reg_complete', 'Registration completed'),
        t('help_complete', 'Your application has been accepted and will soon be processed by a specialist'));
    } else {
      showMessage(form, t('something_wrong', 'Something went wrong'), errorMessage(data.code), true);
    }
  } catch (e) {
    setLoading(form, false);
    showMessage(form, t('something_wrong', 'Something went wrong'),
      t('try_again', 'Your request could not be completed. Please make another attempt.'), true);
  }
};

const handleLogin = async (form) => {
  if (!validateForm(form)) return;
  setLoading(form, true);
  const fd = new FormData(form);
  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: (fd.get('email') || '').trim(), password: fd.get('password') || '' }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(form, false);
    if (res.ok && data.ok && data.redirect) window.location.href = data.redirect;
    else showMessage(form, t('something_wrong', 'Something went wrong'), errorMessage(data.code), true);
  } catch (e) {
    setLoading(form, false);
    showMessage(form, t('something_wrong', 'Something went wrong'), t('try_again'), true);
  }
};

const handleContact = (form) => {
  if (!validateForm(form)) return;
  // No Trackbox lead for the contact form — it is a support message.
  // Wire it to your own mailer/CRM if needed. For now we acknowledge.
  form.reset();
  showMessage(form, t('reg_complete', 'Thank you'),
    t('help_complete', 'Your message has been received. Our team will get back to you.'));
};

const bindForm = (form) => {
  if (form.dataset.bound) return; // already wired
  form.dataset.bound = '1';
  const action = (form.getAttribute('action') || '').toLowerCase();
  const isLogin = action.includes('login');
  const formId = (form.querySelector('input[name="id"]') || {}).value || '';
  const isContact = formId === 'contact' || !!form.querySelector('[name="message"]');

  form.querySelectorAll('[data-phone]').forEach(initPhone);

  form.querySelectorAll('[data-should-validate], [required]').forEach((f) => {
    f.addEventListener('input', () => validateForm(form));
    f.addEventListener('blur', () => validateForm(form));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isLogin) handleLogin(form);
    else if (isContact) handleContact(form);
    else handleRegister(form);
  });
};

// Inject intl-tel-input CSS once (the page template doesn't include it).
const ensurePhoneCss = () => {
  if (document.getElementById('iti-css')) return;
  const link = document.createElement('link');
  link.id = 'iti-css';
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.12.5/build/css/intlTelInput.min.css';
  document.head.appendChild(link);
};

// Load the intl-tel-input library if the page loader didn't already.
const ensurePhoneLib = async () => {
  if (window.intlTelInput) return;
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/intl-tel-input@25.12.5/build/js/intlTelInput.min.js');
    if (!window.intlTelInput && mod && mod.default) window.intlTelInput = mod.default;
  } catch (e) {
    // phone field still works as a plain input if the CDN is unavailable
    console.warn('intl-tel-input failed to load', e);
  }
};

let started = false;
const init = async () => {
  if (started) return; // guard against double-init
  started = true;
  ensurePhoneCss();
  await ensurePhoneLib();
  document.querySelectorAll('form[data-form]').forEach(bindForm);
};

window.forms = { init };

// Self-initialise so the integration works regardless of the page's other
// (possibly missing) module loaders.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init());
} else {
  init();
}

export { init };
