(function () {
  var toggle = document.querySelector('[data-nav-toggle]');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var isOpen = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.querySelectorAll('[data-nav] a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('img[data-placeholder]').forEach(function (img) {
    var frame = img.closest('.media-frame');
    if (!frame) return;
    var markMissing = function () {
      frame.classList.add('is-missing');
    };
    if (img.complete && img.naturalWidth === 0) {
      markMissing();
    } else {
      img.addEventListener('error', markMissing);
    }
  });

  var sections = document.querySelectorAll('main [id]');
  var navLinks = document.querySelectorAll('[data-nav] a[href^="#"]');
  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = document.querySelector('[data-nav] a[href="#' + entry.target.id + '"]');
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) {
              l.classList.remove('is-active');
            });
            link.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Contact form: submit to Formspree over fetch so the visitor stays on the page.
  var contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    var note = contactForm.querySelector('[data-form-note]');
    var submitBtn = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener('submit', function (e) {
      if (!window.fetch) return; // no fetch: let the native POST to Formspree happen
      e.preventDefault();
      if (note) note.textContent = 'Sending…';
      if (submitBtn) submitBtn.disabled = true;

      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (res.ok) {
            contactForm.reset();
            if (note) note.textContent = "Thanks — your note is in. I'll be in touch.";
          } else {
            return res.json().then(function (data) {
              var msg =
                data && data.errors && data.errors.length
                  ? data.errors.map(function (x) { return x.message; }).join(', ')
                  : 'Something went wrong. Email me directly at lukebonniwell@gmail.com.';
              if (note) note.textContent = msg;
              if (submitBtn) submitBtn.disabled = false;
            });
          }
        })
        .catch(function () {
          if (note) note.textContent =
            "Couldn't send just now. Email me directly at lukebonniwell@gmail.com.";
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  // Quick links: copy the email address to the clipboard (fall back to a mail compose).
  var copyBtn = document.querySelector('[data-copy-email]');
  if (copyBtn) {
    var copyLabel = copyBtn.querySelector('[data-copy-label]');
    var copyDefault = copyLabel ? copyLabel.textContent : '';
    copyBtn.addEventListener('click', function () {
      var address = copyBtn.getAttribute('data-email');
      var flash = function (msg) {
        if (!copyLabel) return;
        copyLabel.textContent = msg;
        setTimeout(function () {
          copyLabel.textContent = copyDefault;
        }, 2000);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(address).then(
          function () { flash('copied to clipboard'); },
          function () { window.location.href = 'mailto:' + address; }
        );
      } else {
        window.location.href = 'mailto:' + address;
      }
    });
  }
})();
