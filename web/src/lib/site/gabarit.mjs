// Fiches des yachts et page « La flotte », rendues à la demande depuis la base (site public hybride, phase B).
// Port fidèle de tools/build-flotte.cjs : même gabarit, même HTML ; seules les données changent de source
// (base Supabase au lieu de data/flotte.json) et les photos envoyées depuis l'espace directeur sont servies
// depuis le stockage Supabase. Les pages sont produites en français, puis traduites (traduction.ts).
import { localize } from './routes.mjs';

export function creerGabarit({ saison, yachts, SITE, STOCKAGE }) {
// Adresse d'une photo : site (assets/img/…) ou stockage Supabase (« supabase:<slug>/<id> », envoyée par le directeur)
const photo = (src, taille, root) => (String(src).startsWith('supabase:') ? `${STOCKAGE}/${String(src).slice(9)}-${taille}.webp` : `${root}assets/img/${src}-${taille}.webp`);
// ---------------------------------------------------------------------------------------------
// Petits outils
// ---------------------------------------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nombre = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(n);
const euros = (n) => `${nombre(n)}&nbsp;€`;
const metres = (n) => `${nombre(n)}&nbsp;m`;
const pad = (i) => String(i + 1).padStart(2, '0');
// Nombre de cabines : saisi dans l'éditeur, ou déduit de la description ; jamais d'erreur si le texte n'a pas de chiffre
const nbCabines = (y) => Number(y.nbCabines) || Number(String(y.cabines ?? '').match(/^\d+/)?.[0]) || '—';
const vendu = (y) => y.vente != null;
const loue = (y) => y.location != null;
const statut = (y) => [vendu(y) && 'À vendre', loue(y) && 'À louer'].filter(Boolean).join(' et ').replace('À vendre et À louer', 'À vendre et à louer');

function prix(y, { court = false } = {}) {
  const out = [];
  if (vendu(y)) out.push(`${court ? '' : 'À vendre, '}${euros(y.vente)}`);
  if (loue(y)) out.push(`${court ? 'Location dès ' : 'À louer dès '}${euros(y.location.basse)} la semaine`);
  return out.join(court ? ' · ' : ' · ');
}

function img(src, { w, h, alt = '', sizes = '100vw', lazy = true, cls = '' }, root) {
  // Les images existent en deux largeurs : 900 et 1600 (ou 1536, la largeur des originaux ChatGPT)
  const big = Math.min(1600, Number(w) || 1600);
  return `<img${cls ? ` class="${cls}"` : ''} src="${esc(photo(src, 1600, root))}" srcset="${esc(photo(src, 900, root))} 900w, ${esc(photo(src, 1600, root))} ${big}w" sizes="${sizes}" alt="${esc(alt)}" width="${Number(w) || ''}" height="${Number(h) || ''}"${lazy ? ' loading="lazy"' : ' fetchpriority="high"'}>`;
}
// Règles de réservation (réglages de la saison dans Supabase, avec des valeurs par défaut si le fichier est ancien)
const HAUTE_FIN = saison.hauteFin || (() => { const d = new Date(`${saison.haute[1]}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString().slice(0, 10); })();
const MIN = saison.minNuits || { haute: 7, basse: 3 };
const HEURES = saison.heures || ['10:00', '18:00'];
const PORTS = saison.ports || ['Saint-Tropez', 'Cannes', 'Monaco', 'Saint-Raphaël'];

// Calendrier de réservation d'un yacht : tous les jours de la saison, état de départ tiré de la base au moment
// de la construction (js/reservation.js le remet à jour en direct). Noms des mois et des jours écrits par le script,
// dans la langue de la page.
function reservation(y, root) {
  const prises = y.prises || [];
  const etat = (iso) => { const p = prises.find((x) => iso >= x.debut && iso < x.fin); return p ? (p.etat === 'option' ? 'option' : 'pris') : ''; };
  const mois = [];
  for (const d = new Date(`${saison.debut.slice(0, 8)}01T12:00:00Z`); d.toISOString().slice(0, 10) <= saison.fin; d.setUTCMonth(d.getUTCMonth() + 1)) mois.push(d.toISOString().slice(0, 7));
  const calendrier = mois.map((m) => {
    const premier = new Date(`${m}-01T12:00:00Z`);
    const nb = new Date(Date.UTC(premier.getUTCFullYear(), premier.getUTCMonth() + 1, 0)).getUTCDate();
    const cases = [...Array(7)].map((_, k) => `<li class="dow" data-dow="${k}" aria-hidden="true"></li>`);
    for (let k = 0; k < (premier.getUTCDay() + 6) % 7; k++) cases.push('<li aria-hidden="true"></li>');
    for (let j = 1; j <= nb; j++) {
      const iso = `${m}-${String(j).padStart(2, '0')}`;
      const hors = iso < saison.debut || iso > saison.fin;
      const e = hors ? '' : etat(iso);
      const cls = ['jour', !hors && iso >= saison.haute[0] && iso < HAUTE_FIN && 'is-haute', e && `is-${e}`].filter(Boolean).join(' ');
      cases.push(`<li><button type="button" class="${cls}" data-d="${iso}"${hors ? ' disabled' : ''}>${j}</button></li>`);
    }
    return `<div class="resa__m"><h3 data-mois="${m}"></h3><ol class="resa__jours">${cases.join('')}</ol></div>`;
  }).join('\n            ');

  // Heures d'embarquement, de demi-heure en demi-heure
  const minutes = (s) => s.split(':').reduce((a, b) => a * 60 + Number(b), 0);
  const heures = [];
  for (let x = minutes(HEURES[0]); x <= minutes(HEURES[1]); x += 30) {
    const v = `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
    heures.push(`<option value="${v}"${v === '12:00' ? ' selected' : ''}>${v}</option>`);
  }
  const ports = [y.port, ...PORTS.filter((p) => p !== y.port)];
  // Conditions de paiement (réglages) : acompte, avance sur frais (APA), TVA comprise, délai du solde avant le départ
  const regles = { debut: saison.debut, fin: saison.fin, haute: [saison.haute[0], HAUTE_FIN], min: MIN, paiement: saison.paiement };

  return `<div class="resa" data-yacht="${y.slug}" data-nom="${esc(y.nom)}" data-basse="${y.location.basse}" data-haute="${y.location.haute}" data-regles="${esc(JSON.stringify(regles))}">
          <p class="resa__etape"><span class="resa__num">01</span><span class="resa__consigne">Choisissez votre jour d'embarquement</span></p>
          <div class="resa__mois" role="group" aria-label="Calendrier de la saison ${saison.annee}">
            ${calendrier}
          </div>
          <p class="resa__legende"><span class="l-libre">Disponible</span><span class="l-option">En option</span><span class="l-pris">Réservé</span><span class="l-haute">Haute saison</span><span class="l-choix">Votre séjour</span></p>
          <p class="resa__aide" role="status" aria-live="polite"></p>
          <div class="resa__panneau" hidden>
            <div class="resa__resume"><p class="resa__dates"></p><p class="resa__nuits"></p></div>
            <dl class="resa__prix"></dl>
            <form class="resa__form" novalidate>
              <div class="champs champs--3">
                <div class="champ"><label for="r-heure">Heure d'embarquement</label><select id="r-heure" name="heure">${heures.join('')}</select></div>
                <div class="champ"><label for="r-port">Port d'embarquement</label><select id="r-port" name="port">${ports.map((p) => `<option>${esc(p)}</option>`).join('')}</select></div>
                <div class="champ"><label for="r-invites">Invités</label><select id="r-invites" name="invites">${[...Array(y.invites)].map((_, k) => `<option${k + 1 === Math.min(6, y.invites) ? ' selected' : ''}>${k + 1}</option>`).join('')}</select></div>
                <div class="champ champ--large"><label for="r-msg">Vos souhaits <small>(facultatif)</small></label><textarea id="r-msg" name="message" rows="3" maxlength="2000" placeholder="Itinéraire, occasion, régime alimentaire, jouets nautiques…"></textarea></div>
              </div>
              <label class="form__consent resa__accord"><input type="checkbox" name="accepte" required> <span>J'accepte les conditions de location et le contrat qui en découle.</span></label>
              <div class="resa__robot"></div>
              <div class="resa__envoi">
                <button class="btn btn--light" type="submit" data-magnetic>Réserver</button>
                <button type="button" class="resa__changer">Changer les dates</button>
                <p class="note" role="status" aria-live="polite"></p>
              </div>
              <p class="auth__legal">Votre demande bloque ces dates. Un courtier la confirme sous 24&nbsp;heures ; rien n'est débité en ligne.</p>
              <p class="auth__legal"><a href="${root}fr/conditions/">Conditions de location</a></p>
            </form>
          </div>
          <div class="resa__merci" hidden tabindex="-1">
            <p class="kicker">Demande envoyée</p>
            <h3 class="resa__merci-titre"></h3>
            <p class="resa__merci-texte"></p>
            <a class="btn btn--ghost" href="${root}fr/espace/">Suivre ma réservation</a>
          </div>
        </div>`;
}

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const jourMois = (iso) => { const [, m, j] = iso.split('-').map(Number); return `${j} ${MOIS[m - 1]}`; };

// ---------------------------------------------------------------------------------------------
// Gabarit commun : en-tête, pied de page, bulle WhatsApp
// ---------------------------------------------------------------------------------------------
const WA = 'https://wa.me/33600000000?text=Bonjour%20Portolan%2C%20je%20souhaite%20parler%20%C3%A0%20un%20courtier.';
const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.6.9 1-3.5-.2-.4C3 15.8 2.5 14 2.5 12.2 2.5 6.9 6.8 2.7 12 2.7s9.5 4.2 9.5 9.5-4.3 9.6-9.5 9.6zM20.1 4A11.4 11.4 0 0 0 1.8 17.7L.2 23.5l6-1.6a11.4 11.4 0 0 0 5.8 1.5c6.3 0 11.4-5.1 11.4-11.4 0-3-1.2-5.9-3.3-8z"/></svg>';
const COMPTE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/></svg>';
const ROSE = '<svg class="brand__rose" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1v30M1 16h30M5.4 5.4l21.2 21.2M26.6 5.4L5.4 26.6"/><circle cx="16" cy="16" r="6.5"/></svg>';

// Préchargement de l'image d'ouverture : c'est elle que Google mesure comme « plus grand élément affiché » (LCP)
function preloadTags(root, p) {
  if (!p) return '';
  const big = `<link rel="preload" as="image" href="${root}assets/img/${p.src}-1600.webp" imagesrcset="${root}assets/img/${p.src}-900.webp 900w, ${root}assets/img/${p.src}-1600.webp 1600w" imagesizes="100vw" fetchpriority="high"`;
  if (!p.mobile) return `${big}>`;
  return `${big} media="(min-width: 701px)">\n  <link rel="preload" as="image" href="${root}assets/img/${p.mobile}-1024.webp" imagesrcset="${root}assets/img/${p.mobile}-700.webp 700w, ${root}assets/img/${p.mobile}-1024.webp 1024w" imagesizes="100vw" fetchpriority="high" media="(max-width: 700px)">`;
}

function page({ root, url, title, description, image, body, script, jsonld, bodyClass, alt, preload }) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <!-- Site de démonstration : retirer noindex pour un vrai client -->
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="${SITE}${url}">
  ${['fr', 'en', 'de', 'it'].map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${localize(url, l)}">`).join('\n  ')}
  <link rel="alternate" hreflang="x-default" href="${SITE}${localize(url, 'en')}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="Portolan">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${SITE}${url}">
  <meta property="og:image" content="${esc(photo(image, 1600, SITE + "/"))}">
  <meta property="og:image:alt" content="${esc(alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#0B1513">
  <link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="${root}assets/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="${root}assets/apple-touch-icon.png">
  ${preloadTags(root, preload)}
  <link rel="preload" href="${root}assets/fonts/BodoniModa-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${root}assets/fonts/HankenGrotesk-normal.woff2" as="font" type="font/woff2" crossorigin>
  <!-- Une seule feuille de style, assemblée et compressée par tools/css.cjs (sources : css/main.css, flotte.css…) -->
  <link rel="stylesheet" href="${root}css/site.min.css">
  <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2).replace(/</g, '\\u003c')}
  </script>
</head>
<body class="${bodyClass}">
  <a class="skip" href="#contenu">Aller au contenu</a>

  <header class="header">
    <a class="brand" href="${root}fr/" aria-label="Portolan, accueil">${ROSE}<span>Portolan</span></a>
    <nav class="header__nav" aria-label="Navigation principale">
      <a href="${root}fr/flotte/"${url.startsWith('/fr/flotte/') ? ' aria-current="page"' : ''}>La flotte</a>
      <a href="${root}fr/acheter/"${url === '/fr/acheter/' ? ' aria-current="page"' : ''}>Acheter</a>
      <a href="${root}fr/louer/"${url === '/fr/louer/' ? ' aria-current="page"' : ''}>Louer</a>
      <a href="${root}fr/methode/"${url === '/fr/methode/' ? ' aria-current="page"' : ''}>Méthode</a>
      <a href="${root}fr/nos-eaux/"${url === '/fr/nos-eaux/' ? ' aria-current="page"' : ''}>Nos eaux</a>
      <a href="${root}fr/contact/"${url === '/fr/contact/' ? ' aria-current="page"' : ''}>Contact</a>
    </nav>
    <a class="compte-lien" href="${root}fr/espace/"${url === '/fr/espace/' ? ' aria-current="page"' : ''}>${COMPTE_ICON}<span>Mon espace</span></a>
    <div class="lang">
      <button class="lang__current" type="button" aria-expanded="false" aria-controls="lang-list"><span class="visually-hidden">Langue : </span>FR</button>
      <ul class="lang__list" id="lang-list" hidden>
        <li><a href="${root}fr${url.slice(3)}" hreflang="fr" lang="fr" aria-current="page">Français</a></li>
        <li><a href="${root}${localize(url, 'en').slice(1)}" hreflang="en" lang="en">English</a></li>
        <li><a href="${root}${localize(url, 'de').slice(1)}" hreflang="de" lang="de">Deutsch</a></li>
        <li><a href="${root}${localize(url, 'it').slice(1)}" hreflang="it" lang="it">Italiano</a></li>
      </ul>
    </div>
  </header>

  <main id="contenu">
${body}
  </main>

  <footer class="footer">
    <p class="footer__mark" aria-hidden="true">Portolan</p>
    <div class="footer__row">
      <p>Portolan, courtier en yachts, Saint&#8209;Tropez et Monaco.</p>
      <p class="footer__credit">Site de démonstration conçu par <a href="https://www.sudwebproject.com/">SudWebProject</a>. Société, yachts, caractéristiques, prix et numéros fictifs. Images générées par IA.</p>
    </div>
    <nav class="footer__legal" aria-label="Informations légales">
      <a href="${root}fr/mentions-legales/" data-legal="mentions">Mentions légales</a>
      <a href="${root}fr/confidentialite/" data-legal="confidentialite">Confidentialité et cookies</a>
      <a href="${root}fr/conditions/" data-legal="conditions">Conditions générales</a>
    </nav>
  </footer>

  <a class="wa" href="${WA}" target="_blank" rel="noopener" aria-label="Écrire à un courtier sur WhatsApp">
    <span class="wa__label" aria-hidden="true">Un courtier, maintenant</span>
    <span class="wa__icon">${WA_ICON}</span>
  </a>
  <div class="cursor" aria-hidden="true"><span></span></div>

  <script src="${root}vendor/gsap.min.js" defer></script>
  <script src="${root}vendor/ScrollTrigger.min.js" defer></script>
  <script src="${root}vendor/SplitText.min.js" defer></script>
  <script src="${root}vendor/lenis.min.js" defer></script>
  <script type="module" src="${root}js/${script}"></script>
</body>
</html>
`;
}

const consentement = '<label class="form__consent"><input type="checkbox" name="consentement" required> <span>J\'accepte que Portolan utilise ces informations pour me recontacter au sujet de ma demande.</span></label>';

// ---------------------------------------------------------------------------------------------
// La flotte
// ---------------------------------------------------------------------------------------------
// Image d'ouverture : la baie des yachts (image à créer), sinon la vue du ciel de la visite
const HERO = { src: 'flotte/baie', w: 1536, h: 1024 };

function pageFlotte() {
  const root = '../../';
  const lengths = yachts.map((y) => y.longueur);
  const nVente = yachts.filter(vendu).length;
  const nLoc = yachts.filter(loue).length;

  const plates = yachts.map((y, i) => `
      <li class="plate" data-vente="${vendu(y)}" data-location="${loue(y)}" data-type="${esc(y.type)}" data-longueur="${y.longueur}">
        <a class="plate__media" href="${y.slug}/" data-cursor="Voir" tabindex="-1" aria-hidden="true">
          ${img(y.image.src, { ...y.image, alt: '', sizes: '(min-width: 960px) 62vw, 100vw' }, root)}
        </a>
        <div class="plate__body">
          <p class="plate__num"><span>${pad(i)}</span> ${esc(y.chantierCourt)}${y.type === 'voile' ? ' · voilier' : ''}</p>
          <h2 class="plate__name"><a href="${y.slug}/"><em>${esc(y.nom)}</em></a></h2>
          <p class="plate__line">${esc(y.accroche)}</p>
          <dl class="plate__specs">
            <div><dt>Longueur</dt><dd>${metres(y.longueur)}</dd></div>
            <div><dt>Année</dt><dd>${esc(y.annee)}${y.refit ? ` <small>refit ${esc(y.refit)}</small>` : ''}</dd></div>
            <div><dt>Invités</dt><dd>${y.invites}</dd></div>
            <div><dt>Cabines</dt><dd>${nbCabines(y)}</dd></div>
            <div><dt>Croisière</dt><dd>${y.vitesse.croisiere}<small>nœuds</small></dd></div>
          </dl>
          <p class="plate__price">${prix(y)}</p>
          <div class="plate__actions">
            <a class="btn btn--light" href="${y.slug}/" data-magnetic>Voir la fiche</a>
            <a class="link" href="${y.slug}/#demande">Demander le dossier</a>
          </div>
        </div>
      </li>`).join('');

  const rows = yachts.map((y, i) => `
      <li class="row" data-vente="${vendu(y)}" data-location="${loue(y)}" data-type="${esc(y.type)}" data-longueur="${y.longueur}" data-preview="${esc(photo(y.image.src, 900, root))}">
        <a class="row__link" href="${y.slug}/">
          <span class="row__num">${pad(i)}</span>
          <span class="row__name"><em>${esc(y.nom)}</em></span>
          <span class="row__yard">${esc(y.chantierCourt)}</span>
          <span class="row__cell">${esc(y.annee)}</span>
          <span class="row__cell">${metres(y.longueur)}</span>
          <span class="row__cell">${y.invites} invités</span>
          <span class="row__price">${vendu(y) ? euros(y.vente) : `dès ${euros(y.location.basse)}<small> / semaine</small>`}</span>
          <svg class="row__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>
        </a>
      </li>`).join('');

  const body = `
    <section class="fl-hero" aria-labelledby="fl-title">
      <figure class="fl-hero__media">${img(HERO.src, { ...HERO, alt: '', lazy: false }, root)}</figure>
      <div class="fl-hero__text">
        <nav class="crumbs" aria-label="Fil d'Ariane"><a href="../">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">La flotte</span></nav>
        <p class="kicker">Saison ${saison.annee}</p>
        <h1 id="fl-title" class="fl-hero__title">La flotte</h1>
        <p class="fl-hero__lead">${yachts.length === 6 ? 'Six' : yachts.length} yachts que nous avons visités, essayés et choisis, de ${nombre(Math.min(...lengths))} à ${nombre(Math.max(...lengths))}&nbsp;mètres, entre Saint&#8209;Tropez et Monaco.</p>
      </div>
      <dl class="fl-hero__stats">
        <div><dt>à vendre</dt><dd>${nVente}</dd></div>
        <div><dt>à louer</dt><dd>${nLoc}</dd></div>
        <div><dt>invités, jusqu'à</dt><dd>${Math.max(...yachts.map((y) => y.invites))}</dd></div>
      </dl>
    </section>

    <section class="fl-list" aria-label="Les yachts de la flotte" data-view="plates">
      <div class="fl-bar">
        <div class="fl-bar__filters" role="group" aria-label="Filtrer la flotte">
          <button class="chip" type="button" data-filter="tous" aria-pressed="true">Tous</button>
          <button class="chip" type="button" data-filter="vente" aria-pressed="false">À vendre</button>
          <button class="chip" type="button" data-filter="location" aria-pressed="false">À louer</button>
          <span class="fl-bar__sep" aria-hidden="true"></span>
          <button class="chip" type="button" data-filter="voile" aria-pressed="false">Voiliers</button>
          <button class="chip" type="button" data-filter="grand" aria-pressed="false">Plus de 40&nbsp;m</button>
        </div>
        <p class="fl-bar__count" aria-live="polite"><span>${yachts.length}</span> yachts</p>
        <div class="fl-bar__view" role="group" aria-label="Affichage">
          <button type="button" data-view="plates" aria-pressed="true">Planches</button>
          <button type="button" data-view="register" aria-pressed="false">Registre</button>
        </div>
      </div>

      <ol class="fl-plates">${plates}
      </ol>
      <ol class="fl-register" hidden>${rows}
      </ol>
      <p class="fl-empty" hidden>Aucun yacht ne correspond à ces critères cette semaine. <a class="link" href="#recherche">Confiez-nous une recherche</a></p>
      <figure class="fl-preview" aria-hidden="true"><img alt=""></figure>
    </section>

    <section class="fl-search" id="recherche" aria-labelledby="search-title">
      <div class="fl-search__intro">
        <p class="kicker">Recherche confidentielle</p>
        <h2 id="search-title" class="section-title">Le yacht que vous cherchez n'est peut&#8209;être pas encore annoncé.</h2>
        <p>Un tiers de nos ventes se conclut hors marché. Décrivez&#8209;nous votre projet : un courtier vous rappelle sous 24&#8239;heures avec les bateaux qui s'en approchent, annoncés ou non.</p>
      </div>
      <form class="form fl-search__form" action="#" novalidate>
        <fieldset class="form__group">
          <legend class="form__label">Votre projet</legend>
          <div class="form__chips">
            <label><input type="radio" name="projet" value="acheter" required><span>Acheter</span></label>
            <label><input type="radio" name="projet" value="louer"><span>Louer</span></label>
            <label><input type="radio" name="projet" value="vendre"><span>Vendre le mien</span></label>
          </div>
        </fieldset>
        <fieldset class="form__group">
          <legend class="form__label">Taille</legend>
          <div class="form__chips">
            <label><input type="radio" name="taille" value="20-30 m"><span>20 à 30&nbsp;m</span></label>
            <label><input type="radio" name="taille" value="30-45 m"><span>30 à 45&nbsp;m</span></label>
            <label><input type="radio" name="taille" value="45-70 m"><span>45 à 70&nbsp;m</span></label>
          </div>
        </fieldset>
        <div class="form__grid">
          <div class="form__group"><label class="form__label" for="s-nom">Nom</label><input class="form__input" id="s-nom" name="nom" autocomplete="name" required></div>
          <div class="form__group"><label class="form__label" for="s-mail">E&#8209;mail</label><input class="form__input" id="s-mail" name="email" type="email" autocomplete="email" required></div>
          <div class="form__group form__group--wide"><label class="form__label" for="s-msg">Ce qui compte pour vous <span>(facultatif)</span></label><textarea class="form__input" id="s-msg" name="message" rows="3" placeholder="Budget, période, nombre d'invités, style de navigation…"></textarea></div>
        </div>
        ${consentement}
        <button class="btn btn--light" type="submit" data-magnetic>Confier une recherche</button>
        <p class="form__note" role="status" aria-live="polite"></p>
      </form>
    </section>`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': `${SITE}/fr/flotte/#page`, url: `${SITE}/fr/flotte/`, name: 'La flotte Portolan', inLanguage: 'fr', isPartOf: { '@id': `${SITE}/#website` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/fr/` },
        { '@type': 'ListItem', position: 2, name: 'La flotte', item: `${SITE}/fr/flotte/` },
      ] },
      { '@type': 'ItemList', itemListElement: yachts.map((y, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/fr/flotte/${y.slug}/`, name: y.nom })) },
    ],
  };

  return page({
    root, url: '/fr/flotte/', bodyClass: 'inner page-flotte', script: 'flotte.js', image: 'flotte/camarat', jsonld,
    alt: 'Le yacht Camarat en navigation devant le phare de Camarat',
    title: 'La flotte | Yachts à vendre et à louer, de Saint-Tropez à Monaco | Portolan',
    description: `${yachts.length} yachts de ${nombre(Math.min(...lengths))} à ${nombre(Math.max(...lengths))} m à vendre et à louer sur la Côte d'Azur : caractéristiques, prix, disponibilités. Chaque yacht a été visité par nos courtiers.`,
    body,
  });
}

