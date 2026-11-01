/* Shared by every page with the full header and footer. */
window.PiuSite = (() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onView = (el, cb, threshold = 0.5) => {
    new IntersectionObserver((entries, io) => {
      if (entries.some(e => e.isIntersecting)) { cb(); io.disconnect(); }
    }, { threshold }).observe(el);
  };

  /* Header fill */
  const nav = document.getElementById('nav');
  const syncNav = () => nav.classList.toggle('is-filled', scrollY > 50);
  addEventListener('scroll', syncNav, { passive: true });
  syncNav();

  /* Menu overlay */
  const burger = document.getElementById('burger');
  const overlay = document.getElementById('overlay');
  const overlayImgs = overlay.querySelectorAll('.overlay-images img');
  // The menu photos are heavy and hidden until the menu opens, so fetch them on first interaction.
  const loadOverlayImages = () => {
    overlayImgs.forEach(img => { if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; } });
  };
  const setMenu = open => {
    if (open) loadOverlayImages();
    overlay.classList.toggle('is-open', open);
    overlay.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  };
  ['pointerenter', 'pointerdown', 'focus'].forEach(type => burger.addEventListener(type, loadOverlayImages, { once: true }));
  burger.addEventListener('click', () => setMenu(!overlay.classList.contains('is-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  overlay.querySelectorAll('.overlay-links a').forEach(link => {
    link.addEventListener('mouseenter', () => {
      overlayImgs.forEach((img, i) => img.classList.toggle('is-on', i === +link.dataset.img));
    });
    link.addEventListener('click', () => setMenu(false));
  });

  /* Tickers: 75px/s, half speed on hover, paused off screen */
  const TICKER_SPEED = 75;
  document.querySelectorAll('[data-ticker]').forEach(ticker => {
    const track = ticker.querySelector('.ticker-track');
    const first = track.firstElementChild;
    for (let i = 0; i < 3; i++) {
      const clone = first.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.append(clone);
    }
    let x = 0, last = 0, factor = 1, target = 1, visible = false, loop = 0;
    // A tap fires mouseenter without a matching leave, so only a real mouse slows the ticker.
    ticker.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') target = 0.5; });
    ticker.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') target = 1; });
    // Measured on resize and font load rather than every frame.
    const measure = () => { loop = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap) || loop; };
    measure();
    new ResizeObserver(measure).observe(first);
    if (document.fonts) document.fonts.ready.then(measure);
    const step = t => {
      const dt = Math.min((t - last) / 1000, 0.1);
      last = t;
      factor += (target - factor) * Math.min(dt * 6, 1);
      x = loop ? (x + TICKER_SPEED * factor * dt) % loop : 0;
      track.style.transform = `translate3d(${-x}px,0,0)`;
      if (visible) requestAnimationFrame(step);
    };
    if (reduced) return;
    new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) { last = performance.now(); requestAnimationFrame(step); }
    }).observe(ticker);
  });

  /* Heading character reveal */
  document.querySelectorAll('[data-chars]').forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    let i = 0;
    text.split(' ').forEach((word, w, words) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'word';
      wordEl.setAttribute('aria-hidden', 'true');
      [...word].forEach(ch => {
        const c = document.createElement('span');
        c.className = 'char';
        c.style.setProperty('--i', i++);
        c.textContent = ch;
        wordEl.append(c);
      });
      el.append(wordEl);
      if (w < words.length - 1) { el.append(' '); i++; }
    });
    onView(el, () => el.classList.add('is-in'));
  });

  /* Scroll reveals */
  document.querySelectorAll('[data-reveal]').forEach(el => {
    onView(el, () => el.classList.add('is-in'), 0.2);
  });

  /* Opening hours: the single source for the footer and the visit section.
     Tuesday to Thursday 11 AM to 8 PM, Friday 11 AM to 9 PM, Saturday and
     Sunday 4 PM to 8/9 PM, closed Monday, in Eastern time. Both values are
     24-hour, and a closed day is null. Index 0 is Sunday. */
  const TIME_ZONE = 'America/New_York';
  const HOURS = [[16, 20], null, [11, 20], [11, 20], [11, 20], [11, 21], [16, 21]];
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formatHour = hour => {
    const whole = Math.floor(hour);
    const mins = Math.round((hour - whole) * 60);
    const display = whole % 12 || 12;
    return `${display}${mins ? `:${String(mins).padStart(2, '0')}` : ''} ${whole < 12 || whole === 24 ? 'AM' : 'PM'}`;
  };
  const scheduleStatus = (now, hours = HOURS, timeZone = TIME_ZONE) => {
    const parts = {};
    new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(now).forEach(p => { parts[p.type] = p.value; });
    const day = DAY_NAMES.indexOf(parts.weekday);
    const time = +parts.hour + +parts.minute / 60;
    const today = hours[day];
    if (today && time >= today[0] && time < today[1]) return { open: true, day, text: `Open now · closes ${formatHour(today[1])}` };
    if (today && time < today[0]) return { open: false, day, text: `Opens today at ${formatHour(today[0])}` };
    for (let ahead = 1; ahead <= 7; ahead++) {
      const next = hours[(day + ahead) % 7];
      if (next) return { open: false, day, text: `Opens ${ahead === 1 ? 'tomorrow' : DAY_NAMES[(day + ahead) % 7]} at ${formatHour(next[0])}` };
    }
    return { open: false, day, text: 'Closed for now' };
  };
  const hourGroups = () => {
    const groups = [];
    [1, 2, 3, 4, 5, 6, 0].forEach(day => {
      const hours = HOURS[day];
      const last = groups[groups.length - 1];
      if (last && String(last.hours) === String(hours)) last.days.push(day);
      else groups.push({ hours, days: [day] });
    });
    return groups.map(({ hours, days }) => ({
      days,
      label: days.length > 1 ? `${DAY_NAMES[days[0]]} to ${DAY_NAMES[days[days.length - 1]]}` : DAY_NAMES[days[0]],
      time: hours ? `${formatHour(hours[0])} – ${formatHour(hours[1])}` : 'Closed'
    }));
  };
  document.getElementById('footerHours').innerHTML = hourGroups().map(g => `<li>${g.label}: ${g.time}</li>`).join('');

  return { reduced, onView, scheduleStatus, hourGroups };
})();
