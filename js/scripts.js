/* Ridge Fundastead AU — site scripts (vanilla, no deps) */

// ===== Mobile burger menu =====
const initMobileMenu = () => {
  const icon = document.querySelector('[data-menu-icon]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!icon || !menu) return;

  let open = false;
  const setOpen = (state) => {
    open = state;
    icon.toggleAttribute('data-active', open);
    menu.toggleAttribute('data-active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  icon.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!open);
  });

  // close after picking a menu link
  menu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });

  // close when tapping outside (mobile drawer covers all area, but keep guard)
  document.addEventListener('click', (e) => {
    if (!open) return;
    if (menu.contains(e.target) || icon.contains(e.target)) return;
    setOpen(false);
  });
};

// ===== Lang menu toggle (small dropdown in header/footer) =====
const initLangToggles = () => {
  document.querySelectorAll('[data-connector="lang-menu"]').forEach((btn) => {
    const parent = btn.closest('[data-connect-parent]') || document;
    const tgt = parent.querySelector('[data-connect="lang-menu"]');
    if (!tgt) return;
    let open = false;
    const set = (s) => {
      open = s;
      btn.toggleAttribute('data-active', open);
      tgt.toggleAttribute('data-active', open);
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      set(!open);
    });
    document.addEventListener('click', (e) => {
      if (open && !tgt.contains(e.target)) set(false);
    });
  });
};

// ===== Accordion (FAQ) =====
window.toggleAccordion = (index) => {
  const cur = document.getElementById(`accordion-${index}`);
  const con = document.getElementById(`content-${index}`);
  if (!cur || !con) return;
  const wasActive = cur.hasAttribute('data-active');

  document.querySelectorAll('[id^="accordion-"]').forEach((a) => a.removeAttribute('data-active'));
  document.querySelectorAll('[id^="content-"]').forEach((c) => (c.style.maxHeight = '0'));

  if (wasActive) return;
  cur.setAttribute('data-active', '');
  con.style.maxHeight = con.scrollHeight + 'px';
};

// ===== Reviewer initials =====
const initInitials = () => {
  document.querySelectorAll('[data-reviewer]').forEach((rv, i) => {
    const name = (rv.innerText || '').trim();
    const letters = name.split(/[\s,]+/).slice(0, 2)
      .map((w) => (w[0] || '').toUpperCase()).join('');
    const slot = document.querySelector(`[data-initials="${rv.dataset.reviewer || (i+1)}"]`);
    if (slot) slot.innerText = letters;
  });
};

// ===== Intl-tel-style phone selector (emoji flags, no CDN, file:// safe) =====
const COUNTRIES = [
  ['AU','Australia','+61','🇦🇺'],
  ['NZ','New Zealand','+64','🇳🇿'],
  ['US','United States','+1','🇺🇸'],
  ['CA','Canada','+1','🇨🇦'],
  ['GB','United Kingdom','+44','🇬🇧'],
  ['IE','Ireland','+353','🇮🇪'],
  ['DE','Germany','+49','🇩🇪'],
  ['FR','France','+33','🇫🇷'],
  ['IT','Italy','+39','🇮🇹'],
  ['ES','Spain','+34','🇪🇸'],
  ['NL','Netherlands','+31','🇳🇱'],
  ['BE','Belgium','+32','🇧🇪'],
  ['CH','Switzerland','+41','🇨🇭'],
  ['AT','Austria','+43','🇦🇹'],
  ['SE','Sweden','+46','🇸🇪'],
  ['NO','Norway','+47','🇳🇴'],
  ['DK','Denmark','+45','🇩🇰'],
  ['FI','Finland','+358','🇫🇮'],
  ['PL','Poland','+48','🇵🇱'],
  ['CZ','Czechia','+420','🇨🇿'],
  ['PT','Portugal','+351','🇵🇹'],
  ['GR','Greece','+30','🇬🇷'],
  ['JP','Japan','+81','🇯🇵'],
  ['KR','South Korea','+82','🇰🇷'],
  ['SG','Singapore','+65','🇸🇬'],
  ['HK','Hong Kong','+852','🇭🇰'],
  ['IN','India','+91','🇮🇳'],
  ['AE','United Arab Emirates','+971','🇦🇪'],
  ['ZA','South Africa','+27','🇿🇦'],
  ['BR','Brazil','+55','🇧🇷'],
  ['MX','Mexico','+52','🇲🇽'],
  ['AR','Argentina','+54','🇦🇷'],
  ['CL','Chile','+56','🇨🇱'],
];

