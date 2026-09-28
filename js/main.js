import { initMenu } from './menu.js';
import { t as tr } from './i18n.js';
import { initLienCompte } from './compte.js';
import { enregistrerDemande } from './demandes.js';
import { revele, aLEcran } from './apparition.js';


const { gsap, ScrollTrigger, SplitText, Lenis } = window;
gsap.registerPlugin(ScrollTrigger, SplitText);

// La visite commence toujours au début, même après un rechargement
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const reduceMotion =window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('.header');

// Défilement doux
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

initMenu(lenis);
initLienCompte();

// Le démarrage est découpé en tranches : entre deux sections, le navigateur reprend la main (affichage, clics).
// Sur un téléphone moyen, cela évite une longue tâche bloquante au chargement.
const pause = () => new Promise((r) => (window.scheduler?.yield ? window.scheduler.yield().then(r) : setTimeout(r, 0)));

function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { duration: 1.6 });
  else window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const id = link.getAttribute('href');
  if (id === '#' || link.closest('.route')) return;
  link.addEventListener('click', (e) => {
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    scrollToY(target.getBoundingClientRect().top + window.scrollY);
  });
});

// Sélecteur de langue
const langButton = document.querySelector('.lang__current');
const langList = document.getElementById('lang-list');
langButton.addEventListener('click', () => {
  const open = langButton.getAttribute('aria-expanded') === 'true';
  langButton.setAttribute('aria-expanded', String(!open));
  langList.hidden = open;
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang')) { langButton.setAttribute('aria-expanded', 'false'); langList.hidden = true; }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !langList.hidden) { langList.hidden = true; langButton.setAttribute('aria-expanded', 'false'); langButton.focus(); }
});

// En-tête opaque une fois la visite terminée
ScrollTrigger.create({
  trigger: '#maison',
  start: 'top 80px',
  end: 'max',
  onToggle: (self) => header.classList.toggle('is-solid', self.isActive),
});

// Lignes de rhumb : les rayons d'une rose des vents, comme sur les portulans
function drawRhumbs(group, centers, radius, count = 32) {
  const ns = 'http://www.w3.org/2000/svg';
  centers.forEach(([cx, cy]) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', cx + Math.cos(angle) * radius);
      line.setAttribute('y2', cy + Math.sin(angle) * radius);
      group.appendChild(line);
    }
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', 14);
    group.appendChild(circle);
  });
  return group;
}

// La visite : plan-séquence continu, piloté par le scroll
const film = document.querySelector('.film');
const beats = [...film.querySelectorAll('.shot')];
const routeLinks = [...film.querySelectorAll('.route a')];
const loader = film.querySelector('.film__loader');
// Sur téléphone, des images plus légères (le décodage coûte cher à chaque nouvelle image)
const small = window.matchMedia('(max-width: 760px)').matches;
// Part du scroll pendant laquelle la carte ancienne brûle, avant que la caméra ne bouge
const CARTE = [0.02, 0.1];

function supportsWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl'); } catch { return false; }
}

// Sans WebGL, sans séquence ou avec mouvement réduit : chaque étape devient une section avec son image
function staticFilm() {
  film.classList.add('is-static');
  beats.forEach((el) => {
    const img = document.createElement('img');
    img.className = 'shot__img';
    img.src = el.dataset.poster;
    img.alt = '';
    img.loading = 'lazy';
    el.prepend(img);
  });
  document.body.classList.remove('is-loading');
}

function filmY(p) {
  return film.offsetTop + (film.offsetHeight - window.innerHeight) * p;
}

// Instruments de bord, pièce par pièce : cap, position, altitude puis pont
const HUD = {
  'K1-drone': { cap: 128, lat: 43.2204, lon: 6.6719, alt: 300 },
  'K2-trois-quarts': { cap: 64, lat: 43.2197, lon: 6.6702, alt: 60 },
  'K3-poupe': { cap: 2, lat: 43.2199, lon: 6.6710, alt: 3 },
  'K4-pont-arriere': { cap: 0, lat: 43.2199, lon: 6.6711, deck: 'Principal' },
  'K5-salon': { cap: 0, lat: 43.2200, lon: 6.6711, deck: 'Principal' },
  'K6-salle-a-manger': { cap: 0, lat: 43.2200, lon: 6.6711, deck: 'Principal' },
  'K7-bar': { cap: 172, lat: 43.2200, lon: 6.6711, deck: 'Principal' },
  'K8-coursive': { cap: 8, lat: 43.2200, lon: 6.6712, deck: 'Principal' },
  'K9-suite': { cap: 0, lat: 43.2201, lon: 6.6712, deck: 'Principal' },
  'K10-salle-de-bain': { cap: 270, lat: 43.2201, lon: 6.6712, deck: 'Principal' },
  'K10b-escalier': { cap: 90, lat: 43.2201, lon: 6.6712, deck: 'Supérieur' },
  'K11-pont-superieur-jacuzzi': { cap: 352, lat: 43.2201, lon: 6.6713, deck: 'Supérieur' },
};
const CHAPTERS = [['K4-pont-arriere', 'I'], ['K8-coursive', 'II'], ['K10b-escalier', 'III'], [null, 'IV']];

