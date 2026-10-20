// Scream Jam enemy clips.
// 1. <figure class="clip" data-clip="path/to/name" data-view="debug"> holds a
//    <video> and buttons with data-view="debug" / data-view="clean". Clicking
//    one swaps name_debug.mp4/.jpg for name_clean.mp4/.jpg and keeps the timestamp.
// 2. <video data-cycle="pathA pathB" data-cycle-labels="A|B"> plays pathA.mp4,
//    then pathB.mp4, and loops; an element with data-cycle-tag shows the label.
// Every clip plays only while it's on screen, and never autoplays for
// visitors who prefer reduced motion.
(function () {
  var clips = document.querySelectorAll('[data-clip]');
  var cycles = document.querySelectorAll('video[data-cycle]');
  if (!clips.length && !cycles.length) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var setView = function (clip, view) {
    var video = clip.querySelector('video');
    var base = clip.getAttribute('data-clip');
    if (!video || clip.getAttribute('data-view') === view) return;

    var time = video.currentTime || 0;
    var wasPlaying = !video.paused;
    clip.setAttribute('data-view', view);
    video.poster = base + '_' + view + '.jpg';
    video.src = base + '_' + view + '.mp4';
    video.addEventListener('loadedmetadata', function seek() {
      video.removeEventListener('loadedmetadata', seek);
      try { video.currentTime = time; } catch (e) {}
      if (wasPlaying) video.play().catch(function () {});
    });
    video.load();

    clip.querySelectorAll('button[data-view]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-view') === view ? 'true' : 'false');
    });
  };

  clips.forEach(function (clip) {
    clip.querySelectorAll('button[data-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setView(clip, btn.getAttribute('data-view'));
      });
    });
  });

  cycles.forEach(function (video) {
    var paths = video.getAttribute('data-cycle').split(/\s+/);
    var labels = (video.getAttribute('data-cycle-labels') || '').split('|');
    var tag = video.parentNode.querySelector('[data-cycle-tag]');
    var index = 0;
    video.addEventListener('ended', function () {
      index = (index + 1) % paths.length;
      video.src = paths[index] + '.mp4';
      if (tag && labels[index]) tag.textContent = labels[index];
      video.play().catch(function () {});
    });
  });

  if (reduceMotion || !('IntersectionObserver' in window)) return;

  var watcher = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var video = entry.target.tagName === 'VIDEO' ? entry.target : entry.target.querySelector('video');
      if (!video) return;
      if (entry.isIntersecting) {
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.35 });

  clips.forEach(function (clip) { watcher.observe(clip); });
  cycles.forEach(function (video) { watcher.observe(video); });
})();
