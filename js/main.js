/* ==========================================================================
   Opulatrix Canada — main.js
   - Mobile nav toggle
   - Country/dial-code picker for phone fields
   - Client-side form validation + success state
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  var navToggle = document.querySelector(".nav__toggle");
  var navMenu = document.querySelector(".nav__menu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var open = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Country list (curated, default = Canada) ---------- */
  var COUNTRIES = [
    { c: "CA", n: "Canada",                d: "1",   f: "🇨🇦" },
    { c: "US", n: "United States",         d: "1",   f: "🇺🇸" },
    { c: "GB", n: "United Kingdom",        d: "44",  f: "🇬🇧" },
    { c: "AU", n: "Australia",             d: "61",  f: "🇦🇺" },
    { c: "DE", n: "Germany",               d: "49",  f: "🇩🇪" },
    { c: "FR", n: "France",                d: "33",  f: "🇫🇷" },
    { c: "ES", n: "Spain",                 d: "34",  f: "🇪🇸" },
    { c: "IT", n: "Italy",                 d: "39",  f: "🇮🇹" },
    { c: "NL", n: "Netherlands",           d: "31",  f: "🇳🇱" },
    { c: "BE", n: "Belgium",               d: "32",  f: "🇧🇪" },
    { c: "CH", n: "Switzerland",           d: "41",  f: "🇨🇭" },
    { c: "AT", n: "Austria",               d: "43",  f: "🇦🇹" },
    { c: "IE", n: "Ireland",               d: "353", f: "🇮🇪" },
    { c: "SE", n: "Sweden",                d: "46",  f: "🇸🇪" },
    { c: "NO", n: "Norway",                d: "47",  f: "🇳🇴" },
    { c: "DK", n: "Denmark",               d: "45",  f: "🇩🇰" },
    { c: "FI", n: "Finland",               d: "358", f: "🇫🇮" },
    { c: "PL", n: "Poland",                d: "48",  f: "🇵🇱" },
    { c: "PT", n: "Portugal",              d: "351", f: "🇵🇹" },
    { c: "CZ", n: "Czech Republic",        d: "420", f: "🇨🇿" },
    { c: "GR", n: "Greece",                d: "30",  f: "🇬🇷" },
    { c: "TR", n: "Turkey",                d: "90",  f: "🇹🇷" },
    { c: "AE", n: "United Arab Emirates",  d: "971", f: "🇦🇪" },
    { c: "SA", n: "Saudi Arabia",          d: "966", f: "🇸🇦" },
    { c: "IN", n: "India",                 d: "91",  f: "🇮🇳" },
    { c: "JP", n: "Japan",                 d: "81",  f: "🇯🇵" },
    { c: "KR", n: "South Korea",           d: "82",  f: "🇰🇷" },
    { c: "SG", n: "Singapore",             d: "65",  f: "🇸🇬" },
    { c: "MY", n: "Malaysia",              d: "60",  f: "🇲🇾" },
    { c: "HK", n: "Hong Kong",             d: "852", f: "🇭🇰" },
    { c: "NZ", n: "New Zealand",           d: "64",  f: "🇳🇿" },
    { c: "MX", n: "Mexico",                d: "52",  f: "🇲🇽" },
    { c: "BR", n: "Brazil",                d: "55",  f: "🇧🇷" },
    { c: "AR", n: "Argentina",             d: "54",  f: "🇦🇷" },
    { c: "CL", n: "Chile",                 d: "56",  f: "🇨🇱" },
    { c: "CO", n: "Colombia",              d: "57",  f: "🇨🇴" },
    { c: "ZA", n: "South Africa",          d: "27",  f: "🇿🇦" },
    { c: "NG", n: "Nigeria",               d: "234", f: "🇳🇬" },
    { c: "EG", n: "Egypt",                 d: "20",  f: "🇪🇬" },
    { c: "IL", n: "Israel",                d: "972", f: "🇮🇱" }
  ];

  function initPhoneInput(input) {
    if (!input || input.dataset.phoneReady) return;
    input.dataset.phoneReady = "1";

    var wrap = document.createElement("div");
    wrap.className = "phone-input";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.placeholder = input.placeholder || "555 123 4567";
    input.setAttribute("inputmode", "tel");
    input.setAttribute("autocomplete", "tel-national");

    // Trigger
    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "phone-input__country";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML =
      '<span class="phone-input__flag"></span>' +
      '<span class="phone-input__dial"></span>' +
      '<svg class="phone-input__chev" viewBox="0 0 12 8" fill="none" aria-hidden="true">' +
      '<path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    wrap.insertBefore(trigger, input);

    // Hidden field for dial code
    var hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = input.name + "_country";
    hidden.value = "CA";
    wrap.appendChild(hidden);

    // Dropdown
    var dd = document.createElement("div");
    dd.className = "phone-input__dropdown";
    dd.innerHTML =
      '<input type="text" class="phone-input__search" placeholder="Search country..." aria-label="Search country">' +
      '<ul class="phone-input__list" role="listbox"></ul>';
    wrap.appendChild(dd);

    var list = dd.querySelector(".phone-input__list");
    var search = dd.querySelector(".phone-input__search");

    function renderList(filter) {
      list.innerHTML = "";
      var f = (filter || "").toLowerCase().trim();
      COUNTRIES.forEach(function (co) {
        if (f && co.n.toLowerCase().indexOf(f) === -1 && co.d.indexOf(f) === -1 && co.c.toLowerCase().indexOf(f) === -1) return;
        var li = document.createElement("li");
        li.setAttribute("role", "option");
        li.dataset.code = co.c;
        li.dataset.dial = co.d;
        li.dataset.flag = co.f;
        li.innerHTML = '<span style="font-size:1.2rem">' + co.f + '</span>' +
                       '<span>' + co.n + '</span>' +
                       '<span class="dial">+' + co.d + '</span>';
        li.addEventListener("click", function () { selectCountry(co); });
        list.appendChild(li);
      });
    }

    function selectCountry(co) {
      trigger.querySelector(".phone-input__flag").textContent = co.f;
      trigger.querySelector(".phone-input__dial").textContent = "+" + co.d;
      hidden.value = co.c;
      wrap.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      input.focus();
    }

    // Default: Canada
    selectCountry(COUNTRIES[0]);
    renderList("");

    // Toggle
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { search.value = ""; renderList(""); setTimeout(function(){ search.focus(); }, 30); }
    });
    search.addEventListener("input", function () { renderList(this.value); });
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });

    // Optional geo auto-detect (best-effort; silent fallback)
    if (window.fetch) {
      try {
        fetch("https://ipapi.co/country/", { mode: "cors" })
          .then(function (r) { return r.ok ? r.text() : null; })
          .then(function (code) {
            if (!code) return;
            code = code.trim().toUpperCase();
            var match = COUNTRIES.find(function (c) { return c.c === code; });
            if (match) selectCountry(match);
          })
          .catch(function () { /* silent */ });
      } catch (e) { /* ignore */ }
    }
  }

  /* ---------- Form validation ---------- */
  function validateField(field) {
    var input = field.querySelector("input, textarea, select");
    if (!input) return true;
    var val = (input.value || "").trim();
    var type = input.type;
    var required = input.required;
    var valid = true;

    if (required && !val) valid = false;
    if (valid && type === "email" && val) {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
    }
    if (valid && type === "tel" && val) {
      // Accept 6-15 digits (after stripping non-digits)
      var digits = val.replace(/\D/g, "");
      valid = digits.length >= 6 && digits.length <= 15;
    }
    field.classList.toggle("is-invalid", !valid);
    return valid;
  }

  function bindForm(form) {
    if (!form || form.dataset.bound) return;
    form.dataset.bound = "1";
    var fields = form.querySelectorAll(".form-field");
    fields.forEach(function (f) {
      var input = f.querySelector("input, textarea, select");
      if (!input) return;
      input.addEventListener("blur", function () { validateField(f); });
      input.addEventListener("input", function () {
        if (f.classList.contains("is-invalid")) validateField(f);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      fields.forEach(function (f) { if (!validateField(f)) ok = false; });

      // Required checkboxes
      var checks = form.querySelectorAll('.form-check input[type="checkbox"][required]');
      checks.forEach(function (cb) {
        if (!cb.checked) {
          ok = false;
          cb.closest(".form-check").style.color = "var(--color-danger)";
        } else {
          cb.closest(".form-check").style.color = "";
        }
      });

      if (!ok) return;

      var success = form.querySelector(".form-success") ||
        (function () {
          var d = document.createElement("div");
          d.className = "form-success";
          d.textContent = "Thank you! Your request has been received. A specialist from Opulatrix Canada will contact you within one business day.";
          form.insertBefore(d, form.firstChild);
          return d;
        })();
      success.classList.add("is-visible");
      form.querySelectorAll("input, select, textarea, button").forEach(function (el) {
        if (el.type !== "hidden") el.disabled = true;
      });
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('input[type="tel"]').forEach(initPhoneInput);
    document.querySelectorAll("form[data-validate]").forEach(bindForm);

    // Mark active nav link based on pathname
    var path = window.location.pathname.replace(/\/index\.html$/, "/");
    if (path === "") path = "/";
    document.querySelectorAll(".nav__menu a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href) return;
      var hp = href.replace(/\/index\.html$/, "/");
      if (hp === path || (hp !== "/" && path.indexOf(hp) === 0)) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
    });

    // Smooth-scroll for in-page anchors
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = this.getAttribute("href").slice(1);
        if (!id) return;
        var el = document.getElementById(id);
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
      });
    });
  });
})();
