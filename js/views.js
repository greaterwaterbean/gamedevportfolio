// Anonymous page-view counts, stored as plain numbers on a free counter API
// (abacus.jasoncameron.dev). No cookies, no stored IDs, no IP logging on our
// side: every page load just adds 1 to a few counters.
//
//   total              every page view on the site
//   page-<slug>        views of one page
//   src-<site>         views that arrived from another site (linkedin, itch...)
//   ref-<tag>          views from a tagged link, e.g. lukebonniwell.com/?ref=acme
//   ref-<tag>.<slug>   which pages a tagged link's visitor went on to read
//
// A ?ref= tag is carried onto every internal link, so one tagged link
// tracks the whole visit. stats.html reads the numbers back.
(function () {
  var API = 'https://abacus.jasoncameron.dev';
  var host = location.hostname;
  var local = host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:';
  var NS = local ? 'lukebonniwell-dev' : 'lukebonniwell-com';

  // The site owner can opt their own browser out from stats.html.
  try {
    if (localStorage.getItem('lb-skip-views') === '1') return;
  } catch (e) {}

  var slug = function (s, max) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max || 40);
  };

  // Page slug: /projects/tails-of-the-tower.html -> tails-of-the-tower
  var parts = location.pathname.replace(/index\.html$/, '').split('/').filter(Boolean);
  // (counter keys max out at 64 characters, so slugs are capped)
  var page = parts.length ? slug(parts[parts.length - 1].replace(/\.html$/, ''), 30) : 'home';

  // Visitors who ask not to be tracked only add to the total and page counts.
  var noTrack = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';

  var keys = ['total', 'page-' + page];

  var params = new URLSearchParams(location.search);
  var ref = params.get('ref') ? slug(params.get('ref'), 24) : '';
  if (ref.length < 2) ref = '';

  if (!noTrack) {
    var from = '';
    try {
      from = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
    } catch (e) {}
    if (from !== host) {
      var buckets = ['linkedin', 'itch', 'github', 'google', 'bing', 'duckduckgo', 'indeed', 'handshake',
        'wellfound', 'glassdoor', 'discord', 'reddit', 'youtube', 'startplaying'];
      var source = 'direct';
      if (from) {
        source = 'other';
        if (/(^|\.)(x|twitter|t)\.co(m)?$/.test(from)) source = 'twitter';
        buckets.forEach(function (b) { if (from.indexOf(b) !== -1) source = b; });
      }
      keys.push('src-' + source);
    }
    if (ref) {
      keys.push('ref-' + ref, 'ref-' + ref + '.' + page);
      // Carry the tag onto internal links so the rest of the visit counts too.
      document.querySelectorAll('a[href]').forEach(function (a) {
        var href = a.getAttribute('href');
        if (!href || /^(https?:|mailto:|#|javascript:)/.test(href)) return;
        if (!/\.html(#|$)|\/(#|$)/.test(href)) return;
        var hash = '';
        var i = href.indexOf('#');
        if (i !== -1) { hash = href.slice(i); href = href.slice(0, i); }
        a.setAttribute('href', href + (href.indexOf('?') === -1 ? '?' : '&') + 'ref=' + encodeURIComponent(ref) + hash);
      });
    }
  }

  var show = function (value) {
    document.querySelectorAll('[data-view-count]').forEach(function (el) {
      el.textContent = String(value).padStart(6, '0');
      el.closest('[data-view-counter]').hidden = false;
    });
  };

  keys.forEach(function (key) {
    fetch(API + '/hit/' + NS + '/' + key, { mode: 'cors', keepalive: true })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (key === 'total' && data && typeof data.value === 'number') show(data.value); })
      .catch(function () {});
  });
})();
