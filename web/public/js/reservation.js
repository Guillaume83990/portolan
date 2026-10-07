// Réservation en ligne, sur la fiche d'un yacht à louer.
// 1. Le visiteur choisit son jour d'embarquement, puis son jour de retour : seules les dates libres sont possibles,
//    et la durée minimale dépend de la saison. 2. Le prix s'affiche au prorata des nuits de basse et de haute saison,
//    avec l'échéancier (acompte, solde, avance sur frais) tiré des réglages de la base.
// 3. Il précise l'heure, le port et le nombre d'invités, accepte les conditions, puis réserve. L'envoi passe par le
//    serveur de l'application (/api/reservations) : session du client, protection anti-robot (Turnstile), preuve
//    d'acceptation (version du contrat, heure, adresse IP) ; la base vérifie tout, recalcule le prix et bloque les dates.
//    Sans session, le visiteur passe par Mon espace (connexion ou création de compte) et revient ici, dates conservées.
// Les dates prises sont relues en direct dans Supabase quand le calendrier approche de l'écran.
import { db } from './supabase.js';
import { t, lang, locale, euros } from './i18n.js';
import { scrollToEl, reduceMotion, gsap } from './commun.js';

const iso = (d) => d.toISOString().slice(0, 10);
const date = (s) => new Date(`${s}T12:00:00Z`);
const plus = (s, n) => { const d = date(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const ecart = (a, b) => Math.round((date(b) - date(a)) / 864e5);
const ESPACE = { fr: 'espace', en: 'my-account', de: 'mein-konto', it: 'area-riservata' };
const MEMOIRE = 'portolan-reservation'; // réservation en cours, gardée le temps de la connexion (24 heures au plus)

// Messages renvoyés par le serveur et la base (fonction public.reserver)
function messageReservation(code) {
  const codes = {
    dates_indisponibles: t('Ces dates viennent d\'être prises. Le calendrier est à jour : choisissez d\'autres dates.'),
    sejour_trop_court: t('Le séjour est trop court pour cette période.'),
    hors_saison: t('Ces dates sont en dehors de la saison.'),
    date_trop_proche: t('Pour un départ aussi proche, appelez directement votre courtier.'),
    trop_de_demandes: t('Vous avez déjà deux demandes en attente. Votre courtier vous répond avant d\'en ajouter une troisième.'),
    mode_demo: t('Le compte de démonstration ne peut pas réserver.'),
    invites_invalides: t('Le nombre d\'invités dépasse la capacité du yacht.'),
    heure_invalide: t('Choisissez une heure d\'embarquement dans la liste.'),
    port_invalide: t('Choisissez un port dans la liste.'),
    connexion_requise: t('Connectez-vous pour envoyer votre réservation.'),
    yacht_non_louable: t('Ce yacht n\'est plus proposé à la location.'),
    contrat: t('Merci de cocher votre accord avec les conditions de location.'),
    robot: t('La vérification anti-robot a échoué. Réessayez dans un instant.'),
  };
  return codes[code] || t('Une erreur est survenue. Réessayez dans un instant.');
}

// Session de l'application (cookies) et clé publique Turnstile, lues sur le serveur
async function etatSession() {
  try {
    const r = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
    return r.ok ? await r.json() : { connecte: false };
  } catch { return { connecte: false }; }
}

// Protection anti-robot Cloudflare Turnstile : invisible, sauf si Cloudflare a un doute
let chargementTurnstile = null;
function turnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  chargementTurnstile ??= new Promise((ok, ko) => {
    window.onTurnstileResa = () => ok(window.turnstile);
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileResa';
    s.async = true; s.onerror = ko;
    document.head.appendChild(s);
  });
  return chargementTurnstile;
}

export function initReservation() {
  const resa = document.querySelector('.resa');
  if (!resa) return;
  const R = JSON.parse(resa.dataset.regles);
  const P = R.paiement || { acompte: 50, apa: 30, tva: 20, soldeJours: 30 };
  const basse = Number(resa.dataset.basse);
  const haute = Number(resa.dataset.haute);
  const slug = resa.dataset.yacht;
  const nom = resa.dataset.nom;
  const jours = [...resa.querySelectorAll('.jour')];
  const parDate = new Map(jours.map((j) => [j.dataset.d, j]));
  const aide = resa.querySelector('.resa__aide');
  const consigne = resa.querySelector('.resa__consigne');
  const num = resa.querySelector('.resa__num');
  const panneau = resa.querySelector('.resa__panneau');
  const form = resa.querySelector('.resa__form');
  const note = form.querySelector('.note');
  const merci = resa.querySelector('.resa__merci');
  const zoneRobot = form.querySelector('.resa__robot');

  // Mois, jours de la semaine et libellés accessibles, dans la langue de la page
  const fMois = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const fJour = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const fLong = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const fDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  resa.querySelectorAll('[data-mois]').forEach((h) => { h.textContent = fMois.format(date(`${h.dataset.mois}-01`)); });
  resa.querySelectorAll('.dow').forEach((li) => { li.textContent = fJour.format(new Date(Date.UTC(2024, 0, 1 + Number(li.dataset.dow)))).replace('.', '').slice(0, 2); });

  // Les jours passés (et les deux prochains) ne peuvent plus servir d'embarquement
  const aujourdhui = iso(new Date());
  const premierPossible = plus(aujourdhui, 2);
  jours.forEach((j) => { if (j.dataset.d < premierPossible) j.disabled = true; });

  const nuitLibre = (d) => {
    const j = parDate.get(d);
    return Boolean(j) && d < R.fin && d >= premierPossible && !j.disabled && !j.classList.contains('is-pris') && !j.classList.contains('is-option');
  };
  const etiqueter = () => jours.forEach((j) => {
    const etat = j.classList.contains('is-pris') ? t('réservé') : j.classList.contains('is-option') ? t('en option') : j.disabled ? t('indisponible') : t('disponible');
    j.setAttribute('aria-label', `${fLong.format(date(j.dataset.d))}, ${etat}${j.classList.contains('is-haute') ? `, ${t('haute saison')}` : ''}`);
  });

  let debut = null;
  let fin = null;
  let survol = null;
  let limite = null; // dernier jour de retour possible pour l'embarquement choisi

  const nuitsHaute = (a, b) => Math.max(0, ecart(a > R.haute[0] ? a : R.haute[0], b < R.haute[1] ? b : R.haute[1]));
  // Même calcul que la base (public.prix_sejour) : chaque partie arrondie à la dizaine d'euros
  const prix = (a, b) => {
    const n = ecart(a, b);
    const nh = nuitsHaute(a, b);
    const mb = Math.round(basse * (n - nh) / 7 / 10) * 10;
    const mh = Math.round(haute * nh / 7 / 10) * 10;
    return { n, nh, nb: n - nh, mb, mh, montant: mb + mh };
  };
  // Même échéancier que la base (public.echeancier) : départ proche, tout est réglé en une fois
  const echeancier = (montant, a) => {
    const soldeLe = plus(a, -P.soldeJours);
    const tout = soldeLe <= aujourdhui;
    const acompte = tout ? montant : Math.round(montant * P.acompte / 100);
    return { tout, soldeLe, acompte, solde: montant - acompte, apa: Math.round(montant * P.apa / 100), tva: montant - montant / (1 + P.tva / 100) };
  };

  function dessiner() {
    const bout = fin || survol;
    jours.forEach((j) => {
      const d = j.dataset.d;
      j.classList.toggle('is-debut', d === debut);
      j.classList.toggle('is-fin', d === fin);
      j.classList.toggle('is-plage', Boolean(debut && bout && d > debut && d < bout));
      j.classList.toggle('is-possible', Boolean(debut && !fin && d > debut && d <= limite));
      j.setAttribute('aria-pressed', String(d === debut || d === fin));
    });
  }

  function etape(k) {
    num.textContent = `0${k}`;
    consigne.textContent = [t("Choisissez votre jour d'embarquement"), t('Choisissez votre jour de retour'), t('Précisez votre embarquement')][k - 1];
  }
  const signaler = (texte, erreur = false) => { aide.textContent = texte; aide.classList.toggle('is-erreur', erreur); };

  function choisir(d, { defiler = true } = {}) {
    signaler('');
    merci.hidden = true;
    if (!debut || fin || d <= debut) {
      if (!nuitLibre(d)) { signaler(t("Ce jour n'est pas disponible pour embarquer."), true); return false; }
      debut = d; fin = null; survol = null; panneau.hidden = true;
      // Retour possible jusqu'à la première nuit déjà prise (ce jour-là compris : on débarque le matin)
      limite = d;
      while (limite < R.fin && nuitLibre(limite)) limite = plus(limite, 1);
      etape(2);
      const p = prix(d, plus(d, 1));
      signaler(t('Embarquement le {jour}. {n} nuits au moins en {saison}.', { jour: fLong.format(date(d)), n: p.nh ? R.min.haute : R.min.basse, saison: p.nh ? t('haute saison') : t('basse saison') }));
      dessiner();
      return true;
    }
    if (d > limite) { signaler(t('Ces dates chevauchent une autre réservation. Choisissez un retour plus tôt.'), true); return false; }
    const p = prix(debut, d);
    const min = p.nh ? R.min.haute : R.min.basse;
    if (p.n < min) { signaler(t('{n} nuits au moins pour ces dates.', { n: min }), true); return false; }
    fin = d;
    dessiner();
    etape(3);
    remplirPanneau();
    panneau.hidden = false;
    if (!reduceMotion) gsap.fromTo(panneau, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    if (defiler) scrollToEl(panneau, 24);
    preparerRobot();
    return true;
  }

  function remplirPanneau() {
    const p = prix(debut, fin);
    const e = echeancier(p.montant, debut);
    resa.querySelector('.resa__dates').textContent = t('Du {a} à {h} au {b}', { a: fLong.format(date(debut)), h: form.heure.value, b: fLong.format(date(fin)) });
    resa.querySelector('.resa__nuits').textContent = t('{n} nuits à bord de {yacht}, au départ de {port}', { n: p.n, yacht: nom, port: form.port.value });
    const lignes = [];
    if (p.nb) lignes.push([t('Basse saison, {n} nuits', { n: p.nb }), euros(p.mb)]);
    if (p.nh) lignes.push([t('Haute saison, {n} nuits', { n: p.nh }), euros(p.mh)]);
    const ligne = ([a, b], cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${a}</dt><dd>${b}</dd></div>`;
    const paiement = e.tout
      ? [ligne([t('Paiement en une fois après validation par votre courtier (départ proche)'), euros(e.acompte)])]
      : [ligne([t('Acompte ({taux} %), après validation par votre courtier', { taux: P.acompte }), euros(e.acompte)]),
        ligne([t('Solde, à régler avant le {date}', { date: fDate.format(date(e.soldeLe)) }), euros(e.solde)])];
    resa.querySelector('.resa__prix').innerHTML = `${lignes.map((l) => ligne(l)).join('')}
      ${ligne([t('Location, équipage compris'), euros(p.montant)], 'is-total')}
      ${ligne([t('dont TVA ({taux} %)', { taux: P.tva }), euros(e.tva)])}
      ${paiement.join('')}
      ${ligne([t('Avance sur frais de croisière ({taux} %), avec le solde', { taux: P.apa }), euros(e.apa)])}`;
  }

  // Clics et survol du calendrier
  const grille = resa.querySelector('.resa__mois');
  grille.addEventListener('click', (e) => {
    const j = e.target.closest('.jour');
    if (j && !j.disabled) choisir(j.dataset.d);
  });
  grille.addEventListener('pointerover', (e) => {
    const j = e.target.closest('.jour');
    if (!debut || fin || !j) return;
    const d = j.dataset.d;
    const s = d > debut && d <= limite ? d : null;
    if (s !== survol) { survol = s; dessiner(); }
  });
  grille.addEventListener('pointerleave', () => { if (survol) { survol = null; dessiner(); } });

  form.addEventListener('change', () => { if (debut && fin) remplirPanneau(); });
  resa.querySelector('.resa__changer').addEventListener('click', () => {
    debut = null; fin = null; survol = null; limite = null;
    panneau.hidden = true; etape(1); signaler(''); dessiner();
    scrollToEl(grille, 80);
  });

  // Anti-robot : préparé à l'ouverture du panneau, un jeton par envoi
  let robot = null;
  async function preparerRobot() {
    if (robot || !zoneRobot) return;
    robot = { id: null, jeton: null, attente: [], desactive: false };
    const s = await etatSession();
    if (!s.turnstile) { robot.desactive = true; return; }
    try {
      const w = await turnstile();
      robot.id = w.render(zoneRobot, {
        sitekey: s.turnstile, language: lang, appearance: 'interaction-only', size: 'flexible',
        callback: (j) => { robot.jeton = j; robot.attente.splice(0).forEach((f) => f(j)); },
        'expired-callback': () => { robot.jeton = null; },
        'error-callback': () => { robot.attente.splice(0).forEach((f) => f(null)); },
      });
    } catch { robot.desactive = true; }
  }
  async function jetonRobot() {
    await preparerRobot();
    if (robot.desactive) return null;
    if (robot.jeton) return robot.jeton;
    return new Promise((ok) => { robot.attente.push(ok); setTimeout(() => ok(null), 15000); });
  }
  const nouveauJeton = () => { if (robot?.id && window.turnstile) { robot.jeton = null; window.turnstile.reset(robot.id); } };

  // Sans session : la réservation est gardée, le visiteur se connecte dans Mon espace puis revient ici
  function versConnexion() {
    try {
      localStorage.setItem(MEMOIRE, JSON.stringify({
        slug, debut, fin, heure: form.heure.value, port: form.port.value, invites: form.invites.value,
        message: form.message.value, accepte: form.accepte.checked, le: Date.now(),
      }));
    } catch { /* stockage indisponible : les dates seront à choisir de nouveau */ }
    location.assign(`/${lang}/${ESPACE[lang] || 'espace'}?retour=${encodeURIComponent(location.pathname)}`);
  }

  // Envoi : le serveur vérifie la session, l'accord et l'anti-robot ; la base vérifie, calcule et enregistre
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!debut || !fin) return;
    const bouton = form.querySelector('[type="submit"]');
    const dire = (texte, erreur = false) => { note.textContent = texte; note.classList.toggle('is-erreur', erreur); };
    if (!form.accepte.checked) { dire(messageReservation('contrat'), true); form.accepte.focus(); return; }
    bouton.disabled = true;
    dire(t('Envoi de votre demande…'));
    try {
      const s = await etatSession();
      if (!s.connecte) { dire(t('Connexion à votre espace…')); versConnexion(); return; }
      const reponse = await fetch('/api/reservations', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yacht: slug, debut, fin, heure: form.heure.value, port: form.port.value, invites: Number(form.invites.value),
          message: form.message.value.trim(), langue: lang, accepte: true, captcha: await jetonRobot(),
        }),
      });
      const data = await reponse.json().catch(() => ({ ok: false, code: 'erreur' }));
      nouveauJeton();
      if (!data.ok) {
        if (data.code === 'connexion_requise') { versConnexion(); return; }
        dire(messageReservation(data.code), true);
        if (data.code === 'dates_indisponibles') actualiser().catch(() => {});
        return;
      }
      for (let d = debut; d < fin; d = plus(d, 1)) parDate.get(d)?.classList.add('is-option');
      merci.querySelector('.resa__merci-titre').textContent = t('Merci. Votre demande {ref} est bien reçue.', { ref: data.reference });
      merci.querySelector('.resa__merci-texte').textContent = t('{yacht}, du {a} au {b}, {montant}. Ces dates sont bloquées pour vous : votre courtier vous confirme la réservation sous 24 heures, par e-mail.', { yacht: nom, a: fLong.format(date(debut)), b: fLong.format(date(fin)), montant: euros(data.montant) });
      debut = null; fin = null; limite = null;
      form.message.value = '';
      form.accepte.checked = false;
      dire('');
      panneau.hidden = true;
      etape(1);
      etiqueter();
      dessiner();
      merci.hidden = false;
      merci.focus({ preventScroll: true });
      scrollToEl(merci, 24);
    } catch {
      dire(t('Connexion impossible. Vérifiez votre accès à Internet.'), true);
    } finally {
      bouton.disabled = false;
    }
  });

  // Retour de Mon espace après connexion : la réservation en cours est reprise là où elle s'était arrêtée
  function reprendre(m) {
    try { localStorage.removeItem(MEMOIRE); } catch { /* rien */ }
    if (!m || m.slug !== slug || Date.now() - m.le > 864e5) return;
    for (const k of ['heure', 'port', 'invites', 'message']) if (m[k] != null && form[k]) form[k].value = m[k];
    form.accepte.checked = Boolean(m.accepte);
    debut = null; fin = null;
    if (!choisir(m.debut, { defiler: false }) || !choisir(m.fin)) {
      signaler(t("Ces dates ne sont plus disponibles : choisissez-en d'autres."), true);
      scrollToEl(grille, 80);
    }
  }

  // Dates prises, relues en direct
  async function actualiser() {
    const sb = await db();
    const { data, error } = await sb.rpc('disponibilites', { p_yacht: slug });
    if (error) throw error;
    jours.forEach((j) => j.classList.remove('is-pris', 'is-option'));
    for (const p of data) for (let d = p.debut; d < p.fin; d = plus(d, 1)) parDate.get(d)?.classList.add(p.etat === 'option' ? 'is-option' : 'is-pris');
    etiqueter();
    dessiner();
  }

  etiqueter();
  let enCours = null;
  try { enCours = JSON.parse(localStorage.getItem(MEMOIRE)); } catch { /* rien à reprendre */ }
  if (enCours?.slug === slug) {
    // Retour après connexion : dates relues tout de suite, puis réservation reprise
    actualiser().catch(() => {}).finally(() => reprendre(enCours));
  } else {
    new IntersectionObserver((entrees, obs) => {
      if (!entrees[0].isIntersecting) return;
      obs.disconnect();
      actualiser().catch(() => {}); // sans réseau, l'état de la construction reste affiché
    }, { rootMargin: '600px 0px' }).observe(resa);
  }
}
