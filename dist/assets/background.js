/* Decorative, silent video with a permanent poster fallback. */
(() => {
  const video = document.querySelector('[data-background-video]');
  if (!video) return;
  const background = video.closest('.video-background');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let loaded = false;

  const showPoster = () => background.classList.remove('is-playing');
  const sync = () => {
    if (motion.matches || document.hidden) {
      video.pause();
      showPoster();
      return;
    }
    video.muted = true;
    video.defaultMuted = true;
    if (!loaded) {
      const source = video.querySelector('source');
      source.src = source.dataset.src;
      loaded = true;
      video.load();
    }
    const result = video.play();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {
        // Autoplay may be blocked by power-saving or browser settings.
        showPoster();
      });
    }
  };
  video.addEventListener('playing', () => {
    if (motion.matches || document.hidden) {
      sync();
      return;
    }
    background.classList.add('is-playing');
  });
  video.addEventListener('pause', showPoster);
  video.addEventListener('error', showPoster);
  if (motion.addEventListener) motion.addEventListener('change', sync);
  else motion.addListener(sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  sync();
})();
