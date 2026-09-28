// Fiche d'un yacht : ouverture, galerie par pont avec visionneuse, plan de pont, calendrier des semaines,
// demande préremplie selon le bouton choisi, barre du bas sur téléphone.
import { gsap, ScrollTrigger, SplitText, reduceMotion, initCommun, scrollToEl, pause, revele, aLEcran } from './commun.js';
import { t as tr } from './i18n.js';
import { initReservation } from './reservation.js';

initCommun();

// Ouverture : l'image se pose, le nom monte lettre à lettre, puis les caractéristiques
if (!reduceMotion) {
  const chars = SplitText.create('.fi-hero__title', { aria: 'hidden', type: 'lines,chars', mask: 'lines' }).chars;
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.fi-hero__media img', { scale: 1.2, duration: 2.8, ease: 'power3.out' }, 0)
    .from(chars, { yPercent: 105, duration: 1.4, stagger: 0.05 }, 0.25)
    .from('.fi-hero .crumbs, .fi-hero .kicker, .fi-hero__lead', { autoAlpha: 0, y: 20, duration: 1.2, stagger: 0.1 }, 0.6)
    .from('.fi-hero__specs div', { autoAlpha: 0, y: 20, duration: 1, stagger: 0.07 }, 0.9);
  gsap.to('.fi-hero__media img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.fi-hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.utils.toArray('.fi-intro > p, .fi-points li, .fi-specs__list div, .fi-sale__list li, .fi-decks__list li, .fi-more__list li').forEach((el) => {
    revele(el, { autoAlpha: 0, y: 24, duration: 1, ease: 'power3.out' }, el, 92);
  });
}

await pause();

// ---------------------------------------------------------------------------------------------
// Galerie : filtrée par pont, on la fait glisser, les flèches avancent d'une image
// ---------------------------------------------------------------------------------------------
const strip = document.querySelector('.fi-gallery__strip');
if (strip) {
  const shots = [...strip.querySelectorAll('.fi-shot')];
  const counter = document.querySelector('.fi-gallery__count');
  const visible = () => shots.filter((s) => !s.hidden);
  const currentIndex = () => {
    const left = strip.getBoundingClientRect().left;
    const v = visible();
    let best = 0;
    v.forEach((s, k) => { if (Math.abs(s.getBoundingClientRect().left - left) < Math.abs(v[best].getBoundingClientRect().left - left)) best = k; });
    return best;
  };
  const updateCount = () => {
    const v = visible();
    counter.innerHTML = `<span>${String(currentIndex() + 1).padStart(2, '0')}</span> / ${String(v.length).padStart(2, '0')}`;
  };
  const goShot = (k) => {
    const v = visible();
    const target = v[gsap.utils.clamp(0, v.length - 1, k)];
    strip.scrollTo({ left: target.offsetLeft - strip.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  strip.addEventListener('scroll', () => requestAnimationFrame(updateCount), { passive: true });
  document.querySelectorAll('.fi-gallery__nav button').forEach((b) => b.addEventListener('click', () => goShot(currentIndex() + Number(b.dataset.dir))));

  const tabs = [...document.querySelectorAll('.fi-gallery__tabs .chip')];
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
    shots.forEach((s) => { s.hidden = Boolean(tab.dataset.pont) && s.dataset.pont !== tab.dataset.pont; });
    strip.scrollLeft = 0;
    if (!reduceMotion) gsap.fromTo(visible(), { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, clearProps: 'all' });
    updateCount();
  }));

  // Glisser à la souris (au doigt, le défilement natif suffit)
  let drag = null;
  let moved = false;
  strip.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    drag = { x: e.clientX, left: strip.scrollLeft };
    moved = false;
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) { moved = true; strip.classList.add('is-dragging'); }
    strip.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    drag = null;
    strip.classList.remove('is-dragging');
    if (moved) goShot(currentIndex());
  });

  // Visionneuse plein écran
  const box = document.createElement('dialog');
  box.className = 'fi-lightbox';
  box.setAttribute('aria-label', tr('Visionneuse'));
  box.innerHTML = `<figure><img alt=""></figure><div class="fi-lightbox__bar"><p></p><button type="button" data-dir="-1" aria-label="${tr('Image précédente')}">←</button><button type="button" data-dir="1" aria-label="${tr('Image suivante')}">→</button></div><button type="button" class="fi-lightbox__close">${tr('Fermer')}</button>`;
  document.body.append(box);
  const bigImg = box.querySelector('img');
  const caption = box.querySelector('p');
  let open = 0;
  const show = (k) => {
    const v = visible();
    open = (k + v.length) % v.length;
    const src = v[open].querySelector('img');
    // Toujours la grande version (l'image de la bande n'est peut-être pas encore chargée)
    bigImg.src = src.getAttribute('src');
    bigImg.alt = src.alt;
    caption.textContent = `${String(open + 1).padStart(2, '0')} / ${String(v.length).padStart(2, '0')} · ${src.alt}`;
    if (!reduceMotion) gsap.fromTo(bigImg, { autoAlpha: 0, scale: 1.03 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power3.out' });
  };
  strip.addEventListener('click', (e) => {
    const btn = e.target.closest('.fi-shot__open');
    if (!btn || moved) return;
    show(visible().indexOf(btn.closest('.fi-shot')));
    box.showModal();
  });
  box.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => show(open + Number(b.dataset.dir))));
  box.querySelector('.fi-lightbox__close').addEventListener('click', () => box.close());
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(open + 1);
    if (e.key === 'ArrowLeft') show(open - 1);
  });
  box.addEventListener('click', (e) => { if (e.target === box || e.target.tagName === 'FIGURE') box.close(); });
  updateCount();
}

