document.addEventListener('DOMContentLoaded', () => {
  const currentLanguage = document.querySelector(".current-language");
  const languageToggle = currentLanguage?.closest(".language-toggle");

  if (currentLanguage && languageToggle) {
    currentLanguage.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      languageToggle.classList.toggle("active");
    });
  }

  // Закрытие при клике вне
  document.addEventListener("click", function () {
    document.querySelectorAll(".language-toggle.active").forEach(el => {
      el.classList.remove("active");
    });
  });

  // Предотвращаем закрытие при клике на dropdown
  const dropdown = document.querySelector(".language-dropdown");
  if (dropdown) {
    dropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // Определение текущего языка по URL
  const currentPath = window.location.pathname;
  let activeLang = null;

  document.querySelectorAll(".language-link").forEach(link => {
    // Для корректной работы 'x-default' на главной
    const href = link.getAttribute("href");
    // Считаем язык активным, если путь ИМЕННО СОВПАДАЕТ с href (для /)
    // или НАЧИНАЕТСЯ с href (для /, / и т.д.)
    if ((href === '/' && currentPath === href) || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add("active");
      activeLang = link;
    }
  });

  // Обновляем отображение текущего языка
  if (activeLang) {
    const flag = activeLang.querySelector(".flag")?.textContent || "";
    const text = activeLang.querySelector(".text")?.textContent || "";

    const currentFlag = document.querySelector(".current-language .flag");
    const currentText = document.querySelector(".current-language .text");

    if (currentFlag) currentFlag.textContent = flag;
    if (currentText) currentText.textContent = text;

    activeLang.style.display = 'none';
  }
})