// ---------------------------------------------------------------------------------------------
// Fiche d'un yacht
// ---------------------------------------------------------------------------------------------
// Silhouettes de profil, au trait : yacht à moteur ou ketch (le plan de pont les découpe en niveaux)
const PROFIL = {
  moteur: {
    view: '0 0 1000 300',
    trait: 'M40 210 L70 250 L880 250 Q930 232 965 196 L40 196 Z M110 196 L130 150 L800 150 L860 196 M200 150 L230 108 L700 108 L745 150 M300 108 L330 76 L560 76 L590 108 M430 76 L440 30 M425 44 L470 44',
    niveaux: [76, 108, 150, 196, 230],
  },
  voile: {
    view: '0 0 1000 420',
    trait: 'M60 330 L95 372 L860 372 Q920 350 960 318 L60 318 Z M300 318 L320 290 L620 290 L640 318 M420 318 L420 20 M720 318 L720 80 M420 30 L200 300 M420 30 L880 316 M720 90 L900 312',
    niveaux: [290, 318, 350],
  },
};

function fiche(y, i) {
  const root = '../../../';
  const autres = yachts.filter((o) => o.slug !== y.slug).slice(0, 3);
  const ponts = [...new Set(y.galerie.map((g) => g.pont))];

  const specs = [
    ['Chantier', esc(y.chantier)],
    ['Année', `${esc(y.annee)}${y.refit ? `, refit ${esc(y.refit)}` : ''}`],
    ['Longueur', metres(y.longueur)],
    ['Largeur', metres(y.largeur)],
    ["Tirant d'eau", metres(y.tirant)],
    ['Coque', esc(y.coque)],
    ['Architecture', esc(y.architecte)],
    ['Invités', `${y.invites}`],
    ['Cabines', esc(y.cabines)],
    ['Équipage', `${y.equipage}`],
    ['Vitesse', `${y.vitesse.croisiere}&nbsp;nœuds en croisière, ${y.vitesse.max} en pointe`],
    ['Autonomie', `${nombre(y.autonomie)}&nbsp;milles`],
    ['Motorisation', esc(y.moteurs)],
    ['Stabilité', esc(y.stabilisateurs)],
    ['Pavillon', esc(y.pavillon)],
    ["Port d'attache", esc(y.port)],
  ];

  const galerie = y.galerie.length
    ? `
        <section class="fi-gallery" id="galerie" aria-labelledby="gal-title">
          <div class="fi-section-head">
            <p class="kicker">À bord</p>
            <h2 id="gal-title" class="section-title">${y.galerie.length} vues de <em>${esc(y.nom)}</em></h2>
          </div>
          <div class="fi-gallery__tabs" role="group" aria-label="Choisir un pont">
            <button class="chip" type="button" data-pont="" aria-pressed="true">Tout</button>
            ${ponts.map((p) => `<button class="chip" type="button" data-pont="${esc(p)}" aria-pressed="false">${esc(p)}</button>`).join('\n            ')}
          </div>
          <div class="fi-gallery__strip" data-cursor="Agrandir">
            ${y.galerie.map((g, k) => `<figure class="fi-shot" data-pont="${esc(g.pont)}"><button type="button" class="fi-shot__open" data-index="${k}" aria-label="Agrandir : ${esc(g.alt)}">${img(g.src, { ...g, sizes: '(min-width: 960px) 44vw, 86vw' }, root)}</button><figcaption>${esc(g.alt)}</figcaption></figure>`).join('\n            ')}
          </div>
          <div class="fi-gallery__foot">
            <p class="fi-gallery__count"><span>01</span> / ${pad(y.galerie.length - 1)}</p>
            <div class="fi-gallery__nav"><button type="button" data-dir="-1" aria-label="Image précédente">←</button><button type="button" data-dir="1" aria-label="Image suivante">→</button></div>
            ${y.visite ? '<a class="link" href="#visite">Monter à bord</a>' : ''}
          </div>
        </section>`
    : `
        <section class="fi-gallery fi-gallery--soon" id="galerie" aria-labelledby="gal-title">
          <div class="fi-section-head">
            <p class="kicker">À bord</p>
            <h2 id="gal-title" class="section-title">La visite de <em>${esc(y.nom)}</em>, en images</h2>
          </div>
          <p class="fi-note">La galerie complète, les plans et l'inventaire sont joints au dossier. Nous vous l'envoyons sous 24&#8239;heures.</p>
          <a class="btn btn--ghost" href="#demande" data-intent="dossier">Recevoir le dossier</a>
        </section>`;

  // Visite à bord : un plan-séquence continu (Wan 2.2), chargé seulement quand le visiteur la lance
  const v = y.visite;
  const visite = v ? `
        <section class="fi-tour" id="visite" aria-labelledby="tour-title"
          data-dir="${root}assets/${esc(v.dir)}/" data-yacht="${esc(y.nom)}" data-pieces="${esc(JSON.stringify(v.pieces))}" data-louer="${loue(y)}">
          <button type="button" class="fi-tour__open" data-cursor="Embarquer" aria-labelledby="tour-title" aria-describedby="tour-lead">
            ${img(v.affiche, { w: 1600, h: 900, alt: '', sizes: '(min-width: 1100px) 60vw, 100vw' }, root)}
            <span class="fi-tour__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span>
          </button>
          <div class="fi-tour__text">
            <p class="kicker">Visite à bord</p>
            <h2 id="tour-title" class="section-title">Monter à bord de <em>${esc(y.nom)}</em></h2>
            <p id="tour-lead" class="fi-note">${esc(v.duree)} Un seul mouvement de caméra, que vous guidez en faisant défiler.</p>
            <button type="button" class="btn btn--light fi-tour__start" data-magnetic>Monter à bord</button>
          </div>
        </section>` : '';

  const profil = PROFIL[y.type];
  const plan = `
        <section class="fi-decks" aria-labelledby="deck-title">
          <div class="fi-section-head">
            <p class="kicker">Plan de pont</p>
            <h2 id="deck-title" class="section-title">${y.ponts.length} niveaux, ${y.invites} invités</h2>
          </div>
          <svg class="fi-decks__profile" viewBox="${profil.view}" aria-hidden="true">
            <path class="fi-decks__line" d="${profil.trait}"/>
            ${y.ponts.map((p, k) => `<line class="fi-decks__level" data-level="${k}" x1="20" x2="980" y1="${profil.niveaux[Math.min(k, profil.niveaux.length - 1)]}" y2="${profil.niveaux[Math.min(k, profil.niveaux.length - 1)]}"/>`).join('')}
          </svg>
          <ol class="fi-decks__list">
            ${y.ponts.map(([n, d], k) => `<li data-level="${k}"><span class="fi-decks__n">${pad(k)}</span><h3>${esc(n)}</h3><p>${esc(d)}</p></li>`).join('\n            ')}
          </ol>
        </section>`;

  // Réservation en ligne : calendrier jour par jour (dates prises lues en direct dans Supabase par js/reservation.js),
  // prix calculé au prorata des nuits de basse et de haute saison, heure et port d'embarquement
  const charter = loue(y) ? `
        <section class="fi-charter" id="disponibilites" aria-labelledby="charter-title">
          <div class="fi-section-head">
            <p class="kicker">Location avec équipage</p>
            <h2 id="charter-title" class="section-title">Réserver en ligne</h2>
          </div>
          <dl class="fi-rates">
            <div><dt>Basse saison</dt><dd>${euros(y.location.basse)}<small> la semaine</small></dd></div>
            <div><dt>Haute saison, ${jourMois(saison.haute[0])} au ${jourMois(HAUTE_FIN)}</dt><dd>${euros(y.location.haute)}<small> la semaine</small></dd></div>
          </dl>
          <p class="fi-note">Embarquement le jour et à l'heure de votre choix, à ${esc(y.port)} ou dans un autre port de la Riviera. ${MIN.haute}&nbsp;nuits au moins en haute saison, ${MIN.basse} en basse saison. Hors frais de croisière (carburant, vivres, ports), réglés par une avance de 30&nbsp;%, et TVA selon les eaux naviguées.</p>
          ${reservation(y, root)}
        </section>` : '';

  const vente = vendu(y) ? `
        <section class="fi-sale" aria-labelledby="sale-title">
          <div class="fi-section-head">
            <p class="kicker">À vendre</p>
            <h2 id="sale-title" class="section-title">${euros(y.vente)}</h2>
          </div>
          <ul class="fi-sale__list">
            <li><h3>Visite à bord</h3><p>À ${esc(y.port)}, sur rendez&#8209;vous, en présence du capitaine.</p></li>
            <li><h3>Historique complet</h3><p>Entretien, classification et inventaire, transmis avec le dossier.</p></li>
            <li><h3>Essai en mer</h3><p>Une sortie avant l'offre, pour juger le bateau là où il vivra.</p></li>
          </ul>
        </section>` : '';

  // La location se réserve dans le calendrier (section Disponibilités) ; ce formulaire garde les autres demandes
  const intents = [
    ['dossier', 'Recevoir le dossier'],
    ['visite', 'Organiser une visite'],
    ...(loue(y) ? [['question', 'Poser une question']] : []),
  ];

  const body = `
    <section class="fi-hero" aria-labelledby="fi-title">
      <figure class="fi-hero__media">${img(y.image.src, { ...y.image, lazy: false }, root)}</figure>
      <div class="fi-hero__text">
        <nav class="crumbs" aria-label="Fil d'Ariane"><a href="../../">Accueil</a><span aria-hidden="true">/</span><a href="../">La flotte</a><span aria-hidden="true">/</span><span aria-current="page">${esc(y.nom)}</span></nav>
        <p class="kicker">${statut(y)}${y.exclusivite ? ' · Exclusivité Portolan' : ''}</p>
        <h1 id="fi-title" class="fi-hero__title"><em>${esc(y.nom)}</em></h1>
        <p class="fi-hero__lead">${esc(y.accroche)}</p>
      </div>
      <dl class="fi-hero__specs">
        <div><dt>Longueur</dt><dd>${metres(y.longueur)}</dd></div>
        <div><dt>Chantier</dt><dd>${esc(y.chantierCourt === 'Exclusivité Portolan' ? 'Viareggio' : y.chantierCourt)}</dd></div>
        <div><dt>Année</dt><dd>${esc(y.annee)}</dd></div>
        <div><dt>Invités</dt><dd>${y.invites}</dd></div>
        <div><dt>Cabines</dt><dd>${nbCabines(y)}</dd></div>
        <div><dt>Équipage</dt><dd>${y.equipage}</dd></div>
      </dl>
    </section>

    <div class="fi-layout">
      <div class="fi-main">
        <section class="fi-intro" aria-labelledby="intro-title">
          <p class="kicker">${pad(i)} · ${esc(y.chantierCourt)}</p>
          <h2 id="intro-title" class="visually-hidden">Présentation de ${esc(y.nom)}</h2>
          ${y.description.map((p) => `<p>${esc(p)}</p>`).join('\n          ')}
          <ul class="fi-points">
            ${y.points.map(([t, d]) => `<li><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('\n            ')}
          </ul>
        </section>
