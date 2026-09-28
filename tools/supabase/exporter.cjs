// Lit la flotte dans Supabase et prépare la génération des pages :
//   - data/flotte.json (même forme qu'avant, plus les dates déjà prises de chaque yacht)
//   - tools/i18n/<langue>-yachts.tsv (les traductions saisies dans l'espace directeur)
// Usage : node tools/supabase/exporter.cjs   (lancé automatiquement par tools/construire.cjs)
// Seule la clé publique est utilisée : on ne lit que ce que tout visiteur peut lire.
// Sans connexion Internet, le data/flotte.json existant est conservé et la construction continue.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'js/supabase.js'), 'utf8');
const URL_BASE = src.match(/SUPABASE_URL = '([^']+)'/)[1];
const CLE = src.match(/SUPABASE_CLE_PUBLIQUE = '([^']+)'/)[1];

// Même empreinte et même normalisation que tools/traduire.cjs
const norm = (s) => s.replace(/‑/g, '-').replace(/[  ]/g, ' ').replace(/&nbsp;/g, ' ').replace(/’/g, "'").replace(/\s+/g, ' ').trim();
const hash = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function lire(chemin, options = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${chemin}`, {
    ...options,
    headers: { apikey: CLE, 'Content-Type': 'application/json', ...options.headers },
  });
  if (!r.ok) throw new Error(`${chemin} : ${r.status} ${await r.text()}`);
  return r.json();
}

(async () => {
  let reglages; let lignes; let prises;
  try {
    [[reglages], lignes, prises] = await Promise.all([
      lire('reglages?select=*'),
      lire('yachts?select=*&publie=eq.true&order=ordre'),
      lire('rpc/disponibilites', { method: 'POST', body: '{}' }),
    ]);
  } catch (e) {
    console.warn(`Supabase injoignable (${e.message}) : data/flotte.json est conservé tel quel.`);
    return;
  }

  // Semaine de haute saison la plus tardive (pour l'affichage « du 3 juillet au 4 septembre »)
  const derniere = new Date(`${reglages.haute_fin}T12:00:00Z`); derniere.setUTCDate(derniere.getUTCDate() - 7);
  const saison = {
    annee: reglages.annee,
    debut: reglages.saison_debut,
    fin: reglages.saison_fin,
    haute: [reglages.haute_debut, derniere.toISOString().slice(0, 10)],
    hauteFin: reglages.haute_fin,
    minNuits: { haute: reglages.min_nuits_haute, basse: reglages.min_nuits_basse },
    heures: [reglages.heure_min.slice(0, 5), reglages.heure_max.slice(0, 5)],
    ports: reglages.ports,
  };

  const yachts = lignes.map((l) => {
    // Les étapes de la visite sont rangées en liste dans la base (l'ordre des clés d'un objet n'y est pas garanti)
    const visite = l.fiche.visite && { ...l.fiche.visite, pieces: Object.fromEntries((l.fiche.visite.pieces || []).map((p) => [p.cle, p.nom])) };
    if (visite) l.fiche = { ...l.fiche, visite };
    const dates = prises.filter((p) => p.yacht === l.slug).map(({ debut, fin, etat }) => ({ debut, fin, etat }));
    return {
      slug: l.slug,
      nom: l.nom,
      ...l.fiche,
      invites: l.invites,
      port: l.port,
      vente: l.vente,
      location: l.location_basse ? { basse: l.location_basse, haute: l.location_haute } : null,
      // Anciennes semaines (samedi) réservées ou en option, gardées pour les pages qui les utilisent encore
      reserve: dates.filter((d) => d.etat !== 'option').map((d) => d.debut),
      option: dates.filter((d) => d.etat === 'option').map((d) => d.debut),
      prises: dates,
    };
  });

  // Photos ajoutées depuis l'espace directeur (« supabase:camarat/abc ») : téléchargées une fois dans
  // assets/img/uploads/, pour que le site reste autonome et rapide
  let nouvelles = 0;
  const rapatrier = async (img) => {
    if (!img?.src?.startsWith('supabase:')) return;
    const chemin = img.src.slice(9);
    for (const taille of [900, 1600]) {
      const local = path.join(ROOT, 'assets/img/uploads', `${chemin}-${taille}.webp`);
      if (fs.existsSync(local)) continue;
      const r = await fetch(`${URL_BASE}/storage/v1/object/public/yachts/${chemin}-${taille}.webp`);
      if (!r.ok) throw new Error(`photo ${chemin}-${taille} : ${r.status}`);
      fs.mkdirSync(path.dirname(local), { recursive: true });
      fs.writeFileSync(local, Buffer.from(await r.arrayBuffer()));
      nouvelles++;
    }
    img.src = `uploads/${chemin}`;
  };
  for (const y of yachts) {
    await rapatrier(y.image);
    for (const g of y.galerie || []) await rapatrier(g);
  }
  if (nouvelles) console.log(`${nouvelles} fichiers de photos téléchargés depuis Supabase.`);

  const lisezmoi ='Fichier généré par tools/supabase/exporter.cjs à partir de la base Supabase : ne pas modifier à la main, passer par l\'espace directeur.';
  fs.writeFileSync(path.join(ROOT, 'data/flotte.json'), `${JSON.stringify({ _lisezmoi: lisezmoi, saison, yachts }, null, 2)}\n`);

  // Traductions des yachts : une ligne « empreinte traduction », pour le texte tel qu'il est écrit dans la page
  // (échappé) et tel qu'il est lu dans un attribut (non échappé)
  for (const lang of ['en', 'de', 'it']) {
    const out = new Map();
    for (const l of lignes) {
      for (const [fr, trad] of Object.entries(l.traductions?.[lang] || {})) {
        if (!trad || !trad.trim()) continue;
        const t = esc(trad).replace(/\s*\n\s*/g, ' ').trim();
        out.set(hash(norm(esc(fr))), t);
        out.set(hash(norm(fr)), t);
      }
    }
    const texte = [`# Portolan : traductions (${lang}) des yachts, générées depuis Supabase. Ne pas modifier à la main.`, ...[...out].map(([h, t]) => `${h} ${t}`)].join('\n');
    fs.writeFileSync(path.join(ROOT, `tools/i18n/${lang}-yachts.tsv`), `${texte}\n`);
  }

  console.log(`Supabase : ${yachts.length} yachts, ${prises.length} périodes déjà prises. data/flotte.json et traductions à jour.`);
})();
