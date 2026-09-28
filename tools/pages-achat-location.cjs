// Pages « Acheter » et « Louer », générées avec le gabarit et les données de la flotte (data/flotte.json).
// Appelé par build-flotte.cjs, qui fournit les outils communs. Renvoie une liste [chemin, html].
module.exports = function pagesAchatLocation(t) {
  const { page, img, esc, euros, metres, nombre, pad, nbCabines, vendu, loue, saison, yachts, consentement, SITE } = t;
  const root = '../../';

  // ---------------------------------------------------------------------------------------------
  // Morceaux communs
  // ---------------------------------------------------------------------------------------------
  // imageMobile (facultative) : une version cadrée en hauteur, servie aux téléphones
  const hero = ({ image, imageMobile, kicker, title, lead, stats, crumb, actions }) => `
    <section class="pg-hero" aria-labelledby="pg-title">
      <figure class="pg-hero__media"><picture>${imageMobile ? `<source media="(max-width: 700px)" srcset="${root}assets/img/${imageMobile}-700.webp 700w, ${root}assets/img/${imageMobile}-1024.webp 1024w" sizes="100vw">` : ''}${img(image.src, { ...image, alt: '', lazy: false }, root)}</picture></figure>
      <div class="pg-hero__text">
        <nav class="crumbs" aria-label="Fil d'Ariane"><a href="../">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">${crumb}</span></nav>
        <p class="kicker">${kicker}</p>
        <h1 id="pg-title" class="pg-hero__title">${title}</h1>
        <p class="pg-hero__lead">${lead}</p>
        <div class="pg-hero__actions">${actions}</div>
      </div>
      <dl class="pg-hero__stats">${stats.map(([dd, dt]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join('')}</dl>
    </section>`;

  const head = (kicker, title, lead = '', id = '') => `
      <header class="pg-head">
        <p class="kicker">${kicker}</p>
        <h2${id ? ` id="${id}"` : ''} class="section-title">${title}</h2>
        ${lead ? `<p class="pg-lead">${lead}</p>` : ''}
      </header>`;

  const card = (y, mode) => `
        <li class="pg-card">
          <a href="../flotte/${y.slug}/" data-cursor="Voir">
            <figure>${img(y.image.src, { ...y.image, alt: '', sizes: '(min-width: 960px) 30vw, 90vw' }, root)}</figure>
            <p class="pg-card__yard">${esc(y.chantierCourt)}${y.type === 'voile' ? ' · voilier' : ''}</p>
            <h3 class="pg-card__name"><em>${esc(y.nom)}</em></h3>
            <p class="pg-card__meta">${metres(y.longueur)} · ${y.annee} · ${y.invites} invités · ${nbCabines(y)} cabines</p>
            <p class="pg-card__price">${mode === 'vente' ? euros(y.vente) : `${euros(y.location.basse)} à ${euros(y.location.haute)} <small>la semaine</small>`}</p>
          </a>
        </li>`;

  // Étapes : liste à gauche, image qui change à droite (collée à l'écran pendant la lecture)
  const steps = (items) => `
      <div class="pg-steps">
        <ol class="pg-steps__list">
          ${items.map(([title, text, image], k) => `<li class="pg-step${k === 0 ? ' is-active' : ''}" data-step="${k}">
            <span class="pg-step__n">${pad(k)}</span>
            <div><h3>${title}</h3><p>${text}</p></div>
          </li>`).join('\n          ')}
        </ol>
        <div class="pg-steps__visual" aria-hidden="true">
          ${items.map(([, , image], k) => pic(image, { alt: '', sizes: '(min-width: 960px) 45vw, 100vw', cls: k === 0 ? 'is-active' : '' })).join('\n          ')}
        </div>
      </div>`;

  const faq = (items) => `
      <div class="pg-faq">
        ${items.map(([q, a]) => `<details class="pg-faq__item"><summary><span>${q}</span><i aria-hidden="true"></i></summary><div class="pg-faq__a"><p>${a}</p></div></details>`).join('\n        ')}
      </div>`;
  const faqLd = (items) => ({
    '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q.replace(/&#8239;|&nbsp;|&#8209;/g, ' '), acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '').replace(/&#8239;|&nbsp;/g, ' ').replace(/&#8209;/g, '-') } })),
  });

  const crumbsLd = (name, url) => ({ '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/fr/` },
    { '@type': 'ListItem', position: 2, name, item: `${SITE}${url}` },
  ] });

  const I = (src, w = 1536, h = 1024) => ({ src, w, h });
  // Image : les portraits de l'accueil existent en 700 et 1024 px, les autres en 900 et 1600 px
  const pic = (image, opts) => {
    const html = img(image.src, { ...image, ...opts }, root);
    return image.w === 1024 ? html.replace(/-1600\.webp/g, '-1024.webp').replace('-900.webp 900w', '-700.webp 700w') : html;
  };
  const P = (src) => ({ src, w: 1024, h: 1536 });

  // =============================================================================================
  // LOUER
  // =============================================================================================
  const aLouer = yachts.filter(loue);
  const minLoc = Math.min(...aLouer.map((y) => y.location.basse));
  const semaine = [
    ['Samedi', 'Saint&#8209;Tropez, puis Pampelonne', "Embarquement au vieux port en fin d'après&#8209;midi. Premier mouillage dans la baie de Pampelonne, dîner à bord.", I('louer/pampelonne')],
    ['Dimanche', 'Porquerolles', "La plage d'Argent, les pins, une eau que l'on croirait tropicale. Déjeuner à bord, l'après&#8209;midi à vélo sur l'île.", I('galerie/solenne-mouillage')],
    ['Lundi', 'Port&#8209;Cros', "Le parc national et son sentier sous&#8209;marin. La journée la plus calme de la semaine.", I('louer/port-cros')],
    ['Mardi', "L'Estérel", "Les calanques de porphyre rouge. Mouillage au pied des roches, baignade depuis la plage arrière.", I('galerie/tramontane-calanque')],
    ['Mercredi', 'Les îles de Lérins', "Sainte&#8209;Marguerite et Saint&#8209;Honorat, le monastère et ses vignes. Le soir, Cannes à portée de tender.", I('flotte/castellane')],
    ['Jeudi', 'Monaco', "Arrivée à Port Hercule à l'heure bleue. Dîner à bord face au Rocher illuminé.", I('galerie/mistral-blanc-diner')],
    ['Vendredi', 'Retour à Saint&#8209;Tropez', "Le long de la côte, une dernière escale à Pampelonne. Dernier dîner face au village.", I('galerie/alize-cockpit')],
  ];

  const faqLouer = [
    ['Faut&#8209;il un permis bateau&#8239;?', "Non. Le yacht est mené par son capitaine et son équipage, qui connaissent chaque mouillage de la côte."],
    ["Peut&#8209;on embarquer ailleurs qu'à Saint&#8209;Tropez&#8239;?", "Oui : Monaco, Cannes, Antibes ou Saint&#8209;Raphaël. Des frais de livraison s'ajoutent selon la distance entre le port d'attache du yacht et votre port d'embarquement."],
    ['Combien de temps à l&#8217;avance faut&#8209;il réserver&#8239;?', "Pour juillet et août, dès l'automne ou l'hiver précédent : les meilleurs yachts partent vite. Mai, juin et septembre restent plus souples, et souvent plus beaux."],
    ['Peut&#8209;on louer moins d&#8217;une semaine&#8239;?', "Oui, hors haute saison, à partir de trois jours selon les yachts. Les plus petits se louent aussi à la journée."],
    ['Les enfants sont&#8209;ils les bienvenus&#8239;?', "Bien sûr. Nous prévenons l'équipage, qui prévoit les gilets adaptés et, sur demande, une nurse à bord."],
    ['Et si la météo se gâte&#8239;?', "Le capitaine adapte l'itinéraire chaque matin selon le vent. La côte offre toujours un abri : la semaine se déplace, elle ne se perd pas."],
    ["Qu'est&#8209;ce que l'avance sur frais (APA)&#8239;?", "Environ 30&nbsp;% du tarif, versés avant l'embarquement pour le carburant, les repas, les boissons et les ports. Le capitaine en tient le compte au jour le jour et vous rend le reliquat."],
  ];

  const louerBody = `${hero({
    image: I('louer/hero'),
    imageMobile: 'louer/hero-mobile',
    crumb: 'Louer',
    kicker: 'Location avec équipage · Saint&#8209;Tropez à Monaco',
    title: 'Louer un yacht',
    lead: "Une semaine entre les îles d'Or et Monaco, un équipage choisi, un itinéraire tracé chaque matin avec le capitaine selon le vent du jour.",
    actions: '<a class="btn btn--light" href="#demande" data-magnetic>Préparer une location</a><a class="link" href="#budget">Estimer le budget</a>',
    stats: [[aLouer.length, 'yachts à louer'], [`${nombre(minLoc / 1000)}&#8239;k€`, 'la semaine, dès'], [Math.max(...aLouer.map((y) => y.invites)), 'invités, jusqu&#8217;à']],
  })}

    <section class="pg-section pg-intro" aria-labelledby="louer-intro">
      <p class="pg-statement serif" id="louer-intro" data-words>Une location réussie ne tient pas au bateau seul. Elle tient au capitaine qui connaît la crique abritée, au chef qui sait ce que vous aimez, et au courtier qui a choisi les deux.</p>
    </section>

    <section class="pg-section pg-route" aria-labelledby="route-title">
      ${head('Une semaine type', 'De Saint&#8209;Tropez à Monaco, en sept escales', "Un itinéraire indicatif : le capitaine l'ajuste chaque matin selon le vent, vos envies et le rythme de vos invités.", 'route-title')}
      <div class="pg-route__layout">
        <ol class="pg-route__days">
          ${semaine.map(([jour, lieu, texte], k) => `<li class="pg-day${k === 0 ? ' is-active' : ''}" data-day="${k}">
            <p class="pg-day__when"><span>${pad(k)}</span>${jour}</p>
            <h3 class="pg-day__where">${lieu}</h3>
            <p class="pg-day__text">${texte}</p>
          </li>`).join('\n          ')}
        </ol>
        <div class="pg-route__visual" aria-hidden="true">
          ${semaine.map(([, , , image], k) => img(image.src, { ...image, alt: '', sizes: '(min-width: 960px) 50vw, 100vw', cls: k === 0 ? 'is-active' : '' }, root)).join('\n          ')}
          <p class="pg-route__caption"><span class="pg-route__n">01</span> / 07 · <span class="pg-route__place">Saint&#8209;Tropez, puis Pampelonne</span></p>
        </div>
      </div>
    </section>

    <section class="pg-section" aria-labelledby="louer-yachts">
      ${head('La flotte à louer', `${aLouer.length} yachts, de ${nombre(Math.min(...aLouer.map((y) => y.longueur)))} à ${nombre(Math.max(...aLouer.map((y) => y.longueur)))}&nbsp;mètres`, "Tarifs à la semaine, de la basse à la haute saison, avec équipage. Chaque fiche montre les semaines encore libres.", 'louer-yachts')}
      <ul class="pg-cards">${aLouer.map((y) => card(y, 'location')).join('')}
      </ul>
      <a class="link pg-more" href="../flotte/">Toute la flotte</a>
    </section>

    <section class="pg-section pg-budget" id="budget" aria-labelledby="budget-title">
      ${head('Budget', 'Ce que coûte vraiment une semaine', "Le tarif affiché n'est qu'une partie du budget. Choisissez un yacht et une période : voici l'engagement complet, sans surprise.", 'budget-title')}
      <div class="pg-budget__tool" data-yachts="${esc(JSON.stringify(aLouer.map((y) => ({ nom: y.nom, basse: y.location.basse, haute: y.location.haute }))))}">
        <div class="pg-budget__choices">
          <div class="form__group">
            <p class="form__label" id="b-yacht">Yacht</p>
            <div class="form__chips" role="radiogroup" aria-labelledby="b-yacht">
              ${aLouer.map((y, k) => `<label><input type="radio" name="b-yacht" value="${k}"${k === 0 ? ' checked' : ''}><span>${esc(y.nom)}</span></label>`).join('\n              ')}
            </div>
          </div>
          <div class="form__group">
            <p class="form__label" id="b-saison">Période</p>
            <div class="form__chips" role="radiogroup" aria-labelledby="b-saison">
              <label><input type="radio" name="b-saison" value="basse" checked><span>Mai, juin, septembre</span></label>
              <label><input type="radio" name="b-saison" value="haute"><span>Juillet, août</span></label>
            </div>
          </div>
        </div>
        <dl class="pg-budget__lines" aria-live="polite">
          <div><dt>Location de la semaine, avec équipage</dt><dd data-b="tarif">&nbsp;</dd></div>
          <div><dt>Avance sur frais (APA, environ 30&nbsp;%) <small>carburant, repas, boissons, ports ; le reliquat vous est rendu</small></dt><dd data-b="apa">&nbsp;</dd></div>
          <div><dt>TVA sur la location <small>20&nbsp;% dans les eaux françaises, selon l'itinéraire</small></dt><dd data-b="tva">&nbsp;</dd></div>
          <div class="pg-budget__total"><dt>Engagement total indicatif</dt><dd data-b="total">&nbsp;</dd></div>
        </dl>
        <p class="pg-note">Ordre de grandeur, hors gratification de l'équipage (d'usage 10 à 15&nbsp;% du tarif) et hors frais de livraison. Le devis exact vient avec le contrat.</p>
      </div>
    </section>

    <section class="pg-section" aria-labelledby="louer-steps">
      ${head('Comment se passe une location', 'De la première question au premier mouillage', '', 'louer-steps')}
      ${steps([
    ['Votre demande', "Vos dates, vos invités, vos envies. Un courtier vous répond sous 24&#8239;heures avec deux ou trois yachts, pas davantage.", P('louer/demande')],
    ["L'option", "Nous posons une option sans frais sur la semaine choisie, le temps que vous décidiez en famille ou entre amis.", P('louer/option')],
    ['Le contrat', "Un contrat standard MYBA, reconnu dans toute la Méditerranée. Acompte de 50&nbsp;% à la signature, solde un mois avant l'embarquement.", P('louer/contrat')],
    ['La préparation', "Menus, allergies, jouets nautiques, anniversaire à fêter : le capitaine et le chef préparent votre semaine avec nous.", P('louer/preparation')],
    ["L'embarquement", "Accueil à bord à Saint&#8209;Tropez ou à Monaco. Nous restons joignables toute la semaine, jusqu'au débarquement.", P('louer/embarquement')],
  ])}
    </section>

    <section class="pg-section" aria-labelledby="louer-faq">
      ${head('Questions fréquentes', 'Avant de monter à bord', '', 'louer-faq')}
      ${faq(faqLouer)}
    </section>

    <section class="pg-section pg-demande" id="demande" aria-labelledby="dem-title">
      <div class="pg-demande__intro">
        <p class="kicker">Préparer une location</p>
        <h2 id="dem-title" class="section-title">Parlons de votre semaine</h2>
        <p class="pg-lead">Un courtier vous rappelle sous 24&#8239;heures avec deux ou trois yachts disponibles à vos dates.</p>
      </div>
      <form class="form" action="#" novalidate data-yacht="">
        <input type="hidden" name="projet" value="louer">
        <div class="form__grid">
          <div class="form__group"><label class="form__label" for="l-arrivee">Arrivée souhaitée</label><input class="form__input" id="l-arrivee" name="arrivee" type="date" min="${saison.debut}" max="${saison.fin}"></div>
          <div class="form__group"><label class="form__label" for="l-nuits">Durée</label><select class="form__input" id="l-nuits" name="duree"><option>Une semaine</option><option>Deux semaines</option><option>Quelques jours</option><option>À définir</option></select></div>
        </div>
        <fieldset class="form__group">
          <legend class="form__label">Invités</legend>
          <div class="form__chips">
            <label><input type="radio" name="invites" value="jusqu'à 6"><span>Jusqu'à 6</span></label>
            <label><input type="radio" name="invites" value="8 à 10"><span>8 à 10</span></label>
            <label><input type="radio" name="invites" value="12"><span>12</span></label>
          </div>
        </fieldset>
        <div class="form__grid">
          <div class="form__group"><label class="form__label" for="l-yacht">Yacht</label><select class="form__input" id="l-yacht" name="yacht"><option value="">À nous de vous conseiller</option>${aLouer.map((y) => `<option>${esc(y.nom)}</option>`).join('')}</select></div>
          <div class="form__group"><label class="form__label" for="l-embarq">Embarquement</label><select class="form__input" id="l-embarq" name="embarquement"><option>Saint-Tropez</option><option>Monaco</option><option>Cannes ou Antibes</option><option>À définir</option></select></div>
          <div class="form__group"><label class="form__label" for="l-nom">Nom</label><input class="form__input" id="l-nom" name="nom" autocomplete="name" required></div>
          <div class="form__group"><label class="form__label" for="l-mail">E&#8209;mail</label><input class="form__input" id="l-mail" name="email" type="email" autocomplete="email" required></div>
          <div class="form__group"><label class="form__label" for="l-tel">Téléphone <span>(facultatif)</span></label><input class="form__input" id="l-tel" name="tel" type="tel" autocomplete="tel"></div>
          <div class="form__group"><label class="form__label" for="l-langue">Langue</label><select class="form__input" id="l-langue" name="langue"><option>Français</option><option>English</option><option>Deutsch</option><option>Italiano</option></select></div>
          <div class="form__group form__group--wide"><label class="form__label" for="l-msg">Vos envies <span>(facultatif)</span></label><textarea class="form__input" id="l-msg" name="message" rows="3" placeholder="Une occasion à fêter, des enfants à bord, un mouillage dont vous rêvez…"></textarea></div>
        </div>
        ${consentement}
        <button class="btn btn--light" type="submit" data-magnetic>Envoyer ma demande</button>
        <p class="form__note" role="status" aria-live="polite"></p>
      </form>
    </section>`;

  const louer = page({
    root, url: '/fr/louer/', bodyClass: 'inner page-louer', script: 'pages.js', image: 'louer/hero', preload: { src: 'louer/hero', mobile: 'louer/hero-mobile' },
    alt: "Le yacht Camarat au mouillage dans une crique turquoise des îles d'Or, plage arrière baissée",
    title: 'Location de yacht avec équipage à Saint-Tropez et Monaco | Portolan',
    description: `Louer un yacht avec équipage sur la Côte d'Azur : ${aLouer.length} yachts de ${nombre(Math.min(...aLouer.map((y) => y.longueur)))} à ${nombre(Math.max(...aLouer.map((y) => y.longueur)))} m, dès ${nombre(minLoc)} € la semaine. Itinéraire de Saint-Tropez à Monaco, budget complet, disponibilités.`,
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Service', name: 'Location de yachts avec équipage', provider: { '@id': `${SITE}/#org` }, areaServed: ['Saint-Tropez', 'Porquerolles', 'Cannes', 'Monaco', "Côte d'Azur"], offers: aLouer.map((y) => ({ '@type': 'Offer', name: `Location de ${y.nom}, la semaine`, price: y.location.basse, priceCurrency: 'EUR', url: `${SITE}/fr/flotte/${y.slug}/` })) },
      crumbsLd('Louer', '/fr/louer/'),
      faqLd(faqLouer),
    ] },
    body: louerBody,
  });

  // =============================================================================================
  // ACHETER
  // =============================================================================================
  const aVendre = yachts.filter(vendu);
  const prixV = aVendre.map((y) => y.vente);
  const faqAcheter = [
    ['Faut&#8209;il passer par un courtier pour acheter un yacht&#8239;?', "Ce n'est pas obligatoire, mais le courtier vérifie ce que l'annonce ne dit pas : l'historique, l'état réel, la situation fiscale, et les bateaux qui ne sont pas annoncés."],
    ['Qui paie la commission du courtier&#8239;?', "Dans l'usage de la profession, la commission de vente est à la charge du vendeur. Pour l'acheteur, notre accompagnement ne s'ajoute pas au prix."],
    ["Quels frais s'ajoutent au prix d'achat&#8239;?", "L'expertise indépendante, l'immatriculation et le pavillon, les éventuels droits ou TVA selon la situation du bateau, et la première mise en service. Nous les chiffrons avant l'offre."],
    ['Combien coûte un yacht à l&#8217;année&#8239;?', "Environ 10&nbsp;% de sa valeur, selon sa taille, son âge et son usage : équipage, entretien, assurance, place de port et carburant. Le simulateur ci&#8209;dessus en donne l'ordre de grandeur."],
    ['Peut&#8209;on louer son yacht pour réduire les frais&#8239;?', "Oui. Une dizaine de semaines de location par saison couvre souvent une large part des frais d'exploitation. Nous gérons la mise en location et les réservations."],
    ["Combien de temps faut&#8209;il pour acheter&#8239;?", "Un à trois mois en général, de la première visite à la remise des clés : le temps de l'expertise, de l'essai en mer et des formalités."],
    ['Peut&#8209;on acheter depuis l&#8217;étranger&#8239;?', "Oui. Nous organisons les visites en vidéo, l'expertise et les formalités, et vous accueillons pour l'essai en mer. Nous travaillons en français, anglais, allemand et italien."],
  ];

  const acheterBody = `${hero({
    image: I('acheter/hero'),
    imageMobile: 'acheter/hero-mobile',
    crumb: 'Acheter',
    kicker: 'Achat, vente et recherche de yachts',
    title: 'Acheter un yacht',
    lead: "Nous cherchons le bateau avant qu'il ne soit annoncé, nous le visitons avant vous, et nous restons à vos côtés jusqu'au premier départ.",
    actions: '<a class="btn btn--light" href="#demande" data-magnetic>Confier une recherche</a><a class="link" href="#vendre">Vendre votre yacht</a>',
    stats: [[aVendre.length, 'yachts à vendre'], ['1/3', 'de nos ventes hors marché'], ['4', 'langues au bureau']],
  })}

    <section class="pg-section pg-intro" aria-labelledby="acheter-intro">
      <p class="pg-statement serif" id="acheter-intro" data-words>Trois bateaux plutôt que trente. Nous les avons visités, nous connaissons leur histoire, et nous vous disons aussi ce que les annonces taisent.</p>
    </section>

    <section class="pg-section" aria-labelledby="vente-yachts">
      ${head('À vendre', `${aVendre.length} yachts, de ${nombre(Math.min(...prixV) / 1e6)} à ${nombre(Math.max(...prixV) / 1e6)}&nbsp;millions d'euros`, "Chacun a été visité et essayé par nos courtiers. D'autres, non annoncés, vous sont présentés sur rendez&#8209;vous.", 'vente-yachts')}
      <ul class="pg-cards">${aVendre.map((y) => card(y, 'vente')).join('')}
      </ul>
      <a class="link pg-more" href="../flotte/">Toute la flotte</a>
    </section>

    <section class="pg-section" aria-labelledby="achat-steps">
      ${head("L'accompagnement", 'De la recherche à la remise des clés', "Un seul interlocuteur du premier rendez&#8209;vous au premier départ, et après.", 'achat-steps')}
      ${steps([
    ['Le cahier des charges', "Votre façon de naviguer, vos invités, vos zones, votre budget d'achat et d'exploitation. Une heure qui évite des mois de recherche.", P('acheter/cahier-des-charges')],
    ['La recherche', "Le marché annoncé et, surtout, celui qui ne l'est pas : un tiers de nos ventes se conclut avant toute mise en ligne.", P('acheter/recherche')],
    ['Les visites', "Nous visitons avant vous, puis avec vous. Vous ne voyez que les bateaux qui valent le déplacement.", P('acheter/visites')],
    ["L'offre", "Négociation, protocole d'accord standard MYBA, dépôt de 10&nbsp;% sous séquestre : le cadre qui protège acheteur et vendeur.", P('acheter/offre')],
    ["L'essai en mer et l'expertise", "Une sortie avec le capitaine, puis une expertise indépendante de la coque et des machines, avant tout engagement définitif.", P('acheter/expertise')],
    ["Le pavillon et l'équipage", "Choix du pavillon avec vos conseils, immatriculation, assurance, et recrutement d'un capitaine en qui vous aurez confiance.", P('acheter/pavillon')],
    ['La remise des clés', "Le bateau est prêt, l'équipage aussi. Nous restons là pour la première saison, et les suivantes.", P('acheter/premier-depart')],
  ])}
    </section>

    <section class="pg-section pg-cost" id="cout" aria-labelledby="cout-title">
      ${head("Le coût d'un yacht", 'Ce que coûte un yacht à l&#8217;année', "Un repère de la profession : environ 10&nbsp;% de sa valeur chaque année. Faites glisser pour voir l'ordre de grandeur.", 'cout-title')}
      <div class="pg-cost__tool">
        <div class="pg-cost__input">
          <label class="form__label" for="c-prix">Prix d'achat</label>
          <output class="pg-cost__price serif" for="c-prix">10&nbsp;M€</output>
          <input type="range" id="c-prix" min="2" max="60" step="1" value="10">
          <p class="pg-cost__range"><span>2&nbsp;M€</span><span>60&nbsp;M€</span></p>
        </div>
        <div class="pg-cost__result" aria-live="polite">
          <p class="form__label">Frais annuels estimés</p>
          <p class="pg-cost__total serif"><span data-c="min">&nbsp;</span> à <span data-c="max">&nbsp;</span></p>
          <ul class="pg-cost__bars">
            <li data-part="0.40"><span>Équipage</span><b></b><em></em></li>
            <li data-part="0.20"><span>Entretien et chantier</span><b></b><em></em></li>
            <li data-part="0.12"><span>Place de port</span><b></b><em></em></li>
            <li data-part="0.10"><span>Assurance</span><b></b><em></em></li>
            <li data-part="0.10"><span>Carburant</span><b></b><em></em></li>
            <li data-part="0.08"><span>Divers et imprévus</span><b></b><em></em></li>
          </ul>
          <p class="pg-note">Ordre de grandeur pour un yacht à moteur récent, navigant l'été en Méditerranée. Une location d'une dizaine de semaines par saison peut en couvrir une large part.</p>
        </div>
      </div>
    </section>

    <section class="pg-section pg-sell" id="vendre" aria-labelledby="vendre-title">
      <figure class="pg-sell__media">${pic(P('acheter/vendre'), { alt: "Un yacht à coque bleu nuit, seul à quai la nuit dans le port d'Antibes", sizes: '(min-width: 960px) 40vw, 100vw' })}</figure>
      <div class="pg-sell__text">
        <p class="kicker">Vendre</p>
        <h2 id="vendre-title" class="section-title">Vendre votre yacht, en toute discrétion</h2>
        <p class="pg-lead">Estimation confidentielle sous 72&#8239;heures. Mise en vente annoncée ou hors marché, auprès des acheteurs que nous accompagnons déjà.</p>
        <form class="form pg-sell__form" action="#" novalidate data-yacht="">
          <input type="hidden" name="projet" value="vendre">
          <div class="form__grid">
            <div class="form__group"><label class="form__label" for="v-chantier">Chantier et modèle</label><input class="form__input" id="v-chantier" name="chantier" placeholder="Benetti, Sanlorenzo, Perini…"></div>
            <div class="form__group"><label class="form__label" for="v-annee">Année</label><input class="form__input" id="v-annee" name="annee" inputmode="numeric" placeholder="2019"></div>
            <div class="form__group"><label class="form__label" for="v-long">Longueur</label><input class="form__input" id="v-long" name="longueur" placeholder="34 m"></div>
            <div class="form__group"><label class="form__label" for="v-port">Port d'attache</label><input class="form__input" id="v-port" name="port" placeholder="Saint-Tropez, Antibes, Monaco…"></div>
            <div class="form__group"><label class="form__label" for="v-nom">Nom</label><input class="form__input" id="v-nom" name="nom" autocomplete="name" required></div>
            <div class="form__group"><label class="form__label" for="v-mail">E&#8209;mail</label><input class="form__input" id="v-mail" name="email" type="email" autocomplete="email" required></div>
          </div>
          ${consentement}
          <button class="btn btn--light" type="submit" data-magnetic>Demander une estimation</button>
          <p class="form__note" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>

    <section class="pg-section" aria-labelledby="acheter-faq">
      ${head('Questions fréquentes', "Avant d'acheter", '', 'acheter-faq')}
      ${faq(faqAcheter)}
    </section>

    <section class="pg-section pg-demande" id="demande" aria-labelledby="dem-title">
      <div class="pg-demande__intro">
        <p class="kicker">Confier une recherche</p>
        <h2 id="dem-title" class="section-title">Décrivez&#8209;nous le yacht que vous cherchez</h2>
        <p class="pg-lead">Un courtier vous rappelle sous 24&#8239;heures avec une première sélection, annoncée ou non.</p>
      </div>
      <form class="form" action="#" novalidate data-yacht="">
        <input type="hidden" name="projet" value="acheter">
        <fieldset class="form__group">
          <legend class="form__label">Type</legend>
          <div class="form__chips">
            <label><input type="radio" name="type" value="moteur"><span>Yacht à moteur</span></label>
            <label><input type="radio" name="type" value="voile"><span>Voilier</span></label>
            <label><input type="radio" name="type" value="indifférent"><span>Les deux</span></label>
          </div>
        </fieldset>
        <fieldset class="form__group">
          <legend class="form__label">Budget</legend>
          <div class="form__chips">
            <label><input type="radio" name="budget" value="< 5 M€"><span>Moins de 5&nbsp;M€</span></label>
            <label><input type="radio" name="budget" value="5-15 M€"><span>5 à 15&nbsp;M€</span></label>
            <label><input type="radio" name="budget" value="15-40 M€"><span>15 à 40&nbsp;M€</span></label>
            <label><input type="radio" name="budget" value="> 40 M€"><span>Plus de 40&nbsp;M€</span></label>
          </div>
        </fieldset>
        <div class="form__grid">
          <div class="form__group"><label class="form__label" for="a-nom">Nom</label><input class="form__input" id="a-nom" name="nom" autocomplete="name" required></div>
          <div class="form__group"><label class="form__label" for="a-mail">E&#8209;mail</label><input class="form__input" id="a-mail" name="email" type="email" autocomplete="email" required></div>
          <div class="form__group"><label class="form__label" for="a-tel">Téléphone <span>(facultatif)</span></label><input class="form__input" id="a-tel" name="tel" type="tel" autocomplete="tel"></div>
          <div class="form__group"><label class="form__label" for="a-langue">Langue</label><select class="form__input" id="a-langue" name="langue"><option>Français</option><option>English</option><option>Deutsch</option><option>Italiano</option></select></div>
          <div class="form__group form__group--wide"><label class="form__label" for="a-msg">Ce qui compte pour vous <span>(facultatif)</span></label><textarea class="form__input" id="a-msg" name="message" rows="3" placeholder="Nombre d'invités, zones de navigation, échéance, chantiers préférés…"></textarea></div>
        </div>
        ${consentement}
        <button class="btn btn--light" type="submit" data-magnetic>Confier ma recherche</button>
        <p class="form__note" role="status" aria-live="polite"></p>
      </form>
    </section>`;

  const acheter = page({
    root, url: '/fr/acheter/', bodyClass: 'inner page-acheter', script: 'pages.js', image: 'acheter/hero', preload: { src: 'acheter/hero', mobile: 'acheter/hero-mobile' },
    alt: "Le yacht Camarat à quai dans le vieux port de Saint-Tropez à l'aube, la passerelle baissée",
    title: "Achat de yacht sur la Côte d'Azur, de Saint-Tropez à Monaco | Portolan",
    description: `Acheter un yacht avec un courtier de Saint-Tropez et Monaco : ${aVendre.length} yachts à vendre de ${nombre(Math.min(...prixV) / 1e6)} à ${nombre(Math.max(...prixV) / 1e6)} M€, recherche hors marché, expertise, essai en mer, coût annuel. Vendre votre yacht en toute discrétion.`,
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Service', name: 'Achat et vente de yachts', provider: { '@id': `${SITE}/#org` }, areaServed: ['Saint-Tropez', 'Cannes', 'Antibes', 'Monaco', "Côte d'Azur"], offers: aVendre.map((y) => ({ '@type': 'Offer', name: `Yacht ${y.nom}`, price: y.vente, priceCurrency: 'EUR', url: `${SITE}/fr/flotte/${y.slug}/` })) },
      crumbsLd('Acheter', '/fr/acheter/'),
      faqLd(faqAcheter),
    ] },
    body: acheterBody,
  });

  return [['fr/louer/index.html', louer], ['fr/acheter/index.html', acheter]];
};
