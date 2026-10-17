// Mesmas interações de pressionar dos botões da página original.
document.querySelectorAll('[data-press]').forEach((button) => {
  const press = () => button.classList.add('animate-press');
  const release = () => button.classList.remove('animate-press');
  button.addEventListener('mousedown', press);
  button.addEventListener('mouseup', release);
  button.addEventListener('mouseleave', release);
  button.addEventListener('touchstart', press, { passive: true });
  button.addEventListener('touchend', release, { passive: true });
  button.addEventListener('touchcancel', release, { passive: true });
});
