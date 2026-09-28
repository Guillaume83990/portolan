// Portolan : ce que partagent les pages intérieures (la flotte, les fiches).
// Défilement doux, en-tête, langue, curseur, boutons aimantés, apparitions et formulaires de démonstration.

import { initMenu } from './menu.js';
import { t as tr } from './i18n.js';
import { initLienCompte } from './compte.js';
import { enregistrerDemande } from './demandes.js';

export const { gsap, ScrollTrigger, SplitText, Lenis } = window;
gsap.registerPlugin(ScrollTrigger, SplitText);

// Rend la main au navigateur entre deux tranches de démarrage (évite les longues tâches au chargement)
export const pause = () => new Promise((r) => (window.scheduler?.yield ? window.scheduler.yield().then(r) : setTimeout(r, 0)));

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function scrollToY(y, duration = 1.6) {
  if (lenis) lenis.scrollTo(y, { duration });
  else window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
}

export function scrollToEl(el, offset = 0) {
  const header = document.querySelector('.header').offsetHeight;
  scrollToY(el.getBoundingClientRect().top + window.scrollY - header - offset);
}

export function initCommun() {
  initMenu(lenis);
  initLienCompte();

  // Ancres de la page : défilement doux, sous l'en-tête
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const id = link.getAttribute('href');
    if (id === '#' || id === '#contenu') return;
    link.addEventListener('click', (e) => {
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollToEl(target, 16);
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

  // En-tête opaque dès que l'on quitte l'image d'ouverture
  const header = document.querySelector('.header');
  // La bulle WhatsApp apparaît en même temps (à l'ouverture, elle masquerait les filtres)
  const wa = document.querySelector('.wa');
  ScrollTrigger.create({ start: 80, end: 'max', onToggle: (self) => { header.classList.toggle('is-solid', self.isActive); wa?.classList.toggle('is-on', self.isActive); } });

  // Curseur laiton, qui affiche une invite sur les images cliquables
  const cursor = document.querySelector('.cursor');
  if (cursor && finePointer && !reduceMotion) {
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

  // Boutons aimantés
  if (finePointer && !reduceMotion) {
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

  // Apparitions : surtitres, titres ligne à ligne, nom de la maison en pied de page (dans une tranche à part)
  if (!reduceMotion) pause().then(() => {
    document.querySelectorAll('main .kicker').forEach((k) => {
      if (k.closest('.fl-hero, .fi-hero')) return;
      gsap.from(k, { autoAlpha: 0, x: -12, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: k, start: 'top 90%' } });
    });
    document.querySelectorAll('main .section-title, .fi-brochure__title').forEach((title) => {
      SplitText.create(title, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110, rotate: 2.5, transformOrigin: 'left top', duration: 1.4, ease: 'expo.out', stagger: 0.12,
          scrollTrigger: { trigger: title, start: 'top 88%' },
        }),
      });
    });
    const mark = document.querySelector('.footer__mark');
    if (mark) {
      const chars = SplitText.create(mark, { type: 'chars' }).chars;
      gsap.from(chars, { yPercent: 100, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: mark, start: 'top 98%' } });
    }
  });

  initForms();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  if (document.readyState === 'complete') pause().then(() => ScrollTrigger.refresh());
  else window.addEventListener('load', () => ScrollTrigger.refresh());
}

// Formulaires (dossier, brochure, visite, contact, recherche…) : on vérifie les champs, on enregistre la demande
// dans Supabase (table des demandes, lue par le directeur), puis on remercie.
function initForms() {
  document.querySelectorAll('form.form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const note = form.querySelector('.form__note');
      const problem = check(form);
      if (problem) { note.textContent = problem; return; }
      const bouton = form.querySelector('[type="submit"]');
      if (bouton) bouton.disabled = true;
      try {
        await enregistrerDemande(form, form.classList.contains('fi-brochure__form') ? 'brochure' : undefined);
      } catch {
        note.textContent = tr("L'envoi n'a pas abouti. Réessayez, ou écrivez-nous sur WhatsApp.");
        if (bouton) bouton.disabled = false;
        return;
      }
      if (bouton) bouton.disabled = false;
      const prenom = (form.querySelector('[name="nom"]')?.value.trim().split(' ')[0]) || '';
      const yacht = form.dataset.yacht;
      note.textContent = form.classList.contains('fi-brochure__form')
        ? tr('Merci. La brochure de {yacht} vous parvient dans quelques minutes.', { yacht })
        : tr('Merci{prenom}. Un courtier vous répond sous 24 heures{yacht}.', { prenom: prenom ? `, ${prenom}` : '', yacht: yacht ? tr(' au sujet de {yacht}', { yacht }) : '' });
      form.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), textarea').forEach((f) => { f.value = ''; });
      form.querySelectorAll('input[type="checkbox"]').forEach((f) => { f.checked = false; });
    });
  });
}

function check(form) {
  form.querySelectorAll('[aria-invalid]').forEach((f) => f.removeAttribute('aria-invalid'));
  const radios = [...new Set([...form.querySelectorAll('input[type="radio"][required]')].map((r) => r.name))];
  for (const name of radios) {
    if (!form.querySelector(`input[name="${name}"]:checked`)) return tr('Merci de choisir votre projet.');
  }
  for (const f of form.querySelectorAll('input[required]:not([type="radio"]):not([type="checkbox"])')) {
    if (!f.value.trim() || !f.checkValidity()) {
      f.setAttribute('aria-invalid', 'true');
      f.focus();
      return f.type === 'email' ? tr("Merci d'indiquer une adresse e-mail valide.") : tr("Merci d'indiquer votre nom.");
    }
  }
  const consent = form.querySelector('input[type="checkbox"][required]');
  if (consent && !consent.checked) return tr('Merci de cocher votre accord pour être recontacté.');
  return '';
}
