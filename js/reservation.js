// Réservation en ligne, sur la fiche d'un yacht à louer.
// 1. Le visiteur choisit son jour d'embarquement, puis son jour de retour : seules les dates libres sont possibles,
//    et la durée minimale dépend de la saison. 2. Le prix s'affiche au prorata des nuits de basse et de haute saison.
// 3. Il précise l'heure, le port et le nombre d'invités, puis réserve : connexion si besoin, puis la base vérifie tout,
//    recalcule le prix et bloque les dates (statut « en attente » jusqu'à la réponse du courtier).
// Les dates prises sont relues en direct dans Supabase quand le calendrier approche de l'écran.
import { db } from './supabase.js';
import { t, lang, locale, euros } from './i18n.js';
import { demanderConnexion, session, messageErreur } from './compte.js';
import { scrollToEl, reduceMotion, gsap } from './commun.js';

const iso = (d) => d.toISOString().slice(0, 10);
const date = (s) => new Date(`${s}T12:00:00Z`);
const plus = (s, n) => { const d = date(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const ecart = (a, b) => Math.round((date(b) - date(a)) / 864e5);

// Messages renvoyés par la base (fonction public.reserver)
function messageReservation(err) {
  const m = `${err?.message || ''}`;
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
  };
  const code = Object.keys(codes).find((c) => m.includes(c));
  return code ? codes[code] : messageErreur(err);
}

export function initReservation() {
  const resa = document.querySelector('.resa');
  if (!resa) return;
  const R = JSON.parse(resa.dataset.regles);
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

  // Mois, jours de la semaine et libellés accessibles, dans la langue de la page
  const fMois = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const fJour = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  const fLong = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  resa.querySelectorAll('[data-mois]').forEach((h) => { h.textContent = fMois.format(date(`${h.dataset.mois}-01`)); });
  resa.querySelectorAll('.dow').forEach((li) => { li.textContent = fJour.format(new Date(Date.UTC(2024, 0, 1 + Number(li.dataset.dow)))).replace('.', '').slice(0, 2); });

  // Les jours passés (et les deux prochains) ne peuvent plus servir d'embarquement
  const premierPossible = plus(iso(new Date()), 2);
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

  function choisir(d) {
    signaler('');
    merci.hidden = true;
    if (!debut || fin || d <= debut) {
      if (!nuitLibre(d)) { signaler(t("Ce jour n'est pas disponible pour embarquer."), true); return; }
      debut = d; fin = null; survol = null; panneau.hidden = true;
      // Retour possible jusqu'à la première nuit déjà prise (ce jour-là compris : on débarque le matin)
      limite = d;
      while (limite < R.fin && nuitLibre(limite)) limite = plus(limite, 1);
      etape(2);
      const p = prix(d, plus(d, 1));
      signaler(t('Embarquement le {jour}. {n} nuits au moins en {saison}.', { jour: fLong.format(date(d)), n: p.nh ? R.min.haute : R.min.basse, saison: p.nh ? t('haute saison') : t('basse saison') }));
      dessiner();
      return;
    }
    if (d > limite) { signaler(t('Ces dates chevauchent une autre réservation. Choisissez un retour plus tôt.'), true); return; }
    const p = prix(debut, d);
    const min = p.nh ? R.min.haute : R.min.basse;
    if (p.n < min) { signaler(t('{n} nuits au moins pour ces dates.', { n: min }), true); return; }
    fin = d;
    dessiner();
    etape(3);
    remplirPanneau();
    panneau.hidden = false;
    if (!reduceMotion) gsap.fromTo(panneau, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    scrollToEl(panneau, 24);
  }

  function remplirPanneau() {
    const p = prix(debut, fin);
    resa.querySelector('.resa__dates').textContent = t('Du {a} à {h} au {b}', { a: fLong.format(date(debut)), h: form.heure.value, b: fLong.format(date(fin)) });
    resa.querySelector('.resa__nuits').textContent = t('{n} nuits à bord de {yacht}, au départ de {port}', { n: p.n, yacht: nom, port: form.port.value });
    const lignes = [];
    if (p.nb) lignes.push([t('Basse saison, {n} nuits', { n: p.nb }), euros(p.mb)]);
    if (p.nh) lignes.push([t('Haute saison, {n} nuits', { n: p.nh }), euros(p.mh)]);
    resa.querySelector('.resa__prix').innerHTML = `${lignes.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}
      <div class="is-total"><dt>${t('Location, équipage compris')}</dt><dd>${euros(p.montant)}</dd></div>
      <div><dt>${t('Avance sur frais de croisière (30 %), à régler avant le départ')}</dt><dd>${euros(p.montant * 0.3)}</dd></div>`;
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

  // Envoi : connexion si besoin, puis la base vérifie, calcule et enregistre
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!debut || !fin) return;
    const bouton = form.querySelector('[type="submit"]');
    const dire = (texte, erreur = false) => { note.textContent = texte; note.classList.toggle('is-erreur', erreur); };
    bouton.disabled = true;
    dire(t('Envoi de votre demande…'));
    try {
      let s = await session();
      if (!s) {
        dire('');
        s = await demanderConnexion({ raison: t('Pour réserver {yacht}, connectez-vous ou créez votre compte : cela prend trente secondes.', { yacht: nom }) });
        if (!s) { dire(t('Connectez-vous pour envoyer votre réservation.'), true); return; }
        dire(t('Envoi de votre demande…'));
      }
      const sb = await db();
      const { data, error } = await sb.rpc('reserver', {
        p_yacht: slug, p_debut: debut, p_fin: fin, p_heure: form.heure.value, p_port: form.port.value,
        p_invites: Number(form.invites.value), p_message: form.message.value.trim(), p_langue: lang,
      });
      if (error) throw error;
      for (let d = debut; d < fin; d = plus(d, 1)) parDate.get(d)?.classList.add('is-option');
      merci.querySelector('.resa__merci-titre').textContent = t('Merci. Votre demande {ref} est bien reçue.', { ref: data.reference });
      merci.querySelector('.resa__merci-texte').textContent = t('{yacht}, du {a} au {b}, {montant}. Ces dates sont bloquées pour vous : votre courtier vous confirme la réservation sous 24 heures, par e-mail.', { yacht: nom, a: fLong.format(date(debut)), b: fLong.format(date(fin)), montant: euros(data.montant) });
      debut = null; fin = null; limite = null;
      form.message.value = '';
      dire('');
      panneau.hidden = true;
      etape(1);
      etiqueter();
      dessiner();
      merci.hidden = false;
      merci.focus({ preventScroll: true });
      scrollToEl(merci, 24);
    } catch (err) {
      dire(messageReservation(err), true);
      if (/dates_indisponibles/.test(err?.message)) actualiser();
    } finally {
      bouton.disabled = false;
    }
  });

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
  new IntersectionObserver((entrees, obs) => {
    if (!entrees[0].isIntersecting) return;
    obs.disconnect();
    actualiser().catch(() => {}); // sans réseau, l'état de la construction reste affiché
  }, { rootMargin: '600px 0px' }).observe(resa);
}
