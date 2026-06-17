document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (preloader) {
                preloader.classList.add('_hidden');
                setTimeout(() => preloader.remove(), 500);
            }
        }, 300);
    });

    const scrollToTopBtn = document.getElementById('scrollToTop');
    window.addEventListener('scroll', () => {
        if (scrollToTopBtn) {
            if (window.scrollY > 400) {
                scrollToTopBtn.classList.add('_show');
            } else {
                scrollToTopBtn.classList.remove('_show');
            }
        }
    });

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    const cookiePopup = document.getElementById('cookiePopup');
    const acceptCookiesBtn = document.getElementById('acceptCookies');

    if (cookiePopup && acceptCookiesBtn) {
        if (!localStorage.getItem('cookieConsentAccepted')) {
            setTimeout(() => {
                cookiePopup.classList.add('_show');
            }, 1000);
        }

        acceptCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsentAccepted', 'true');
            cookiePopup.classList.remove('_show');
        });
    }

    const forms = document.querySelectorAll('.main-form__form');

    forms.forEach((form, index) => {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        const checkboxesWrapper = document.createElement('div');
        checkboxesWrapper.className = 'form__column';
        checkboxesWrapper.style.cssText = 'width: 100%; margin-top: 10px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 10px; flex-basis: 100%;';

        const ageContainer = document.createElement('div');
        ageContainer.className = 'form__checkbox-container';
        ageContainer.style.cssText = 'display: flex; align-items: flex-start; gap: 10px; font-family: "Questrial", sans-serif; font-size: 14px; text-align: left; padding: 0 10px;';

        const ageCheckboxId = `age_agree_${index}`;
        const ageCheckbox = document.createElement('input');
        ageCheckbox.type = 'checkbox';
        ageCheckbox.id = ageCheckboxId;
        ageCheckbox.required = true;
        ageCheckbox.style.cssText = 'margin-top: 4px; cursor: pointer; width: 16px; height: 16px; flex-shrink: 0;';

        const ageLabel = document.createElement('label');
        ageLabel.setAttribute('for', ageCheckboxId);
        ageLabel.style.cssText = 'cursor: pointer; line-height: 1.4; color: inherit;';
        ageLabel.innerHTML = `I confirm that I am 18 years of age or older.`;

        ageContainer.appendChild(ageCheckbox);
        ageContainer.appendChild(ageLabel);

        const policyContainer = document.createElement('div');
        policyContainer.className = 'form__checkbox-container';
        policyContainer.style.cssText = 'display: flex; align-items: flex-start; gap: 10px; font-family: "Questrial", sans-serif; font-size: 14px; text-align: left; padding: 0 10px;';

        const policyCheckboxId = `policy_agree_${index}`;
        const policyCheckbox = document.createElement('input');
        policyCheckbox.type = 'checkbox';
        policyCheckbox.id = policyCheckboxId;
        policyCheckbox.required = true;
        policyCheckbox.style.cssText = 'margin-top: 4px; cursor: pointer; width: 16px; height: 16px; flex-shrink: 0;';

        const policyLabel = document.createElement('label');
        policyLabel.setAttribute('for', policyCheckboxId);
        policyLabel.style.cssText = 'cursor: pointer; line-height: 1.4; color: inherit;';
        policyLabel.innerHTML = `I accept the website’s <a href="/privacy/" target="_blank" style="text-decoration: underline;">Privacy Policy</a> and <a href="/terms/" target="_blank" style="text-decoration: underline;">Terms and Conditions</a>.`;

        policyContainer.appendChild(policyCheckbox);
        policyContainer.appendChild(policyLabel);

        checkboxesWrapper.appendChild(ageContainer);
        checkboxesWrapper.appendChild(policyContainer);

        const submitBtnColumn = submitBtn.closest('.form__column');
        if (submitBtnColumn && submitBtnColumn.parentNode) {
            submitBtnColumn.parentNode.insertBefore(checkboxesWrapper, submitBtnColumn);
        } else if (submitBtn.parentNode) {
            submitBtn.parentNode.insertBefore(checkboxesWrapper, submitBtn);
        }

        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.style.transition = 'opacity 0.3s ease';

        const updateButtonState = () => {
            if (ageCheckbox.checked && policyCheckbox.checked) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            } else {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
        };

        ageCheckbox.addEventListener('change', updateButtonState);
        policyCheckbox.addEventListener('change', updateButtonState);

        const mainFormBody = form.closest('.main-form__body');
        if (mainFormBody) {
            const oldFooter = mainFormBody.querySelector('.main-form__footer');
            if (oldFooter) {
                oldFooter.style.display = 'none';
            }
        }
    });

    const cards = document.querySelectorAll('.blog-card');

    cards.forEach((article, index) => {
        const postIndex = index + 1;
        const urlElement = article.querySelector('.blog-card__url');
        const blogUrl = urlElement ? urlElement.getAttribute('href') : null;

        if (blogUrl && blogUrl !== "#") {
            const titleDest = article.querySelector('.title_blog' + postIndex);
            const textDest = article.querySelector('.text_blog' + postIndex);

            fetch(blogUrl)
                .then(response => {
                    if (!response.ok) throw new Error('Network error');
                    return response.text();
                })
                .then(htmlString => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlString, 'text/html');

                    const titleSource = doc.querySelector('h1');
                    const textSource = doc.querySelector('.blog-post__content p');

                    if (titleDest && titleSource) {
                        titleDest.textContent = titleSource.textContent.trim();
                    }
                    if (textDest && textSource) {
                        const cleanText = textSource.textContent.trim();
                        textDest.textContent = cleanText.length > 160
                            ? cleanText.substring(0, 160) + '...'
                            : cleanText;
                    }
                })
                .catch(error => console.error('Fetch error:', error));
        }
    });

    const faqHeaders = document.querySelectorAll('.faq h3');

    faqHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const answer = header.nextElementSibling;
            const isActive = header.classList.contains('active');

            document.querySelectorAll('.faq h3').forEach(h => h.classList.remove('active'));
            document.querySelectorAll('.faq p').forEach(p => p.classList.remove('active'));

            if (!isActive && answer && answer.tagName.toLowerCase() === 'p') {
                header.classList.add('active');
                answer.classList.add('active');
            }
        });
    });

    const detailsContainer = document.querySelector('.details');

    if (detailsContainer) {
        const headings = detailsContainer.querySelectorAll('h3');

        const modifiers = [
            'item__box--platform',
            'item__box--supported',
            'item__box--protection',
            'item__box--cost',
            'item__box--deposit',
            'item__box--world'
        ];

        const boxesContainer = document.createElement('div');
        boxesContainer.className = 'details__boxes';

        headings.forEach((h3, index) => {
            const p = h3.nextElementSibling;

            if (p && p.tagName.toLowerCase() === 'p') {
                const box = document.createElement('div');
                const modifier = modifiers[index] || '';
                box.className = `item__box ${modifier} item__box--white`;

                const title = document.createElement('p');
                title.className = 'item__box-title item__box-title--small';
                title.innerHTML = h3.innerHTML;

                const text = document.createElement('p');
                text.className = 'item__box-text';
                text.innerHTML = p.innerHTML;

                box.appendChild(title);
                box.appendChild(text);
                boxesContainer.appendChild(box);
            }
        });

        detailsContainer.innerHTML = '';
        detailsContainer.appendChild(boxesContainer);
    }

    const experienceContainer = document.querySelector('.experience');

    if (experienceContainer) {
        const headings = experienceContainer.querySelectorAll('h3');

        const topContainer = document.createElement('div');
        topContainer.className = 'item__boxes-top experience__boxes-top';

        const bottomContainer = document.createElement('div');
        bottomContainer.className = 'item__boxes-bottom';

        headings.forEach((h3, index) => {
            const p = h3.nextElementSibling;

            if (p && p.tagName.toLowerCase() === 'p') {
                const box = document.createElement('div');

                let boxClass = 'item__box item__box--sm item__box--noafter item__box--white';
                if (index < 2) {
                    boxClass += ' item__box--wide';
                }
                box.className = boxClass;

                const title = document.createElement('p');
                title.className = 'item__box-title';
                title.innerHTML = h3.innerHTML;

                const text = document.createElement('p');
                text.className = 'item__box-text';
                text.innerHTML = p.innerHTML;

                box.appendChild(title);
                box.appendChild(text);

                if (index < 2) {
                    topContainer.appendChild(box);
                } else {
                    bottomContainer.appendChild(box);
                }
            }
        });

        experienceContainer.innerHTML = '';
        experienceContainer.appendChild(topContainer);
        experienceContainer.appendChild(bottomContainer);
    }


    const whyContainer = document.querySelector('.why');
    if (whyContainer) {
        const headings = whyContainer.querySelectorAll('h3');
        const signBtn = whyContainer.querySelector('.why__sign-btn');
        const modifiers = ['item__box--type', 'item__box--user', 'item__box--safe'];
        const boxesWrapper = document.createElement('div');
        boxesWrapper.className = 'item__boxes';
        headings.forEach((h3, index) => {
            const p = h3.nextElementSibling;
            if (p && p.tagName.toLowerCase() === 'p') {
                const box = document.createElement('div');
                box.className = `item__box ${modifiers[index] || ''}`;
                const title = document.createElement('h3');
                title.className = 'item__box-title';
                title.innerHTML = h3.innerHTML;
                const text = document.createElement('p');
                text.className = 'item__box-text';
                text.innerHTML = p.innerHTML;
                box.appendChild(title);
                box.appendChild(text);
                boxesWrapper.appendChild(box);
            }
        });
        whyContainer.innerHTML = '';
        whyContainer.appendChild(boxesWrapper);
        if (signBtn) whyContainer.appendChild(signBtn);
    }

    const valInp = document.getElementById('value');
    const rangeInp = document.getElementById('range');
    const daysDisp = document.getElementById('days');
    const amountDisp = document.getElementById('ammount');
    const symDisp = document.getElementById('symbol');

    if (valInp && rangeInp && daysDisp && amountDisp) {
        const rate = parseFloat(amountDisp.dataset.rate) || 0.05;
        if (symDisp) symDisp.textContent = '$';

        const updateCalc = () => {
            const v = parseFloat(valInp.value) || 0;
            const d = parseInt(rangeInp.value) || 1;
            const res = v * Math.pow(1 + rate, d);

            let suffix = daysDisp.dataset.daysMany;
            if (d === 1) suffix = daysDisp.dataset.day;
            else if (d > 1 && d < 5) suffix = daysDisp.dataset.days;

            daysDisp.textContent = `${d} ${suffix}`;
            amountDisp.textContent = res.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        valInp.addEventListener('input', updateCalc);
        rangeInp.addEventListener('input', updateCalc);
        updateCalc();
    }
});