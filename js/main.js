(() => {
  const IMG = 'https://framerusercontent.com/images/';
  const PAPER = IMG + 'pqbPyqZxZhoGvr2tVKXCqn7C25o.png?scale-down-to=1024';
  const LEAF = IMG + 'CLBHvevS4uB0GZ8UmXMU4Btxjc.svg';
  const TOMATO = IMG + 'C0UmP0XoHfmSYrCIWIgCmHbflLw.svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = matchMedia('(min-width: 1440px)');
  const isPhone = matchMedia('(max-width: 809.98px)');

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

  /* Hero menu cards */
  const heroCards = [...document.querySelectorAll('.hero-card')];
  let heroIndex = 0, heroVisible = false;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(document.getElementById('heroCards'));
  if (!reduced) setInterval(() => {
    if (document.hidden || !heroVisible) return;
    const out = heroCards[heroIndex];
    heroIndex = (heroIndex + 1) % heroCards.length;
    const next = heroCards[heroIndex];
    next.classList.add('no-anim');
    next.classList.remove('is-out');
    next.offsetWidth;
    next.classList.remove('no-anim');
    out.classList.remove('is-on');
    out.classList.add('is-out');
    next.classList.add('is-on');
  }, 3000);

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

  /* Odometers */
  document.querySelectorAll('[data-odo]').forEach(odo => {
    const reels = [];
    [...odo.dataset.odo].forEach((ch, i) => {
      const col = document.createElement('span');
      col.className = 'odo-col';
      col.setAttribute('aria-hidden', 'true');
      if (ch === ',') {
        col.classList.add('odo-comma');
        col.textContent = ',';
      } else {
        const reel = document.createElement('span');
        reel.className = 'odo-reel';
        const spins = 2 + i;
        const count = spins * 10 + +ch + 1;
        for (let n = 0; n < count; n++) {
          const b = document.createElement('b');
          b.textContent = n % 10;
          reel.append(b);
        }
        col.append(reel);
        reels.push({ reel, stop: count - 1 });
      }
      odo.append(col);
    });
    const plus = document.createElement('span');
    plus.className = 'odo-plus';
    plus.setAttribute('aria-hidden', 'true');
    plus.textContent = '+';
    odo.append(plus);

    const place = p => reels.forEach(({ reel, stop }) => {
      reel.style.transform = `translateY(${-p * stop}em)`;
    });
    if (reduced) { place(1); return; }
    place(0);
    onView(odo, () => {
      const start = performance.now();
      const tick = t => {
        const p = Math.min((t - start) / 3000, 1);
        place(1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });

  /* Newly added: active item swaps the spinning pizza. On tablet and phone
     the pizza sits directly under the active item. */
  const stage = document.getElementById('pizzaStage');
  const right = document.getElementById('newlyRight');
  const items = [...document.querySelectorAll('.item')];
  const showPizza = (root, index) => {
    root.querySelectorAll('.pizza-spin img').forEach((p, i) => p.classList.toggle('is-on', i === index));
  };
  const placeStage = () => {
    const active = items.find(i => i.classList.contains('is-active'));
    document.querySelectorAll('.pizza-stage.is-clone').forEach(c => c.remove());
    showPizza(stage, +active.dataset.pizza);
    if (isDesktop.matches) right.append(stage);
    else if (isPhone.matches) {
      // Phone shows every pizza at once, each under its own item.
      items.forEach((item, i) => {
        const copy = i === 0 ? stage : stage.cloneNode(true);
        if (i > 0) { copy.removeAttribute('id'); copy.classList.add('is-clone'); }
        showPizza(copy, i);
        item.parentElement.append(copy);
      });
    } else active.parentElement.append(stage);
  };
  items.forEach(item => {
    item.addEventListener('click', e => {
      if (e.target.closest('a')) e.preventDefault();
      if (isPhone.matches) return;
      items.forEach(i => i.classList.toggle('is-active', i === item));
      placeStage();
    });
  });
  isDesktop.addEventListener('change', placeStage);
  isPhone.addEventListener('change', placeStage);
  placeStage();

  /* Explore tabs */
  const MENU = {
    classic: [
      ['Four Cheese Pull', '$17', '6IueieBH5I7tAUe7V8bo3fxJw.png', 'aDhjTebJLF4kFgiur4Rb2dmc.jpg'],
      ['Fresh Mozzarella', '$16', 'ao6TLXgmeUj6tAsQEPCGQsWPk4.png', 'KPB0sUOeKgynOIx812bchnMXTw.png'],
      ['Pepperoni & Ham', '$18', '6S9zGnkbghidjG9R4UmRruBS1dQ.png', 'HkR5BifDLPe7PxC66kVpO38UUs.png']
    ],
    signature: [
      ['Smoky BBQ Chicken', '$19', 'CwtgOTrPgMN4i5TwUdtDeGbv4.png', 'GRmdIjJZLVB06etQbZ9IyCZ7HpI.png'],
      ['The Stone Supreme', '$20', 'YcsM2Ba5wOIiwt6ltc2EjZqZh0.png', 'waRs6hqwPbV0L6NfQ5hkSWIQ.jpg']
    ],
    meat: [['The Butcher', '$21', 'oqNzyU7EwACYAdBnYX1NKi5bIWg.png', 'KlcuaF8rSo6lW27LcftVcbRj8C8.png']],
    veggie: [['Market Veggie', '$17', 'aqlLbbYV5QVHHIjETA9yfqdyquc.png', '1Oz70YlHtt77pekZ5a25C0HrR4.png']]
  };
  const cards = document.getElementById('cards');
  const cardHTML = ([name, price, pizza, photo]) => `
    <a class="card" href="#">
      <span class="card-media">
        <img class="card-paper" src="${PAPER}" alt="" loading="lazy">
        <span class="card-pizza">
          <img src="${IMG}${pizza}?scale-down-to=512" alt="" loading="lazy">
          <img class="card-leaf" src="${LEAF}" alt="" loading="lazy">
          <img class="card-tomato" src="${TOMATO}" alt="" loading="lazy">
        </span>
        <span class="card-name">${name}</span>
        <span class="card-link">View Details</span>
        <img class="card-default" src="${IMG}${photo}?scale-down-to=1024" alt="${name}" loading="lazy">
      </span>
      <span class="card-meta"><span class="card-title">${name}</span><span class="card-price">${price}</span></span>
    </a>`;
  const tabs = [...document.querySelectorAll('.tab')];
  const tabBar = document.querySelector('.tabs');
  // On a phone the tab row scrolls sideways, so bring the chosen tab to the middle.
  const centerTab = tab => {
    if (tabBar.scrollWidth <= tabBar.clientWidth) return;
    const offset = tab.getBoundingClientRect().left - tabBar.getBoundingClientRect().left + tabBar.scrollLeft;
    tabBar.scrollTo({ left: offset - (tabBar.clientWidth - tab.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  };
  const showTab = key => {
    tabs.forEach(t => {
      const on = t.dataset.tab === key;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    cards.innerHTML = MENU[key].map(cardHTML).join('');
    cards.scrollTo(0, 0);
  };
  tabs.forEach(t => t.addEventListener('click', () => { showTab(t.dataset.tab); centerTab(t); }));
  showTab('classic');
  // Fetch the other tabs' photos early so switching tabs never shows empty cards.
  new IntersectionObserver((entries, io) => {
    if (!entries.some(e => e.isIntersecting)) return;
    io.disconnect();
    Object.values(MENU).flat().forEach(([, , pizza, photo]) => {
      new Image().src = `${IMG}${pizza}?scale-down-to=512`;
      new Image().src = `${IMG}${photo}?scale-down-to=1024`;
    });
  }, { rootMargin: '800px' }).observe(cards);

  /* Testimonials */
  const slider = document.getElementById('slider');
  const slides = [...slider.querySelectorAll('.slide')];
  const dots = [...slider.querySelectorAll('.slider-dots button')];
  let current = 0, sliderHover = false, sliderVisible = false, swipe = null, timer;
  const renderSlides = (dir = 0) => {
    const n = slides.length;
    slides.forEach((slide, i) => {
      const offset = ((i - current + n + 1) % n) - 1;
      const wrapped = (dir > 0 && offset === 1) || (dir < 0 && offset === -1);
      slide.classList.toggle('no-anim', wrapped || dir === 0);
      slide.style.transform = `translateX(calc(${offset * 100}% + ${offset * 40}px + var(--drag, 0px)))`;
      slide.setAttribute('aria-hidden', String(offset !== 0));
    });
    dots.forEach((d, i) => d.classList.toggle('is-on', i === current));
  };
  const go = dir => {
    current = (current + dir + slides.length) % slides.length;
    renderSlides(dir);
    restart();
  };
  const restart = () => {
    clearInterval(timer);
    if (reduced) return;
    timer = setInterval(() => {
      if (!sliderHover && !swipe && sliderVisible && !document.hidden && ready(slides[(current + 1) % slides.length])) go(1);
    }, 3000);
  };
  // Autoplay never brings in a card whose photo is still downloading.
  const ready = slide => [...slide.querySelectorAll('img')].every(img => img.complete);
  // The off-screen slides are clipped, so lazy loading would only fetch their ~400 KB photos
  // once they slide in, leaving an empty card on a phone connection. Fetch them ahead of time.
  new IntersectionObserver((entries, io) => {
    if (!entries.some(e => e.isIntersecting)) return;
    io.disconnect();
    slider.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
  }, { rootMargin: '1500px' }).observe(slider);
  slider.querySelector('.slider-prev').addEventListener('click', () => go(-1));
  slider.querySelector('.slider-next').addEventListener('click', () => go(1));
  dots.forEach((d, i) => d.addEventListener('click', () => {
    const dir = i === current ? 0 : ((i - current + slides.length) % slides.length === 1 ? 1 : -1);
    if (dir) go(dir);
  }));
  // Only a real mouse pauses autoplay; a tap would otherwise leave it paused for good.
  slider.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') sliderHover = true; });
  slider.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') sliderHover = false; });
  new IntersectionObserver(([e]) => { sliderVisible = e.isIntersecting; }).observe(slider);
  /* Swipe: the slides follow the finger, then settle on release. A vertical scroll that
     starts on the slider ends in pointercancel, which must clear the swipe too. */
  const view = slider.querySelector('.slider-view');
  view.addEventListener('pointerdown', e => {
    if (isDesktop.matches || (e.pointerType === 'mouse' && e.button !== 0)) return;
    swipe = { id: e.pointerId, x: e.clientX, dx: 0 };
  });
  addEventListener('pointermove', e => {
    if (!swipe || e.pointerId !== swipe.id) return;
    swipe.dx = e.clientX - swipe.x;
    if (Math.abs(swipe.dx) > 8) view.classList.add('is-dragging');
    if (view.classList.contains('is-dragging')) view.style.setProperty('--drag', `${swipe.dx}px`);
  });
  const endSwipe = commit => {
    if (!swipe) return;
    const { dx } = swipe;
    swipe = null;
    const moved = view.classList.contains('is-dragging');
    view.classList.remove('is-dragging');
    view.style.removeProperty('--drag');
    if (commit && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    else if (moved) slides.forEach(s => s.classList.remove('no-anim'));
  };
  addEventListener('pointerup', () => endSwipe(true));
  addEventListener('pointercancel', () => endSwipe(false));
  renderSlides();
  restart();

  /* CTA: image settles and the box grows in; the box can be dragged and snaps back */
  const cta = document.getElementById('cta');
  const box = document.getElementById('ctaBox');
  new IntersectionObserver((entries, io) => {
    if (entries.some(e => e.isIntersecting)) { cta.classList.add('is-in'); io.disconnect(); }
  }, { rootMargin: '0px 0px -50% 0px' }).observe(document.getElementById('ctaTrigger'));
  let drag = null;
  box.addEventListener('pointerdown', e => {
    if (e.target.closest('a') || !cta.classList.contains('is-in') || e.pointerType === 'touch') return;
    drag = { x: e.clientX, y: e.clientY };
    box.classList.add('is-drag');
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener('pointermove', e => {
    if (!drag) return;
    box.style.setProperty('--dx', `${e.clientX - drag.x}px`);
    box.style.setProperty('--dy', `${e.clientY - drag.y}px`);
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    box.classList.remove('is-drag');
    box.style.removeProperty('--dx');
    box.style.removeProperty('--dy');
  };
  box.addEventListener('pointerup', endDrag);
  box.addEventListener('pointercancel', endDrag);

  /* Phone quick actions: shown once the hero is behind you, tucked away at the CTA and footer */
  const actionBar = document.getElementById('actionBar');
  const bar = { pastHero: false, ends: new Set() };
  const syncBar = () => actionBar.classList.toggle('is-on', bar.pastHero && !bar.ends.size);
  new IntersectionObserver(([e]) => {
    bar.pastHero = !e.isIntersecting && e.boundingClientRect.bottom < 0;
    syncBar();
  }).observe(document.querySelector('.hero'));
  const endObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) bar.ends.add(e.target); else bar.ends.delete(e.target); });
    syncBar();
  });
  [cta, document.querySelector('.footer')].forEach(el => endObserver.observe(el));

  /* Tape ribbons */
  document.querySelectorAll('[data-ribbon]').forEach(track => {
    const words = track.dataset.ribbon.split('|');
    const star = '<svg><use href="#i-oven"/></svg>';
    const row = words.map(w => `<span>${w}${star}</span>`).join('');
    track.innerHTML = row.repeat(6);
  });

  /* Opening hours: the single source for the footer and the visit section.
     The kitchen serves 5 PM to 10 PM every day, in Eastern time. Both are
     24-hour, and a closed day is null. Index 0 is Sunday. */
  const TIME_ZONE = 'America/New_York';
  const HOURS = [[17, 22], [17, 22], [17, 22], [17, 22], [17, 22], [17, 22], [17, 22]];
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
  const renderStatus = () => {
    const status = scheduleStatus(new Date());
    const line = document.getElementById('ovenStatus');
    line.textContent = status.text;
    line.classList.toggle('is-resting', !status.open);
    document.getElementById('oven').classList.toggle('is-resting', !status.open);
    document.getElementById('visitHours').innerHTML = hourGroups().map(g => `<li${g.days.includes(status.day) ? ' class="is-today"' : ''}><b>${g.label}</b>${g.time}</li>`).join('');
  };
  renderStatus();
  setInterval(renderStatus, 60000);
})();
