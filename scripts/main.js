(() => {
  'use strict';

  const motion = window.gsap;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.header');
  const menuButton = header.querySelector('.menu-toggle');
  const nav = header.querySelector('#main-nav');
  const submenus = Array.from(nav.querySelectorAll('.nav-subtoggle'));
  const desktop = window.matchMedia('(min-width: 1025px)');

  function updateHeader() {
    header.classList.toggle('is-solid', window.scrollY > 24 || nav.classList.contains('is-open'));
  }

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
    if (!open) submenus.forEach(button => setSubmenu(button, false));
    updateHeader();
  }

  function setSubmenu(button, open) {
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('span').textContent = open ? '−' : '+';
    document.getElementById(button.getAttribute('aria-controls')).hidden = !open;
  }

  submenus.forEach(button => button.addEventListener('click', () => {
    const opening = button.getAttribute('aria-expanded') === 'false';
    submenus.forEach(control => setSubmenu(control, control === button && opening));
  }));

  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('pageshow', event => {
    if (event.persisted) setMenu(false);
    else updateHeader();
  });
  updateHeader();
  menuButton.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  desktop.addEventListener('change', () => setMenu(false));
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) {
      setMenu(false);
    } else if (!event.target.closest('.nav-group')) {
      submenus.forEach(button => setSubmenu(button, false));
    }
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });

  const intro = document.querySelector('#intro');
  const introSkip = intro?.querySelector('.intro-skip');
  const introHeading = intro?.parentElement.querySelector('.hero h1');
  let introTimeline;
  let introTimeout;
  function endIntro() {
    if (!intro || intro.hidden) return;
    const restoreFocus = document.activeElement === introSkip;
    introTimeline?.kill();
    window.clearTimeout(introTimeout);
    intro.hidden = true;
    if (restoreFocus) introHeading.focus({ preventScroll: true });
    intro.dispatchEvent(new Event('introend'));
  }
  function runIntro() {
    if (!intro || !intro.hidden || !motion || reduced.matches) return;
    const stage = intro.querySelector('.intro-stage');
    const curtain = intro.querySelector('.intro-curtain');
    const logo = intro.querySelector('.intro-logo img');
    const lines = intro.querySelectorAll('.intro-line');
    const place = intro.querySelector('.intro-place');

    motion.set([stage, curtain], { yPercent: 0 });
    motion.set(logo, { yPercent: 105 });
    motion.set(lines, { yPercent: 115 });
    motion.set(place, { y: 8, opacity: 0 });
    motion.set(introSkip, { opacity: 1 });
    intro.hidden = false;
    introTimeline = motion.timeline({ onComplete: endIntro })
      .to(logo, { yPercent: 0, duration: .75, ease: 'power3.out' }, .15)
      .to(lines, { yPercent: 0, duration: 1.03, stagger: .38, ease: 'power3.out' }, .8)
      .to(place, { y: 0, opacity: 1, duration: .6, ease: 'power2.out' }, 2.28)
      .to(introSkip, { opacity: 0, duration: .24 }, 4.08)
      .to(stage, { yPercent: -100, duration: .82, ease: 'power3.inOut' }, 4.05)
      .to(curtain, { yPercent: -100, duration: .78, ease: 'power3.inOut' }, 4.22);
    introTimeout = window.setTimeout(endIntro, 5500);
  }
  introSkip?.addEventListener('click', endIntro);
  // Avoid covering the page if the animation script arrives late.
  const introStart = document.timeline?.currentTime ?? 0;
  if (intro && motion && !reduced.matches && !location.hash && !document.hidden &&
      window.scrollY < 24 && introStart < 1500) {
    const introSeenKey = 'tregi-intro-seen-v2';
    let seen = false;
    try { seen = sessionStorage.getItem(introSeenKey) === '1'; } catch {}
    if (!seen) {
      runIntro();
      try { sessionStorage.setItem(introSeenKey, '1'); } catch {}
    }
  }
  reduced.addEventListener('change', event => {
    if (event.matches) endIntro();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const expanded = submenus.find(button => button.getAttribute('aria-expanded') === 'true');
      if (expanded) {
        setSubmenu(expanded, false);
        if (nav.contains(document.activeElement)) expanded.focus();
      } else if (nav.classList.contains('is-open')) {
        setMenu(false);
        menuButton.focus();
      }
    }
    if (event.key === 'Escape' || event.key === 'Tab') endIntro();
  });

  const socialDialog = document.querySelector('#demo-dialog');
  const quote = document.querySelector('#preventivo');

  function bindDialog(dialog, open) {
    let returnFocus;
    dialog.querySelectorAll('.dialog-close, .dialog-dismiss').forEach(button => {
      button.addEventListener('click', () => dialog.close());
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const { left, right, top, bottom } = dialog.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => returnFocus?.focus({ preventScroll: true }));

    return trigger => {
      endIntro();
      if (dialog.open) return;
      returnFocus = trigger;
      open(trigger);
      dialog.showModal();
      dialog.scrollTop = 0;
      if (motion && !reduced.matches) {
        motion.fromTo(dialog, { y: 10 }, {
          y: 0, duration: .24, ease: 'power2.out', overwrite: true, clearProps: 'transform',
        });
      }
    };
  }

  const openSocial = bindDialog(socialDialog, trigger => {
    const channel = trigger.dataset.demo;
    const replay = trigger.hasAttribute('data-replay');
    socialDialog.querySelector('#dialog-title').textContent =
      replay ? 'Movimento ridotto attivo' : channel;
    socialDialog.querySelector('#dialog-copy').textContent =
      replay ? 'L’intro segue le preferenze del tuo dispositivo.' : 'Collegamento in anteprima.';
  });
  document.querySelectorAll('[data-demo]').forEach(button => {
    button.addEventListener('click', () => openSocial(button));
  });
  document.querySelector('[data-replay]')?.addEventListener('click', event => {
    if (reduced.matches || !motion) {
      openSocial(event.currentTarget);
      return;
    }
    window.scrollTo(0, 0);
    runIntro();
    introSkip.focus({ preventScroll: true });
  });

  const openQuote = bindDialog(quote, trigger => {
    if (trigger.dataset.project) document.querySelector('#quote-interest').value = trigger.dataset.project;
  });
  const quoteViewport = window.visualViewport;
  const quoteHeading = quote.querySelector('.quote-dialog-heading');
  function fitQuoteToViewport() {
    if (!quote.open || !quoteViewport) return;
    quote.style.setProperty('--quote-viewport-height', `${quoteViewport.height}px`);
    quote.style.setProperty('--quote-viewport-top', `${quoteViewport.offsetTop}px`);

    const field = document.activeElement;
    if (!field?.matches('#quote-form :is(input, select, textarea)') || quote.scrollHeight <= quote.clientHeight) return;
    const bounds = field.getBoundingClientRect();
    const top = quoteHeading.getBoundingClientRect().bottom + 8;
    const bottom = quote.getBoundingClientRect().bottom - 8;
    if (bounds.bottom > bottom) quote.scrollTop += bounds.bottom - bottom;
    else if (bounds.top < top) quote.scrollTop += bounds.top - top;
  }
  quoteViewport?.addEventListener('resize', fitQuoteToViewport);
  quoteViewport?.addEventListener('scroll', fitQuoteToViewport);
  document.querySelectorAll('[data-open-quote]').forEach(button => {
    button.addEventListener('click', () => {
      openQuote(button);
      fitQuoteToViewport();
    });
  });

  function setupForm(form) {
    const required = Array.from(form.querySelectorAll('[required]'));
    const result = form.querySelector('.form-result');

    function validate(input) {
      const error = document.getElementById(input.id + '-error');
      let message = '';
      if (!input.value.trim()) message = 'Compila questo campo.';
      else if (input.validity.typeMismatch) message = 'Inserisci un indirizzo email valido.';
      error.textContent = message;
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', error.id);
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
      return !message;
    }

    form.addEventListener('input', event => {
      if (event.target.getAttribute('aria-invalid') === 'true') validate(event.target);
      result.textContent = '';
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const invalid = required.filter(input => !validate(input));
      if (invalid.length) {
        invalid[0].focus();
        return;
      }
      const feedback = form.id === 'quote-form' ? 'Richiesta di prova completata.' : 'Messaggio di prova completato.';
      result.textContent = feedback + ' Nessun dato è stato inviato o salvato.';
      result.focus();
    });
    form.querySelector('button[type="submit"]').disabled = false;
  }

  document.querySelectorAll('[data-preview-form]').forEach(setupForm);
  const subject = document.querySelector('#contact-subject');
  if (subject) {
    const promotion = new URLSearchParams(window.location.search).get('promozione')?.trim();
    if (promotion && !subject.value.trim()) {
      subject.value = 'Promozione · ' + promotion;
    }
    document.querySelector('[data-visit]')?.addEventListener('click', () => {
      if (!subject.value.trim()) {
        subject.value = 'Visita in showroom';
        subject.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  const promotionFilters = document.querySelector('.promotion-filters');
  if (promotionFilters && promotionFilters.children.length > 2) {
    const controls = Array.from(promotionFilters.querySelectorAll('button'));
    const cards = Array.from(document.querySelectorAll('[data-promotion-category]'));
    const status = document.querySelector('#promotion-status');
    controls.forEach(control => control.addEventListener('click', () => {
      const category = control.dataset.promotionFilter;
      controls.forEach(button => button.setAttribute('aria-pressed', String(button === control)));
      cards.forEach(card => { card.hidden = category !== '' && card.dataset.promotionCategory !== category; });
      status.textContent = category ? 'Promozioni di ' + category : 'Tutte le promozioni';
    }));
    promotionFilters.hidden = false;
  }

  function setupCarousel() {
    const photos = document.querySelector('.hero-photos');
    const hero = photos.closest('.hero');
    const sceneMenu = hero.querySelector('.scene-select');
    const selectors = Array.from(sceneMenu.querySelectorAll('[data-scene-select]'));
    const slides = Array.from(photos.querySelectorAll('[data-scene]'));
    const images = slides.map(slide => slide.querySelector('img'));
    const unavailable = new Set();
    let active = 0;
    let requestVersion = 0;
    let animation;
    let rotating = !reduced.matches;
    let inView = false;
    let hoveringControls = false;
    let timer;

    function canRotate() {
      const focusInHero = hero.contains(document.activeElement) && document.activeElement !== introHeading;
      return rotating && inView && !document.hidden && !hoveringControls &&
        (!intro || intro.hidden) && !focusInHero && !document.querySelector('dialog[open]');
    }

    function scheduleRotation() {
      window.clearTimeout(timer);
      if (!canRotate() || nextSlide(1) === null) return;
      timer = window.setTimeout(async () => {
        if (canRotate()) await select(nextSlide(1), true);
        scheduleRotation();
      }, 6500);
    }

    function stopRotation() {
      rotating = false;
      window.clearTimeout(timer);
    }

    function nextSlide(step) {
      for (let offset = 1; offset < slides.length; offset++) {
        const index = (active + step * offset + slides.length) % slides.length;
        if (!unavailable.has(index)) return index;
      }
      return null;
    }

    function markUnavailable(index) {
      if (unavailable.has(index)) return;
      unavailable.add(index);
      selectors[index].hidden = true;
      if (unavailable.has(active)) select(nextSlide(1));
    }

    async function select(index, automatic = false) {
      const version = ++requestVersion;
      if (index === null || index === active || unavailable.has(index)) return;

      const incoming = slides[index];
      const image = images[index];
      image.loading = 'eager';
      try {
        await image.decode();
      } catch {
        if (image.complete && !image.naturalWidth) markUnavailable(index);
        return;
      }
      if (version !== requestVersion || (automatic && !canRotate())) return;

      animation?.kill();
      const outgoing = slides[active];
      slides.forEach((slide, position) => {
        slide.hidden = slide !== outgoing && slide !== incoming;
        slide.setAttribute('aria-hidden', String(slide !== incoming));
        slide.style.removeProperty('opacity');
        slide.style.zIndex = slide === incoming ? '1' : '';
        selectors[position].setAttribute('aria-pressed', String(position === index));
      });
      active = index;
      if (!motion || reduced.matches) {
        outgoing.hidden = true;
        return;
      }
      animation = motion.fromTo(incoming, { opacity: 0 }, {
        opacity: 1, duration: .65, ease: 'power2.inOut', clearProps: 'opacity',
        onComplete: () => { outgoing.hidden = true; },
      });
    }

    selectors.forEach((selector, index) => {
      selector.addEventListener('click', () => {
        stopRotation();
        select(index);
      });
    });
    images.forEach((image, index) => {
      image.addEventListener('error', () => markUnavailable(index));
      image.addEventListener('load', () => {
        if (unavailable.delete(index)) {
          selectors[index].hidden = false;
          scheduleRotation();
        }
      });
      if (image.currentSrc && image.complete && !image.naturalWidth) markUnavailable(index);
    });
    sceneMenu.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      hoveringControls = true;
      scheduleRotation();
    });
    sceneMenu.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      hoveringControls = false;
      scheduleRotation();
    });
    hero.addEventListener('focusin', scheduleRotation);
    hero.addEventListener('focusout', () => queueMicrotask(scheduleRotation));
    intro?.addEventListener('introend', scheduleRotation);
    document.addEventListener('visibilitychange', scheduleRotation);
    document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', scheduleRotation));
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= .45;
      scheduleRotation();
    }, { threshold: .45 });
    visibility.observe(hero);
    sceneMenu.hidden = false;

    let touchOrigin;
    photos.addEventListener('touchstart', event => {
      const touch = event.touches[0];
      touchOrigin = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
    }, { passive: true });
    photos.addEventListener('touchend', event => {
      if (!touchOrigin) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchOrigin.x;
      const dy = touch.clientY - touchOrigin.y;
      touchOrigin = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const step = dx < 0 ? 1 : -1;
      stopRotation();
      select(nextSlide(step));
    }, { passive: true });
    photos.addEventListener('touchcancel', () => { touchOrigin = null; }, { passive: true });
    reduced.addEventListener('change', event => {
      if (event.matches) {
        animation?.progress(1);
        stopRotation();
      }
    });
  }
  if (document.querySelector('.hero-photos')) setupCarousel();

  const brandBanner = document.querySelector('.brand-banner');
  if (brandBanner && 'IntersectionObserver' in window) {
    const visibility = new IntersectionObserver(([entry]) => {
      brandBanner.classList.toggle('is-offscreen', !entry.isIntersecting);
      if (entry.isIntersecting) {
        brandBanner.querySelectorAll('img[loading="lazy"]').forEach(image => { image.loading = 'eager'; });
      }
    });
    visibility.observe(brandBanner);
  }

  const environmentGrid = document.querySelector('.environment-grid');
  if (environmentGrid) {
    const mobile = window.matchMedia('(max-width: 42rem)');
    const animateTouch = () => mobile.matches && !reduced.matches;
    let openingCard;
    let navigationTimer;

    environmentGrid.querySelectorAll('.environment').forEach(card => {
      let touched = false;
      card.addEventListener('pointerdown', event => {
        touched = event.isPrimary && event.pointerType === 'touch';
        if (touched && animateTouch() && !openingCard) card.setAttribute('data-pressed', '');
      });

      function releaseCard(event) {
        if (event.type === 'pointercancel') touched = false;
        if (card !== openingCard) card.removeAttribute('data-pressed');
      }
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => card.addEventListener(type, releaseCard));

      card.addEventListener('click', event => {
        const touchClick = touched && event.detail > 0;
        touched = false;
        if (!touchClick || !animateTouch() || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        event.preventDefault();
        if (openingCard) return;
        openingCard = card;
        card.setAttribute('data-pressed', '');
        navigationTimer = window.setTimeout(() => window.location.assign(card.href), 240);
      });
    });

    window.addEventListener('pagehide', () => {
      window.clearTimeout(navigationTimer);
      openingCard = null;
      environmentGrid.querySelectorAll('[data-pressed]').forEach(card => card.removeAttribute('data-pressed'));
    });
  }

  function setupFilters() {
    const controls = Array.from(document.querySelectorAll('[data-filter]'));
    const filterBar = controls[0].parentElement;
    const compact = window.matchMedia('(max-width: 42rem)');
    const grid = document.querySelector('.product-grid');
    const products = Array.from(grid.querySelectorAll('[data-category]'));
    const frames = products.map(product => product.querySelector('.photo-frame'));
    const status = document.querySelector('#filter-status');
    const flip = window.Flip;
    let transition;

    function applyFilter(control, animate = false) {
      if (control.getAttribute('aria-pressed') === 'true') return;
      const category = control.dataset.filter;
      const showAll = category === 'all';
      transition?.progress(1);
      const state = animate && flip && !reduced.matches && !compact.matches ? flip.getState(frames) : null;

      controls.forEach(button => button.setAttribute('aria-pressed', String(button === control)));
      products.forEach(product => { product.hidden = !showAll && product.dataset.category !== category; });
      grid.classList.toggle('is-filtered', !showAll);
      status.textContent = showAll ? 'Tutte le categorie' : control.textContent;

      if (compact.matches) {
        grid.scrollLeft = 0;
        const bar = filterBar.getBoundingClientRect();
        const button = control.getBoundingClientRect();
        if (button.left < bar.left) filterBar.scrollLeft -= bar.left - button.left;
        else if (button.right > bar.right) filterBar.scrollLeft += button.right - bar.right;
      }

      if (state) {
        transition = flip.from(state, { duration: .55, ease: 'power3.inOut', scale: true });
      }
    }

    // Older home links used a fragment pointing directly to the product card.
    const legacyRoom = url => products.find(product => url.hash === '#' + product.id);
    function filterFromUrl() {
      const url = new URL(location.href);
      const room = url.searchParams.get('ambiente') ?? legacyRoom(url)?.dataset.category;
      applyFilter(controls.find(control => control.dataset.filter === room) ?? controls[0]);
    }
    filterFromUrl();
    window.addEventListener('hashchange', filterFromUrl);

    controls.forEach(control => control.addEventListener('click', () => {
      applyFilter(control, true);
      if (location.protocol === 'file:') return;
      const url = new URL(location.href);
      if (control.dataset.filter === 'all') url.searchParams.delete('ambiente');
      else url.searchParams.set('ambiente', control.dataset.filter);
      if (legacyRoom(url)) url.hash = '';
      history.replaceState(history.state, '', url);
    }));
    reduced.addEventListener('change', event => {
      if (event.matches) transition?.progress(1);
    });
  }
  if (document.querySelector('.product-grid')) setupFilters();

  if (motion) {
    motion.matchMedia().add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const buttons = Array.from(document.querySelectorAll('.button'));
      function moveFill(event) {
        const button = event.currentTarget;
        if (button.disabled) return;
        const entered = event.type === 'pointerenter';
        if (entered) {
          const { left, width } = button.getBoundingClientRect();
          const origin = motion.utils.clamp(0, 100, 100 * (event.clientX - left) / width);
          button.style.setProperty('--fill-origin', origin + '%');
        }
        motion.to(button, {
          '--fill': entered ? '100%' : '0%',
          duration: entered ? .4 : .28, ease: 'power2.out', overwrite: 'auto',
        });
      }
      buttons.forEach(button => {
        button.addEventListener('pointerenter', moveFill);
        button.addEventListener('pointerleave', moveFill);
      });
      return () => buttons.forEach(button => {
        button.removeEventListener('pointerenter', moveFill);
        button.removeEventListener('pointerleave', moveFill);
        motion.killTweensOf(button, '--fill');
        button.style.removeProperty('--fill');
        button.style.removeProperty('--fill-origin');
      });
    });
  }
})();
