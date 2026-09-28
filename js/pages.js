// Pages « Acheter », « Louer » et « Méthode » : ouverture, manifeste, escales et étapes à image collée, budget de location,
// coût annuel d'un yacht, questions fréquentes. Les formulaires sont gérés par commun.js.
import { gsap, ScrollTrigger, SplitText, reduceMotion, initCommun, scrollToEl, pause, revele, aLEcran } from './commun.js';
import { t as tr, euros, nombre } from './i18n.js';

initCommun();

const eur = euros;

// Ouverture : l'image se pose, le titre monte lettre à lettre
if (!reduceMotion) {
  const chars = SplitText.create('.pg-hero__title', { aria: 'hidden', type: 'lines,chars', mask: 'lines' }).chars;
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.pg-hero__media img', { scale: 1.18, duration: 2.6, ease: 'power3.out' }, 0)
    .from(chars, { yPercent: 105, duration: 1.4, stagger: 0.045 }, 0.2)
    .from('.pg-hero .crumbs, .pg-hero .kicker, .pg-hero__lead, .pg-hero__actions', { autoAlpha: 0, y: 20, duration: 1.2, stagger: 0.1 }, 0.6)
    .from('.pg-hero__stats div', { autoAlpha: 0, y: 24, duration: 1.2, stagger: 0.1 }, 0.9);
  gsap.to('.pg-hero__media img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.pg-hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Manifeste : les mots s'allument au défilement
  document.querySelectorAll('[data-words]').forEach((el) => {
    const words = SplitText.create(el, { aria: 'hidden', type: 'words', wordsClass: 'word' }).words;
    gsap.fromTo(words, { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });

  gsap.utils.toArray('.pg-card, .pg-faq__item, .pg-budget__tool, .pg-cost__tool, .pg-sell__media, .pg-sell__text > *, .ct-way, .ct-office, .ct-other__list li').forEach((el) => {
    revele(el, { autoAlpha: 0, y: 28, duration: 1.1, ease: 'power3.out' }, el, 90);
  });
}

await pause();

// Méthode : les lignes de rhumb se tracent, les chapitres montent, les images glissent, le carnet se compte
const rhumb = document.querySelector('.mt-rhumb');
if (rhumb && !reduceMotion) {
  const lines = [...rhumb.querySelectorAll('.mt-rhumb__lines line')];
  lines.forEach((l) => { const n = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value); l.style.strokeDasharray = n; l.style.strokeDashoffset = n; });
  gsap.timeline({ scrollTrigger: { trigger: rhumb, start: 'top 80%', end: 'bottom 40%', scrub: 1 } })
    .to(lines, { strokeDashoffset: 0, ease: 'none', stagger: { each: 0.01, from: 'random' } }, 0)
    .from(rhumb.querySelectorAll('.mt-rhumb__dots circle'), { scale: 0, transformOrigin: 'center', stagger: 0.03 }, 0)
    .from(rhumb.querySelector('.mt-rhumb__rose'), { rotate: -90, scale: 0.4, autoAlpha: 0, transformOrigin: 'center', ease: 'power2.out' }, 0.2);
}
await pause();
if (!reduceMotion) {
  document.querySelectorAll('.mt-chapter').forEach((ch) => {
    const im = ch.querySelector('.mt-chapter__media img');
    gsap.fromTo(im, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true } });
    revele(ch.querySelector('.mt-chapter__media'), { clipPath: 'inset(12% 12% 12% 12%)', duration: 1.6, ease: 'expo.out' }, ch, 75);
    revele(ch.querySelectorAll('.mt-chapter__num, .mt-chapter__when, .mt-chapter__title, .mt-chapter__text, .mt-chapter__lists li'), { autoAlpha: 0, y: 26, duration: 1.1, ease: 'power3.out', stagger: 0.05 }, ch, 70);
  });
  gsap.utils.toArray('.mt-carnet__panel, .mt-engage__list li, .mt-office').forEach((el) => {
    revele(el, { autoAlpha: 0, y: 28, duration: 1.1, ease: 'power3.out' }, el, 90);
  });
  const count = document.querySelector('.mt-carnet__count [data-count]');
  if (count) {
    const o = { n: 0 };
    aLEcran(count, () => gsap.to(o, { n: Number(count.dataset.count), duration: 2, ease: 'power2.out', onUpdate: () => { count.textContent = Math.round(o.n); } }), 85);
  }
}

// Escales de la semaine et étapes : l'élément lu au centre de l'écran s'éclaire, son image apparaît
function follow(items, images, onChange) {
  items.forEach((item, k) => {
    ScrollTrigger.create({
      trigger: item, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => {
        if (!self.isActive) return;
        items.forEach((it, j) => it.classList.toggle('is-active', j === k));
        images.forEach((im, j) => im.classList.toggle('is-active', j === k));
        onChange?.(k);
      },
    });
  });
}
await pause();
const days = [...document.querySelectorAll('.pg-day')];
if (days.length) {
  const n = document.querySelector('.pg-route__n');
  const place = document.querySelector('.pg-route__place');
  follow(days, [...document.querySelectorAll('.pg-route__visual img')], (k) => {
    n.textContent = String(k + 1).padStart(2, '0');
    place.innerHTML = days[k].querySelector('.pg-day__where').innerHTML;
  });
}
document.querySelectorAll('.pg-steps').forEach((block) => {
  follow([...block.querySelectorAll('.pg-step')], [...block.querySelectorAll('.pg-steps__visual img')]);
});