${visite}${galerie}

        <section class="fi-brochure" aria-labelledby="bro-title">
          <div>
            <p class="kicker">La brochure</p>
            <h2 id="bro-title" class="fi-brochure__title">${esc(y.nom)}, en vingt pages.</h2>
            <p>Plans, inventaire, historique d'entretien et photographies en haute définition. Envoyée par e&#8209;mail, en toute discrétion.</p>
          </div>
          <form class="form fi-brochure__form" action="#" novalidate data-yacht="${esc(y.nom)}" data-slug="${y.slug}">
            <label class="visually-hidden" for="b-mail">Votre e-mail</label>
            <input class="form__input" id="b-mail" type="email" name="email" autocomplete="email" placeholder="Votre e-mail" required>
            <button class="btn btn--light" type="submit" data-magnetic>Recevoir la brochure</button>
            <p class="form__note" role="status" aria-live="polite"></p>
          </form>
        </section>
${plan}

        <section class="fi-specs" aria-labelledby="specs-title">
          <div class="fi-section-head">
            <p class="kicker">Fiche technique</p>
            <h2 id="specs-title" class="section-title">Caractéristiques</h2>
          </div>
          <dl class="fi-specs__list">
            ${specs.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('\n            ')}
          </dl>
        </section>
${vente}${charter}

        <section class="fi-demande" id="demande" aria-labelledby="dem-title">
          <div class="fi-section-head">
            <p class="kicker">Votre demande</p>
            <h2 id="dem-title" class="section-title">Parlons de <em>${esc(y.nom)}</em></h2>
          </div>
          <form class="form fi-form" action="#" novalidate data-yacht="${esc(y.nom)}" data-slug="${y.slug}">
            <fieldset class="form__group">
              <legend class="form__label">Vous souhaitez</legend>
              <div class="form__chips">
                ${intents.map(([v, t], k) => `<label><input type="radio" name="demande" value="${v}"${k === 0 ? ' checked' : ''}><span>${t}</span></label>`).join('\n                ')}
              </div>
            </fieldset>
            <div class="form__grid">
              <div class="form__group"><label class="form__label" for="f-nom">Nom</label><input class="form__input" id="f-nom" name="nom" autocomplete="name" required></div>
              <div class="form__group"><label class="form__label" for="f-mail">E&#8209;mail</label><input class="form__input" id="f-mail" name="email" type="email" autocomplete="email" required></div>
              <div class="form__group"><label class="form__label" for="f-tel">Téléphone <span>(facultatif)</span></label><input class="form__input" id="f-tel" name="tel" type="tel" autocomplete="tel"></div>
              <div class="form__group"><label class="form__label" for="f-langue">Langue</label><select class="form__input" id="f-langue" name="langue"><option>Français</option><option>English</option><option>Deutsch</option><option>Italiano</option></select></div>
              <div class="form__group form__group--wide"><label class="form__label" for="f-msg">Message <span>(facultatif)</span></label><textarea class="form__input" id="f-msg" name="message" rows="3"></textarea></div>
            </div>
            ${consentement}
            <button class="btn btn--light" type="submit" data-magnetic>Envoyer ma demande</button>
            <p class="form__note" role="status" aria-live="polite"></p>
          </form>
        </section>
      </div>

      <aside class="fi-carnet" aria-label="En bref">
        <div class="fi-carnet__inner">
          <p class="fi-carnet__name"><em>${esc(y.nom)}</em></p>
          <p class="fi-carnet__meta">${metres(y.longueur)} · ${esc(y.annee)} · ${Number(y.invites)} invités</p>
          ${vendu(y) ? `<p class="fi-carnet__price"><small>À vendre</small>${euros(y.vente)}</p>` : ''}
          ${loue(y) ? `<p class="fi-carnet__price"><small>À louer, la semaine</small>dès ${euros(y.location.basse)}</p>` : ''}
          <div class="fi-carnet__actions">
            <a class="btn btn--light" href="#demande" data-intent="dossier" data-magnetic>Demander le dossier</a>
            <a class="btn btn--ghost" href="#demande" data-intent="visite">Organiser une visite</a>
            ${v ? '<a class="link" href="#visite">Monter à bord</a>' : ''}
            ${loue(y) ? '<a class="link" href="#disponibilites">Réserver en ligne</a>' : ''}
          </div>
          <p class="fi-carnet__promise">Réponse d'un courtier sous 24&#8239;heures, week&#8209;end compris.</p>
        </div>
      </aside>
    </div>

    <section class="fi-more" aria-labelledby="more-title">
      <div class="fi-section-head">
        <p class="kicker">Dans la flotte</p>
        <h2 id="more-title" class="section-title">Continuer la visite</h2>
      </div>
      <ul class="fi-more__list">
        ${autres.map((o) => `<li><a href="../${o.slug}/" data-cursor="Voir"><figure>${img(o.image.src, { ...o.image, alt: '', sizes: '(min-width: 960px) 30vw, 90vw' }, root)}</figure><p class="fi-more__name"><em>${esc(o.nom)}</em></p><p class="fi-more__meta">${metres(o.longueur)} · ${prix(o, { court: true })}</p></a></li>`).join('\n        ')}
      </ul>
      <a class="link" href="../">Toute la flotte</a>
    </section>

    <div class="fi-bar" aria-hidden="true">
      <p><em>${esc(y.nom)}</em><small>${vendu(y) ? euros(y.vente) : `dès ${euros(y.location.basse)} / sem.`}</small></p>
      <a class="btn btn--light" href="#demande" data-intent="dossier" tabindex="-1">Demander le dossier</a>
    </div>`;

  const offers = [];
  if (vendu(y)) offers.push({ '@type': 'Offer', price: y.vente, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', name: `Vente du yacht ${y.nom}` });
  if (loue(y)) offers.push({ '@type': 'Offer', price: y.location.basse, priceCurrency: 'EUR', name: `Location d'une semaine à bord de ${y.nom}`, priceSpecification: { '@type': 'UnitPriceSpecification', price: y.location.basse, priceCurrency: 'EUR', unitText: 'semaine' } });
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product', '@id': `${SITE}/fr/flotte/${y.slug}/#yacht`, name: `Yacht ${y.nom}`, description: y.description[0],
        brand: { '@type': 'Brand', name: y.chantierCourt }, category: y.type === 'voile' ? 'Voilier' : 'Yacht à moteur',
        image: [`${photo(y.image.src, 1600, SITE + "/")}`, ...y.galerie.slice(0, 5).map((g) => `${photo(g.src, 1600, SITE + "/")}`)],
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Longueur', value: y.longueur, unitCode: 'MTR' },
          { '@type': 'PropertyValue', name: 'Année', value: y.annee },
          { '@type': 'PropertyValue', name: 'Invités', value: y.invites },
        ],
        offers: offers.length === 1 ? offers[0] : offers,
      },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/fr/` },
        { '@type': 'ListItem', position: 2, name: 'La flotte', item: `${SITE}/fr/flotte/` },
        { '@type': 'ListItem', position: 3, name: y.nom, item: `${SITE}/fr/flotte/${y.slug}/` },
      ] },
    ],
  };

  const quoi = [vendu(y) && 'à vendre', loue(y) && 'à louer'].filter(Boolean).join(' et ');
  return page({
    root, url: `/fr/flotte/${y.slug}/`, bodyClass: 'inner page-fiche', script: 'fiche.js', image: y.image.src, jsonld, alt: y.image.alt,
    title: `${y.nom}, yacht de ${nombre(y.longueur)} m ${quoi} | Portolan`,
    description: `${y.nom}, ${y.chantierCourt === 'Exclusivité Portolan' ? 'yacht sur mesure' : y.chantierCourt} ${y.annee}, ${nombre(y.longueur)} m, ${y.invites} invités, ${quoi} au départ de ${y.port}. ${y.accroche}`,
    body,
  });
}


return { pageFlotte, fiche };
}