function dms(v, pos, neg) {
  const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = Math.floor(((a - d) * 60 - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″ ${v >= 0 ? pos : neg}`;
}

function buildDial(group) {
  const ns = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const long = i % 9 === 0;
    const line = document.createElementNS(ns, 'line');
    const r1 = long ? 36 : 40;
    line.setAttribute('x1', Math.sin(a) * r1); line.setAttribute('y1', -Math.cos(a) * r1);
    line.setAttribute('x2', Math.sin(a) * 44); line.setAttribute('y2', -Math.cos(a) * 44);
    group.appendChild(line);
  }
  const ring = document.createElementNS(ns, 'circle');
  ring.setAttribute('r', 46);
  group.appendChild(ring);
  const n = document.createElementNS(ns, 'text');
  n.setAttribute('y', -24); n.setAttribute('text-anchor', 'middle'); n.textContent = 'N';
  group.appendChild(n);
}

async function startFilm() {
  // La séquence et la place de chaque pièce (image clé) dans la séquence
  let manifest;
  try {
    const res = await fetch(`../assets/plan-sequence/${small ? 'manifest-m' : 'manifest'}.json`);
    if (!res.ok) throw new Error(res.status);
    manifest = await res.json();
  } catch {
    staticFilm();
    return;
  }
  const { count, stops } = manifest;
  const frameOfKey = Object.fromEntries(stops.map((s) => [s.key, s.frame]));
  const segment = stops.length > 1 ? stops[1].frame - stops[0].frame : count;
  const pOfFrame = (f) => CARTE[1] + ((f - 1) / (count - 1)) * (1 - CARTE[1]);

  const canvas = film.querySelector('.film__canvas');
  const rhumbs = drawRhumbs(film.querySelector('.rhumbs__lines'), [[500, 500], [150, 180], [860, 820]], 900, 32);
  const rhumbLines = rhumbs.querySelectorAll('line');
  gsap.set('.rhumbs', { opacity: 0 });
  buildDial(film.querySelector('.hud__dial'));

  const first = beats[0];
  const split = SplitText.create(first.querySelector('.chapter__title'), { aria: 'hidden', type: 'lines', mask: 'lines' });
  gsap.set(first, { autoAlpha: 1 });
  // Le texte d'ouverture reste visible dès le premier affichage (seule une petite montée l'anime)
  gsap.set(first.querySelector('.chapter__kicker'), { autoAlpha: 0, y: 16 });
  gsap.set(first.querySelector('.chapter__body'), { y: 16 });
  gsap.set(['.film__hint', '.route', '.hud'], { autoAlpha: 0 });

  // Le titre monte tout de suite, sans attendre les images du film : c'est lui que Google mesure
  // comme « plus grand élément affiché » (LCP). La carte brûle ensuite derrière lui.
  let introDone = false;
  gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.05, onComplete: () => { introDone = true; } })
    .to(first.querySelectorAll('.chapter__kicker, .chapter__body'), { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12 }, 0.1);

  let sequence;
  try {
    const { createPlanSequence } = await import('./plan-sequence.js');
    sequence = createPlanSequence(canvas, {
      count,
      dir: small ? '../assets/plan-sequence/m/' : '../assets/plan-sequence/d/',
      carte: `../assets/plan-sequence/carte${small ? '-m' : ''}.webp`,
      carteRange: CARTE,
      // Le film démarre dès les premières images ; la suite se charge ensuite, sans gêner l'affichage de la page
      startAt: small ? 8 : 12,
      sobre: true,
      onLoad: (f) => loader.style.setProperty('--progress', Math.min(1, f * 4).toFixed(2)),
    });
    await sequence.ready;
  } catch (err) {
    console.error('La visite n\'a pas pu démarrer.', err);
    split.revert();
    staticFilm();
    return;
  }

  loader.classList.add('is-done');
  document.body.classList.remove('is-loading');
  sequence.start();
  if (new URLSearchParams(location.search).has('debug')) window.portolanVisite = sequence;

  // Ouverture : les rhumbs rayonnent et la carte apparaît à l'encre (le titre est déjà là)
  // Sur téléphone, les 96 rayons apparaissent en fondu (les tracer un à un coûtait trop au processeur)
  const ouverture = gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to('.rhumbs', { opacity: 0.4, duration: small ? 1.2 : 0.6 }, 0);
  if (!small) {
    ouverture.from(rhumbLines, {
      attr: { x2: (i, el) => el.getAttribute('x1'), y2: (i, el) => el.getAttribute('y1') },
      duration: 2.2, ease: 'power2.inOut', stagger: 0.004,
    }, 0);
  }
  ouverture
    .call(() => sequence.intro(2600), null, 0.3)
    .to('.rhumbs', { opacity: 0.16, duration: 1.4 }, 2.2)
    .to(['.film__hint', '.route'], { autoAlpha: 1, duration: 1 }, 2.8)
    .set('.hud', { autoAlpha: 1, opacity: 0 }, 2.8);

  ScrollTrigger.create({
    trigger: film,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => sequence.setProgress(self.progress),
    onToggle: (self) => sequence.setVisible(self.isActive || self.progress < 1),
  });
  gsap.to('.rhumbs__lines', { opacity: 0, scrollTrigger: { trigger: film, start: 'top top', end: '+=900', scrub: true } });

  // Chaque texte s'affiche autour de l'arrivée dans sa pièce
  const data = beats.map((el) => {
    const key = el.dataset.key;
    let from = Number(el.dataset.from), to = Number(el.dataset.to);
    if (key && frameOfKey[key]) {
      const f = frameOfKey[key];
      from = key === stops[0].key ? CARTE[1] + 0.004 : pOfFrame(Math.max(1, f - segment * 0.3));
      to = el.classList.contains('shot--final') ? 1.05 : pOfFrame(Math.min(count, f + segment * 0.45));
    }
    return { el, text: el.querySelector('.chapter__text'), from, to };
  });
  // Une pièce absente de la séquence (plan pas encore calculé) est repoussée hors d'atteinte
  const stopP = routeLinks.map((a) => (a.dataset.key ? (frameOfKey[a.dataset.key] ? pOfFrame(frameOfKey[a.dataset.key]) : 2) : Number(a.dataset.p)));
  const hud = Object.fromEntries([...film.querySelectorAll('[data-hud]')].map((el) => [el.dataset.hud, el]));
  const needle = film.querySelector('.hud__dial');
  const hudEl = film.querySelector('.hud');
  const hint = film.querySelector('.film__hint');
  const keys = stops.map((s) => s.key);
  let currentStep = -1;

  sequence.onUpdate((p, f) => {
    data.forEach((b, i) => {
      if (i === 0 && !introDone) return;
      const edge = 0.012;
      const o = i === 0
        ? gsap.utils.clamp(0, 1, (b.to - p) / edge)
        : Math.min(gsap.utils.clamp(0, 1, (p - b.from) / edge), gsap.utils.clamp(0, 1, (b.to - p) / edge));
      b.el.style.opacity = o;
      b.el.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      b.el.classList.toggle('is-active', o > 0.5);
      b.text.style.transform = `translateY(${(1 - o) * 22}px)`;
    });

    // Instruments : interpolation entre les deux pièces qui encadrent l'image affichée
    const kf = gsap.utils.clamp(0, keys.length - 1, (f - stops[0].frame) / segment);
    const k = Math.min(Math.floor(kf), keys.length - 2);
    const t = kf - k;
    const a = HUD[keys[k]] || HUD['K1-drone'], b = HUD[keys[k + 1]] || a;
    const cap = a.cap + (((b.cap - a.cap + 540) % 360) - 180) * t;
    needle.style.transform = `rotate(${-cap}deg)`;
    hud.cap.textContent = `${String(Math.round((cap + 360) % 360)).padStart(3, '0')}°`;
    hud.pos.textContent = `${dms(a.lat + (b.lat - a.lat) * t, 'N', 'S')} · ${dms(a.lon + (b.lon - a.lon) * t, 'E', 'O')}`;
    const near = t < 0.5 ? a : b;
    if (near.deck) {
      hud.altLabel.textContent = tr('Pont');
      hud.alt.textContent = tr(near.deck);
    } else {
      hud.altLabel.textContent = tr('Altitude');
      hud.alt.textContent = `${Math.round(a.alt + ((b.alt ?? a.alt) - a.alt) * t)} m`;
    }
    const chapter = CHAPTERS.find(([until]) => !until || kf < (keys.includes(until) ? keys.indexOf(until) - 0.5 : Infinity));
    hud.num.textContent = chapter[1];
    // À l'arrivée sur le pont supérieur, les instruments s'effacent pour laisser la place au texte final
    // Pendant le titre d'ouverture, les instruments restent effacés (ils chevaucheraient le titre)
    hudEl.style.opacity = introDone ? Math.min(gsap.utils.clamp(0, 1, (p - 0.07) / 0.025), 1 - gsap.utils.clamp(0, 1, (p - 0.95) / 0.02)) : '';
    if (introDone) hint.style.opacity = 1 - gsap.utils.clamp(0, 1, p / 0.02);

    let step = 0;
    stopP.forEach((s, i) => { if (p >= s - 0.01) step = i; });
    if (step !== currentStep) {
      currentStep = step;
      routeLinks.forEach((link, i) => {
        link.classList.toggle('is-current', i === step);
        if (i === step) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
      });
    }
  });

  routeLinks.forEach((link, i) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = filmY(stopP[i]);
      if (lenis) lenis.scrollTo(target, { duration: 2.4 });
      else scrollToY(target);
    });
  });
  ScrollTrigger.refresh();
}

if (reduceMotion || !supportsWebGL()) staticFilm();
else startFilm();
await pause();

// ---------------------------------------------------------------------------------------------
// Sections de la page. Les deux sections épinglées (la flotte, nos eaux) sont créées EN PREMIER :
// ScrollTrigger calcule les positions dans l'ordre de création, et tout ce qui est en dessous
// doit connaître la hauteur ajoutée par les épinglages. Sans cela, les animations du bas de page
// se déclenchent en décalé.
// ---------------------------------------------------------------------------------------------

// La flotte, « le sextant » : les noms des yachts sont gravés sur un limbe gradué qui tourne au fil du défilement.
// Le yacht aligné sur l'alidade s'affiche en grand, révélé par un balayage de phare autour du centre du limbe.
const sextant = document.querySelector('.sextant');
if (sextant) {
  const ns = 'http://www.w3.org/2000/svg';
  const frames = gsap.utils.toArray('.sextant__frame', sextant);
  const cards = gsap.utils.toArray('.sextant__card', sextant);
  const framesBox = sextant.querySelector('.sextant__frames');
  const list = sextant.querySelector('.sextant__names');
  const svg = sextant.querySelector('.sextant__limb');
  const scale = svg.querySelector('.sextant__scale');
  const alidade = svg.querySelector('.sextant__alidade');
  const current = sextant.querySelector('.sextant__current');
  const bar = sextant.querySelector('.sextant__bar span');
  const dossier = sextant.querySelector('.sextant__dossier');
  const fiche = sextant.querySelector('.sextant__fiche');
  const n = cards.length;
  const nameOf = (i) => cards[i].querySelector('.sextant__name').textContent.trim();

  let geo = null;
  let pos = 0;
  let shown = 0;
  let z = 1;
  let st = null;

  // Les noms du limbe sont des boutons, construits depuis les fiches
  const names = cards.map((card, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = card.querySelector('.sextant__name').innerHTML;
    btn.setAttribute('aria-label', `Voir ${nameOf(i)}`);
    btn.addEventListener('click', () => goTo(i));
    li.append(btn);
    list.append(li);
    return { li, btn };
  });
  names[0].btn.setAttribute('aria-current', 'true');
  gsap.set(cards.slice(1), { autoAlpha: 0 });
  gsap.set(frames[0], { zIndex: 1 });

  const svgEl = (tag, attrs, parent) => {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    parent.append(el);
    return el;
  };

  // Géométrie : sur grand écran le limbe est à droite et les noms rayonnent ; sur téléphone on le voit d'en haut
  function layout() {
    const W = sextant.clientWidth;
    const H = sextant.clientHeight;
    const radial = W >= 960 || W > H * 1.25;
    sextant.classList.toggle('is-radial', radial);
    sextant.classList.toggle('is-tangent', !radial);
    geo = radial
      ? { W, H, radial, R: Math.min(W * 0.2, H * 0.34), cx: W * 0.44, cy: H * 0.52, base: 0, step: 15, gap: 24 }
      : { W, H, radial, R: W * 1.05, cx: W / 2, cy: H * 0.64 + W * 1.05, base: -90, step: 22, gap: 12 };
    const { cx, cy, R, base } = geo;
    sextant.style.setProperty('--card-top', `${cy - R + 52}px`);
    // Les graduations s'estompent loin de l'alidade
    sextant.style.setProperty('--fade-a', `${cx - R}px`);
    sextant.style.setProperty('--fade-b', `${cx + R * 0.45}px`);
    // Le balayage part de l'alidade et tourne autour du centre du limbe
    framesBox.style.setProperty('--mx', `${cx - framesBox.offsetLeft}px`);
    framesBox.style.setProperty('--my', `${cy - framesBox.offsetTop}px`);
    framesBox.style.setProperty('--from', `${base + 90}deg`);

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    scale.replaceChildren();
    alidade.replaceChildren();
    svgEl('circle', { class: 'ring', cx, cy, r: R }, scale);
    for (let d = 0; d < 360; d++) {
      const a = (d * Math.PI) / 180;
      const len = d % 10 === 0 ? 16 : d % 5 === 0 ? 10 : 5;
      const cls = d % 10 === 0 ? 'tick tick--10' : d % 5 === 0 ? 'tick tick--5' : 'tick';
      svgEl('line', { class: cls, x1: cx + Math.cos(a) * R, y1: cy + Math.sin(a) * R, x2: cx + Math.cos(a) * (R - len), y2: cy + Math.sin(a) * (R - len) }, scale);
      if (d % 10 === 0) {
        const tx = cx + Math.cos(a) * (R - 30);
        const ty = cy + Math.sin(a) * (R - 30);
        svgEl('text', { x: tx, y: ty, 'text-anchor': 'middle', 'dominant-baseline': 'middle', transform: `rotate(${d + 90} ${tx} ${ty})` }, scale).textContent = d;
      }
    }
    // L'alidade : le bras depuis le pivot et l'index qui désigne le yacht choisi
    const ux = Math.cos((base * Math.PI) / 180);
    const uy = Math.sin((base * Math.PI) / 180);
    if (radial) {
      svgEl('line', { class: 'arm', x1: cx, y1: cy, x2: cx + ux * R, y2: cy + uy * R }, alidade);
      svgEl('circle', { class: 'pivot', cx, cy, r: 5 }, alidade);
    }
    const p = (r, side) => `${cx + ux * r - uy * side} ${cy + uy * r + ux * side}`;
    svgEl('path', { class: 'index', d: `M${p(R + 1, 0)} L${p(R + 11, 5)} L${p(R + 11, -5)}Z` }, alidade);
    render();
  }

  function render() {
    if (!geo) return;
    const { cx, cy, R, base, step, gap, radial } = geo;
    scale.setAttribute('transform', `rotate(${-pos * step} ${cx} ${cy})`);
    names.forEach(({ li }, i) => {
      const d = Math.abs(i - pos);
      const o = Math.max(0, 1 - d * (radial ? 0.3 : 0.45));
      li.style.transform = `translate(${cx}px, ${cy}px) rotate(${base + (i - pos) * step}deg) translateX(${R + gap}px) rotate(${-base}deg)`;
      li.style.setProperty('--s', (1 - 0.42 * Math.min(d, 1)).toFixed(3));
      li.style.opacity = o.toFixed(3);
      li.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    });
  }

  function show(i) {
    if (i === shown) return;
    const prev = shown;
    shown = i;
    current.textContent = String(i + 1).padStart(2, '0');
    // Le dossier demandé suit le yacht affiché
    dossier.dataset.project = cards[i].dataset.project;
    dossier.dataset.yacht = nameOf(i);
    fiche.href = `flotte/${cards[i].dataset.slug}/`;
    names.forEach(({ btn }, k) => (k === i ? btn.setAttribute('aria-current', 'true') : btn.removeAttribute('aria-current')));
    if (reduceMotion) {
      gsap.set(cards, { autoAlpha: (k) => (k === i ? 1 : 0) });
      gsap.set(frames[i], { zIndex: ++z, '--sweep': '390deg' });
      return;
    }
    gsap.to(cards[prev], { autoAlpha: 0, y: -14, duration: 0.35, ease: 'power2.in', overwrite: true });
    gsap.fromTo(cards[i], { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.2, ease: 'power3.out', overwrite: true });
    // L'image attend que le limbe s'arrête sur un yacht : on ne balaie pas les yachts dépassés en chemin
    clearTimeout(sweepTimer);
    sweepTimer = setTimeout(() => sweep(i), 160);
  }

  // Le balayage du phare révèle l'image du yacht choisi
  let sweepTimer = 0;
  let lit = 0;
  function sweep(i) {
    if (i === lit) return;
    lit = i;
    const frame = frames[i];
    gsap.set(frame, { zIndex: ++z });
    gsap.fromTo(frame, { '--sweep': '-30deg' }, { '--sweep': '390deg', duration: 1.3, ease: 'power2.inOut', overwrite: true });
    gsap.fromTo(frame.querySelector('img'), { scale: 1.12 }, { scale: 1, duration: 1.9, ease: 'power3.out', overwrite: true });
  }

  function goTo(i) {
    const k = gsap.utils.clamp(0, n - 1, i);
    scrollToY(st.start + (st.end - st.start) * (k / (n - 1)));
  }

  // Le limbe tourne avec le défilement (lissé), et se cale toujours sur un yacht
  const state = { p: 0 };
  const tween = gsap.to(state, {
    p: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: sextant,
      start: 'top top',
      end: () => `+=${window.innerHeight * (n - 1) * 0.7}`,
      pin: true,
      scrub: reduceMotion ? true : 0.9,
      snap: { snapTo: 1 / (n - 1), inertia: false, duration: { min: 0.3, max: 0.8 }, delay: 0.08, ease: 'power2.inOut' },
      invalidateOnRefresh: true,
    },
    onUpdate: () => {
      pos = state.p * (n - 1);
      render();
      show(Math.round(pos));
      bar.style.transform = `scaleX(${(pos + 1) / n})`;
    },
  });
  st = tween.scrollTrigger;

  // Clavier : les flèches passent d'un yacht à l'autre
  list.addEventListener('keydown', (e) => {
    const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const k = gsap.utils.clamp(0, n - 1, shown + dir);
    goTo(k);
    names[k].btn.focus({ preventScroll: true });
  });

  // Glisser : vers le haut à la souris, vers la gauche au doigt, pour passer au yacht suivant
  let start = null;
  framesBox.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse' }; });
  window.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const d = start.touch ? (Math.abs(dx) > Math.abs(dy) ? -dx : 0) : -dy;
    start = null;
    if (Math.abs(d) > 40) goTo(shown + Math.sign(d));
  });

  layout();
  new ResizeObserver(layout).observe(sextant);
}

await pause();

// Nos eaux : épinglée, la route se trace, un bateau la suit, le port traversé s'affiche
const chart = document.querySelector('.chart');
if (chart) {
  drawRhumbs(chart.querySelector('.chart__rhumbs'), [[60, 350], [965, 86]], 700, 24);
  const route = chart.querySelector('.chart__route');
  const boat = chart.querySelector('.chart__boat');
  const length = route.getTotalLength();
  const box = chart.viewBox.baseVal;
  const ports = [...document.querySelectorAll('.ports li')];
  const miles = document.querySelector('.coast__miles-n');
  const portName = document.querySelector('.coast__port');
  const portNote = document.querySelector('.coast__note');

  // Chaque port est posé sur la route, à sa fraction du trajet (data-t)
  ports.forEach((li) => {
    const pt = route.getPointAtLength(Number(li.dataset.t) * length);
    li.style.setProperty('--x', `${(pt.x / box.width) * 100}%`);
    li.style.setProperty('--y', `${(pt.y / box.height) * 100}%`);
  });
  route.style.strokeDasharray = length;

  let here = -1;
  const sail = (p) => {
    route.style.strokeDashoffset = length * (1 - p);
    const pt = route.getPointAtLength(p * length);
    boat.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
    miles.textContent = Math.round(p * 60);
    let k = 0;
    ports.forEach((li, i) => {
      const lit = p >= Number(li.dataset.t) - 0.005;
      li.classList.toggle('is-lit', lit);
      if (lit) k = i;
    });
    if (k !== here) {
      here = k;
      ports.forEach((li, i) => li.classList.toggle('is-here', i === k));
      portName.textContent = ports[k].querySelector('strong').textContent;
      portNote.textContent = ports[k].dataset.note;
      if (!reduceMotion) gsap.fromTo([portName, portNote], { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06, overwrite: true });
    }
  };
  sail(0);
  ScrollTrigger.create({
    trigger: '.coast__pin',
    start: 'top top',
    end: () => `+=${window.innerHeight * 1.6}`,
    pin: true,
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => sail(gsap.utils.clamp(0, 1, (self.progress - 0.05) / 0.9)),
  });
  if (!reduceMotion) {
    gsap.to('.chart__rhumbs', { rotate: 6, ease: 'none', scrollTrigger: { trigger: '.coast__pin', start: 'top top', end: () => `+=${window.innerHeight * 1.6}`, scrub: true } });
  }
}

// ---------------------------------------------------------------------------------------------
// Animations d'apparition, dans l'ordre de la page
// ---------------------------------------------------------------------------------------------
await pause();
if (!reduceMotion) {
  // Filets des surtitres
  document.querySelectorAll('.kicker').forEach((k) => {
    if (k.closest('.film')) return;
    revele(k, { autoAlpha: 0, x: -12, duration: 1, ease: 'power3.out' }, k, 90);
  });

  // Titres : lignes qui montent dans leur masque, avec une légère rotation
  document.querySelectorAll('.section-title, .contact__title, .offer__title, .offmarket__title').forEach((title) => {
    SplitText.create(title, { aria: 'hidden', type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => revele(self.lines, { yPercent: 110, rotate: 2.5, transformOrigin: 'left top', duration: 1.4, ease: 'expo.out', stagger: 0.12 }, title, 88),
    });
  });

  await pause();

  // Paragraphes et liens : montée douce
  gsap.utils.toArray('[data-reveal], .offmarket__text, .offmarket__fields, .contact__lead, .contact__promises li, .contact__wa, .lead').forEach((el) => {
    revele(el, { autoAlpha: 0, y: 28, duration: 1.2, ease: 'power3.out' }, el, 90);
  });

  // La maison : les mots s'allument un à un au fil du défilement
  const statement = document.querySelector('[data-words]');
  if (statement) {
    const words = SplitText.create(statement, { aria: 'hidden', type: 'words', wordsClass: 'word' }).words;
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  }

  await pause();

  // L'image de la maison s'ouvre, d'une capsule jusqu'au plein écran
  const grow = document.querySelector('[data-grow]');
  if (grow) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: grow, start: 'top bottom', end: 'bottom bottom', scrub: 1 } });
    tl.to(grow, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut' }, 0)
      .to(grow.querySelector('img'), { scale: 1, ease: 'power2.inOut' }, 0)
      .from(grow.querySelector('figcaption'), { autoAlpha: 0, y: 20, duration: 0.3 }, 0.7);
  }

  // Acheter, louer : les panneaux s'ouvrent comme des rideaux qui s'écartent
  gsap.utils.toArray('.offer').forEach((offer, i) => {
    const offres = document.querySelector('.offers');
    revele(offer.querySelector('.offer__media'), { clipPath: i === 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)', duration: 1.6, ease: 'expo.inOut' }, offres, 65);
    revele(offer.querySelectorAll('.offer__text > *:not(.offer__title)'), { autoAlpha: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.6 }, offres, 65);
  });

  // Chiffres : ils défilent jusqu'à leur valeur
  gsap.utils.toArray('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix ? el.dataset.suffix.replace('&#8239;', ' ') : '';
    const obj = { v: 0 };
    aLEcran(el, () => gsap.to(obj, {
      v: end, duration: 2.2, ease: 'power3.out',
      onUpdate: () => { el.textContent = `${Math.round(obj.v)}${suffix}`; },
    }), 90);
  });

  await pause();

  // Ruban des ports : défilement continu, accéléré et incliné par la vitesse du scroll
  const track = document.querySelector('.marquee__track');
  if (track) {
    track.innerHTML += track.innerHTML;
    const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    const skew = gsap.quickTo(track, 'skewX', { duration: 0.6, ease: 'power3.out' });
    ScrollTrigger.create({
      trigger: '.marquee',
      onUpdate: (self) => {
        const v = self.getVelocity();
        loop.timeScale(1 + Math.min(Math.abs(v) / 400, 4) * Math.sign(v || 1));
        skew(gsap.utils.clamp(-8, 8, v / -300));
      },
    });
  }

  // Témoignage : les lignes montent une à une
  const quote = document.querySelector('.quote__text');
  if (quote) {
    SplitText.create(quote, { aria: 'hidden', type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: (self) => revele(self.lines, { yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: 0.1 }, quote, 85),
    });
    revele('.quote__rose', { rotate: -180, autoAlpha: 0, duration: 2, ease: 'expo.out' }, document.querySelector('.quote'), 80);
  }

  // Pied de page : le nom de la maison se révèle lettre par lettre
  const mark = document.querySelector('.footer__mark');
  if (mark) {
    const chars = SplitText.create(mark, { aria: 'hidden', type: 'chars' }).chars;
    revele(chars, { yPercent: 100, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.05 }, mark, 98);
  }
}

await pause();

// Méthode : l'étape survolée (ou atteinte au défilement) change l'image par un volet
const steps = [...document.querySelectorAll('.method__step')];
const visuals = [...document.querySelectorAll('.method__visual img')];
let activeStep = 0;
function showStep(i) {
  if (i === activeStep) return;
  const prev = activeStep;
  activeStep = i;
  steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
  if (reduceMotion) { visuals.forEach((v, k) => { v.style.clipPath = k === i ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)'; }); return; }
  gsap.set(visuals[i], { zIndex: 2 });
  gsap.set(visuals[prev], { zIndex: 1 });
  gsap.fromTo(visuals[i], { clipPath: 'inset(100% 0 0 0)', scale: 1.2 }, { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 1.1, ease: 'expo.out', overwrite: true });
}
steps.forEach((step, i) => {
  step.addEventListener('mouseenter', () => showStep(i));
  ScrollTrigger.create({ trigger: step, start: 'top 60%', end: 'bottom 60%', onToggle: (self) => { if (self.isActive) showStep(i); } });
});

// Hors marché : inscription à la sélection confidentielle (démonstration)
const offmarket = document.querySelector('.offmarket');
if (offmarket) {
  offmarket.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = offmarket.querySelector('input');
    const note = offmarket.querySelector('.offmarket__note');
    const ok = input.value.trim() && input.checkValidity();
    input.setAttribute('aria-invalid', String(!ok));
    if (!ok) { note.textContent = tr("Merci d'indiquer une adresse e-mail valide."); input.focus(); return; }
    try {
      await enregistrerDemande(offmarket, 'hors-marche');
      note.textContent = tr('Merci. Vous recevrez la prochaine sélection lundi.');
      input.value = '';
    } catch {
      note.textContent = tr("L'envoi n'a pas abouti. Réessayez, ou écrivez-nous sur WhatsApp.");
    }
  });
}

await pause();

// Contact : formulaire de qualification en trois étapes
const lead = document.querySelector('.lead');
if (lead) {
  const stepsEls = [...lead.querySelectorAll('.lead__step')];
  const next = lead.querySelector('.lead__next');
  const back = lead.querySelector('.lead__back');
  const error = lead.querySelector('.lead__error');
  const done = lead.querySelector('.lead__done');
  const bar = lead.querySelector('.lead__progress span');
  const label = lead.querySelector('.lead__step-label');
  let step = 0;
  const value = (name) => lead.querySelector(`[name="${name}"]:checked`)?.value || lead.querySelector(`[name="${name}"]:not([type="radio"])`)?.value?.trim() || '';
  const project = () => value('projet');

  // Les critères demandés dépendent du projet choisi
  const filterGroups = () => {
    stepsEls[1].querySelectorAll('.lead__group[data-for]').forEach((g) => { g.hidden = !g.dataset.for.split(' ').includes(project()); });
  };
  const required = { acheter: 'budget', louer: 'periode', vendre: 'port' };
  const labels = { budget: tr("Merci d'indiquer un budget."), periode: tr("Merci d'indiquer une période."), port: tr("Merci d'indiquer le port d'attache.") };

  function check() {
    lead.querySelectorAll('[aria-invalid]').forEach((f) => f.removeAttribute('aria-invalid'));
    if (step === 0 && !project()) return tr('Merci de choisir votre projet.');
    if (step === 1) {
      const key = required[project()];
      if (!value(key)) return labels[key];
    }
    if (step === 2) {
      const nom = lead.querySelector('#l-nom');
      const mail = lead.querySelector('#l-mail');
      if (!nom.value.trim()) { nom.setAttribute('aria-invalid', 'true'); nom.focus(); return tr("Merci d'indiquer votre nom."); }
      if (!mail.value.trim() || !mail.checkValidity()) { mail.setAttribute('aria-invalid', 'true'); mail.focus(); return tr("Merci d'indiquer une adresse e-mail valide."); }
      if (!lead.querySelector('[name="consentement"]').checked) return tr('Merci de cocher votre accord pour être recontacté.');
    }
    return '';
  }

  function go(to) {
    const from = stepsEls[step];
    const target = to < stepsEls.length ? stepsEls[to] : done;
    const dir = to > step ? 1 : -1;
    step = to;
    from.hidden = true;
    target.hidden = false;
    if (!reduceMotion) gsap.fromTo(target, { autoAlpha: 0, x: 30 * dir }, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power3.out' });
    const finished = to >= stepsEls.length;
    bar.style.transform = `scaleX(${finished ? 1 : (to + 1) / 3})`;
    label.hidden = finished;
    lead.querySelector('.lead__step-n').textContent = to + 1;
    lead.querySelector('.lead__step-name').textContent = finished ? '' : stepsEls[to].dataset.name;
    back.hidden = to === 0 || finished;
    next.hidden = finished;
    next.textContent = to === 2 ? tr('Envoyer ma demande') : tr('Continuer');
    if (finished) {
      const nom = lead.querySelector('#l-nom').value.trim().split(' ')[0];
      done.querySelector('.lead__done-name').textContent = nom ? `, ${nom}` : '';
      done.querySelector('.lead__done-via').textContent = ` ${value('rappel') === 'e-mail' ? tr('par e-mail') : value('rappel') === 'WhatsApp' ? tr('sur WhatsApp') : tr('par téléphone')}`;
      done.focus();
    } else {
      target.querySelector('input, select')?.focus({ preventScroll: true });
    }
  }

  lead.addEventListener('change', (e) => {
    if (e.target.name === 'projet') { filterGroups(); error.textContent = ''; }
  });
  lead.addEventListener('submit', async (e) => {
    e.preventDefault();
    const problem = check();
    error.textContent = problem;
    if (problem) return;
    if (step === 0) filterGroups();
    // Dernière étape : la demande est enregistrée dans Supabase avant de remercier
    if (step === 2) {
      next.disabled = true;
      try {
        await enregistrerDemande(lead, `projet-${project()}`);
      } catch {
        error.textContent = tr("L'envoi n'a pas abouti. Réessayez, ou écrivez-nous sur WhatsApp.");
        return;
      } finally {
        next.disabled = false;
      }
    }
    go(step + 1);
  });
  back.addEventListener('click', () => { error.textContent = ''; go(step - 1); });
  filterGroups();

  // Boutons « Acheter ce yacht », « Demander le dossier »… : le projet est choisi d'avance,
  // le formulaire s'ouvre directement sur les critères, avec le nom du yacht noté
  const wanted = lead.querySelector('[name="yacht_vise"]');
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-project]');
    if (!link) return;
    const radio = lead.querySelector(`input[name="projet"][value="${link.dataset.project}"]`);
    if (!radio) return;
    radio.checked = true;
    wanted.value = link.dataset.yacht || '';
    stepsEls[1].querySelector('.lead__q').textContent = link.dataset.yacht ? tr('Vos critères pour {yacht}', { yacht: link.dataset.yacht }) : tr('Vos critères');
    filterGroups();
    error.textContent = '';
    if (step === 0) go(1);
  });
}

// Bulle WhatsApp : absente pendant la visite, elle apparaît dès la première section
const wa = document.querySelector('.wa');
if (wa) {
  // Elle s'efface dans la section contact, qui a son propre lien WhatsApp (et ne masque pas le formulaire)
  ScrollTrigger.create({ trigger: '#maison', start: 'top 70%', endTrigger: '#contact', end: 'top 85%', onToggle: (self) => wa.classList.toggle('is-on', self.isActive) });
}

// Curseur : une pastille laiton, qui devient « Voir » sur les éléments cliquables
const cursor = document.querySelector('.cursor');
if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
  const label = cursor.querySelector('span');
  const x = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3.out' });
  const y = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); cursor.classList.add('is-on'); }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  document.querySelectorAll('[data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-big'); });
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-big'));
  });
}

// Boutons aimantés : ils suivent légèrement la souris
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    const bx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
    const by = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      bx((e.clientX - r.left - r.width / 2) * 0.3);
      by((e.clientY - r.top - r.height / 2) * 0.3);
    });
    btn.addEventListener('pointerleave', () => { bx(0); by(0); });
  });
}

// Les positions sont recalculées une fois les polices et les images chargées (sinon : décalages)
document.fonts?.ready.then(() => ScrollTrigger.refresh());
if (document.readyState === 'complete') ScrollTrigger.refresh();
else window.addEventListener('load', () => ScrollTrigger.refresh());
