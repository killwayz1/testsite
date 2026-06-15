(function () {
  'use strict';
  /* Minimal intl-tel-input-like country code selector.
     Default country: Canada (CA). Includes ~70 commonly used countries. */

  var COUNTRIES = [
    ['CA', 'Canada', '1'],
    ['US', 'États-Unis', '1'],
    ['FR', 'France', '33'],
    ['BE', 'Belgique', '32'],
    ['CH', 'Suisse', '41'],
    ['LU', 'Luxembourg', '352'],
    ['MC', 'Monaco', '377'],
    ['GB', 'Royaume-Uni', '44'],
    ['IE', 'Irlande', '353'],
    ['DE', 'Allemagne', '49'],
    ['AT', 'Autriche', '43'],
    ['NL', 'Pays-Bas', '31'],
    ['ES', 'Espagne', '34'],
    ['PT', 'Portugal', '351'],
    ['IT', 'Italie', '39'],
    ['DK', 'Danemark', '45'],
    ['SE', 'Suède', '46'],
    ['NO', 'Norvège', '47'],
    ['FI', 'Finlande', '358'],
    ['IS', 'Islande', '354'],
    ['PL', 'Pologne', '48'],
    ['CZ', 'Tchéquie', '420'],
    ['SK', 'Slovaquie', '421'],
    ['HU', 'Hongrie', '36'],
    ['RO', 'Roumanie', '40'],
    ['BG', 'Bulgarie', '359'],
    ['GR', 'Grèce', '30'],
    ['HR', 'Croatie', '385'],
    ['SI', 'Slovénie', '386'],
    ['EE', 'Estonie', '372'],
    ['LV', 'Lettonie', '371'],
    ['LT', 'Lituanie', '370'],
    ['MT', 'Malte', '356'],
    ['CY', 'Chypre', '357'],
    ['TR', 'Turquie', '90'],
    ['IL', 'Israël', '972'],
    ['AE', 'Émirats arabes unis', '971'],
    ['SA', 'Arabie saoudite', '966'],
    ['QA', 'Qatar', '974'],
    ['KW', 'Koweït', '965'],
    ['BH', 'Bahreïn', '973'],
    ['OM', 'Oman', '968'],
    ['EG', 'Égypte', '20'],
    ['MA', 'Maroc', '212'],
    ['TN', 'Tunisie', '216'],
    ['DZ', 'Algérie', '213'],
    ['SN', 'Sénégal', '221'],
    ['CI', 'Côte d’Ivoire', '225'],
    ['CM', 'Cameroun', '237'],
    ['ZA', 'Afrique du Sud', '27'],
    ['NG', 'Nigeria', '234'],
    ['KE', 'Kenya', '254'],
    ['AU', 'Australie', '61'],
    ['NZ', 'Nouvelle-Zélande', '64'],
    ['JP', 'Japon', '81'],
    ['KR', 'Corée du Sud', '82'],
    ['CN', 'Chine', '86'],
    ['HK', 'Hong Kong', '852'],
    ['TW', 'Taïwan', '886'],
    ['SG', 'Singapour', '65'],
    ['MY', 'Malaisie', '60'],
    ['TH', 'Thaïlande', '66'],
    ['VN', 'Vietnam', '84'],
    ['ID', 'Indonésie', '62'],
    ['PH', 'Philippines', '63'],
    ['IN', 'Inde', '91'],
    ['PK', 'Pakistan', '92'],
    ['BD', 'Bangladesh', '880'],
    ['MX', 'Mexique', '52'],
    ['BR', 'Brésil', '55'],
    ['AR', 'Argentine', '54'],
    ['CL', 'Chili', '56'],
    ['CO', 'Colombie', '57'],
    ['PE', 'Pérou', '51'],
    ['UY', 'Uruguay', '598'],
    ['UA', 'Ukraine', '380']
  ];

  function flagSrc(code) {
    return '/images/flags/' + code.toLowerCase() + '.svg';
  }

  function buildSelector(input) {
    var wrap = document.createElement('div');
    wrap.className = 'iti';
    var inputParent = input.parentNode;
    inputParent.insertBefore(wrap, input);
    wrap.appendChild(input);

    var defaultCode = (input.getAttribute('data-default') || 'CA').toUpperCase();
    var current = COUNTRIES.find(function (c) { return c[0] === defaultCode; }) || COUNTRIES[0];

    var fc = document.createElement('div');
    fc.className = 'iti__flag-container';
    fc.setAttribute('role', 'button');
    fc.setAttribute('aria-label', 'Choisir le code pays');
    fc.innerHTML =
      '<span class="iti__selected">' +
        '<img class="iti__flag" alt="" src="' + flagSrc(current[0]) + '" width="26" height="18">' +
        '<span class="iti__dial">+' + current[2] + '</span>' +
        '<span class="iti__chev">▾</span>' +
      '</span>';
    wrap.insertBefore(fc, input);

    var list = document.createElement('div');
    list.className = 'iti__list';
    list.setAttribute('role', 'listbox');
    var search = document.createElement('div');
    search.className = 'iti__search';
    search.innerHTML = '<input type="search" placeholder="Rechercher un pays…" autocomplete="off">';
    list.appendChild(search);
    var items = document.createElement('div');
    list.appendChild(items);
    wrap.appendChild(list);

    function render(filter) {
      filter = (filter || '').toLowerCase();
      items.innerHTML = '';
      COUNTRIES.forEach(function (c) {
        if (filter &&
            c[1].toLowerCase().indexOf(filter) === -1 &&
            c[0].toLowerCase().indexOf(filter) === -1 &&
            c[2].indexOf(filter) === -1) return;
        var opt = document.createElement('div');
        opt.className = 'iti__opt' + (c[0] === current[0] ? ' is-active' : '');
        opt.setAttribute('role', 'option');
        opt.innerHTML =
          '<img class="iti__flag" alt="" src="' + flagSrc(c[0]) + '" width="26" height="18">' +
          '<span class="name">' + c[1] + '</span>' +
          '<span class="code">+' + c[2] + '</span>';
        opt.addEventListener('click', function () {
          current = c;
          fc.querySelector('.iti__flag').src = flagSrc(c[0]);
          fc.querySelector('.iti__dial').textContent = '+' + c[2];
          input.setAttribute('data-dial', c[2]);
          input.setAttribute('data-country', c[0]);
          close();
          input.focus();
        });
        items.appendChild(opt);
      });
    }

    function open() {
      wrap.classList.add('is-open');
      var s = search.querySelector('input');
      s.value = '';
      render('');
      setTimeout(function () { s.focus(); }, 10);
    }
    function close() { wrap.classList.remove('is-open'); }
    fc.addEventListener('click', function (e) {
      e.stopPropagation();
      if (wrap.classList.contains('is-open')) close(); else open();
    });
    search.querySelector('input').addEventListener('input', function (e) {
      render(e.target.value);
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });

    input.setAttribute('data-dial', current[2]);
    input.setAttribute('data-country', current[0]);
    render('');
  }

  document.querySelectorAll('input[data-phone]').forEach(buildSelector);
})();
