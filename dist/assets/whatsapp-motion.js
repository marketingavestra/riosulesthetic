/* Shared CTA motion. Individual transforms leave entrance/press animations and
   the pulse/sheen pseudo-elements untouched. No dependencies or build step. */
(() => {
  const buttons = [...document.querySelectorAll('.button-whatsapp')];
  if (!buttons.length || !window.CSS ||
      !CSS.supports('translate', '0px 0px') ||
      !CSS.supports('rotate', '0deg') || !CSS.supports('scale', '1')) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(hover: hover) and (pointer: fine)');
  const mobile = window.matchMedia('(hover: none), (pointer: coarse)');
  const interval = 8000;
  let pageActive = true;
  const states = new Map();
  const frames = [
    { offset: 0, translate: '0px 0px', rotate: '0deg', scale: '1' },
    { offset: .18, translate: '-2px -1px', rotate: '-1deg', scale: '1.01' },
    { offset: .36, translate: '2px -3px', rotate: '1deg', scale: '1.025' },
    { offset: .52, translate: '-2px -3px', rotate: '-1deg', scale: '1.025' },
    { offset: .68, translate: '1px -2px', rotate: '.5deg', scale: '1.015' },
    { offset: 1, translate: '0px 0px', rotate: '0deg', scale: '1' }
  ];

  function inViewport(button) {
    const rect = button.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 &&
      rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  }
  function eligible(state) {
    return pageActive && !document.hidden && !reduced.matches &&
      state.visible && inViewport(state.button);
  }
  function stop(state) {
    window.clearTimeout(state.timer);
    state.timer = null;
    if (state.animation) state.animation.cancel();
    state.animation = null;
  }
  function play(state) {
    if (!eligible(state) || state.animation || typeof state.button.animate !== 'function') return;
    const animation = state.button.animate(frames, {
      duration: 600, easing: 'ease-in-out', fill: 'none'
    });
    state.animation = animation;
    animation.onfinish = animation.oncancel = () => {
      if (state.animation === animation) state.animation = null;
    };
  }
  function schedule(state) {
    window.clearTimeout(state.timer);
    state.timer = null;
    if (!eligible(state) || desktop.matches || !mobile.matches) return;
    state.timer = window.setTimeout(() => {
      state.timer = null;
      play(state);
      schedule(state);
    }, interval);
  }
  function refresh() {
    states.forEach(state => {
      stop(state);
      schedule(state);
    });
  }

  buttons.forEach(button => {
    const state = { button, visible: inViewport(button), timer: null, animation: null };
    states.set(button, state);
    button.addEventListener('pointerenter', event => {
      if (desktop.matches && event.pointerType === 'mouse') play(state);
    });
    schedule(state);
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const state = states.get(entry.target);
        const visible = entry.isIntersecting && entry.intersectionRatio > 0;
        if (state.visible === visible) return;
        state.visible = visible;
        stop(state);
        schedule(state);
      });
    }, { threshold: 0 });
    buttons.forEach(button => observer.observe(button));
  } else {
    // Older browsers: only reschedule on a visibility transition, never on every scroll.
    const checkViewport = () => states.forEach(state => {
      const visible = inViewport(state.button);
      if (visible === state.visible) return;
      state.visible = visible;
      stop(state);
      schedule(state);
    });
    window.addEventListener('scroll', checkViewport, { passive: true });
    window.addEventListener('resize', checkViewport);
  }
  [reduced, desktop, mobile].forEach(query => {
    if (query.addEventListener) query.addEventListener('change', refresh);
    else query.addListener(refresh);
  });
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('pagehide', () => { pageActive = false; refresh(); });
  window.addEventListener('pageshow', () => { pageActive = true; refresh(); });
})();
