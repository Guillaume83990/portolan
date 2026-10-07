// Protection anti-robot Cloudflare Turnstile pour les formulaires du site (invisible, sauf si Cloudflare a un doute).
// La clé de site (publique) est donnée par le serveur de l'application (/api/session). Un jeton ne sert qu'une fois.
import { lang } from './i18n.js';

let cle = null;
let chargement = null;
const widgets = new Map(); // conteneur → { id, jeton, attente }

async function cleDeSite() {
  if (cle !== null) return cle;
  try {
    const r = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    cle = r.ok ? ((await r.json()).turnstile || '') : '';
  } catch { cle = ''; }
  return cle;
}

function turnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  chargement ??= new Promise((ok, ko) => {
    window.onTurnstileSite = () => ok(window.turnstile);
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileSite';
    s.async = true; s.onerror = ko;
    document.head.appendChild(s);
  });
  return chargement;
}

// Prépare le défi dans le formulaire (appelé dès que le visiteur commence à le remplir)
export async function preparerRobot(form) {
  if (widgets.has(form)) return widgets.get(form);
  const w = { id: null, jeton: null, attente: [], desactive: false };
  widgets.set(form, w);
  const k = await cleDeSite();
  if (!k) { w.desactive = true; return w; }
  try {
    const t = await turnstile();
    const zone = document.createElement('div');
    zone.className = 'robot';
    form.appendChild(zone);
    w.id = t.render(zone, {
      sitekey: k, language: lang, appearance: 'interaction-only', size: 'flexible',
      callback: (j) => { w.jeton = j; w.attente.splice(0).forEach((f) => f(j)); },
      'expired-callback': () => { w.jeton = null; },
      'error-callback': () => { w.attente.splice(0).forEach((f) => f(null)); },
    });
  } catch { w.desactive = true; }
  return w;
}

// Jeton pour l'envoi (15 secondes d'attente au plus), puis nouveau défi pour l'envoi suivant
export async function jetonRobot(form) {
  const w = await preparerRobot(form);
  if (w.desactive) return null;
  const j = w.jeton || await new Promise((ok) => { w.attente.push(ok); setTimeout(() => ok(null), 15000); });
  w.jeton = null;
  if (w.id && window.turnstile) window.turnstile.reset(w.id);
  return j;
}
