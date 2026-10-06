// Site public, méthode hybride : copie les pages vitrines statiques (générées par tools/construire.cjs à la racine
// du dépôt) dans web/public, pour que l'application Vercel serve tout le site sous une seule adresse.
// - Pages, styles, scripts, polices et icônes sont copiés (quelques Mo) ; les médias lourds (assets/img,
//   assets/plan-sequence, assets/visites) restent sur l'hébergement statique et sont relayés (next.config.ts).
// - Les anciennes pages « espace » et « direction » ne sont pas copiées : l'application les remplace.
// - Les scripts du site sont reliés à la base de l'application (clé publique uniquement).
// - La liste des pages servies est écrite dans src/lib/site-statique.json (lue par proxy.ts).
// Usage, depuis web/ : node scripts/site-statique.mjs
import fs from 'node:fs';
import path from 'node:path';

const racine = path.resolve(import.meta.dirname, '..', '..');
const web = path.resolve(import.meta.dirname, '..');
const pub = path.join(web, 'public');
const LANGUES = ['fr', 'en', 'de', 'it'];
// Dossiers remplacés par l'application (Mon espace, ancien espace directeur)
const REMPLACES = new Set(['espace', 'my-account', 'mein-konto', 'area-riservata', 'direction']);

const env = Object.fromEntries(fs.readFileSync(path.join(web, '.env.local'), 'utf8').split(/\r?\n/)
  .filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim()]; }));

const copier = (de, vers) => fs.cpSync(path.join(racine, de), path.join(pub, vers ?? de), { recursive: true });
const pages = [];
function inventorier(dossier, url) {
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (e.isFile() && e.name === 'index.html') pages.push(url);
    if (e.isDirectory()) inventorier(path.join(dossier, e.name), `${url}${e.name}/`);
  }
}

// Nettoyage des copies précédentes (jamais les fichiers propres à l'application : fonts/, email/, icônes)
for (const d of [...LANGUES, 'css', 'js', 'vendor', 'assets']) fs.rmSync(path.join(pub, d), { recursive: true, force: true });

for (const l of LANGUES) {
  fs.mkdirSync(path.join(pub, l), { recursive: true });
  for (const e of fs.readdirSync(path.join(racine, l), { withFileTypes: true })) {
    if (e.isDirectory() && REMPLACES.has(e.name)) continue;
    copier(path.join(l, e.name));
  }
  inventorier(path.join(pub, l), `/${l}/`);
}
for (const d of ['css', 'js', 'vendor', 'assets/fonts']) copier(d);
for (const f of ['index.html', 'robots.txt', 'assets/favicon.svg', 'assets/favicon-32.png', 'assets/apple-touch-icon.png']) copier(f);
pages.push('/');

// Scripts du site reliés à la base de l'application (URL et clé publique seulement)
const sb = path.join(pub, 'js', 'supabase.js');
const avant = fs.readFileSync(sb, 'utf8');
const apres = avant
  .replace(/export const SUPABASE_URL = '[^']*';/, `export const SUPABASE_URL = '${env.NEXT_PUBLIC_SUPABASE_URL}';`)
  .replace(/export const SUPABASE_CLE_PUBLIQUE = '[^']*';/, `export const SUPABASE_CLE_PUBLIQUE = '${env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}';`);
if (apres === avant) throw new Error('js/supabase.js : URL ou clé introuvable');
fs.writeFileSync(sb, apres);

fs.writeFileSync(path.join(web, 'src', 'lib', 'site-statique.json'), JSON.stringify(pages.sort(), null, 0) + '\n');
console.log(`${pages.length} pages vitrines copiées dans web/public`);
