// Page « Nos eaux » : la côte des îles d'Or à Monaco, dix mouillages sur une carte marine dessinée
// à partir des vraies coordonnées, les vents, les saisons et le mouillage responsable.
// Appelé par build-flotte.cjs. Renvoie une liste [chemin, html].
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

module.exports = function pageNosEaux(t) {
  const { page, img, pad, SITE } = t;
  const root = '../../';

  const exists = (src) => fs.existsSync(path.join(ROOT, 'assets/img', `${src}-1600.webp`));
  const L = (src, w = 1536, h = 1024) => ({ src, w, h });
  // Image dédiée si elle existe (eaux/<slug>), sinon une image provisoire du site
  const pick = (neuve, provisoire) => (exists(neuve) ? L(neuve) : provisoire);

  // ---------------------------------------------------------------------------------------------
  // La carte : projection simple des latitudes et longitudes (équirectangulaire, cos 43,4°)
  // ---------------------------------------------------------------------------------------------
  const LON0 = 6.02; const LON1 = 7.52; const LAT0 = 42.93; const LAT1 = 43.8;
  const KX = 690; const KY = 949;
  const W = Math.round((LON1 - LON0) * KX); const H = Math.round((LAT1 - LAT0) * KY);
  const P = ([lat, lon]) => [(lon - LON0) * KX, (LAT1 - lat) * KY];
  const poly = (pts) => pts.map((p, k) => { const [x, y] = P(p); return `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('') + 'Z';

  const cote = [[43.105, 6.02], [43.09, 6.08], [43.075, 6.12], [43.045, 6.125], [43.03, 6.105], [43.025, 6.14], [43.04, 6.165], [43.08, 6.16], [43.1, 6.19], [43.115, 6.24], [43.125, 6.29], [43.13, 6.33], [43.14, 6.37], [43.155, 6.42], [43.16, 6.47], [43.17, 6.52], [43.17, 6.55], [43.18, 6.58], [43.165, 6.61], [43.18, 6.645], [43.195, 6.665], [43.205, 6.69], [43.225, 6.675], [43.245, 6.69], [43.265, 6.69], [43.275, 6.66], [43.27, 6.635], [43.265, 6.6], [43.27, 6.58], [43.29, 6.59], [43.305, 6.635], [43.32, 6.67], [43.35, 6.7], [43.385, 6.72], [43.415, 6.74], [43.42, 6.77], [43.41, 6.8], [43.41, 6.845], [43.425, 6.87], [43.44, 6.9], [43.47, 6.925], [43.5, 6.935], [43.525, 6.95], [43.545, 6.99], [43.55, 7.02], [43.54, 7.045], [43.555, 7.06], [43.565, 7.09], [43.56, 7.115], [43.545, 7.135], [43.56, 7.14], [43.585, 7.13], [43.62, 7.145], [43.65, 7.17], [43.665, 7.2], [43.685, 7.24], [43.695, 7.27], [43.69, 7.295], [43.705, 7.31], [43.69, 7.32], [43.675, 7.33], [43.69, 7.34], [43.705, 7.345], [43.715, 7.37], [43.72, 7.4], [43.735, 7.425], [43.75, 7.46], [43.77, 7.52], [43.8, 7.52], [43.8, 6.02]];
  const iles = [
    [[43.0, 6.155], [43.01, 6.18], [43.015, 6.21], [43.01, 6.245], [43.0, 6.26], [42.99, 6.23], [42.99, 6.19], [42.995, 6.16]],
    [[43.005, 6.37], [43.015, 6.385], [43.01, 6.41], [42.995, 6.41], [42.995, 6.38]],
    [[43.02, 6.43], [43.035, 6.46], [43.045, 6.5], [43.04, 6.52], [43.025, 6.49], [43.015, 6.45]],
    [[43.52, 7.03], [43.525, 7.05], [43.52, 7.07], [43.513, 7.055], [43.515, 7.035]],
    [[43.508, 7.04], [43.51, 7.05], [43.504, 7.052], [43.502, 7.042]],
  ];
  // Deux roses des vents et leurs lignes de rhumb, comme sur les portulans
  const roses = [[43.05, 6.95], [43.4, 6.3]].map((c) => {
    const [cx, cy] = P(c);
    const lines = Array.from({ length: 16 }, (_, k) => {
      const a = (k / 16) * Math.PI * 2;
      return `<line x1="${cx.toFixed(0)}" y1="${cy.toFixed(0)}" x2="${(cx + Math.cos(a) * 1400).toFixed(0)}" y2="${(cy + Math.sin(a) * 1400).toFixed(0)}"${k % 4 === 0 ? ' class="is-major"' : ''}/>`;
    }).join('');
    return `${lines}<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="5"/>`;
  }).join('');

  // ---------------------------------------------------------------------------------------------
  // Les dix mouillages, d'ouest en est. Milles : distance approximative depuis Saint-Tropez
  // ---------------------------------------------------------------------------------------------
  const spots = [
    { slug: 'porquerolles', nom: 'Porquerolles', zone: "Îles d'Or", at: [43.022, 6.205], milles: 32,
      texte: "La plage d'Argent et la plage Notre&#8209;Dame, une eau que l'on croirait tropicale, des pins jusqu'au sable. On y passe la journée, et l'après&#8209;midi à vélo sur l'île.",
      pour: 'Baignade, déjeuner à bord, vélo', abri: 'Au nord de l’île par vent d’est', image: pick('eaux/porquerolles', L('galerie/solenne-mouillage')) },
    { slug: 'port-cros', nom: 'Port&#8209;Cros', zone: 'Parc national', at: [43.017, 6.418], milles: 25,
      texte: "L'île la plus sauvage de la côte, protégée depuis 1963. Le sentier sous&#8209;marin de la Palud, la baie de Port&#8209;Man, et un silence que l'on ne trouve nulle part ailleurs.",
      pour: 'Plongée libre, randonnée, calme', abri: 'Mouillage réglementé, sur bouées en été', image: pick('eaux/port-cros', L('louer/port-cros')) },
    { slug: 'cap-taillat', nom: 'Cap Taillat', zone: 'Presqu’île de Saint&#8209;Tropez', at: [43.172, 6.664], milles: 8,
      texte: "Un isthme de sable entre deux criques, protégé par le Conservatoire du littoral. Pas une construction à l'horizon, seulement le sentier côtier et les pins parasols.",
      pour: 'Crique sauvage, sentier du littoral', abri: 'Une crique de chaque côté selon le vent', image: pick('eaux/cap-taillat', L('bord/trois-quarts', 1600, 900)) },
    { slug: 'pampelonne', nom: 'Pampelonne', zone: 'Ramatuelle', at: [43.232, 6.69], milles: 4,
      texte: "Cinq kilomètres de sable face au large. Le premier mouillage de la semaine, le déjeuner dans un club de plage en tender, et le coucher de soleil depuis le pont.",
      pour: 'Clubs de plage, dîner à bord', abri: 'Bien abrité du mistral', image: pick('eaux/pampelonne', L('louer/pampelonne')) },
    { slug: 'saint-tropez', nom: 'Saint&#8209;Tropez', zone: 'Notre port d’attache', at: [43.278, 6.648], milles: 0,
      texte: "Le vieux port, le quai Suffren et notre bureau. On embarque le samedi en fin d'après&#8209;midi, on revient le vendredi soir pour un dernier dîner face au village.",
      pour: 'Embarquement, village, marchés', abri: 'Port abrité, places à réserver tôt', image: pick('eaux/saint-tropez', L('flotte/alize')) },
    { slug: 'esterel', nom: "L'Estérel", zone: 'Agay et Anthéor', at: [43.418, 6.888], milles: 15,
      texte: "Des calanques de porphyre rouge qui plongent dans une eau très bleue. On mouille au pied des roches, on se baigne depuis la plage arrière, et la lumière du soir embrase le massif.",
      pour: 'Calanques, baignade, paddle', abri: 'Criques abritées du vent d’ouest', image: pick('eaux/esterel', L('galerie/tramontane-calanque')) },
    { slug: 'lerins', nom: 'Îles de Lérins', zone: 'Au large de Cannes', at: [43.513, 7.046], milles: 27,
      texte: "Le plan d'eau entre Sainte&#8209;Marguerite et Saint&#8209;Honorat, turquoise sur fond de sable. Les moines y font encore leur vin, et Cannes n'est qu'à dix minutes de tender.",
      pour: 'Eau turquoise, monastère, Cannes', abri: 'Le chenal entre les deux îles', image: pick('eaux/lerins', L('flotte/castellane')) },
    { slug: 'cap-antibes', nom: "Cap d'Antibes", zone: 'Antibes et Juan&#8209;les&#8209;Pins', at: [43.55, 7.148], milles: 31,
      texte: "La Garoupe, ses villas cachées dans les pins, et Port Vauban où s'alignent les plus grands yachts de Méditerranée. Le soir, le vieil Antibes et ses remparts.",
      pour: 'Anse de la Garoupe, Port Vauban', abri: 'Côté ouest par vent d’est', image: pick('eaux/cap-antibes', L('galerie/castellane-beach-club')) },
    { slug: 'villefranche', nom: 'Villefranche', zone: 'Entre Nice et le cap Ferrat', at: [43.692, 7.314], milles: 45,
      texte: "La rade la plus profonde de la côte, entre les façades ocre du village et les villas du cap Ferrat. Un mouillage de carte postale, calme en toute saison.",
      pour: 'Rade abritée, village, cap Ferrat', abri: 'Excellent abri, sauf plein sud', image: pick('eaux/villefranche', L('galerie/mistral-blanc-jacuzzi')) },
    { slug: 'monaco', nom: 'Monaco', zone: 'Port Hercule', at: [43.731, 7.432], milles: 52,
      texte: "Notre second bureau, face au Rocher. Arrivée à l'heure bleue, dîner à bord quand la ville s'illumine, et le Grand Prix ou le Yacht Show vus depuis le pont.",
      pour: 'Port Hercule, Grand Prix, Yacht Show', abri: 'Port, sur réservation', image: pick('eaux/monaco', L('flotte/mistral-blanc')) },
  ];
  const st = spots.find((s) => s.slug === 'saint-tropez');
  const [stx, sty] = P(st.at);

  const pins = spots.map((s, k) => {
    const [x, y] = P(s.at);
    return `<g class="ne-pin${k === 0 ? ' is-active' : ''}${s.slug === 'saint-tropez' ? ' is-home' : ''}" data-spot="${k}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle class="ne-pin__halo" r="22"/><circle class="ne-pin__dot" r="8"/><text x="${s.slug === 'saint-tropez' ? -48 : 14}" y="${s.slug === 'saint-tropez' ? -8 : 30}">${pad(k)}</text></g>`;
  }).join('');
  // Route de Saint-Tropez vers chaque mouillage : une courbe qui passe au large
  const routes = spots.map((s) => {
    const [x, y] = P(s.at);
    const mx = (stx + x) / 2; const my = Math.max(sty, y) + 30 + Math.abs(x - stx) * 0.12;
    return `M${stx.toFixed(1)} ${sty.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  // Noms des villes, écrits sur la terre comme sur les portulans
  const villes = [['Hyères', [43.14, 6.21]], ['Le Lavandou', [43.185, 6.33]], ['Saint-Tropez', [43.3, 6.5]], ['Saint-Raphaël', [43.465, 6.66]], ['Cannes', [43.59, 6.93]], ['Antibes', [43.625, 7.06]], ['Nice', [43.74, 7.22]], ['Monaco', [43.78, 7.36]]]
    .map(([nom, at]) => { const [x, y] = P(at); return `<text x="${x.toFixed(0)}" y="${y.toFixed(0)}">${nom}</text>`; }).join('');

  const chart = `<svg class="ne-chart__svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="ne-chart-title">
            <title id="ne-chart-title">Carte de la côte, des îles d'Or à Monaco, avec nos dix mouillages</title>
            <defs><clipPath id="ne-sea"><rect width="${W}" height="${H}"/></clipPath></defs>
            <g class="ne-chart__rhumbs" clip-path="url(#ne-sea)">${roses}</g>
            <path class="ne-chart__land" d="${poly(cote)}"/>
            ${iles.map((i) => `<path class="ne-chart__land ne-chart__isle" d="${poly(i)}"/>`).join('')}
            <path class="ne-chart__route" d="${routes[0]}" data-routes='${JSON.stringify(routes)}'/>
            <g class="ne-chart__towns" aria-hidden="true">${villes}</g>
            ${pins}
          </svg>`;

  // ---------------------------------------------------------------------------------------------
  // Contenus
  // ---------------------------------------------------------------------------------------------
  const vents = [
    ['Le mistral', 'Nord&#8209;ouest', "Il descend la vallée du Rhône, fort et sec, et laisse derrière lui un ciel d'une pureté rare. Le capitaine cherche alors les mouillages à l'est des caps : Pampelonne, les criques de l'Estérel, Villefranche."],
    ["Le vent d'est", 'Est et sud&#8209;est', "Plus humide, il lève une houle longue. On se replie à l'ouest des caps et dans les rades profondes, ou l'on reste au port une matinée pour visiter le village."],
    ['La brise de mer', "L'après&#8209;midi", "Aux beaux jours, la terre chauffe et la mer souffle vers la côte après le déjeuner. C'est l'heure des voiliers, et celle où l'on change de mouillage pour la nuit."],
  ];
  const saisons = [
    ['Mai et juin', '18 à 22&nbsp;°C', "La côte s'éveille. Les mouillages sont libres, la lumière est longue, les tarifs de location sont ceux de la basse saison."],
    ['Juillet et août', '24 à 26&nbsp;°C', "La pleine saison. Les meilleurs yachts se réservent dès l'hiver, les ports affichent complet : un courtier qui connaît les capitaines fait la différence."],
    ['Septembre et octobre', '20 à 23&nbsp;°C', "Notre saison préférée. La mer est encore chaude, les foules sont parties, et Monaco accueille le Yacht Show."],
    ["De novembre à avril", "L'hivernage", "Les yachts rejoignent les chantiers. C'est le meilleur moment pour acheter : on visite au calme, on expertise hors de l'eau, on négocie sans la pression de l'été."],
  ];

  // ---------------------------------------------------------------------------------------------
  // Page
  // ---------------------------------------------------------------------------------------------
  const hero = pick('eaux/hero', L('galerie/tramontane-calanque'));
  const heroMobile = fs.existsSync(path.join(ROOT, 'assets/img/eaux/hero-mobile-1024.webp')) ? 'eaux/hero-mobile' : null;

  const body = `
    <section class="pg-hero" aria-labelledby="pg-title">
      <figure class="pg-hero__media"><picture>${heroMobile ? `<source media="(max-width: 700px)" srcset="${root}assets/img/${heroMobile}-700.webp 700w, ${root}assets/img/${heroMobile}-1024.webp 1024w" sizes="100vw">` : ''}${img(hero.src, { ...hero, alt: '', lazy: false }, root)}</picture></figure>
      <div class="pg-hero__text">
        <nav class="crumbs" aria-label="Fil d'Ariane"><a href="../">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">Nos eaux</span></nav>
        <p class="kicker">Mouillages et croisières sur la Côte d'Azur</p>
        <h1 id="pg-title" class="pg-hero__title">Nos eaux</h1>
        <p class="pg-hero__lead">Des îles d'Or à Monaco, soixante&#8209;dix milles de côte que nos capitaines connaissent crique par crique, selon le vent et la saison.</p>
        <div class="pg-hero__actions"><a class="btn btn--light" href="#carte" data-magnetic>Voir la carte</a><a class="link" href="../louer/">Louer un yacht</a></div>
      </div>
      <dl class="pg-hero__stats"><div><dt>mouillages choisis</dt><dd>${spots.length}</dd></div><div><dt>milles de côte</dt><dd>70</dd></div><div><dt>bureaux, deux ports</dt><dd>2</dd></div></dl>
    </section>

    <section class="pg-section pg-intro" aria-labelledby="eaux-intro">
      <p class="pg-statement serif" id="eaux-intro" data-words>Un bon mouillage ne se trouve pas sur une application. Il se choisit le matin, avec le capitaine, en regardant d'où vient le vent.</p>
    </section>

    <section class="pg-section ne-map" id="carte" aria-labelledby="carte-title">
      <header class="pg-head">
        <p class="kicker">La carte</p>
        <h2 id="carte-title" class="section-title">Dix mouillages que nous aimons</h2>
        <p class="pg-lead">D'ouest en est, des îles d'Or à Monaco. Les distances sont données en milles marins depuis notre bureau de Saint&#8209;Tropez.</p>
      </header>
      <div class="ne-map__layout">
        <div class="ne-chart" aria-hidden="false">
          ${chart}
          <p class="ne-chart__caption" aria-hidden="true"><span class="ne-chart__n">01</span> · <span class="ne-chart__name">${spots[0].nom}</span> · <span class="ne-chart__miles">${spots[0].milles}</span>&nbsp;milles</p>
        </div>
        <ol class="ne-spots">
          ${spots.map((s, k) => `<li class="ne-spot${k === 0 ? ' is-active' : ''}" id="${s.slug}" data-spot="${k}" data-miles="${s.milles}">
            <figure class="ne-spot__media">${img(s.image.src, { ...s.image, alt: '', sizes: '(min-width: 960px) 36vw, 90vw' }, root)}</figure>
            <p class="ne-spot__zone"><span>${pad(k)}</span>${s.zone}</p>
            <h3 class="ne-spot__name">${s.nom}</h3>
            <p class="ne-spot__text">${s.texte}</p>
            <dl class="ne-spot__facts">
              <div><dt>Depuis Saint&#8209;Tropez</dt><dd>${s.milles ? `${s.milles}&nbsp;milles` : 'Port d’attache'}</dd></div>
              <div><dt>Pour</dt><dd>${s.pour}</dd></div>
              <div><dt>Abri</dt><dd>${s.abri}</dd></div>
            </dl>
          </li>`).join('\n          ')}
        </ol>
      </div>
    </section>

    <section class="pg-section ne-winds" aria-labelledby="vents-title">
      <header class="pg-head">
        <p class="kicker">Les vents</p>
        <h2 id="vents-title" class="section-title">Pourquoi l'itinéraire change chaque matin</h2>
        <p class="pg-lead">Trois vents font la météo de la côte. Le capitaine les lit à l'aube, puis vous propose le mouillage du jour.</p>
      </header>
      <ol class="ne-winds__list">
        ${vents.map(([nom, dir, texte], k) => `<li><svg class="ne-winds__rose" viewBox="-30 -30 60 60" aria-hidden="true"><circle r="26"/><path d="M0-22 4 0 0 22-4 0Z" transform="rotate(${[315, 90, 200][k]})"/></svg><p class="ne-winds__dir">${dir}</p><h3>${nom}</h3><p>${texte}</p></li>`).join('\n        ')}
      </ol>
    </section>

    <section class="pg-section ne-seasons" aria-labelledby="saisons-title">
      <header class="pg-head">
        <p class="kicker">Les saisons</p>
        <h2 id="saisons-title" class="section-title">Quand naviguer, quand acheter</h2>
      </header>
      <ol class="ne-seasons__list">
        ${saisons.map(([nom, eau, texte], k) => `<li><p class="ne-seasons__n">${pad(k)}</p><h3>${nom}</h3><p class="ne-seasons__water">${k < 3 ? `Eau à ${eau}` : eau}</p><p>${texte}</p></li>`).join('\n        ')}
      </ol>
    </section>

    <section class="pg-section ne-care" aria-labelledby="care-title">
      <div class="ne-care__text">
        <p class="kicker">Mouiller sans abîmer</p>
        <h2 id="care-title" class="section-title">Les herbiers de posidonie</h2>
        <p class="pg-lead">Ces prairies sous&#8209;marines abritent les poissons, clarifient l'eau et retiennent le sable des plages. Une ancre de yacht peut en arracher des mètres carrés, et elles repoussent d'à peine quelques centimètres par an.</p>
        <p class="pg-lead">Depuis 2019, les navires de plus de vingt&#8209;quatre mètres ne peuvent plus mouiller dans les herbiers de la Méditerranée française. Nos capitaines connaissent les zones de sable et les bouées autorisées : vous profitez de la crique, elle reste intacte.</p>
      </div>
      <dl class="ne-care__facts">
        <div><dt>Plus de 24&nbsp;m</dt><dd>Mouillage interdit dans les herbiers</dd></div>
        <div><dt>1 à 6&nbsp;cm</dt><dd>La croissance d'un herbier en un an</dd></div>
        <div><dt>Port&#8209;Cros</dt><dd>Parc national depuis 1963</dd></div>
      </dl>
    </section>

    <section class="pg-section ne-cta" aria-labelledby="cta-title">
      <p class="kicker">Votre semaine</p>
      <h2 id="cta-title" class="section-title">Traçons ensemble votre itinéraire</h2>
      <p class="pg-lead">Dites&#8209;nous vos dates et vos envies : un courtier vous propose un yacht et une première route, que le capitaine ajustera chaque matin.</p>
      <div class="ne-cta__actions"><a class="btn btn--light" href="../louer/#demande" data-magnetic>Préparer une location</a><a class="link" href="../flotte/">Voir la flotte</a></div>
    </section>`;

  const html = page({
    root, url: '/fr/nos-eaux/', bodyClass: 'inner page-eaux', script: 'pages.js', image: hero.src, preload: { src: hero.src, mobile: heroMobile },
    alt: "La presqu'île de Saint-Tropez vue du ciel au coucher du soleil, un yacht au large du cap Camarat",
    title: "Mouillages et croisière sur la Côte d'Azur, des îles d'Or à Monaco | Portolan",
    description: `Les plus beaux mouillages de la Côte d'Azur : Porquerolles, Port-Cros, Pampelonne, Saint-Tropez, l'Estérel, les îles de Lérins, le cap d'Antibes, Villefranche et Monaco. Vents, saisons et mouillage responsable, par un courtier de Saint-Tropez.`,
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'ItemList', name: 'Dix mouillages de la Côte d’Azur', itemListElement: spots.map((s, k) => ({
        '@type': 'ListItem', position: k + 1,
        item: { '@type': 'TouristAttraction', name: s.nom.replace(/&#8209;/g, '-'), description: s.texte.replace(/&#8209;/g, '-'), geo: { '@type': 'GeoCoordinates', latitude: s.at[0], longitude: s.at[1] } },
      })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/fr/` },
        { '@type': 'ListItem', position: 2, name: 'Nos eaux', item: `${SITE}/fr/nos-eaux/` },
      ] },
    ] },
    body,
  });

  return [['fr/nos-eaux/index.html', html]];
};
