// Page « Méthode » : les quatre temps en détail, le carnet de visite (40 points), les engagements,
// les deux bureaux, les questions fréquentes et la prise de rendez-vous.
// Appelé par build-flotte.cjs. Renvoie une liste [chemin, html].
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

module.exports = function pageMethode(t) {
  const { page, img, pad, consentement, SITE } = t;
  const root = '../../';

  // Images : la version dédiée à la page si elle existe, sinon une image provisoire du site
  const exists = (src, w) => fs.existsSync(path.join(ROOT, 'assets/img', `${src}-${w === 1024 ? 1024 : 1600}.webp`));
  const pick = (neuve, provisoire) => (exists(neuve.src, neuve.w) ? neuve : provisoire);
  const L = (src, w = 1536, h = 1024) => ({ src, w, h });
  const P = (src) => ({ src, w: 1024, h: 1536 });
  const pic = (image, opts) => {
    const html = img(image.src, { ...image, ...opts }, root);
    return image.w === 1024 ? html.replace(/-1600\.webp/g, '-1024.webp').replace('-900.webp 900w', '-700.webp 700w') : html;
  };

  const IMG = {
    hero: pick(L('methode/hero'), L('accueil/bureau')),
    heroMobile: exists('methode/hero-mobile', 1024) ? 'methode/hero-mobile' : null,
    temps: [
      pick(P('methode/ecoute'), P('accueil/ecoute')),
      pick(P('methode/selection'), P('accueil/selection')),
      pick(P('methode/essai-en-mer'), P('accueil/essai-en-mer')),
      pick(P('methode/remise-des-cles'), P('accueil/remise-des-cles')),
    ],
    sainttropez: pick(L('methode/bureau-saint-tropez'), L('accueil/bureau')),
    monaco: pick(L('methode/bureau-monaco'), L('galerie/mistral-blanc-diner')),
  };

  // ---------------------------------------------------------------------------------------------
  // Contenus
  // ---------------------------------------------------------------------------------------------
  const temps = [
    {
      titre: "L'écoute", duree: "Un rendez&#8209;vous d'une heure",
      texte: "Avant de parler de bateaux, nous parlons de vous. À Saint&#8209;Tropez, à Monaco ou chez vous, un courtier écoute la façon dont vous naviguerez vraiment : au mouillage ou en traversée, en famille ou entre amis, en juillet seulement ou toute la saison.",
      faisons: ["Vos zones, vos saisons, le nombre d'invités à bord", "Votre budget d'achat, et surtout celui d'exploitation", "Vos contraintes de calendrier, de pavillon et de fiscalité, avec vos conseils"],
      recevez: ['Un cahier des charges écrit, sous 48&#8239;heures', 'Une première estimation du coût annuel', 'Un calendrier réaliste, de la recherche au premier départ'],
    },
    {
      titre: 'La sélection', duree: 'Deux à six semaines',
      texte: "Le marché annoncé ne montre qu'une partie des bateaux. Nous interrogeons aussi les propriétaires, les capitaines et les chantiers que nous connaissons, puis nous visitons chaque yacht avant de vous le proposer.",
      faisons: ['Le tri du marché annoncé, en Méditerranée et au&#8209;delà', 'Les bateaux hors marché, par notre réseau', 'Une visite de chaque yacht, avec notre carnet de 40&nbsp;points'],
      recevez: ['Trois bateaux plutôt que trente', 'Un dossier par yacht, avec nos propres photos', "Ce que l'annonce ne dit pas, et notre avis franc"],
    },
    {
      titre: "L'essai en mer", duree: 'Une journée en mer, puis au chantier',
      texte: "Un yacht se juge là où il vivra. Nous organisons une sortie avec le capitaine entre Pampelonne et les îles d'Hyères, puis une expertise indépendante, coque hors de l'eau, avant tout engagement définitif.",
      faisons: ['Un essai des machines à pleine charge, au mouillage et au port', 'Une expertise indépendante de la coque et des machines', "L'analyse des huiles et la lecture du carnet d'entretien"],
      recevez: ["Le rapport complet de l'expert", 'Une liste chiffrée des travaux à prévoir', 'Les arguments précis de la négociation'],
    },
    {
      titre: 'La remise des clés', duree: 'Un à trois mois',
      texte: "Négociation, papiers, pavillon, équipage : un seul interlocuteur suit tout, jusqu'au jour où le capitaine vous accueille à bord. Et nous restons là pour la première saison, puis les suivantes.",
      faisons: ["La négociation et le protocole d'accord standard MYBA", 'Le dépôt sous séquestre, le pavillon, l&#8217;immatriculation et l&#8217;assurance', "Le recrutement d'un capitaine en qui vous aurez confiance"],
      recevez: ['Un yacht prêt à naviguer, papiers en règle', 'Un équipage choisi avec vous', 'Un courtier joignable, saison après saison'],
    },
  ];

  const carnet = [
    ['Coque et structure', ['Osmose et état de l’antifouling', 'Soudures, tôles et structure', 'Peinture et gelcoat', 'Anodes et protection cathodique', "Lignes d'arbre et hélices", 'Safrans et paliers', 'Passe&#8209;coques et vannes']],
    ['Machines', ['Heures moteur et historique d’entretien', 'Analyse des huiles', 'Essai à pleine charge', 'Groupes électrogènes', 'Stabilisateurs', "Propulseurs d'étrave", 'Circuits de refroidissement', 'Fuites, fumées et vibrations']],
    ['Électricité et électronique', ['Tableaux et câblage', 'Batteries et chargeurs', 'Navigation et radars', 'Communications par satellite', 'Domotique et divertissement', 'Éclairage intérieur et extérieur']],
    ['Pont et équipements', ['Épaisseur restante du teck', 'Guindeau, chaîne et mouillage', 'Grue et annexe', 'Jouets nautiques', 'Passerelle et plage de bain', 'Taud et mobilier extérieur']],
    ['Intérieurs et confort', ['Climatisation', 'Sanitaires et eau chaude', 'Dessalinisateur', 'Cuisine et buanderie', "Traces d'humidité", 'Bruit en navigation']],
    ['Papiers et pavillon', ['Titre de propriété et hypothèques', 'Pavillon et immatriculation', 'Statut au regard de la TVA', 'Classification et conformité', 'Historique des sinistres', "Contrats de l'équipage", "Carnet d'entretien"]],
  ];
  const nPoints = carnet.reduce((n, [, items]) => n + items.length, 0);

  const engagements = [
    ['Un seul interlocuteur', "Le courtier qui vous écoute le premier jour est celui qui vous remet les clés. Il connaît votre dossier, vos goûts, et le prénom de votre capitaine."],
    ['Trois bateaux plutôt que trente', "Nous ne vous montrons que les yachts que nous avons visités et que nous achèterions à votre place. Votre temps compte plus que le nombre d'annonces."],
    ["Ce que l'annonce ne dit pas", "Un moteur fatigué, un teck à refaire, une TVA mal réglée : nous vous le disons, y compris quand cela nous coûte une vente."],
    ['La discrétion', "Accord de confidentialité sur demande, visites en dehors des heures d'affluence, ventes conclues hors marché : votre projet reste le vôtre."],
    ['Des honoraires écrits', "Dans l'usage, la commission est payée par le vendeur. Elle est annoncée par écrit dès le premier jour, et si nous représentons aussi le vendeur, vous le savez tout de suite."],
    ['Une réponse sous 24&#8239;heures', "Week&#8209;end compris, en français, en anglais, en allemand ou en italien. En saison, un courtier reste joignable à toute heure."],
  ];

  const faqMethode = [
    ["Combien coûte votre accompagnement pour un acheteur&#8239;?", "En général, rien : dans l'usage de la profession, la commission est payée par le vendeur. Pour une recherche très particulière, un yacht à faire construire par exemple, nous convenons d'honoraires à l'avance et par écrit."],
    ['Faut&#8209;il signer une exclusivité&#8239;?', "Non, pour un acheteur. Pour un vendeur, nous recommandons un mandat exclusif : un seul courtier présente le bateau, au bon prix, sans qu'il circule partout."],
    ['Peut&#8209;on vous confier seulement une étape&#8239;?', "Oui. Certains clients ont déjà trouvé leur yacht et nous confient l'expertise, la négociation ou le recrutement de l'équipage."],
    ['Comment protégez&#8209;vous la confidentialité&#8239;?', "Nous signons un accord de confidentialité sur simple demande. Les dossiers ne quittent pas nos bureaux, et les ventes hors marché ne sont présentées qu'à des acheteurs que nous connaissons."],
    ["Et après l'achat&#8239;?", "Nous restons votre courtier : gestion de la mise en location, suivi de l'équipage, préparation de l'hivernage, et le jour venu, la revente."],
  ];

  // Réseau de lignes de rhumb : 16 roses sur un cercle, reliées entre elles, comme sur les portulans
  const rhumb = (() => {
    const c = 200; const r = 188; const n = 16;
    const pts = Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2 - Math.PI / 2;
      return [c + r * Math.cos(a), c + r * Math.sin(a)];
    });
    const lines = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const major = i % 4 === 0 || j % 4 === 0;
      lines.push(`<line class="${major ? 'is-major' : ''}" x1="${pts[i][0].toFixed(1)}" y1="${pts[i][1].toFixed(1)}" x2="${pts[j][0].toFixed(1)}" y2="${pts[j][1].toFixed(1)}"/>`);
    }
    const dots = pts.map(([x, y], k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${k % 4 === 0 ? 3.2 : 1.8}"/>`).join('');
    return `<svg class="mt-rhumb" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
          <circle class="mt-rhumb__ring" cx="200" cy="200" r="188"/>
          <g class="mt-rhumb__lines">${lines.join('')}</g>
          <g class="mt-rhumb__dots">${dots}</g>
          <g class="mt-rhumb__rose" transform="translate(200 200)"><path d="M0-46 7-7 46 0 7 7 0 46-7 7-46 0-7-7Z"/><path class="is-light" d="M0-46 7-7 0 0ZM46 0 7 7 0 0ZM0 46-7 7 0 0ZM-46 0-7-7 0 0Z"/></g>
        </svg>`;
  })();

  // ---------------------------------------------------------------------------------------------
  // Page
  // ---------------------------------------------------------------------------------------------
  const body = `
    <section class="pg-hero" aria-labelledby="pg-title">
      <figure class="pg-hero__media"><picture>${IMG.heroMobile ? `<source media="(max-width: 700px)" srcset="${root}assets/img/${IMG.heroMobile}-700.webp 700w, ${root}assets/img/${IMG.heroMobile}-1024.webp 1024w" sizes="100vw">` : ''}${img(IMG.hero.src, { ...IMG.hero, alt: '', lazy: false }, root)}</picture></figure>
      <div class="pg-hero__text">
        <nav class="crumbs" aria-label="Fil d'Ariane"><a href="../">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">Méthode</span></nav>
        <p class="kicker">Achat, vente et location · Saint&#8209;Tropez et Monaco</p>
        <h1 id="pg-title" class="pg-hero__title">Notre méthode</h1>
        <p class="pg-hero__lead">Les portulans étaient dessinés par ceux qui avaient navigué. Nous travaillons de la même façon : nous ne vous montrons que ce que nous avons vu.</p>
        <div class="pg-hero__actions"><a class="btn btn--light" href="#rendez-vous" data-magnetic>Prendre rendez&#8209;vous</a><a class="link" href="#temps">Les quatre temps</a></div>
      </div>
      <dl class="pg-hero__stats"><div><dt>temps, un interlocuteur</dt><dd>4</dd></div><div><dt>points vérifiés</dt><dd>${nPoints}</dd></div><div><dt>pour vous répondre</dt><dd>24&#8239;h</dd></div></dl>
    </section>

    <section class="pg-section mt-origin" aria-labelledby="origin-title">
      <div class="mt-origin__text">
        <p class="kicker">Pourquoi Portolan</p>
        <h2 id="origin-title" class="pg-statement serif" data-words>Une carte fiable ne se dessine pas depuis un bureau. Elle se trace en mer, mille après mille.</h2>
        <p class="pg-lead">Au Moyen Âge, les pilotes de Méditerranée notaient chaque cap, chaque distance, chaque abri. De ces relevés sont nés les portulans, les premières cartes marines dignes de confiance, reconnaissables à leurs roses des vents reliées par des lignes de rhumb.</p>
        <p class="pg-lead">Notre métier tient dans cette idée : visiter avant de conseiller, vérifier avant d'affirmer, et vous donner une carte exacte du marché plutôt qu'une liste d'annonces.</p>
      </div>
      <div class="mt-origin__chart">${rhumb}</div>
    </section>

    <section class="pg-section mt-temps" id="temps" aria-labelledby="temps-title">
      <header class="pg-head">
        <p class="kicker">Les quatre temps</p>
        <h2 id="temps-title" class="section-title">De la première conversation au premier départ</h2>
        <p class="pg-lead">Le même chemin pour un achat, une vente ou une location. Pour une semaine en mer, il tient en quelques jours&#8239;; pour un yacht à acheter, en quelques mois.</p>
      </header>
      ${temps.map((tp, k) => `
      <article class="mt-chapter" aria-labelledby="temps-${k}">
        <figure class="mt-chapter__media">${pic(IMG.temps[k], { alt: '', sizes: '(min-width: 960px) 42vw, 100vw' })}</figure>
        <div class="mt-chapter__body">
          <p class="mt-chapter__num" aria-hidden="true">${pad(k)}</p>
          <p class="mt-chapter__when">${tp.duree}</p>
          <h3 id="temps-${k}" class="mt-chapter__title">${tp.titre}</h3>
          <p class="mt-chapter__text">${tp.texte}</p>
          <div class="mt-chapter__lists">
            <div><h4>Ce que nous faisons</h4><ul>${tp.faisons.map((x) => `<li>${x}</li>`).join('')}</ul></div>
            <div><h4>Ce que vous recevez</h4><ul>${tp.recevez.map((x) => `<li>${x}</li>`).join('')}</ul></div>
          </div>
        </div>
      </article>`).join('')}
    </section>

    <section class="pg-section mt-carnet" aria-labelledby="carnet-title">
      <div class="mt-carnet__head">
        <header class="pg-head">
          <p class="kicker">Le carnet de visite</p>
          <h2 id="carnet-title" class="section-title">Ce que nous vérifions avant de vous montrer un yacht</h2>
          <p class="pg-lead">Chaque bateau que nous proposons a été visité par un courtier, carnet en main. Ce qui ne va pas figure dans votre dossier, noir sur blanc.</p>
        </header>
        <p class="mt-carnet__count" aria-hidden="true"><span data-count="${nPoints}">${nPoints}</span><small>points de contrôle</small></p>
      </div>
      <div class="mt-carnet__grid">
        ${carnet.map(([titre, items], k) => `<section class="mt-carnet__panel" aria-labelledby="carnet-${k}">
          <h3 id="carnet-${k}"><span>${pad(k)}</span>${titre}<small>${items.length}&nbsp;points</small></h3>
          <ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>
        </section>`).join('\n        ')}
      </div>
    </section>

    <section class="pg-section mt-engage" aria-labelledby="engage-title">
      <header class="pg-head">
        <p class="kicker">Nos engagements</p>
        <h2 id="engage-title" class="section-title">Six règles que nous ne négocions pas</h2>
      </header>
      <ol class="mt-engage__list">
        ${engagements.map(([titre, texte], k) => `<li><span class="mt-engage__n" aria-hidden="true">${pad(k)}</span><h3>${titre}</h3><p>${texte}</p></li>`).join('\n        ')}
      </ol>
    </section>

    <section class="pg-section mt-offices" aria-labelledby="offices-title">
      <header class="pg-head">
        <p class="kicker">Deux bureaux</p>
        <h2 id="offices-title" class="section-title">Soixante milles de côte, une seule équipe</h2>
      </header>
      <div class="mt-offices__grid">
        <article class="mt-office">
          <figure>${img(IMG.sainttropez.src, { ...IMG.sainttropez, alt: 'Le bureau Portolan sur le vieux port de Saint-Tropez', sizes: '(min-width: 960px) 45vw, 100vw' }, root)}</figure>
          <h3>Saint&#8209;Tropez</h3>
          <p class="mt-office__where">Quai Suffren, sur le vieux port</p>
          <p>Le port d'attache de la maison. Rendez&#8209;vous tous les jours en saison, du lundi au samedi le reste de l'année.</p>
        </article>
        <article class="mt-office">
          <figure>${img(IMG.monaco.src, { ...IMG.monaco, alt: 'La façade vert bouteille du bureau Portolan face à Port Hercule, à Monaco, à l’heure bleue', sizes: '(min-width: 960px) 45vw, 100vw' }, root)}</figure>
          <h3>Monaco</h3>
          <p class="mt-office__where">Face au port Hercule</p>
          <p>Pour les yachts de plus de quarante mètres et les clients de la Riviera. Rendez&#8209;vous sur demande, y compris à bord.</p>
        </article>
      </div>
    </section>

    <section class="pg-section" aria-labelledby="methode-faq">
      <header class="pg-head">
        <p class="kicker">Questions fréquentes</p>
        <h2 id="methode-faq" class="section-title">Travailler avec nous</h2>
      </header>
      <div class="pg-faq">
        ${faqMethode.map(([q, a]) => `<details class="pg-faq__item"><summary><span>${q}</span><i aria-hidden="true"></i></summary><div class="pg-faq__a"><p>${a}</p></div></details>`).join('\n        ')}
      </div>
    </section>

    <section class="pg-section pg-demande" id="rendez-vous" aria-labelledby="dem-title">
      <div class="pg-demande__intro">
        <p class="kicker">Prendre rendez&#8209;vous</p>
        <h2 id="dem-title" class="section-title">Commençons par vous écouter</h2>
        <p class="pg-lead">Une heure, à Saint&#8209;Tropez, à Monaco, chez vous ou en visio. Un courtier vous rappelle sous 24&#8239;heures pour fixer la date.</p>
      </div>
      <form class="form" action="#" novalidate data-yacht="">
        <fieldset class="form__group">
          <legend class="form__label">Votre projet</legend>
          <div class="form__chips">
            <label><input type="radio" name="projet" value="acheter" required><span>Acheter</span></label>
            <label><input type="radio" name="projet" value="vendre" required><span>Vendre</span></label>
            <label><input type="radio" name="projet" value="louer" required><span>Louer</span></label>
            <label><input type="radio" name="projet" value="autre" required><span>Autre chose</span></label>
          </div>
        </fieldset>
        <fieldset class="form__group">
          <legend class="form__label">Où se voir</legend>
          <div class="form__chips">
            <label><input type="radio" name="lieu" value="Saint-Tropez"><span>Saint&#8209;Tropez</span></label>
            <label><input type="radio" name="lieu" value="Monaco"><span>Monaco</span></label>
            <label><input type="radio" name="lieu" value="chez vous"><span>Chez vous</span></label>
            <label><input type="radio" name="lieu" value="visio"><span>En visio</span></label>
          </div>
        </fieldset>
        <div class="form__grid">
          <div class="form__group"><label class="form__label" for="m-nom">Nom</label><input class="form__input" id="m-nom" name="nom" autocomplete="name" required></div>
          <div class="form__group"><label class="form__label" for="m-mail">E&#8209;mail</label><input class="form__input" id="m-mail" name="email" type="email" autocomplete="email" required></div>
          <div class="form__group"><label class="form__label" for="m-tel">Téléphone <span>(facultatif)</span></label><input class="form__input" id="m-tel" name="tel" type="tel" autocomplete="tel"></div>
          <div class="form__group"><label class="form__label" for="m-langue">Langue</label><select class="form__input" id="m-langue" name="langue"><option>Français</option><option>English</option><option>Deutsch</option><option>Italiano</option></select></div>
          <div class="form__group form__group--wide"><label class="form__label" for="m-msg">Quelques mots sur votre projet <span>(facultatif)</span></label><textarea class="form__input" id="m-msg" name="message" rows="3" placeholder="Un yacht en vue, une saison à préparer, un bateau à vendre…"></textarea></div>
        </div>
        ${consentement}
        <button class="btn btn--light" type="submit" data-magnetic>Demander un rendez&#8209;vous</button>
        <p class="form__note" role="status" aria-live="polite"></p>
      </form>
    </section>`;

  const html = page({
    root, url: '/fr/methode/', bodyClass: 'inner page-methode', script: 'pages.js', image: IMG.hero.src, preload: { src: IMG.hero.src, mobile: IMG.heroMobile },
    alt: 'Une carte portulan dépliée sur la table à cartes du bureau Portolan, face au vieux port de Saint-Tropez à l’heure bleue',
    title: 'Notre méthode de courtage de yachts, de la recherche à la remise des clés | Portolan',
    description: `Comment Portolan accompagne l'achat, la vente et la location de yachts entre Saint-Tropez et Monaco : quatre temps, un seul interlocuteur, ${nPoints} points vérifiés à chaque visite, expertise indépendante et honoraires annoncés par écrit.`,
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', name: 'Notre méthode', url: `${SITE}/fr/methode/`, about: { '@id': `${SITE}/#org` } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/fr/` },
        { '@type': 'ListItem', position: 2, name: 'Méthode', item: `${SITE}/fr/methode/` },
      ] },
      { '@type': 'FAQPage', mainEntity: faqMethode.map(([q, a]) => ({ '@type': 'Question', name: q.replace(/&#8239;|&nbsp;/g, ' ').replace(/&#8209;/g, '-').replace(/&#8217;/g, '’'), acceptedAnswer: { '@type': 'Answer', text: a.replace(/&#8239;|&nbsp;/g, ' ').replace(/&#8209;/g, '-') } })) },
    ] },
    body,
  });

  return [['fr/methode/index.html', html]];
};
