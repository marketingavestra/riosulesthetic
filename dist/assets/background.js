/* Decorative, silent video with a permanent poster fallback. */
(() => {
  const video = document.querySelector('[data-background-video]');
  if (!video) return;
  const background = video.closest('.video-background');
  const toggle = document.querySelector('[data-video-toggle]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  let loaded = false;

  const showPoster = () => background.classList.remove('is-playing');
  const updateButton = () => {
    if (!toggle) return;
    toggle.hidden = motion.matches;
    const label = video.paused ? 'Reproduzir vídeo' : 'Pausar vídeo';
    toggle.textContent = label;
    toggle.setAttribute('aria-label', `${label} de fundo`);
  };
  const sync = () => {
    if (motion.matches || document.hidden || userPaused) {
      video.pause();
      showPoster();
      updateButton();
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
        updateButton();
      });
    }
    updateButton();
  };
  video.addEventListener('playing', () => {
    if (motion.matches || document.hidden || userPaused) {
      sync();
      return;
    }
    background.classList.add('is-playing');
    updateButton();
  });
  video.addEventListener('pause', () => { showPoster(); updateButton(); });
  video.addEventListener('error', () => { showPoster(); updateButton(); });
  if (toggle) toggle.addEventListener('click', () => {
    userPaused = !video.paused;
    sync();
  });
  if (motion.addEventListener) motion.addEventListener('change', sync);
  else motion.addListener(sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  sync();
})();
