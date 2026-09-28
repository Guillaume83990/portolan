// Import initial : transforme data/flotte.json (et les traductions déjà écrites) en SQL pour Supabase.
// Usage : node tools/supabase/seed-depuis-flotte.cjs  →  supabase/seed/01_flotte.sql
// Les semaines « réservées » et « en option » du calendrier deviennent des réservations de démonstration.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const { saison, yachts } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/flotte.json'), 'utf8'));

// Même empreinte et même normalisation que tools/traduire.cjs
const norm = (s) => s.replace(/‑/g, '-').replace(/[  ]/g, ' ').replace(/&nbsp;/g, ' ').replace(/’/g, "'").replace(/\s+/g, ' ').trim();
const hash = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const dicts = {};
for (const lang of ['en', 'de', 'it']) {
  dicts[lang] = {};
  for (const f of fs.readdirSync(path.join(ROOT, 'tools/i18n')).filter((n) => n.startsWith(lang) && n.endsWith('.tsv'))) {
    for (const line of fs.readFileSync(path.join(ROOT, 'tools/i18n', f), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([0-9a-f]{8}) (.*)$/);
      if (m) dicts[lang][m[1]] = m[2];
    }
  }
}

// Tous les textes d'une fiche (hors identifiants techniques)
const TECH = new Set(['slug', 'src', 'dir', 'affiche', 'type']);
function textes(v, key, out = new Set()) {
  if (typeof v === 'string') { if (!TECH.has(key) && /[a-zà-ÿ]{2}/i.test(v)) out.add(v); }
  else if (Array.isArray(v)) v.forEach((x) => textes(x, key, out));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => textes(x, k, out));
  return out;
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const jq = (o) => `${q(JSON.stringify(o))}::jsonb`;

let manquants = 0;
let trouves = 0;
const lignes = [];
lignes.push('-- Généré par tools/supabase/seed-depuis-flotte.cjs, ne pas modifier à la main');
lignes.push('begin;');

// Réglages : nuits de haute saison = semaines qui commencent entre haute[0] et haute[1] inclus
const hauteFin = new Date(`${saison.haute[1]}T12:00:00Z`); hauteFin.setUTCDate(hauteFin.getUTCDate() + 7);
lignes.push(`insert into public.reglages (annee, saison_debut, saison_fin, haute_debut, haute_fin) values (${saison.annee}, ${q(saison.debut)}, ${q(saison.fin)}, ${q(saison.haute[0])}, ${q(hauteFin.toISOString().slice(0, 10))})
  on conflict (id) do update set annee = excluded.annee, saison_debut = excluded.saison_debut, saison_fin = excluded.saison_fin, haute_debut = excluded.haute_debut, haute_fin = excluded.haute_fin;`);

yachts.forEach((y, i) => {
  const { slug, nom, invites, port, vente, location, reserve, option, prises, ...reste } = y;
  // Étapes de la visite en liste : la base ne garde pas l'ordre des clés d'un objet
  if (reste.visite) reste.visite = { ...reste.visite, pieces: Object.entries(reste.visite.pieces).map(([cle, nom]) => ({ cle, nom })) };
  const traductions = { en: {}, de: {}, it: {} };
  for (const t of textes({ nom, port, ...reste })) {
    for (const lang of ['en', 'de', 'it']) {
      const d = dicts[lang];
      const hit = d[hash(norm(esc(t)))] ?? d[hash(norm(t))];
      if (hit != null) { traductions[lang][t] = unesc(hit); trouves++; } else manquants++;
    }
  }
  lignes.push(`insert into public.yachts (slug, ordre, nom, invites, port, vente, location_basse, location_haute, fiche, traductions) values (${q(slug)}, ${i + 1}, ${q(nom)}, ${invites}, ${q(port)}, ${vente ?? 'null'}, ${location?.basse ?? 'null'}, ${location?.haute ?? 'null'}, ${jq(reste)}, ${jq(traductions)})
  on conflict (slug) do update set ordre = excluded.ordre, nom = excluded.nom, invites = excluded.invites, port = excluded.port, vente = excluded.vente, location_basse = excluded.location_basse, location_haute = excluded.location_haute, fiche = excluded.fiche, traductions = excluded.traductions;`);
});

// Réservations de démonstration (clients fictifs), prix calculé par la base
const CLIENTS = [
  ['M. et Mme Lindqvist', 'en', '10:00', 12], ['Famille Aldobrandini', 'it', '11:00', 10], ['M. Hartmann', 'de', '15:00', 8],
  ['Mme Okafor', 'en', '12:00', 6], ['M. Delcourt', 'fr', '16:00', 10], ['Famille Van der Berg', 'en', '14:00', 12],
  ['M. et Mme Rossi', 'it', '10:30', 8], ['Mme de Villeneuve', 'fr', '17:00', 6], ['M. Al-Harbi', 'en', '11:30', 12],
  ['Famille Schneider', 'de', '15:30', 10], ['M. Moreau', 'fr', '13:00', 8], ['Mme Castellani', 'it', '16:30', 6],
];
let c = 0;
lignes.push('delete from public.reservations where client is null and client_email like \'%@exemple.com\';');
for (const y of yachts.filter((x) => x.location)) {
  for (const [statut, semaines] of [['confirmee', y.reserve], ['en_attente', y.option]]) {
    for (const debut of semaines) {
      const [nomClient, langue, heure, inv] = CLIENTS[c++ % CLIENTS.length];
      const fin = new Date(`${debut}T12:00:00Z`); fin.setUTCDate(fin.getUTCDate() + 7);
      const email = `${nomClient.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(m\.|mme|m\. et mme|famille) /, '').replace(/[^a-z]+/g, '.')}@exemple.com`;
      lignes.push(`insert into public.reservations (yacht, client_nom, client_email, langue, debut, fin, heure, port, invites, nuits, montant, statut, decide_le, cree_le)
  select ${q(y.slug)}, ${q(nomClient)}, ${q(email)}, ${q(langue)}, ${q(debut)}, ${q(fin.toISOString().slice(0, 10))}, ${q(heure)}, ${q(y.port)}, ${Math.min(inv, y.invites)}, 7, (public.prix_sejour(${q(y.slug)}, ${q(debut)}, ${q(fin.toISOString().slice(0, 10))}) ->> 'montant')::int, ${q(statut)}, ${statut === 'confirmee' ? 'now()' : 'null'}, now() - interval '${3 + (c % 20)} days';`);
    }
  }
}
lignes.push('commit;');

fs.mkdirSync(path.join(ROOT, 'supabase/seed'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'supabase/seed/01_flotte.sql'), lignes.join('\n') + '\n');
console.log(`${yachts.length} yachts, ${c} réservations de démonstration. Traductions retrouvées : ${trouves}, absentes : ${manquants}.`);
