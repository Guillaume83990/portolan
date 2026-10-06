// Visite à bord d'un yacht, en plein écran : le plan-séquence (Wan 2.2) se parcourt à la molette,
// au doigt ou au clavier. Chargé seulement quand le visiteur clique sur « Monter à bord ».
import { gsap, lenis, reduceMotion, scrollToEl } from './commun.js';
import { t as tr } from './i18n.js';
import { createPlanSequence } from './plan-sequence.js';

const small = window.matchMedia('(max-width: 760px)').matches;

export async function openTour(section) {
  const dir = section.dataset.dir;
  const yacht = section.dataset.yacht;
  const titles = JSON.parse(section.dataset.pieces);
  const louer = section.dataset.louer === 'true';

  const box = document.createElement('dialog');
  box.className = 'tour';
  box.setAttribute('aria-label', tr('Visite à bord de {yacht}', { yacht }));
  box.innerHTML = `
    <canvas class="tour__canvas" aria-hidden="true"></canvas>
    <div class="tour__veil" aria-hidden="true"></div>
    <header class="tour__head">
      <p class="tour__name"><em>${yacht}</em><span>${tr('Visite à bord')}</span></p>
      <button type="button" class="tour__close">${tr('Quitter la visite')}</button>
    </header>
    <div class="tour__loader" role="status"><span class="tour__loader-bar"></span><span class="tour__loader-text">${tr('Embarquement')}</span></div>
    <p class="tour__hint" aria-hidden="true">${small ? tr('Glissez pour avancer') : tr('Faites défiler pour avancer')}</p>
    <div class="tour__room" aria-live="polite"><p class="tour__count"></p><p class="tour__title"></p></div>
    <div class="tour__end" hidden>
      <p class="tour__end-title">${tr('{yacht} vous attend.', { yacht })}</p>
      <div class="tour__end-actions">
        <button type="button" class="btn btn--light" data-go="${louer ? 'location' : 'visite'}">${louer ? tr('Réserver en ligne') : tr('Organiser une visite')}</button>
        <button type="button" class="btn btn--ghost" data-go="dossier">${tr('Recevoir le dossier')}</button>
      </div>
    </div>
    <nav class="tour__route" aria-label="${tr('Étapes de la visite')}"><ol></ol></nav>
    <div class="tour__bar" aria-hidden="true"><span></span></div>`;
  document.body.append(box);
  box.showModal();
  lenis?.stop();
  document.documentElement.classList.add('is-touring');

  const q = (s) => box.querySelector(s);
  const loaderBar = q('.tour__loader-bar');
  let seq;
  let stops;
  try {
    const manifest = await (await fetch(`${dir}${small ? 'manifest-m' : 'manifest'}.json`)).json();
    stops = manifest.stops;
    seq = createPlanSequence(q('.tour__canvas'), {
      count: manifest.count,
      dir: `${dir}${small ? 'm' : 'd'}/`,
      startAt: 16,
      onLoad: (f) => { loaderBar.style.transform = `scaleX(${Math.min(1, f * 5)})`; },
    });
    await seq.ready;
  } catch (err) {
    console.error('La visite n\'a pas pu démarrer.', err);
    q('.tour__loader-text').textContent = tr("La visite n'a pas pu se charger. Retrouvez les photographies dans la galerie.");
    return;
  }
  q('.tour__loader').classList.add('is-done');
  seq.start();

  // Position de chaque étape dans la visite (0 à 1)
  const count = seq.count;
  const pOf = (frame) => (frame - 1) / (count - 1);
  const stopP = stops.map((s) => pOf(s.frame));
  const route = q('.tour__route ol');
  stops.forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><span>${titles[s.key] || ''}</span></button>`;
    li.querySelector('button').addEventListener('click', () => goTo(stopP[i], 2.2));
    route.append(li);
  });
  const routeButtons = [...route.querySelectorAll('button')];

  // La position voulue ; le lecteur glisse doucement jusqu'à elle
  const state = { p: 0 };
  let tween = null;
  const setP = (p) => { state.p = Math.min(1, Math.max(0, p)); seq.setProgress(state.p); };
  function goTo(p, duration = 1.4) {
    tween?.kill();
    tween = gsap.to(state, { p, duration: reduceMotion ? 0 : duration, ease: 'power2.inOut', onUpdate: () => setP(state.p) });
  }
  const nudge = (d) => { tween?.kill(); setP(state.p + d); };
  const perStep = 1 / Math.max(1, stops.length - 1);
  const hint = q('.tour__hint');
  const hideHint = () => hint.classList.add('is-gone');

  // Molette : environ 1 200 px de défilement par étape
  box.addEventListener('wheel', (e) => { e.preventDefault(); hideHint(); nudge((e.deltaY * perStep) / 1200); }, { passive: false });
  // Doigt : glisser vers le haut ou vers la gauche fait avancer
  let touch = null;
  box.addEventListener('touchstart', (e) => { touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  box.addEventListener('touchmove', (e) => {
    if (!touch) return;
    const t = e.touches[0];
    const dx = touch.x - t.clientX;
    const dy = touch.y - t.clientY;
    touch = { x: t.clientX, y: t.clientY };
    hideHint();
    nudge(((Math.abs(dx) > Math.abs(dy) ? dx : dy) * perStep) / (window.innerHeight * 0.9));
  }, { passive: true });
  // Clavier : étape suivante ou précédente
  box.addEventListener('keydown', (e) => {
    const k = stopP.findIndex((p) => p > state.p + 0.001);
    const cur = k < 0 ? stopP.length - 1 : k - 1;
    if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); hideHint(); goTo(stopP[Math.min(stopP.length - 1, cur + 1)]); }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goTo(stopP[Math.max(0, cur - (stopP[cur] >= state.p - 0.001 ? 1 : 0))]); }
  });

  // Titre de l'étape, route et barre suivent l'image réellement affichée
  const count2 = (i) => `${String(i + 1).padStart(2, '0')} / ${String(stops.length).padStart(2, '0')}`;
  const titleEl = q('.tour__title');
  const countEl = q('.tour__count');
  const bar = q('.tour__bar span');
  const end = q('.tour__end');
  let shown = -1;
  seq.onUpdate((p) => {
    bar.style.transform = `scaleX(${p})`;
    let k = 0;
    stopP.forEach((s, i) => { if (p >= s - perStep * 0.35) k = i; });
    if (k !== shown) {
      shown = k;
      titleEl.textContent = titles[stops[k].key] || '';
      countEl.textContent = count2(k);
      routeButtons.forEach((b, i) => (i === k ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
      if (!reduceMotion) gsap.fromTo([countEl, titleEl], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, overwrite: true });
    }
    const atEnd = p > 0.985;
    if (atEnd === end.hidden) {
      end.hidden = !atEnd;
      if (atEnd && !reduceMotion) gsap.fromTo(end, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' });
    }
  });
  setP(0);

  // Fermer : Échap, bouton, ou fin de visite vers la demande
  const close = () => {
    box.close();
  };
  box.addEventListener('close', () => {
    seq.setVisible(false);
    lenis?.start();
    document.documentElement.classList.remove('is-touring');
    box.remove();
    section.querySelector('.fi-tour__start').focus({ preventScroll: true });
  });
  q('.tour__close').addEventListener('click', close);
  end.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
    const intent = b.dataset.go;
    close();
    // Location : direction le calendrier de réservation en ligne
    if (intent === 'location' && document.getElementById('disponibilites')) { scrollToEl(document.getElementById('disponibilites'), 16); return; }
    const form = document.querySelector(`.fi-form input[name="demande"][value="${intent}"]`);
    if (form) { form.checked = true; form.dispatchEvent(new Event('change', { bubbles: true })); }
    scrollToEl(document.getElementById('demande'), 16);
  }));
}
