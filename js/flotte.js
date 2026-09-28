// La flotte : ouverture, filtres, deux affichages (planches, registre) et aperçu qui suit la souris.
import { gsap, ScrollTrigger, SplitText, reduceMotion, finePointer, initCommun, scrollToEl, pause } from './commun.js';

initCommun();

const list = document.querySelector('.fl-list');
const plates = [...list.querySelectorAll('.plate')];
const rows = [...list.querySelectorAll('.row')];
const platesBox = list.querySelector('.fl-plates');
const register = list.querySelector('.fl-register');
const empty = list.querySelector('.fl-empty');
const count = list.querySelector('.fl-bar__count span');

// Ouverture : l'image se pose, le titre monte lettre à lettre, les chiffres défilent
if (!reduceMotion) {
  const chars = SplitText.create('.fl-hero__title', { type: 'lines,chars', mask: 'lines' }).chars;
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.fl-hero__media img', { scale: 1.18, duration: 2.6, ease: 'power3.out' }, 0)
    .from(chars, { yPercent: 105, duration: 1.4, stagger: 0.05 }, 0.2)
    .from('.fl-hero .crumbs, .fl-hero .kicker, .fl-hero__lead', { autoAlpha: 0, y: 20, duration: 1.2, stagger: 0.1 }, 0.6)
    .from('.fl-hero__stats div', { autoAlpha: 0, y: 24, duration: 1.2, stagger: 0.1 }, 0.9);
  document.querySelectorAll('.fl-hero__stats dd').forEach((dd) => {
    const end = Number(dd.textContent);
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, delay: 1, ease: 'power3.out', onUpdate: () => { dd.textContent = Math.round(o.v); } });
  });
  gsap.to('.fl-hero__media img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.fl-hero', start: 'top top', end: 'bottom top', scrub: true } });
}

await pause();

// Planches : l'image se dévoile de bas en haut, puis la plaque de chantier
if (!reduceMotion) {
  plates.forEach((plate) => {
    const media = plate.querySelector('.plate__media');
    const tl = gsap.timeline({ scrollTrigger: { trigger: plate, start: 'top 78%' } });
    tl.from(media, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' })
      .from(media.querySelector('img'), { scale: 1.3, duration: 2, ease: 'expo.out' }, 0.3)
      .from(plate.querySelectorAll('.plate__body > *'), { autoAlpha: 0, y: 26, duration: 1, ease: 'power3.out', stagger: 0.08 }, 0.5);
    gsap.fromTo(media.querySelector('img'), { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: plate, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

await pause();

// Filtres : un seul actif à la fois, le compteur suit
const tests = {
  tous: () => true,
  vente: (el) => el.dataset.vente === 'true',
  location: (el) => el.dataset.location === 'true',
  voile: (el) => el.dataset.type === 'voile',
  grand: (el) => Number(el.dataset.longueur) > 40,
};
const filterButtons = [...list.querySelectorAll('[data-filter]')];
filterButtons.forEach((btn) => btn.addEventListener('click', () => {
  filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  const test = tests[btn.dataset.filter];
  let n = 0;
  plates.forEach((el, i) => {
    const ok = test(el);
    el.hidden = !ok;
    rows[i].hidden = !ok;
    if (ok) n++;
  });
  count.textContent = n;
  empty.hidden = n > 0;
  // Les yachts affichés réapparaissent en douceur, et la liste revient sous la barre
  const shown = (list.dataset.view === 'plates' ? plates : rows).filter((el) => !el.hidden);
  if (!reduceMotion) gsap.fromTo(shown, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, clearProps: 'transform,opacity,visibility' });
  // Les animations d'apparition des planches déjà dépassées restent jouées
  plates.forEach((el) => { if (!el.hidden) gsap.set(el.querySelectorAll('.plate__media, .plate__media img, .plate__body > *'), { clearProps: 'all' }); });
  ScrollTrigger.refresh();
  if (list.getBoundingClientRect().top < 0) scrollToEl(list, -1);
}));

// Planches ou registre
const viewButtons = [...list.querySelectorAll('[data-view]')].filter((b) => b.tagName === 'BUTTON');
viewButtons.forEach((btn) => btn.addEventListener('click', () => {
  const view = btn.dataset.view;
  if (list.dataset.view === view) return;
  viewButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  list.dataset.view = view;
  platesBox.hidden = view !== 'plates';
  register.hidden = view !== 'register';
  const shown = (view === 'plates' ? plates : rows).filter((el) => !el.hidden);
  if (view === 'plates') plates.forEach((el) => gsap.set(el.querySelectorAll('.plate__media, .plate__media img, .plate__body > *'), { clearProps: 'all' }));
  if (!reduceMotion) gsap.fromTo(shown, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.05, clearProps: 'transform,opacity,visibility' });
  ScrollTrigger.refresh();
}));

// Registre : l'image du yacht survolé suit la souris
const preview = list.querySelector('.fl-preview');
if (finePointer && preview) {
  const pimg = preview.querySelector('img');
  const px = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3.out' });
  const py = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3.out' });
  register.addEventListener('pointermove', (e) => { px(e.clientX + 24); py(e.clientY - preview.offsetHeight / 2); });
  rows.forEach((row) => {
    row.addEventListener('pointerenter', () => { pimg.src = row.dataset.preview; preview.classList.add('is-on'); });
    row.addEventListener('pointerleave', () => preview.classList.remove('is-on'));
  });
}
