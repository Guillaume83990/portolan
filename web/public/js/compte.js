// Comptes clients : fenêtre de connexion / création de compte, session, lien « Mon espace » de l'en-tête.
// La bibliothèque Supabase n'est chargée qu'au moment où l'on en a besoin (ouverture de la fenêtre, réservation).
import { db } from './supabase.js';
import { t, lang } from './i18n.js';

const ROSE = '<svg class="auth__rose" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1v30M1 16h30M5.4 5.4l21.2 21.2M26.6 5.4L5.4 26.6"/><circle cx="16" cy="16" r="6.5"/></svg>';

// Une session existe-t-elle déjà dans ce navigateur ? (sans charger Supabase)
export function sessionLocale() {
  try { return Boolean(JSON.parse(localStorage.getItem('portolan-session'))?.access_token); } catch { return false; }
}

// Le lien de l'en-tête prend la couleur laiton quand le visiteur est connecté
export function initLienCompte() {
  if (sessionLocale()) document.querySelectorAll('.compte-lien').forEach((a) => a.classList.add('is-connecte'));
}

export async function session() {
  const sb = await db();
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function deconnexion() {
  const sb = await db();
  await sb.auth.signOut();
  document.querySelectorAll('.compte-lien').forEach((a) => a.classList.remove('is-connecte'));
}

// Messages d'erreur de Supabase, traduits en phrases claires
export function messageErreur(err) {
  const m = `${err?.message || err || ''}`;
  if (/Invalid login credentials/i.test(m)) return t('E-mail ou mot de passe incorrect.');
  if (/already registered|already been registered/i.test(m)) return t('Un compte existe déjà avec cet e-mail. Connectez-vous.');
  if (/Email not confirmed/i.test(m)) return t('Votre adresse e-mail n\'est pas encore confirmée : ouvrez le lien reçu par e-mail.');
  if (/Password should be|weak/i.test(m)) return t('Mot de passe trop faible : 8 caractères au moins.');
  if (/rate limit|too many|429/i.test(m)) return t('Trop de tentatives. Réessayez dans quelques minutes.');
  if (/not authorized|Email address .* invalid/i.test(m)) return t('Cette adresse e-mail ne peut pas recevoir de message pour le moment.');
  if (/Failed to fetch|NetworkError|Supabase indisponible/i.test(m)) return t('Connexion impossible. Vérifiez votre accès à Internet.');
  return t('Une erreur est survenue. Réessayez dans un instant.');
}

let dialog = null;

// Liens vers les conditions et la confidentialité, repris du pied de page (déjà dans la langue de la page)
function liensLegaux() {
  const liens = ['conditions', 'confidentialite']
    .map((k) => document.querySelector(`.footer__legal a[data-legal="${k}"]`))
    .filter(Boolean)
    .map((a) => `<a href="${a.href}" target="_blank" rel="noopener">${a.textContent.trim()}</a>`);
  return liens.length ? ` ${liens.join(' · ')}` : '';
}

function construire() {
  dialog = document.createElement('dialog');
  dialog.className = 'auth';
  dialog.setAttribute('aria-labelledby', 'auth-titre');
  dialog.setAttribute('data-lenis-prevent', ''); // le défilement doux de la page ne capture pas celui de la fenêtre
  dialog.innerHTML = `
    <div class="auth__inner">
      <button type="button" class="auth__close">${t('Fermer')}</button>
      ${ROSE}
      <div>
        <h2 class="auth__title" id="auth-titre">${t('Votre espace Portolan')}</h2>
        <p class="auth__raison"></p>
      </div>
      <div class="auth__tabs" role="tablist">
        <button type="button" role="tab" aria-selected="true" aria-controls="auth-connexion" id="tab-connexion">${t('Se connecter')}</button>
        <button type="button" role="tab" aria-selected="false" aria-controls="auth-creation" id="tab-creation">${t('Créer un compte')}</button>
      </div>

      <form id="auth-connexion" role="tabpanel" aria-labelledby="tab-connexion" novalidate>
        <div class="champ"><label for="c-mail">${t('E-mail')}</label><input id="c-mail" name="email" type="email" autocomplete="email" required></div>
        <div class="champ"><label for="c-mdp">${t('Mot de passe')}</label><input id="c-mdp" name="mdp" type="password" autocomplete="current-password" required></div>
        <div class="auth__actions">
          <button class="btn btn--light" type="submit">${t('Se connecter')}</button>
          <button class="auth__oubli" type="button">${t('Mot de passe oublié ?')}</button>
        </div>
        <p class="note" role="status" aria-live="polite"></p>
      </form>

      <form id="auth-creation" role="tabpanel" aria-labelledby="tab-creation" novalidate hidden>
        <div class="champ"><label for="n-nom">${t('Nom et prénom')}</label><input id="n-nom" name="nom" autocomplete="name" required maxlength="120"></div>
        <div class="champ"><label for="n-mail">${t('E-mail')}</label><input id="n-mail" name="email" type="email" autocomplete="email" required></div>
        <div class="champ"><label for="n-tel">${t('Téléphone')} <small>${t('(pour la confirmation)')}</small></label><input id="n-tel" name="tel" type="tel" autocomplete="tel" maxlength="40"></div>
        <div class="champ"><label for="n-mdp">${t('Mot de passe')} <small>${t('(8 caractères au moins)')}</small></label><input id="n-mdp" name="mdp" type="password" autocomplete="new-password" minlength="8" required></div>
        <p class="auth__legal">${t('Vos informations servent uniquement à gérer vos réservations. Elles ne sont jamais revendues.')}${liensLegaux()}</p>
        <div class="auth__actions"><button class="btn btn--light" type="submit">${t('Créer mon compte')}</button></div>
        <p class="note" role="status" aria-live="polite"></p>
      </form>
    </div>`;
  document.body.append(dialog);

  const tabs = [...dialog.querySelectorAll('[role="tab"]')];
  const panneaux = [...dialog.querySelectorAll('[role="tabpanel"]')];
  const montrer = (k) => {
    tabs.forEach((b, i) => b.setAttribute('aria-selected', String(i === k)));
    panneaux.forEach((p, i) => { p.hidden = i !== k; });
    panneaux[k].querySelector('input')?.focus();
  };
  tabs.forEach((b, k) => b.addEventListener('click', () => montrer(k)));
  dialog.montrer = montrer;
  dialog.querySelector('.auth__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  const [fConnexion, fCreation] = panneaux;
  const note = (f, texte, erreur = false) => { const n = f.querySelector('.note'); n.textContent = texte; n.classList.toggle('is-erreur', erreur); };
  const occupe = (f, oui) => f.querySelectorAll('button').forEach((b) => { b.disabled = oui; });
  const valide = (f) => {
    f.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
    for (const i of f.querySelectorAll('input[required], input[minlength]')) {
      if ((i.required && !i.value.trim()) || !i.checkValidity()) {
        i.setAttribute('aria-invalid', 'true'); i.focus();
        if (i.type === 'email') return t("Merci d'indiquer une adresse e-mail valide.");
        if (i.type === 'password') return t('Mot de passe trop faible : 8 caractères au moins.');
        return t("Merci d'indiquer votre nom.");
      }
    }
    return '';
  };

  fConnexion.addEventListener('submit', async (e) => {
    e.preventDefault();
    const probleme = valide(fConnexion);
    if (probleme) { note(fConnexion, probleme, true); return; }
    occupe(fConnexion, true); note(fConnexion, t('Connexion…'));
    try {
      const sb = await db();
      const { data, error } = await sb.auth.signInWithPassword({ email: fConnexion.email.value.trim(), password: fConnexion.mdp.value });
      if (error) throw error;
      terminer(data.session);
    } catch (err) { note(fConnexion, messageErreur(err), true); } finally { occupe(fConnexion, false); }
  });

  fConnexion.querySelector('.auth__oubli').addEventListener('click', async () => {
    const email = fConnexion.email.value.trim();
    if (!email || !fConnexion.email.checkValidity()) { fConnexion.email.setAttribute('aria-invalid', 'true'); fConnexion.email.focus(); note(fConnexion, t('Indiquez votre e-mail, puis cliquez à nouveau sur « Mot de passe oublié ? ».'), true); return; }
    try {
      const sb = await db();
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: new URL('./', lienEspace()).href + '?nouveau-mot-de-passe' });
      if (error) throw error;
      note(fConnexion, t('Si un compte existe pour cette adresse, un lien pour choisir un nouveau mot de passe vient de vous être envoyé.'));
    } catch (err) { note(fConnexion, messageErreur(err), true); }
  });

  fCreation.addEventListener('submit', async (e) => {
    e.preventDefault();
    const probleme = valide(fCreation);
    if (probleme) { note(fCreation, probleme, true); return; }
    occupe(fCreation, true); note(fCreation, t('Création de votre compte…'));
    try {
      const sb = await db();
      const { data, error } = await sb.auth.signUp({
        email: fCreation.email.value.trim(),
        password: fCreation.mdp.value,
        options: { data: { nom: fCreation.nom.value.trim(), telephone: fCreation.tel.value.trim(), langue: lang }, emailRedirectTo: lienEspace() },
      });
      if (error) throw error;
      if (data.session) terminer(data.session);
      else note(fCreation, t('Presque terminé : ouvrez le lien de confirmation que nous venons de vous envoyer par e-mail.'));
    } catch (err) { note(fCreation, messageErreur(err), true); } finally { occupe(fCreation, false); }
  });
}

// Adresse de la page Mon espace dans la langue courante (lue dans le lien de l'en-tête)
function lienEspace() {
  const a = document.querySelector('.compte-lien');
  return a ? a.href : new URL('../espace/', location.href).href; // page sans en-tête public (espace directeur)
}

let resoudre = null;
function terminer(s) {
  document.querySelectorAll('.compte-lien').forEach((a) => a.classList.add('is-connecte'));
  const r = resoudre; resoudre = null;
  dialog.close();
  r?.(s);
}

// Ouvre la fenêtre et attend : renvoie la session une fois connecté, ou null si le visiteur ferme la fenêtre
export function demanderConnexion({ raison = '', creation = false } = {}) {
  if (!dialog) {
    construire();
    dialog.addEventListener('close', () => { const r = resoudre; resoudre = null; r?.(null); });
  }
  dialog.querySelector('.auth__raison').textContent = raison;
  dialog.querySelectorAll('.note').forEach((n) => { n.textContent = ''; });
  dialog.showModal();
  dialog.montrer(creation ? 1 : 0);
  return new Promise((ok) => { resoudre = ok; });
}
