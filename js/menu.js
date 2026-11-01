(() => {
  const { reduced, scheduleStatus } = window.PiuSite;
  const isPhone = matchMedia('(max-width: 809.98px)');

  /* Open or closed, beside the phone number */
  const status = document.getElementById('menuStatus');
  const renderStatus = () => {
    const now = scheduleStatus(new Date());
    status.textContent = now.text;
    status.classList.toggle('is-resting', !now.open);
  };
  renderStatus();
  setInterval(renderStatus, 60000);

  /* Pizza size: scales the pizza to its true diameter and marks that column of prices */
  const pizza = document.getElementById('pizza');
  const sizeNote = document.getElementById('sizeNote');
  const sizeButtons = [...pizza.querySelectorAll('.size-btn')];
  const areaOf = inches => Math.round(Math.PI * (inches / 2) ** 2);
  sizeButtons.forEach(button => button.addEventListener('click', () => {
    pizza.dataset.size = button.dataset.size;
    sizeButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    sizeNote.textContent = `${areaOf(+button.dataset.size)} square inches of pizza`;
  }));

  /* Section links: follow the reader down the page */
  const bar = document.getElementById('menuNavBar');
  const links = [...bar.querySelectorAll('.tab')];
  const setActive = id => {
    links.forEach(link => {
      const on = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      // Only the bar scrolls sideways, so the page never jumps.
      if (on && bar.scrollWidth > bar.clientWidth) {
        const offset = link.getBoundingClientRect().left - bar.getBoundingClientRect().left + bar.scrollLeft;
        bar.scrollTo({ left: offset - (bar.clientWidth - link.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
      }
    });
  };
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-35% 0px -60% 0px' });
  document.querySelectorAll('[data-menu-section]').forEach(section => spy.observe(section));

  /* Phone: the header tucks away on the way down so the menu keeps the screen */
  const nav = document.getElementById('nav');
  let lastY = scrollY;
  const syncTuck = () => {
    const y = scrollY;
    const tucked = isPhone.matches && y > 400 && y > lastY && !document.body.classList.contains('menu-open');
    if (Math.abs(y - lastY) > 6 || !isPhone.matches) {
      nav.classList.toggle('is-tucked', tucked);
      document.body.classList.toggle('nav-tucked', tucked);
      lastY = y;
    }
  };
  addEventListener('scroll', syncTuck, { passive: true });
  isPhone.addEventListener('change', syncTuck);

  /* Phone quick actions: shown once the hero is behind you, tucked away at the footer */
  const actionBar = document.getElementById('actionBar');
  const barState = { pastHero: false, atFooter: false };
  const syncBar = () => actionBar.classList.toggle('is-on', barState.pastHero && !barState.atFooter);
  new IntersectionObserver(([e]) => {
    barState.pastHero = !e.isIntersecting && e.boundingClientRect.bottom < 0;
    syncBar();
  }).observe(document.querySelector('.menu-hero'));
  new IntersectionObserver(([e]) => {
    barState.atFooter = e.isIntersecting;
    syncBar();
  }).observe(document.querySelector('.footer'));
})();
