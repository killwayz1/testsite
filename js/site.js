document.addEventListener("DOMContentLoaded", function () {
  // FAQ accordion
  document.querySelectorAll(".faq-item").forEach(function (it) {
    var q = it.querySelector(".faq-q");
    var a = it.querySelector(".faq-a");
    if (!q || !a) return;
    a.style.display = "none";
    q.addEventListener("click", function () {
      var open = it.classList.contains("open");
      it.classList.toggle("open");
      a.style.display = open ? "none" : "block";
    });
  });

  // Mobile menu: main.min.js already wires the hamburger when innerWidth<1023.
  // We add a fallback only if main.min.js's handler hasn't run (e.g. resize from desktop into mobile,
  // or main.min.js failing to load). We detect this by checking the inline display style — main.min.js
  // sets `.mobile-menu__wrap{display:flex}` on load.
  var hamburger = document.querySelector(".hamburger");
  var mobileMenu = document.querySelector(".mobile-menu__wrap");
  var headerWrap = document.querySelector(".header-wrap.mob");
  function ensureMenuVisible() {
    if (mobileMenu && getComputedStyle(mobileMenu).display === "none") {
      mobileMenu.style.display = "flex";
    }
  }
  if (window.innerWidth < 1023) {
    ensureMenuVisible();
  }
  // Only attach our handler if window is mobile AND main.min.js failed to make the menu visible
  setTimeout(function () {
    if (window.innerWidth < 1023 && hamburger && mobileMenu && !mobileMenu.dataset.bound) {
      // Check if main.min.js already bound (it sets display:flex). If display is still 'none', it didn't.
      if (getComputedStyle(mobileMenu).display === "none") {
        mobileMenu.style.display = "flex";
        mobileMenu.dataset.bound = "1";
        hamburger.addEventListener("click", function () {
          mobileMenu.classList.toggle("active");
          if (headerWrap) headerWrap.classList.toggle("opened");
          document.documentElement.style.overflow = mobileMenu.classList.contains("active") ? "hidden" : "";
        });
        mobileMenu.querySelectorAll("a").forEach(function (a) {
          a.addEventListener("click", function () {
            mobileMenu.classList.remove("active");
            if (headerWrap) headerWrap.classList.remove("opened");
            document.documentElement.style.overflow = "";
          });
        });
      }
    }
  }, 50);

  // intl-tel-input init for every tel input
  if (typeof window.intlTelInput === "function") {
    document.querySelectorAll('input[type="tel"]').forEach(function (inp) {
      try {
        window.intlTelInput(inp, {
          initialCountry: "nl",
          preferredCountries: ["nl", "be", "de", "fr", "gb", "lu"],
          separateDialCode: true,
          autoPlaceholder: "polite"
        });
      } catch (e) {}
    });
  }
});