const initIntlPhone = () => {
  document.querySelectorAll('.tel-field').forEach((widget) => {
    const def = (widget.dataset.default || 'AU').toUpperCase();
    const toggle = widget.querySelector('.tel-field__dial');
    const flagSpot = widget.querySelector('.tel-field__flag');
    const dialSpot = widget.querySelector('.tel-field__code');
    const input = widget.querySelector('.tel-field__input');
    const list = widget.querySelector('.tel-field__list');
    if (!toggle || !flagSpot || !dialSpot || !input || !list) return;

    // build list once
    list.innerHTML = COUNTRIES.map(([iso, name, dial, flag]) =>
      `<li data-iso="${iso}" data-dial="${dial}"><span class="flag">${flag}</span><span class="name">${name}</span><span class="dial">${dial}</span></li>`
    ).join('');

    const setCountry = (iso) => {
      const c = COUNTRIES.find(([i]) => i === iso) || COUNTRIES[0];
      flagSpot.textContent = c[3];
      dialSpot.textContent = c[2];
      input.dataset.dial = c[2];
      input.dataset.iso = c[0];
    };
    setCountry(def);

    const setOpen = (state) => {
      list.toggleAttribute('hidden', !state);
      widget.classList.toggle('is-open', state);
    };
    setOpen(false);

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(list.hasAttribute('hidden'));
    });

    list.addEventListener('click', (e) => {
      e.stopPropagation();
      const li = e.target.closest('li');
      if (!li) return;
      setCountry(li.dataset.iso);
      setOpen(false);
    });

    document.addEventListener('click', (e) => {
      if (!widget.contains(e.target)) setOpen(false);
    });
  });
};

// ===== Form submit (front-end stub: prevents POST to non-existent /send) =====
const initForms = () => {
  document.querySelectorAll('form[data-form]').forEach((form) => {
    const msg = form.querySelector('[data-form-message]');
    const title = form.querySelector('[data-form-message-title]');
    const content = form.querySelector('[data-form-message-content]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (msg && title && content) {
        title.textContent = 'Application received';
        content.textContent = 'Your details have been recorded. A Ridge Fundastead representative will contact you shortly.';
        msg.classList.add('is-success');
      }
      form.reset();
      // restore default phone selection
      const def = form.querySelector('.tel-field');
      if (def) {
        const ev = new Event('input', { bubbles: true });
        def.querySelector('.tel-field__input')?.dispatchEvent(ev);
      }
    });
  });
};

// ===== Reviews carousel (very small, no deps) =====
const initSlider = (id) => {
  const wrap = document.querySelector(`[data-slider="${id}"]`);
  if (!wrap) return;
  const track = wrap.firstElementChild;
  const slides = track.children;
  if (!slides.length) return;

  let idx = 0;
  const total = slides.length;
  const setPos = () => {
    track.style.transition = 'transform 350ms ease';
    track.style.transform = `translateX(-${(idx * 100) / Math.min(2, total)}%)`;
  };
  document.querySelector(`[data-prev="${id}"]`)?.addEventListener('click', () => {
    idx = (idx - 1 + total) % total;
    setPos();
  });
  document.querySelector(`[data-next="${id}"]`)?.addEventListener('click', () => {
    idx = (idx + 1) % total;
    setPos();
  });
};

// ===== Lazy-load (uses included lazyload.min.js if present) =====
const initLazy = () => {
  if (window.LazyLoad) {
    new LazyLoad({ elements_selector: '[data-lazy]' });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.remove('loading');
  document.getElementById('skeleton')?.remove();
  initMobileMenu();
  initLangToggles();
  initInitials();
  initIntlPhone();
  initForms();
  initSlider('reviews');
  initLazy();
});

// ===== Live trading quotes (TradingView single-quote embeds) =====
window.addEventListener('load', () => {
  const container = document.querySelector('[data-trading]');
  if (!container) return;
  const symbols = ['CRYPTO:BTCUSD', 'CRYPTO:ETHUSD', 'CRYPTOCAP:XRP', 'COINBASE:SOLUSD'];
  const cfg = { colorTheme: 'light', isTransparent: true, locale: 'en', width: '100%' };
  symbols.forEach((symbol) => {
    const card = document.createElement('div');
    card.className = 'tv-card';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
    script.async = true;
    script.innerHTML = JSON.stringify({ ...cfg, symbol });
    card.appendChild(script);
    container.appendChild(card);
  });
  container.classList.add('tradingview-grid');
});
