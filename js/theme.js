/* Two palettes: the original warm red, and the gold one. The choice lives in
   localStorage; an inline script in each page's head applies it before first
   paint so the page never flashes the wrong colours. */
(() => {
  const root = document.documentElement;
  const KEY = 'piubello-theme';
  const isGold = () => root.dataset.theme === 'gold';

  const sync = () => document.querySelectorAll('[data-theme-switch]').forEach(btn => {
    const on = isGold();
    const label = on ? 'Switch to the original colours' : 'Switch to the gold colours';
    btn.setAttribute('aria-checked', String(on));
    btn.setAttribute('aria-label', label);
    btn.title = label;
  });

  document.addEventListener('click', event => {
    const btn = event.target.closest('[data-theme-switch]');
    if (!btn) return;
    if (isGold()) delete root.dataset.theme;
    else root.dataset.theme = 'gold';
    try { localStorage.setItem(KEY, isGold() ? 'gold' : 'classic'); } catch (error) {}
    sync();
  });

  sync();
})();