await pause();

// Budget d'une location : tarif, avance sur frais (30 %), TVA (20 %) et total
const budget = document.querySelector('.pg-budget__tool');
if (budget) {
  const yachts = JSON.parse(budget.dataset.yachts);
  const out = Object.fromEntries([...budget.querySelectorAll('[data-b]')].map((el) => [el.dataset.b, el]));
  const shown = { tarif: 0, apa: 0, tva: 0, total: 0 };
  const update = () => {
    const y = yachts[Number(budget.querySelector('input[name="b-yacht"]:checked').value)];
    const tarif = y[budget.querySelector('input[name="b-saison"]:checked').value];
    const target = { tarif, apa: tarif * 0.3, tva: tarif * 0.2, total: tarif * 1.5 };
    gsap.to(shown, {
      ...target, duration: reduceMotion ? 0 : 0.8, ease: 'power3.out', overwrite: true,
      onUpdate: () => ['tarif', 'apa', 'tva', 'total'].forEach((k) => { out[k].textContent = eur(shown[k]); }),
    });
  };
  budget.addEventListener('change', update);
  update();
}

// Coût annuel d'un yacht : environ 8 à 12 % de sa valeur, réparti par poste
const cost = document.querySelector('.pg-cost__tool');
if (cost) {
  const range = cost.querySelector('input[type="range"]');
  const price = cost.querySelector('.pg-cost__price');
  const min = cost.querySelector('[data-c="min"]');
  const max = cost.querySelector('[data-c="max"]');
  const bars = [...cost.querySelectorAll('.pg-cost__bars li')];
  const update = () => {
    const v = Number(range.value) * 1e6;
    price.textContent = tr('{v} M€', { v: range.value });
    min.textContent = eur(v * 0.08);
    max.textContent = eur(v * 0.12);
    bars.forEach((li) => {
      const part = Number(li.dataset.part);
      li.querySelector('em').textContent = tr('{v} k€', { v: nombre(v * 0.1 * part / 1000) });
      li.querySelector('b').style.transform = `scaleX(${part / 0.4})`;
    });
  };
  range.addEventListener('input', update);
  update();
}

await pause();

// Questions fréquentes : ouverture en douceur
if (!reduceMotion) {
  document.querySelectorAll('.pg-faq__item').forEach((d) => {
    const body = d.querySelector('.pg-faq__a');
    d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        gsap.to(body, { height: 0, duration: 0.45, ease: 'power2.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
      } else {
        d.open = true;
        gsap.from(body, { height: 0, duration: 0.55, ease: 'power3.out', onComplete: () => ScrollTrigger.refresh() });
      }
    });
  });
}

await pause();

// Nos eaux : le mouillage lu s'allume sur la carte, avec la route depuis Saint-Tropez. Un clic sur un point y mène.
const chart = document.querySelector('.ne-chart');
if (chart) {
  const spots = [...document.querySelectorAll('.ne-spot')];
  const pins = [...chart.querySelectorAll('.ne-pin')];
  const route = chart.querySelector('.ne-chart__route');
  const routes = JSON.parse(route.dataset.routes);
  const home = pins.findIndex((p) => p.classList.contains('is-home'));
  const cap = { n: chart.querySelector('.ne-chart__n'), name: chart.querySelector('.ne-chart__name'), miles: chart.querySelector('.ne-chart__miles') };
  const show = (k) => {
    pins.forEach((p, j) => p.classList.toggle('is-active', j === k));
    spots.forEach((s, j) => s.classList.toggle('is-active', j === k));
    cap.n.textContent = String(k + 1).padStart(2, '0');
    cap.name.innerHTML = spots[k].querySelector('.ne-spot__name').innerHTML;
    cap.miles.textContent = spots[k].dataset.miles;
    gsap.to(route, { opacity: 0, duration: reduceMotion ? 0 : 0.2, overwrite: true, onComplete: () => {
      route.setAttribute('d', routes[k]);
      if (k !== home) gsap.to(route, { opacity: 0.9, duration: reduceMotion ? 0 : 0.5 });
    } });
  };
  spots.forEach((s, k) => ScrollTrigger.create({ trigger: s, start: 'top 60%', end: 'bottom 60%', onToggle: (self) => self.isActive && show(k) }));
  pins.forEach((p, k) => {
    p.setAttribute('tabindex', '0');
    p.setAttribute('role', 'link');
    p.setAttribute('aria-label', spots[k].querySelector('.ne-spot__name').textContent);
    const go = () => {
      const narrow = window.matchMedia('(max-width: 959px)').matches;
      scrollToEl(spots[k], narrow ? chart.offsetHeight : -window.innerHeight * 0.1);
      show(k);
    };
    p.addEventListener('click', go);
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  if (!reduceMotion) {
    revele(chart.querySelectorAll('.ne-chart__land'), { opacity: 0, duration: 1.4, ease: 'power2.out', stagger: 0.08 }, chart, 80);
    revele(pins, { scale: 0, transformOrigin: 'center', duration: 0.8, ease: 'back.out(2)', stagger: 0.06 }, chart, 70);
    gsap.utils.toArray('.ne-winds__list li, .ne-seasons__list li, .ne-care__facts div').forEach((el) => {
      revele(el, { autoAlpha: 0, y: 28, duration: 1.1, ease: 'power3.out' }, el, 90);
    });
  }
}
