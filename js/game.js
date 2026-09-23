// Game layer for the homepage: the coin hunt, achievements, sound, and the
// animated extras. Each feature runs only while its word is listed in
// <body data-fx="..."> (see the notes at the top of css/game.css).
(function () {
  var body = document.body;
  var html = document.documentElement;
  var words = (body.getAttribute('data-fx') || '').split(/\s+/);
  var on = function (name) { return words.indexOf(name) !== -1; };
  var media = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reduceMotion = media('(prefers-reduced-motion: reduce)');
  // Phones and small CPUs get fewer particles.
  var lowPower = media('(max-width: 720px), (pointer: coarse)') || (navigator.hardwareConcurrency || 8) <= 4;
  // Asset root, so sounds resolve from any page that loads this script.
  var script = document.currentScript;
  var base = script ? script.src.replace(/js\/game\.js(\?.*)?$/, '') : '';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var rand = function (min, max) { return min + Math.random() * (max - min); };
  var pick = function (list) { return list[Math.floor(Math.random() * list.length)]; };
  var later = function (fn, ms) { return setTimeout(fn, ms); };
  var remove = function (node) { if (node && node.parentNode) node.parentNode.removeChild(node); };
  var load = function (key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch (e) { return fallback; }
  };
  var save = function (key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  };
  var el = function (tag, className, parent) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    return node;
  };
  var sprite = function (name, parent, extra) {
    return el('span', 'sprite sprite-' + name + (extra ? ' ' + extra : ''), parent);
  };
  var replay = function (node, cls) {
    node.classList.remove(cls);
    void node.offsetWidth; // restart the CSS animation
    node.classList.add(cls);
  };
  // Play a sprite strip once, centered on (x, y) inside `host`.
  var oneShot = function (name, host, x, y, px) {
    if (reduceMotion) return;
    var fx = sprite(name, host, 'play-once fx-oneshot');
    if (px) fx.style.setProperty('--px', px);
    fx.style.left = (x - fx.offsetWidth / 2) + 'px';
    fx.style.top = (y - fx.offsetHeight / 2) + 'px';
    fx.addEventListener('animationend', function () { remove(fx); });
    later(function () { remove(fx); }, 2500);
  };
  // Floating text (+1, -12, ...) over an element.
  var popText = function (target, text, cls) {
    if (reduceMotion) return;
    var r = target.getBoundingClientRect();
    var pop = el('span', cls, body);
    pop.textContent = text;
    pop.style.left = (r.left + r.width / 2 - 14) + 'px';
    pop.style.top = (r.top - 10) + 'px';
    later(function () { remove(pop); }, 850);
  };

  // --- Performance: freeze animations in sections that are off screen ---
  var inView = {};
  var isVisible = function (id) { return !document.hidden && inView[id] !== false; };
  if ('IntersectionObserver' in window) {
    var pauser = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('fx-offscreen', !entry.isIntersecting);
        if (entry.target.id) inView[entry.target.id] = entry.isIntersecting;
      });
    }, { rootMargin: '120px 0px' });
    $$('main > section, .site-footer').forEach(function (s) { pauser.observe(s); });
  }

  // --- boot-screen: any key or tap skips it ---
  var boot = $('[data-boot]');
  var booting = !!boot && on('boot-screen') && !reduceMotion && !html.classList.contains('boot-seen');
  if (booting) {
    var skipBoot = function () {
      html.classList.add('boot-seen');
      removeEventListener('keydown', skipBoot);
      removeEventListener('pointerdown', skipBoot);
    };
    addEventListener('keydown', skipBoot);
    addEventListener('pointerdown', skipBoot);
    later(skipBoot, 1500);
  }

  // --- sfx: opt-in sound effects (off until the visitor turns them on) ---
  var sfx = (function () {
    var cache = {};
    var active = on('sfx');
    var enabled = active && load('lb-sfx', false) === true;
    var btn = $('[data-sfx-toggle]');
    var state = $('[data-sfx-state]');
    var render = function () {
      if (!btn) return;
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      if (state) state.textContent = enabled ? 'ON' : 'OFF';
    };
    var play = function (name) {
      if (!enabled) return;
      var audio = cache[name];
      if (!audio) {
        audio = cache[name] = new Audio(base + 'audio/' + name + '.mp3');
        audio.volume = 0.35;
      }
      try {
        audio.currentTime = 0;
        var p = audio.play();
        if (p && p.catch) p.catch(function () {});
      } catch (e) { /* ignore */ }
    };
    if (btn && active) {
      btn.addEventListener('click', function () {
        enabled = !enabled;
        save('lb-sfx', enabled);
        render();
        play('lever');
      });
    }
    render();
    return { play: play };
  })();

  // --- Toast (shared) ---
  var toastEl = $('[data-toast]');
  var toastTimer;
  var lastToastAt = 0;
  var hideToast = function () { if (toastEl) toastEl.classList.remove('is-visible'); };
  // opts: { title, body, icon (sprite name), img (path), action: { label, href, newTab, onClick }, duration }
  var showToast = function (opts) {
    if (!toastEl) return;
    lastToastAt = Date.now();
    toastEl.textContent = '';

    var icon = el('span', 'game-toast-icon', toastEl);
    if (opts.img) {
      var img = el('img', '', icon);
      img.src = opts.img;
      img.alt = '';
    } else {
      sprite(opts.icon || 'coin', icon);
    }

    var text = el('span', '', toastEl);
    var title = el('strong', 'game-toast-title', text);
    title.textContent = opts.title;
    if (opts.body) {
      var bodyText = el('span', 'game-toast-body', text);
      bodyText.textContent = opts.body;
    }
    if (opts.action) {
      var action = el(opts.action.href ? 'a' : 'button', 'game-toast-action', text);
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
    }

    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = later(hideToast, opts.duration || 3500);
  };
  if (toastEl) {
    toastEl.addEventListener('mouseenter', function () { clearTimeout(toastTimer); });
    toastEl.addEventListener('mouseleave', function () { toastTimer = later(hideToast, 2000); });
  }

  // --- achievements ---
  var ach = (function () {
    var list = [
      { id: 'explorer', fx: 'achievements', title: 'Explorer', desc: 'Visited every section of the page.' },
      { id: 'recruiter', fx: 'achievements', title: 'Paper Trail', desc: 'Opened the resume.' },
      { id: 'treasure-hunter', fx: 'coin-hunt', title: 'Treasure Hunter', desc: 'Found every coin and opened the chest.' },
      { id: 'monster-hunter', fx: 'combat', title: 'Monster Hunter', desc: 'Defeated all three project-card critters.' },
      { id: 'natural-20', fx: 'd20', title: 'Natural 20', desc: "Rolled a 20 on the Dungeon Master's die." },
      { id: 'cat-person', fx: 'nap-cat', title: 'Cat Person', desc: 'Woke the cat napping on the About card.' },
      { id: 'crow-whisperer', fx: 'crow', title: 'Crow Whisperer', desc: 'Startled the crow off the logbook.' },
      { id: 'power-nap', fx: 'idle-zzz', title: 'Power Nap', desc: 'Sat still long enough for Player 1 to doze off.' },
      { id: 'save-point', fx: 'campfire', title: 'Game Saved', desc: 'Rested at the save point.' },
      { id: 'shortcut', fx: 'lever', title: 'Shortcut Unlocked', desc: 'Pulled the lever back to the top.' },
      { id: 'cheat-code', fx: 'konami', title: 'Cheat Code', desc: 'Entered the Konami code (or tapped the logbook 5 times).' }
    ].filter(function (a) { return on(a.fx); });
    var active = on('achievements');
    var got = load('lb-achievements', []).filter(function (id) {
      return list.some(function (a) { return a.id === id; });
    });
    var btn = $('[data-ach-btn]');
    var countEl = $('[data-ach-count]');
    var totalEl = $('[data-ach-total]');
    var find = function (id) { return list.filter(function (a) { return a.id === id; })[0]; };
    var render = function () {
      if (countEl) countEl.textContent = got.length;
      if (totalEl) totalEl.textContent = list.length;
      if (btn) btn.setAttribute('aria-label', got.length + ' of ' + list.length + ' achievements unlocked');
    };
    // opts.silent: record it without a toast (the caller shows its own)
    var unlock = function (id, opts) {
      if (!active) return;
      var a = find(id);
      if (!a || got.indexOf(id) !== -1) return;
      got.push(id);
      save('lb-achievements', got);
      render();
      if (btn) replay(btn, 'is-bump');
      if (opts && opts.silent) return;
      var wait = Date.now() - lastToastAt < 1500 ? 1700 : 0;
      later(function () {
        sfx.play('achievement');
        showToast({
          title: 'Achievement unlocked',
          body: a.title + ': ' + a.desc,
          img: base + 'img/icons/trophy.png',
          duration: 5000
        });
      }, wait);
    };
    if (btn && active) {
      btn.addEventListener('click', function () {
        showToast({
          title: 'Achievements ' + got.length + '/' + list.length,
          body: list.map(function (a) {
            return (got.indexOf(a.id) !== -1 ? '★ ' : '• ') + a.title;
          }).join('\n'),
          img: base + 'img/icons/trophy.png',
          action: got.length ? {
            label: 'Reset achievements',
            onClick: function () {
              got = [];
              save('lb-achievements', got);
              render();
              hideToast();
            }
          } : null,
          duration: 8000
        });
      });
    }
    render();
    return { unlock: unlock };
  })();

  $$('a[href*="Resume.pdf"]').forEach(function (a) {
    a.addEventListener('click', function () { ach.unlock('recruiter'); });
  });

  // --- Sections visited: drives xp-bar levels and the Explorer achievement ---
  var header = $('.site-header');
  var xp = null;
  if (on('xp-bar') && header) {
    xp = el('div', 'xp-bar', header);
    xp.setAttribute('aria-hidden', 'true');
    var xpFill = el('span', 'xp-fill', xp);
    var hudTabs = $('[data-hud-tabs]') || el('div', 'hud-tabs', header);
    var xpLv = el('span', 'hud-tab xp-lv');
    xpLv.textContent = 'LV 1';
    hudTabs.insertBefore(xpLv, hudTabs.firstChild);
    var ticking = false;
    var updateXp = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      var progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 1;
      xpFill.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
    };
    addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateXp);
      }
    }, { passive: true });
    addEventListener('resize', updateXp);
    updateXp();
  }

  var sectionIds = ['home', 'about', 'projects', 'experience', 'devlog', 'contact'].filter(function (id) {
    var s = document.getElementById(id);
    return s && getComputedStyle(s).display !== 'none';
  });
  var visited = [];
  var visit = function (id) {
    if (visited.indexOf(id) !== -1) return;
    visited.push(id);
    if (xp) {
      $('.xp-lv').textContent = 'LV ' + visited.length;
      if (visited.length > 1 && !reduceMotion) {
        var pop = el('span', 'level-up', $('.xp-lv').parentNode);
        pop.textContent = 'LEVEL UP!';
        later(function () { remove(pop); }, 1650);
        sfx.play('levelup');
      }
    }
    if (visited.length === sectionIds.length) ach.unlock('explorer');
  };
  if ('IntersectionObserver' in window) {
    var visitWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visit(entry.target.id);
      });
    }, { rootMargin: '-35% 0px -35% 0px' });
    sectionIds.forEach(function (id) { visitWatch.observe(document.getElementById(id)); });
  }

  // --- typewriter: the hero terminal line types itself out ---
  if (on('typewriter') && !reduceMotion) {
    var termBody = $('.hero .terminal-body');
    var termText = termBody && $('.t-type', termBody);
    if (termText) {
      var full = termText.textContent;
      var typed = 0;
      termText.textContent = '';
      termBody.classList.add('tw-ready', 'is-typing');
      var typeNext = function () {
        typed += 1;
        termText.textContent = full.slice(0, typed);
        if (typed < full.length) {
          later(typeNext, full.charAt(typed - 1) === ',' ? 140 : 22);
        } else {
          termBody.classList.remove('is-typing');
        }
      };
      later(typeNext, booting ? 1500 : 450);
    }
  }

  // --- p1-emotes + idle-zzz: the Player 1 knight reacts ---
  var p1 = $('.player-one');
  var p1Shown = function () { return p1 && on('player-one') && getComputedStyle(p1).display !== 'none'; };
  // emote frames: 0 !, 1 ?, 2 heart, 3 ..., 4 happy, 5 dizzy, 6 red !
  var p1Emote = function (frame, ms) {
    if (!p1Shown() || !on('p1-emotes')) return;
    remove($('.p1-emote', p1));
    var bubble = sprite('emote', p1, 'hold p1-emote');
    bubble.style.setProperty('--frame', frame);
    bubble.style.setProperty('--px', 2);
    later(function () { remove(bubble); }, ms || 1800);
  };
  if (on('p1-emotes') && p1 && !reduceMotion) {
    var emoteTick = function () {
      if (isVisible('home') && !p1.classList.contains('is-sleeping')) p1Emote(pick([0, 1, 2, 3, 4]));
      later(emoteTick, rand(6000, 9500));
    };
    later(emoteTick, booting ? 5000 : 3500);
  }
  if (on('idle-zzz') && p1 && !reduceMotion) {
    var idleTimer;
    var lastArm = 0;
    var sleeping = false;
    var arm = function () {
      clearTimeout(idleTimer);
      lastArm = Date.now();
      idleTimer = later(fallAsleep, 20000);
    };
    var fallAsleep = function () {
      if (!isVisible('home') || !p1Shown()) { arm(); return; }
      sleeping = true;
      p1.classList.add('is-sleeping');
      for (var i = 0; i < 3; i++) el('span', 'zzz', p1).textContent = 'Z';
      ach.unlock('power-nap');
    };
    var wake = function () {
      if (sleeping) {
        sleeping = false;
        p1.classList.remove('is-sleeping');
        $$('.zzz', p1).forEach(remove);
        p1Emote(0, 1200);
        arm();
      } else if (Date.now() - lastArm > 1000) {
        arm();
      }
    };
    ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (type) {
      addEventListener(type, wake, { passive: true });
    });
    arm();
  }

  // --- flyby: a bat crosses the hero every so often ---
  var hero = $('.hero');
  if (on('flyby') && hero && !reduceMotion) {
    var lane = el('div', 'flyby-lane', hero);
    lane.setAttribute('aria-hidden', 'true');
    var flyBy = function () {
      if (isVisible('home')) {
        var width = lane.clientWidth;
        var time = (width + 120) / 170;
        var bat = el('div', 'flyby', lane);
        bat.style.top = rand(6, 38).toFixed(1) + '%';
        bat.style.setProperty('--fly-w', width + 'px');
        bat.style.setProperty('--fly-time', time.toFixed(2) + 's');
        sprite('bat', bat);
        later(function () { remove(bat); }, time * 1000 + 200);
      }
      later(flyBy, rand(16000, 26000));
    };
    later(flyBy, booting ? 5500 : 4000);
  }

  // --- rat-run: mice scurry along the top of the Tails of the Tower card ---
  var tailsCard = $('#projects .project-card');
  if (on('rat-run') && tailsCard && !reduceMotion) {
    var ratRun = function () {
      if (isVisible('projects')) {
        var distance = tailsCard.clientWidth - 70;
        [0, 1, 2].forEach(function (i) {
          later(function () {
            var mouse = el('span', 'mouse-run', tailsCard);
            mouse.setAttribute('aria-hidden', 'true');
            mouse.style.setProperty('--run', distance + 'px');
            sprite('mouse', mouse);
            later(function () { remove(mouse); }, 3000);
          }, i * 260);
        });
      }
      later(ratRun, rand(14000, 22000));
    };
    later(ratRun, 5000);
  }

  // --- combat: poke the project-card critters ---
  if (on('combat') && on('critters')) {
    var defeated = {};
    $$('#projects .critter').forEach(function (critter, index) {
      var card = critter.parentNode;
      var hp = 3;
      var busy = false;
      var hpBar = null;
      var hpFill = null;
      critter.removeAttribute('aria-hidden');
      critter.setAttribute('role', 'button');
      critter.setAttribute('tabindex', '0');
      critter.setAttribute('aria-label', 'Monster on this card: attack it');

      var center = function () {
        return [critter.offsetLeft + critter.offsetWidth / 2, critter.offsetTop + critter.offsetHeight / 2];
      };
      var respawn = function () {
        hp = 3;
        remove(hpBar);
        hpBar = null;
        critter.classList.remove('is-defeated');
        replay(critter, 'is-respawning');
        later(function () {
          critter.classList.remove('is-respawning');
          busy = false;
        }, 950);
      };
      var strike = function (event) {
        event.preventDefault();
        if (busy) return;
        hp -= 1;
        sfx.play('hit');
        replay(critter, 'is-hit');
        later(function () { critter.classList.remove('is-hit'); }, 220);
        var c = center();
        oneShot('slash', card, c[0], c[1], 2);
        var crit = Math.random() < 0.2;
        popText(critter, (crit ? 'CRIT -' : '-') + Math.round(crit ? rand(24, 40) : rand(6, 15)), crit ? 'dmg-pop is-crit' : 'dmg-pop');
        if (!hpBar) {
          hpBar = el('span', 'critter-hp', critter);
          hpFill = el('span', 'critter-hp-fill', hpBar);
        }
        hpFill.style.transform = 'scaleX(' + Math.max(hp, 0) / 3 + ')';
        if (hp <= 0) {
          busy = true;
          later(function () {
            var c2 = center();
            oneShot('smoke', card, c2[0], c2[1], 2);
            critter.classList.add('is-defeated');
            sfx.play('poof');
            defeated[index] = true;
            if (Object.keys(defeated).length === 3) ach.unlock('monster-hunter');
            later(respawn, 5000);
          }, 220);
        }
      };
      critter.addEventListener('click', strike);
      critter.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') strike(e);
      });
    });
  }

  // --- nap-cat: pet the cat on the About card ---
  var cat = $('[data-nap-cat]');
  if (cat && on('nap-cat')) {
    var catSprite = $('.sprite', cat);
    var catAwake = false;
    cat.addEventListener('click', function () {
      if (catAwake) return;
      catAwake = true;
      catSprite.className = 'sprite sprite-cat-meow';
      if (!reduceMotion) {
        var meow = sprite('meow', cat, 'meow');
        later(function () { remove(meow); }, 1400);
      }
      sfx.play('dice');
      ach.unlock('cat-person');
      later(function () { catSprite.className = 'sprite sprite-cat-idle'; }, 1000);
      later(function () {
        catSprite.className = 'sprite sprite-cat-sleep';
        catAwake = false;
      }, 4200);
    });
  }

  // --- crow: startle it off the logbook ---
  var crow = $('[data-crow]');
  if (crow && on('crow')) {
    var crowSprite = $('.sprite', crow);
    crow.addEventListener('click', function (event) {
      event.stopPropagation(); // not a logbook tap for the konami shortcut
      if (crow.classList.contains('is-flying')) return;
      var caw = el('span', 'caw', crow.parentNode);
      later(function () { remove(caw); }, 950);
      sfx.play('caw');
      ach.unlock('crow-whisperer');
      if (reduceMotion) return;
      crowSprite.className = 'sprite sprite-crow-fly';
      crow.classList.add('is-flying');
      later(function () {
        crow.classList.remove('is-flying');
        crowSprite.className = 'sprite sprite-crow-idle';
      }, 2800);
    });
  }

  // --- d20: roll on the Dungeon Master card ---
  var d20 = $('[data-d20]');
  if (d20 && on('d20')) {
    var d20Result = $('[data-d20-result]', d20);
    var rolling = false;
    var rollsSince20 = 0;
    var d20Hide;
    d20.addEventListener('click', function () {
      if (rolling) return;
      rolling = true;
      d20Result.textContent = '';
      d20Result.className = 'd20-result';
      if (!reduceMotion) replay(d20, 'is-rolling');
      sfx.play('dice');
      later(function () {
        rollsSince20 += 1;
        // pity timer: the tenth roll without a 20 is a 20
        var n = rollsSince20 >= 10 ? 20 : 1 + Math.floor(Math.random() * 20);
        if (n === 20) rollsSince20 = 0;
        d20Result.textContent = n === 20 ? 'NAT 20!' : n === 1 ? 'NAT 1' : String(n);
        if (n === 20) {
          d20Result.classList.add('is-crit');
          sfx.play('nat20');
          oneShot('sparkle-burst', d20, d20.offsetWidth / 2, d20.offsetHeight / 2, 2);
          ach.unlock('natural-20');
        } else if (n === 1) {
          d20Result.classList.add('is-fail');
        }
        d20.classList.remove('is-rolling');
        d20.setAttribute('aria-label', 'Rolled ' + n + '. Roll the d20 again');
        rolling = false;
        clearTimeout(d20Hide);
        d20Hide = later(function () { d20Result.textContent = ''; }, 2600);
      }, reduceMotion ? 0 : 600);
    });
  }

  // --- quest-stamps: stamp Experience cards as they scroll into view ---
  if (on('quest-stamps') && !reduceMotion && 'IntersectionObserver' in window) {
    var stamps = $$('.quest-stamp');
    var stampWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var stamp = entry.target;
        stampWatch.unobserve(stamp);
        later(function () {
          stamp.classList.remove('is-armed');
          stamp.classList.add('is-stamped');
          sfx.play('hit');
        }, 200 + stamps.indexOf(stamp) * 240);
      });
    }, { threshold: 1 });
    stamps.forEach(function (stamp) {
      stamp.classList.add('is-armed');
      stampWatch.observe(stamp);
    });
  }

  // --- campfire: the save point in Contact ---
  var campfire = $('[data-campfire]');
  if (campfire && on('campfire')) {
    campfire.addEventListener('click', function () {
      sfx.play('chest');
      showToast({
        title: 'Game saved',
        body: 'Rested at the save point. (It was already saving. The fire is just nice.)',
        icon: 'fire',
        duration: 3800
      });
      ach.unlock('save-point');
    });
  }

  // --- lever: pull it to go back to the top ---
  var lever = $('[data-lever]');
  if (lever && on('lever')) {
    lever.addEventListener('click', function () {
      lever.classList.add('is-on');
      sfx.play('lever');
      ach.unlock('shortcut');
      later(function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }, 250);
      later(function () { lever.classList.remove('is-on'); }, 1500);
    });
  }

  // --- click-fx: a small spark wherever the visitor clicks or taps ---
  if (on('click-fx') && !reduceMotion) {
    var bursts = [0, 1, 2, 3].map(function () {
      var b = sprite('burst', body, 'click-burst play-once');
      b.setAttribute('aria-hidden', 'true');
      b.style.visibility = 'hidden';
      return b;
    });
    var nextBurst = 0;
    document.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      var b = bursts[nextBurst++ % bursts.length];
      b.style.visibility = 'visible';
      b.style.transform = 'translate(' + (e.clientX - 32) + 'px, ' + (e.clientY - 32) + 'px)';
      replay(b, 'play-once');
    }, { passive: true });
  }

  // --- konami: cheat code (or 5 quick taps on the logbook) = party mode ---
  if (on('konami')) {
    var partying = false;
    var party = function () {
      if (partying) return;
      partying = true;
      body.classList.add('is-party');
      sfx.play('nat20');
      showToast({
        title: 'Cheat activated',
        body: '↑ ↑ ↓ ↓ ← → ← → B A: party mode for 10 seconds.',
        icon: 'coin-spin',
        duration: 5000
      });
      ach.unlock('cheat-code');
      if (!reduceMotion) {
        var portal = sprite('portal', body, 'party-portal');
        portal.setAttribute('aria-hidden', 'true');
        later(function () { remove(portal); }, 3000);
        var count = lowPower ? 10 : 24;
        for (var i = 0; i < count; i++) {
          later(function () {
            var drop = el('span', 'party-coin', body);
            drop.setAttribute('aria-hidden', 'true');
            drop.style.left = rand(3, 95).toFixed(1) + 'vw';
            drop.style.setProperty('--t', rand(1.8, 3.2).toFixed(2) + 's');
            drop.style.setProperty('--drift', Math.round(rand(-40, 40)) + 'px');
            sprite('coin-spin', drop);
            later(function () { remove(drop); }, 3400);
          }, i * 110);
        }
      }
      later(function () {
        body.classList.remove('is-party');
        partying = false;
      }, 10000);
    };
    var code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var codePos = 0;
    addEventListener('keydown', function (e) {
      var key = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
      codePos = key === code[codePos] ? codePos + 1 : (key === code[0] ? 1 : 0);
      if (codePos === code.length) {
        codePos = 0;
        party();
      }
    });
    var book = $('.devlog-book');
    var taps = [];
    if (book) {
      book.addEventListener('click', function () {
        var now = Date.now();
        taps = taps.filter(function (t) { return now - t < 2500; });
        taps.push(now);
        if (taps.length >= 5) {
          taps = [];
          party();
        }
      });
    }
  }

  // --- coin-hunt: coins tucked into cards; all of them unlock the chest ---
  var coins = $$('[data-coin]');
  if (on('coin-hunt') && coins.length) {
    var hud = $('[data-coin-hud]');
    var countEl = $('[data-coin-count]');
    var totalEl = $('[data-coin-total]');
    var chest = $('[data-chest]');
    var total = coins.length;
    var STORE = 'lb-coin-hunt';
    var ids = coins.map(function (c) { return c.getAttribute('data-coin'); });

    var state = { found: [], opened: false };
    var saved = load(STORE, null);
    if (saved && Array.isArray(saved.found)) {
      state.found = saved.found.filter(function (id) { return ids.indexOf(id) !== -1; });
      state.opened = !!saved.opened && state.found.length === total;
    }
    var saveHunt = function () { save(STORE, state); };
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
          : isComplete() ? 'Treasure chest (unlocked): open it' : 'Treasure chest (locked)');
      }
    };

    var resetHunt = function () {
      state = { found: [], opened: false };
      saveHunt();
      render();
      showToast({ title: 'Coins hidden again', body: 'Happy hunting.' });
    };

    coins.forEach(function (coin) {
      coin.addEventListener('click', function () {
        var id = coin.getAttribute('data-coin');
        if (state.found.indexOf(id) !== -1) return;
        state.found.push(id);
        saveHunt();
        sfx.play('coin');
        popText(coin, '+1', 'coin-pop');
        coin.classList.add('is-collected');
        later(function () {
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
      chest.addEventListener('animationend', function () { chest.classList.remove('is-shaking'); });
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
          saveHunt();
          sfx.play('chest');
          chest.classList.add('is-opening');
          oneShot('sparkle-burst', chest, chest.offsetWidth / 2, chest.offsetHeight / 2, 2);
          later(function () {
            chest.classList.remove('is-opening');
            render();
          }, 320);
        }
        ach.unlock('treasure-hunter', { silent: true });
        showToast({
          title: 'Achievement unlocked',
          body: 'Treasure Hunter: you found every coin. Thanks for exploring!',
          icon: 'chest',
          action: { label: 'Claim your loot (my resume) →', href: 'resume/Luke-Bonniwell-Resume.pdf', newTab: true },
          duration: 9000
        });
      });
    }

    render();
  }
})();
