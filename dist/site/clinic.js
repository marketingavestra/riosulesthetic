/* Interações locais da página. Nenhuma biblioteca ou compilação é necessária. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cada pergunta abre e fecha de forma independente, como na página original.
  document.querySelectorAll('[data-faq]').forEach(button => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      panel.setAttribute('aria-hidden', String(!open));
      panel.classList.toggle('max-h-0', !open);
      panel.classList.toggle('max-h-48', open);
      button.querySelector('svg').classList.toggle('rotate-180', open);
    });
  });

  // Revelação ao entrar na tela, com deslocamentos e tempos do componente original.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0 });
    const horizontalObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          horizontalObserver.unobserve(entry.target);
        }
      });
    });
    document.querySelectorAll('[data-reveal]').forEach(element => {
      if (element.hasAttribute('data-immediate')) {
        requestAnimationFrame(() => requestAnimationFrame(() => element.classList.add('is-visible')));
      } else if (element.hasAttribute('data-horizontal')) {
        horizontalObserver.observe(element);
      } else {
        observer.observe(element);
      }
    });

    // Contadores: duração de 1,5 segundo e desaceleração cúbica.
    const counters = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        counters.unobserve(element);
        const target = Number(element.dataset.counter);
        const start = performance.now();
        function frame(now) {
          const progress = Math.min((now - start) / 1500, 1);
          element.textContent = String(Math.floor((1 - Math.pow(1 - progress, 3)) * target));
          if (progress < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('[data-counter]').forEach(element => {
      element.textContent = '0';
      counters.observe(element);
    });
  }
})();
