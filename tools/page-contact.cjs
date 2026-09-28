// Page « Contact » : trois façons de nous joindre, le formulaire, les deux bureaux et les autres demandes.
// Appelé par build-flotte.cjs. Renvoie une liste [chemin, html].
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

module.exports = function pageContact(t) {
  const { page, img, esc, consentement, SITE, yachts } = t;
  const root = '../../';

  const exists = (src) => fs.existsSync(path.join(ROOT, 'assets/img', `${src}-1600.webp`));
  const L = (src, w = 1536, h = 1024) => ({ src, w, h });
  const pick = (neuve, provisoire) => (exists(neuve) ? L(neuve) : provisoire);

  const IMG = {
    hero: pick('contact/hero', L('bord/salon', 1600, 900)),
    sainttropez: pick('contact/saint-tropez', L('accueil/bureau')),
    monaco: pick('contact/monaco', L('flotte/mistral-blanc')),
  };
  const heroMobile = fs.existsSync(path.join(ROOT, 'assets/img/contact/hero-mobile-1024.webp')) ? 'contact/hero-mobile' : null;

  const WA = 'https://wa.me/33600000000?text=Bonjour%20Portolan%2C%20je%20souhaite%20parler%20%C3%A0%20un%20courtier.';
  const maps = (q) => `https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(q)}`;

  const bureaux = [
    { ville: 'Saint&#8209;Tropez', image: IMG.sainttropez, alt: 'La façade vert bouteille du bureau Portolan sur le vieux port de Saint-Tropez',
      adresse: 'Quai Suffren<br>83990 Saint&#8209;Tropez, France', tel: '+33 4 94 00 00 00', telHref: '+33494000000', carte: 'Quai Suffren, Saint-Tropez',
      horaires: [['Avril à octobre', 'Tous les jours, 9&#8239;h à 20&#8239;h'], ['Novembre à mars', 'Du lundi au samedi, 10&#8239;h à 18&#8239;h']] },
    { ville: 'Monaco', image: IMG.monaco, alt: 'La façade vert bouteille du bureau Portolan face à Port Hercule, à Monaco, à l’heure bleue',
      adresse: 'Quai Antoine I<sup>er</sup><br>98000 Monaco', tel: '+377 93 00 00 00', telHref: '+37793000000', carte: 'Quai Antoine 1er, Monaco',
      horaires: [['Toute l’année', 'Du lundi au vendredi, 9&#8239;h à 19&#8239;h'], ['Rendez&#8209;vous', 'Le week&#8209;end et à bord, sur demande']] },
  ];

  const body = `
    <section class="pg-hero pg-hero--short" aria-labelledby="pg-title">
      <figure class="pg-hero__media"><picture>${heroMobile ? `<source media="(max-width: 700px)" srcset="${root}assets/img/${heroMobile}-700.webp 700w, ${root}assets/img/${heroMobile}-1024.webp 1024w" sizes="100vw">` : ''}${img(IMG.hero.src, { ...IMG.hero, alt: '', lazy: false }, root)}</picture></figure>
      <div class="pg-hero__text">
        <nav class="crumbs" aria-label="Fil d'Ariane"><a href="../">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">Contact</span></nav>
        <p class="kicker">Saint&#8209;Tropez et Monaco</p>
        <h1 id="pg-title" class="pg-hero__title">Nous écrire</h1>
        <p class="pg-hero__lead">Un courtier vous répond sous 24&#8239;heures, week&#8209;end compris, en français, en anglais, en allemand ou en italien.</p>
      </div>
    </section>

    <section class="pg-section ct-ways" aria-label="Nous joindre">
      <ul class="ct-ways__list">
        <li class="ct-way">
          <p class="ct-way__kicker">Appeler</p>
          <h2 class="ct-way__title">Un courtier au bout du fil</h2>
          <p class="ct-way__line"><a href="tel:+33494000000">+33 4 94 00 00 00</a> <span>Saint&#8209;Tropez</span></p>
          <p class="ct-way__line"><a href="tel:+37793000000">+377 93 00 00 00</a> <span>Monaco</span></p>
          <p class="ct-way__note">En saison, tous les jours de 9&#8239;h à 20&#8239;h.</p>
        </li>
        <li class="ct-way">
          <p class="ct-way__kicker">WhatsApp</p>
          <h2 class="ct-way__title">Le plus rapide, en saison</h2>
          <p class="ct-way__line"><a href="${WA}" target="_blank" rel="noopener">Écrire à un courtier</a></p>
          <p class="ct-way__note">Réponse en quelques minutes d'avril à octobre, photos et vidéos des yachts sur demande.</p>
        </li>
        <li class="ct-way">
          <p class="ct-way__kicker">Écrire</p>
          <h2 class="ct-way__title">Pour un dossier complet</h2>
          <p class="ct-way__line"><a href="mailto:bonjour@portolan.example">bonjour@portolan.example</a></p>
          <p class="ct-way__note">Réponse sous 24&#8239;heures, avec une première sélection si vous nous parlez de votre projet.</p>
        </li>
      </ul>
    </section>

    <section class="pg-section pg-demande" id="demande" aria-labelledby="dem-title">
      <div class="pg-demande__intro">
        <p class="kicker">Formulaire</p>
        <h2 id="dem-title" class="section-title">Parlez&#8209;nous de votre projet</h2>
        <p class="pg-lead">Quelques lignes suffisent. Nous revenons vers vous par le moyen que vous préférez, jamais par un robot.</p>
        <ul class="ct-promises">
          <li>Un seul interlocuteur, du premier message à la remise des clés</li>
          <li>Discrétion totale, aucune donnée revendue</li>
          <li>Accord de confidentialité sur simple demande</li>
        </ul>
      </div>
      <form class="form" action="#" novalidate data-yacht="">
        <fieldset class="form__group">
          <legend class="form__label">Votre projet</legend>
          <div class="form__chips">
            <label><input type="radio" name="projet" value="acheter" required><span>Acheter</span></label>
            <label><input type="radio" name="projet" value="louer" required><span>Louer</span></label>
            <label><input type="radio" name="projet" value="vendre" required><span>Vendre</span></label>
            <label><input type="radio" name="projet" value="autre" required><span>Autre chose</span></label>
          </div>
        </fieldset>
        <div class="form__grid">
          <div class="form__group"><label class="form__label" for="c-nom">Nom</label><input class="form__input" id="c-nom" name="nom" autocomplete="name" required></div>
          <div class="form__group"><label class="form__label" for="c-mail">E&#8209;mail</label><input class="form__input" id="c-mail" name="email" type="email" autocomplete="email" required></div>
          <div class="form__group"><label class="form__label" for="c-tel">Téléphone <span>(facultatif)</span></label><input class="form__input" id="c-tel" name="tel" type="tel" autocomplete="tel"></div>
          <div class="form__group"><label class="form__label" for="c-yacht">Un yacht en particulier <span>(facultatif)</span></label><select class="form__input" id="c-yacht" name="yacht"><option value="">Aucun pour l'instant</option>${yachts.map((y) => `<option>${esc(y.nom)}</option>`).join('')}</select></div>
          <div class="form__group"><label class="form__label" for="c-langue">Langue</label><select class="form__input" id="c-langue" name="langue"><option>Français</option><option>English</option><option>Deutsch</option><option>Italiano</option></select></div>
        </div>
        <fieldset class="form__group">
          <legend class="form__label">Être recontacté</legend>
          <div class="form__chips">
            <label><input type="radio" name="rappel" value="téléphone" checked><span>Par téléphone</span></label>
            <label><input type="radio" name="rappel" value="e-mail"><span>Par e&#8209;mail</span></label>
            <label><input type="radio" name="rappel" value="WhatsApp"><span>Sur WhatsApp</span></label>
          </div>
        </fieldset>
        <div class="form__group form__group--wide"><label class="form__label" for="c-msg">Votre message <span>(facultatif)</span></label><textarea class="form__input" id="c-msg" name="message" rows="4" placeholder="Vos dates, le nombre d'invités, un budget, une question…"></textarea></div>
        ${consentement}
        <button class="btn btn--light" type="submit" data-magnetic>Envoyer</button>
        <p class="form__note" role="status" aria-live="polite"></p>
      </form>
    </section>

    <section class="pg-section ct-offices" aria-labelledby="offices-title">
      <header class="pg-head">
        <p class="kicker">Nos bureaux</p>
        <h2 id="offices-title" class="section-title">Passer nous voir</h2>
      </header>
      <div class="ct-offices__grid">
        ${bureaux.map((b) => `<article class="ct-office">
          <figure>${img(b.image.src, { ...b.image, alt: b.alt, sizes: '(min-width: 960px) 45vw, 100vw' }, root)}</figure>
          <h3>${b.ville}</h3>
          <div class="ct-office__cols">
            <div>
              <p class="ct-office__label">Adresse</p>
              <p>${b.adresse}</p>
              <p><a href="tel:${b.telHref}">${b.tel}</a></p>
              <a class="link" href="${maps(b.carte)}" target="_blank" rel="noopener">Itinéraire</a>
            </div>
            <dl>
              ${b.horaires.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
            </dl>
          </div>
        </article>`).join('\n        ')}
      </div>
    </section>

    <section class="pg-section ct-other" aria-labelledby="other-title">
      <header class="pg-head">
        <p class="kicker">Autres demandes</p>
        <h2 id="other-title" class="section-title">Capitaines, chantiers, presse</h2>
      </header>
      <ul class="ct-other__list">
        <li><h3>Capitaines et équipages</h3><p>Nous recrutons pour les yachts que nous vendons et gérons. Envoyez votre CV et vos références.</p><a href="mailto:equipages@portolan.example">equipages@portolan.example</a></li>
        <li><h3>Chantiers et partenaires</h3><p>Chantiers, experts, avocats maritimes, agences de pavillon : nous travaillons avec une poignée de partenaires de confiance.</p><a href="mailto:partenaires@portolan.example">partenaires@portolan.example</a></li>
        <li><h3>Presse</h3><p>Pour une interview, des chiffres du marché ou des images de nos yachts, notre équipe vous répond sous 48&#8239;heures.</p><a href="mailto:presse@portolan.example">presse@portolan.example</a></li>
      </ul>
    </section>`;

  const html = page({
    root, url: '/fr/contact/', bodyClass: 'inner page-contact', script: 'pages.js', image: IMG.hero.src, preload: { src: IMG.hero.src, mobile: heroMobile },
    alt: 'L’accueil du bureau Portolan à Saint-Tropez, porte ouverte sur le quai au coucher du soleil',
    title: 'Contacter un courtier en yachts à Saint-Tropez et Monaco | Portolan',
    description: 'Contactez Portolan, courtier en yachts à Saint-Tropez et Monaco : téléphone, WhatsApp, e-mail ou formulaire. Réponse sous 24 heures, en français, anglais, allemand ou italien.',
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'ContactPage', name: 'Contact', url: `${SITE}/fr/contact/`, about: { '@id': `${SITE}/#org` } },
      { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Portolan', email: 'bonjour@portolan.example', contactPoint: [
        { '@type': 'ContactPoint', telephone: '+33 4 94 00 00 00', contactType: 'sales', areaServed: 'FR', availableLanguage: ['French', 'English', 'German', 'Italian'] },
        { '@type': 'ContactPoint', telephone: '+377 93 00 00 00', contactType: 'sales', areaServed: 'MC', availableLanguage: ['French', 'English', 'German', 'Italian'] },
      ] },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/fr/` },
        { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE}/fr/contact/` },
      ] },
    ] },
    body,
  });

  return [['fr/contact/index.html', html]];
};
