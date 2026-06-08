//===============================================================
const initConnectors = () => {
  document.querySelectorAll('[data-connector]').forEach((connector) => {
    let isOpen = false;

    const parent = connector.closest('[data-connect-parent]') || document;
    const target = parent.querySelector(`[data-connect="${connector.dataset.connector}"]`);

    if (!target) return;

    const toggle = (state) => {
      isOpen = state;
      connector.toggleAttribute('data-active', isOpen);
      target.toggleAttribute('data-active', isOpen);
    };

    connector.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle(!isOpen);
    });

    target.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('click', () => {
      if (isOpen) toggle(false);
    });
  });
};

//===============================================================
const initMobuleMenu = () => {
  let isOpen = false;

  const icon = document.querySelector('[data-menu-icon]');
  const menu = document.querySelector('[data-mobile-menu]');

  const toggleMenu = (state) => {
    isOpen = state;

    icon.toggleAttribute('data-active', isOpen);
    menu.toggleAttribute('data-active', isOpen);
  };

  icon?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu(!isOpen);
  });

  menu?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.addEventListener('click', () => {
    if (isOpen) toggleMenu(false);
  });
};

//===============================================================
const initLangFlags = () => {
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-flag-img]').forEach((img) => {
      const testImg = new Image();
      const src = img.dataset.src;

      testImg.onload = () => {
        img.src = src;
      };

      testImg.onerror = () => {
        console.warn(`Flag image failed to load: ${src}`);
      };

      testImg.src = src;
    });
  });
};

//===============================================================
const initLazyLoad = () => {
  new LazyLoad({
    elements_selector: '[data-lazy]',
  });
};

//===============================================================
const toggleAccordion = (index) => {
  const currentAccordion = document.getElementById(`accordion-${index}`);
  const currentContent = document.getElementById(`content-${index}`);
  const isActive = currentAccordion.hasAttribute('data-active');

  const allAccordions = document.querySelectorAll('[id^="accordion-"]');
  const allContents = document.querySelectorAll('[id^="content-"]');

  allAccordions.forEach((acc) => acc.removeAttribute('data-active'));
  allContents.forEach((content) => (content.style.maxHeight = '0'));

  if (isActive) return;

  currentAccordion.setAttribute('data-active', '');
  currentContent.style.maxHeight = currentContent.scrollHeight + 'px';
};

//===============================================================
const initTrading = () => {
  const container = document.querySelector('[data-trading]');

  if (!container) return;

  const symbols = [
    'CRYPTO:BTCUSD',
    'CRYPTO:ETHUSD',
    'CRYPTO:SOLUSD',
    'CRYPTO:BNBUSD',
    'CRYPTOCAP:XRP',
    'CRYPTOCAP:IOTA',
  ];

  const config = {
    colorTheme: 'light',
    isTransparent: true,
    locale: window.defaultLang,
    width: '100%',
  };

  symbols.forEach((symbol) => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
    script.async = true;
    script.innerHTML = JSON.stringify({ ...config, symbol });

    container.appendChild(script);
  });
};

//===============================================================
const initChart = () => {
  const container = document.querySelector('[data-chart]');

  if (!container) return;

  const config = {
    lineWidth: 2,
    lineType: 0,
    chartType: 'area',
    fontColor: 'rgb(106, 109, 120)',
    gridLineColor: 'rgba(46, 46, 46, 0.06)',
    volumeUpColor: 'rgba(34, 171, 148, 0.5)',
    volumeDownColor: 'rgba(247, 82, 95, 0.5)',
    backgroundColor: '#ffffff',
    widgetFontColor: '#0F0F0F',
    upColor: '#22ab94',
    downColor: '#f7525f',
    borderUpColor: '#22ab94',
    borderDownColor: '#f7525f',
    wickUpColor: '#22ab94',
    wickDownColor: '#f7525f',
    colorTheme: 'light',
    isTransparent: true,
    locale: window.currentLang,
    chartOnly: true,
    scalePosition: 'right',
    scaleMode: 'Normal',
    fontFamily: 'Roboto Slab, -apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
    valuesTracking: '1',
    changeMode: 'price-and-percent',
    symbols: [
      ['OKX:BTCUSD|1D'],
      ['BITSTAMP:ETHUSD|1D'],
      ['CRYPTOCAP:XRP|1D'],
      ['TRADENATION:SOLANA|1D'],
      ['CRYPTOCAP:BNB|1D'],
      ['BINANCE:DOGEUSDT|1D'],
      ['OKX:STETHUSD|1D'],
      ['CRYPTOCAP:ADA|1D'],
      ['BINANCE:WBTC|1D'],
    ],
    dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W'],
    fontSize: '20',
    headerFontSize: 'medium',
    autosize: true,
    width: '100%',
    height: '400',
    noTimeScale: false,
    hideDateRanges: false,
  };

  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
  script.async = true;
  script.innerHTML = JSON.stringify(config);

  container.appendChild(script);
};

//===============================================================
initLazyLoad();
initLangFlags();
initMobuleMenu();
initConnectors();
initTrading();
initChart();