await pause();

// ---------------------------------------------------------------------------------------------
// Plan de pont : survoler un pont éclaire son niveau sur la silhouette ; les niveaux se tracent à l'arrivée
// ---------------------------------------------------------------------------------------------
const levels = [...document.querySelectorAll('.fi-decks__level')];
document.querySelectorAll('.fi-decks__list li').forEach((li) => {
  const on = (v) => {
    li.classList.toggle('is-on', v);
    levels.find((l) => l.dataset.level === li.dataset.level)?.classList.toggle('is-on', v);
  };
  li.addEventListener('pointerenter', () => on(true));
  li.addEventListener('pointerleave', () => on(false));
});
const outline = document.querySelector('.fi-decks__line');
if (outline && !reduceMotion) {
  const len = outline.getTotalLength();
  const trace = gsap.fromTo(outline, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 3, ease: 'power2.inOut', paused: true });
  aLEcran('.fi-decks', () => trace.play(), 75);
}

await pause();

// ---------------------------------------------------------------------------------------------
// Demande : le bouton choisi (dossier, visite, question) prérègle le formulaire
// ---------------------------------------------------------------------------------------------
const form = document.querySelector('.fi-form');
function setIntent(intent) {
  const radio = form.querySelector(`input[name="demande"][value="${intent}"]`);
  if (radio) radio.checked = true;
}
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-intent]');
  if (link) setIntent(link.dataset.intent);
});

// Réservation en ligne (yachts à louer) : calendrier jour par jour, prix, connexion, enregistrement
initReservation();

// Barre du bas (téléphone) : après l'ouverture, et masquée quand le formulaire est à l'écran
const bar = document.querySelector('.fi-bar');
if (bar) {
  let pastHero = false;
  let atForm = false;
  const update = () => bar.classList.toggle('is-on', pastHero && !atForm);
  ScrollTrigger.create({ trigger: '.fi-hero', start: 'bottom 60%', end: 'max', onToggle: (s) => { pastHero = s.isActive; update(); } });
  ScrollTrigger.create({ trigger: '#demande', start: 'top bottom', end: 'bottom top', onToggle: (s) => { atForm = s.isActive; update(); } });
  bar.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); setIntent('dossier'); scrollToEl(document.getElementById('demande'), 16); });
}

// ---------------------------------------------------------------------------------------------
// Visite à bord : le lecteur (et ses centaines d'images) ne se charge qu'au clic
// ---------------------------------------------------------------------------------------------
const tour = document.querySelector('.fi-tour');
if (tour) {
  const hasWebGL = (() => { try { return !!document.createElement('canvas').getContext('webgl'); } catch { return false; } })();
  const launch = async () => {
    if (!hasWebGL) { scrollToEl(document.getElementById('galerie'), 16); return; }
    const { openTour } = await import('./visite-fiche.js');
    openTour(tour);
  };
  tour.querySelectorAll('.fi-tour__open, .fi-tour__start').forEach((b) => b.addEventListener('click', launch));
  if (!reduceMotion) {
    gsap.fromTo(tour.querySelector('.fi-tour__open img'), { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: tour, start: 'top bottom', end: 'bottom top', scrub: true } });
  }
}
