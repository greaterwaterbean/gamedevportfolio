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

  // Contact form: no backend, so hand the note off to the visitor's email app.
  var contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = function (name) {
        var field = contactForm.elements[name];
        return field ? field.value.trim() : '';
      };
      var name = get('name');
      var email = get('email');
      var subject = get('subject') || 'Message from lukebonniwell.com';
      var lines = [get('message'), ''];
      if (name) lines.push('— ' + name);
      if (email) lines.push(email);
      var href =
        'mailto:lukebonniwell@gmail.com' +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      var note = contactForm.querySelector('[data-form-note]');
      if (note) note.textContent = 'Opening your email app…';
      window.location.href = href;
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
