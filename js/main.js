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

  var revealTargets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealTargets.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

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
})();
