// Page « Mon espace » : connexion, réservations du client (statut, annulation d'une demande en attente),
// coordonnées, et choix d'un nouveau mot de passe après un lien « mot de passe oublié ».
// Les règles de la base garantissent qu'un client ne lit que ses propres réservations.
import { initCommun, gsap, reduceMotion } from './commun.js';
import { db } from './supabase.js';
import { t, lang, locale, euros } from './i18n.js';
import { demanderConnexion, deconnexion, messageErreur } from './compte.js';

initCommun();

const racine = document.querySelector('.espace');
const blocs = {
  attente: racine.querySelector('.espace__attente'),
  deconnecte: racine.querySelector('.espace__deconnecte'),
  connecte: racine.querySelector('.espace__connecte'),
  mdp: racine.querySelector('.espace__mdp'),
};
const montrer = (nom) => {
  Object.entries(blocs).forEach(([k, el]) => { el.hidden = k !== nom; });
  if (!reduceMotion && blocs[nom]) gsap.fromTo(blocs[nom], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' });
};

const FLOTTE = { fr: 'flotte', en: 'fleet', de: 'flotte', it: 'flotta' }[lang] || 'flotte';
const fDate = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const jour = (s) => fDate.format(new Date(`${s}T12:00:00Z`));
const STATUTS = {
  en_attente: t('En attente de confirmation'),
  confirmee: t('Confirmée'),
  refusee: t('Non retenue'),
  annulee: t('Annulée'),
};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let sb;
let utilisateur = null;

async function afficher() {
  const [{ data: profil }, { data: resas, error }] = await Promise.all([
    sb.from('profils').select('*').eq('id', utilisateur.id).maybeSingle(),
    sb.from('reservations').select('id, reference, yacht, debut, fin, heure, port, invites, nuits, montant, statut, note_directeur, cree_le, yachts(nom)').eq('type', 'location').order('debut', { ascending: true }),
  ]);
  if (error) throw error;

  // Direction : un lien vers l'espace directeur
  if (['directeur', 'demo'].includes(profil?.role) && !racine.querySelector('.espace__direction')) {
    racine.querySelector('.espace__bonjour').insertAdjacentHTML('afterend', `<p class="espace__porte espace__direction"><a class="btn btn--light" href="../../fr/direction/">Ouvrir l'espace directeur</a></p>`);
  }
  const prenom = (profil?.nom || '').trim().split(' ')[0];
  racine.querySelector('.espace__bonjour').textContent = prenom ? t('Bonjour {prenom}. Voici vos séjours à bord.', { prenom }) : t('Bonjour. Voici vos séjours à bord.');

  // Réservations : à venir d'abord, puis les passées et les demandes closes
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const rang = (r) => (['en_attente', 'confirmee'].includes(r.statut) && r.fin >= aujourdhui ? 0 : 1);
  const liste = racine.querySelector('.espace__liste');
  const tri = (resas || []).sort((a, b) => rang(a) - rang(b) || (a.debut < b.debut ? -1 : 1));
  racine.querySelector('.espace__vide').hidden = tri.length > 0;
  liste.innerHTML = tri.map((r) => `
    <li class="sejour" data-statut="${r.statut}">
      <div>
        <p class="sejour__yacht"><a href="../${FLOTTE}/${esc(r.yacht)}/">${esc(r.yachts?.nom || r.yacht)}</a></p>
        <p class="sejour__detail">${esc(t('Du {a} au {b}', { a: jour(r.debut), b: jour(r.fin) }))}</p>
        <p class="sejour__meta">
          <span>${esc(t('{n} nuits', { n: r.nuits }))}</span>
          <span>${esc(t('Embarquement à {h}, {port}', { h: (r.heure || '').slice(0, 5), port: r.port || '' }))}</span>
          <span>${esc(t('{n} invités', { n: r.invites }))}</span>
          <span>${esc(r.reference)}</span>
        </p>
        ${r.note_directeur ? `<p class="sejour__note">${esc(r.note_directeur)}</p>` : ''}
      </div>
      <div class="sejour__droite">
        <span class="statut statut--${r.statut}">${STATUTS[r.statut] || r.statut}</span>
        <span class="sejour__montant">${euros(r.montant)}</span>
        ${r.statut === 'en_attente' ? `<button class="lien-discret" type="button" data-annuler="${r.id}">${t('Annuler ma demande')}</button>` : ''}
      </div>
    </li>`).join('');

  // Coordonnées
  const f = racine.querySelector('.espace__connecte .espace__profil');
  f.nom.value = profil?.nom || '';
  f.email.value = utilisateur.email || '';
  f.telephone.value = profil?.telephone || '';
  f.langue.value = profil?.langue || lang;
  montrer('connecte');
}

async function demarrer() {
  try {
    sb = await db();
  } catch (err) {
    blocs.attente.textContent = messageErreur(err);
    return;
  }
  // Retour d'un lien « mot de passe oublié » : on propose de choisir le nouveau mot de passe
  sb.auth.onAuthStateChange((evenement) => { if (evenement === 'PASSWORD_RECOVERY') montrer('mdp'); });
  const { data } = await sb.auth.getSession();
  utilisateur = data.session?.user || null;
  if (location.search.includes('nouveau-mot-de-passe') && utilisateur) { montrer('mdp'); return; }
  if (!utilisateur) { montrer('deconnecte'); return; }
  try { await afficher(); } catch (err) { blocs.attente.hidden = false; blocs.attente.textContent = messageErreur(err); }
}

// Boutons : connexion, création de compte, déconnexion, annulation
racine.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-action], [data-annuler]');
  if (!b) return;
  if (b.dataset.action === 'connexion' || b.dataset.action === 'creation') {
    const s = await demanderConnexion({ creation: b.dataset.action === 'creation' });
    if (s) { utilisateur = s.user; await afficher().catch((err) => { blocs.attente.hidden = false; blocs.attente.textContent = messageErreur(err); }); }
  }
  if (b.dataset.action === 'deconnexion') { await deconnexion(); utilisateur = null; montrer('deconnecte'); }
  if (b.dataset.annuler) {
    if (!window.confirm(t('Annuler cette demande ? Les dates seront libérées.'))) return;
    b.disabled = true;
    const { error } = await sb.rpc('annuler_reservation', { p_id: b.dataset.annuler });
    if (error) { b.disabled = false; window.alert(messageErreur(error)); return; }
    await afficher();
  }
});

// Enregistrer ses coordonnées
racine.querySelector('.espace__connecte .espace__profil').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const note = f.querySelector('.note');
  if (!f.nom.value.trim()) { f.nom.setAttribute('aria-invalid', 'true'); f.nom.focus(); note.textContent = t("Merci d'indiquer votre nom."); return; }
  f.nom.removeAttribute('aria-invalid');
  const { error } = await sb.from('profils').update({ nom: f.nom.value.trim(), telephone: f.telephone.value.trim(), langue: f.langue.value }).eq('id', utilisateur.id);
  note.textContent = error ? messageErreur(error) : t('Vos coordonnées sont enregistrées.');
});

// Nouveau mot de passe
racine.querySelector('.espace__mdp form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const note = f.querySelector('.note');
  if (f.mdp.value.length < 8) { note.textContent = t('Mot de passe trop faible : 8 caractères au moins.'); return; }
  const { data, error } = await sb.auth.updateUser({ password: f.mdp.value });
  if (error) { note.textContent = messageErreur(error); return; }
  utilisateur = data.user;
  history.replaceState(null, '', location.pathname);
  await afficher();
});

demarrer();
