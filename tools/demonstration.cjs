// Portolan est un projet de démonstration de SudWebProject : cette étape (la dernière de la construction)
//   1 · pose « noindex, follow » sur toutes les pages publiques : une société fictive ne doit pas apparaître
//       dans Google face à de vrais courtiers ; « follow » laisse Google suivre le lien vers sudwebproject.com
//   2 · ajoute sur chaque page une pastille discrète « Projet de démonstration », dans la langue de la page
//   3 · retire la ligne Sitemap de robots.txt (un plan du site de pages non indexables brouille le signal).
//       robots.txt reste ouvert : Google doit pouvoir lire la balise noindex.
// Pour un vrai client : retirer cette étape de tools/construire.cjs.
// Usage : node tools/demonstration.cjs (lancé automatiquement par tools/construire.cjs)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEXTE = {
  fr: 'Projet de démonstration',
  en: 'Demonstration project',
  de: 'Demonstrationsprojekt',
  it: 'Progetto dimostrativo',
};
const TITRE = {
  fr: 'Site de démonstration conçu par SudWebProject : société, yachts et coordonnées fictifs',
  en: 'Demonstration website designed by SudWebProject: company, yachts and contact details are fictitious',
  de: 'Demonstrations-Website von SudWebProject: Unternehmen, Yachten und Kontaktdaten sind fiktiv',
  it: 'Sito dimostrativo realizzato da SudWebProject: società, yacht e recapiti sono fittizi',
};

let pages = 0;
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (['.git', 'tools', 'supabase', 'data', 'vendor', 'assets', 'node_modules', 'css', 'js'].includes(f)) continue;
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    if (!f.endsWith('.html')) continue;
    let s = fs.readFileSync(p, 'utf8');
    const avant = s;
    const lang = (s.match(/<html[^>]*lang="(\w\w)/) || [])[1] || 'fr';

    // 1 · noindex (les pages privées ont déjà « noindex, nofollow » : on n'y touche pas)
    if (!/<meta name="robots"/.test(s)) {
      s = s.replace(/(<meta charset="[^"]*">)/i, '$1\n  <meta name="robots" content="noindex, follow">');
    }

    // 2 · la pastille, toujours reposée dans la langue de la page (une pastille héritée de la page
    //     française par la traduction serait restée en français)
    s = s.replace(/[ \t]*<a class="demo-pill"[\s\S]*?<\/a>\r?\n?/g, '');
    if (s.includes('</body>')) {
      const pastille = `  <a class="demo-pill" href="https://www.sudwebproject.com/" target="_blank" rel="noopener" title="${TITRE[lang] || TITRE.fr}"><span class="demo-pill__dot" aria-hidden="true"></span>${TEXTE[lang] || TEXTE.fr}<span class="demo-pill__by"> · SudWebProject</span></a>\n`;
      s = s.replace('</body>', `${pastille}</body>`);
    }
    if (s !== avant) { fs.writeFileSync(p, s); pages++; }
  }
}(ROOT));

const robots = path.join(ROOT, 'robots.txt');
if (fs.existsSync(robots)) {
  fs.writeFileSync(robots, fs.readFileSync(robots, 'utf8').replace(/\n*Sitemap:.*\n?/g, '\n'));
}
console.log(`Projet de démonstration : ${pages} pages marquées (noindex, follow + pastille), robots.txt sans sitemap.`);
