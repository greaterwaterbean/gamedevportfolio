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

  // Coin hunt: coins tucked into cards around the homepage; finding them all
  // unlocks the chest in Contact. Runs only while <body data-fx> lists
  // "coin-hunt". Progress is kept in localStorage when the browser allows it.
  var fx = (document.body.getAttribute('data-fx') || '').split(/\s+/);
  var coins = document.querySelectorAll('[data-coin]');
  if (fx.indexOf('coin-hunt') !== -1 && coins.length) {
    var hud = document.querySelector('[data-coin-hud]');
    var countEl = document.querySelector('[data-coin-count]');
    var totalEl = document.querySelector('[data-coin-total]');
    var chest = document.querySelector('[data-chest]');
    var toast = document.querySelector('[data-toast]');
    var total = coins.length;
    var STORE = 'lb-coin-hunt';
    var reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ids = Array.prototype.map.call(coins, function (c) {
      return c.getAttribute('data-coin');
    });

    var state = { found: [], opened: false };
    try {
      var saved = JSON.parse(localStorage.getItem(STORE));
      if (saved && Array.isArray(saved.found)) {
        state.found = saved.found.filter(function (id) { return ids.indexOf(id) !== -1; });
        state.opened = !!saved.opened && state.found.length === total;
      }
    } catch (e) { /* storage blocked: play without saving */ }

    var save = function () {
      try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ }
    };
    var isComplete = function () { return state.found.length === total; };

    var render = function () {
      if (countEl) countEl.textContent = state.found.length;
      if (totalEl) totalEl.textContent = total;
      if (hud) {
        hud.classList.toggle('is-complete', isComplete());
        hud.setAttribute('aria-label', state.found.length + ' of ' + total + ' hidden coins found');
      }
      coins.forEach(function (c) {
        c.hidden = state.found.indexOf(c.getAttribute('data-coin')) !== -1;
      });
      if (chest) {
        chest.classList.toggle('is-unlocked', isComplete());
        chest.classList.toggle('is-open', state.opened);
        chest.setAttribute('aria-label', state.opened
          ? 'Treasure chest (open)'
          : isComplete() ? 'Treasure chest (unlocked) — open it' : 'Treasure chest (locked)');
      }
    };

    var replay = function (el, cls) {
      el.classList.remove(cls);
      void el.offsetWidth; // restart the CSS animation
      el.classList.add(cls);
    };

    var toastTimer;
    var hideToast = function () {
      if (toast) toast.classList.remove('is-visible');
    };
    // opts: { title, body, icon, action: { label, href, newTab, onClick }, duration }
    var showToast = function (opts) {
      if (!toast) return;
      toast.textContent = '';

      var icon = document.createElement('span');
      icon.className = 'game-toast-icon';
      var sprite = document.createElement('span');
      sprite.className = 'sprite ' + (opts.icon || 'sprite-coin');
      icon.appendChild(sprite);

      var text = document.createElement('span');
      var title = document.createElement('strong');
      title.className = 'game-toast-title';
      title.textContent = opts.title;
      text.appendChild(title);
      if (opts.body) {
        var body = document.createElement('span');
        body.className = 'game-toast-body';
        body.textContent = opts.body;
        text.appendChild(body);
      }
      if (opts.action) {
        var action = document.createElement(opts.action.href ? 'a' : 'button');
        action.className = 'game-toast-action';
        action.textContent = opts.action.label;
        if (opts.action.href) {
          action.href = opts.action.href;
          if (opts.action.newTab) {
            action.target = '_blank';
            action.rel = 'noopener';
          }
        } else {
          action.type = 'button';
        }
        action.addEventListener('click', function () {
          if (opts.action.onClick) opts.action.onClick();
          else hideToast();
        });
        text.appendChild(action);
      }

      toast.appendChild(icon);
      toast.appendChild(text);
      toast.classList.add('is-visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(hideToast, opts.duration || 3500);
    };

    if (toast) {
      toast.addEventListener('mouseenter', function () { clearTimeout(toastTimer); });
      toast.addEventListener('mouseleave', function () {
        toastTimer = setTimeout(hideToast, 2000);
      });
    }

    var resetHunt = function () {
      state = { found: [], opened: false };
      save();
      render();
      showToast({ title: 'Coins hidden again', body: 'Happy hunting.' });
    };

    coins.forEach(function (coin) {
      coin.addEventListener('click', function () {
        var id = coin.getAttribute('data-coin');
        if (state.found.indexOf(id) !== -1) return;
        state.found.push(id);
        save();

        if (!reduceMotion) {
          var r = coin.getBoundingClientRect();
          var pop = document.createElement('span');
          pop.className = 'coin-pop';
          pop.textContent = '+1';
          pop.style.left = (r.left + r.width / 2 - 12) + 'px';
          pop.style.top = (r.top - 8) + 'px';
          document.body.appendChild(pop);
          setTimeout(function () { pop.parentNode.removeChild(pop); }, 800);
        }
        coin.classList.add('is-collected');
        setTimeout(function () {
          coin.classList.remove('is-collected');
          render();
        }, reduceMotion ? 0 : 450);
        if (countEl) countEl.textContent = state.found.length;
        if (hud) replay(hud, 'is-bump');

        if (isComplete()) {
          showToast({
            title: 'All ' + total + ' coins found!',
            body: 'The chest down in Contact just unlocked.',
            action: { label: 'Take me there →', href: '#contact' },
            duration: 6000
          });
        } else {
          showToast({
            title: 'Coin ' + state.found.length + ' of ' + total,
            body: state.found.length === 1
              ? 'More are tucked into cards around this page. Find them all to open the chest in Contact.'
              : '',
            duration: state.found.length === 1 ? 5000 : 2200
          });
        }
      });
    });

    if (hud) {
      hud.addEventListener('click', function () {
        if (!isComplete()) {
          showToast({
            title: state.found.length + ' of ' + total + ' coins',
            body: 'Coins are tucked into cards around this page. Find all ' + total + ' to open the chest in Contact.',
            duration: 5000
          });
        } else if (!state.opened) {
          showToast({
            title: 'All ' + total + ' coins found',
            body: 'The chest in Contact is unlocked.',
            action: { label: 'Take me there →', href: '#contact' },
            duration: 6000
          });
        } else {
          showToast({
            title: 'Hunt complete',
            body: 'Want to hide the coins again?',
            action: { label: 'Reset the hunt', onClick: resetHunt },
            duration: 6000
          });
        }
      });
    }

    if (chest) {
      chest.addEventListener('animationend', function () {
        chest.classList.remove('is-shaking');
      });
      chest.addEventListener('click', function () {
        if (!isComplete()) {
          replay(chest, 'is-shaking');
          showToast({
            title: 'Locked',
            body: 'Find the ' + total + ' coins hidden around this page to open it (' +
              state.found.length + '/' + total + ' so far).',
            duration: 5000
          });
          return;
        }
        if (!state.opened) {
          state.opened = true;
          save();
          chest.classList.add('is-opening');
          setTimeout(function () {
            chest.classList.remove('is-opening');
            render();
          }, 320);
        }
        showToast({
          title: 'Achievement unlocked',
          body: 'Treasure Hunter: you found every coin. Thanks for exploring!',
          icon: 'sprite-chest',
          action: { label: 'Claim your loot (my resume) →', href: 'resume/Luke-Bonniwell-Resume.pdf', newTab: true },
          duration: 9000
        });
      });
    }

    render();
  }
})();
