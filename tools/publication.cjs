// Dernière étape de la construction : le site reçoit sa vraie adresse publique.
// Les outils travaillent avec une adresse fictive (https://portolan.example) ; ici, toutes les pages, le plan du site
// et robots.txt passent à l'adresse en ligne (adresse canonique, hreflang, Open Graph, données structurées), et la
// balise « noindex » est retirée des pages publiques (elle reste sur Mon espace et l'espace directeur).
// Usage : node tools/publication.cjs (lancé automatiquement par tools/construire.cjs)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INTERNE = 'https://portolan.example';
const PUBLIQUE = 'https://guillaume83990.github.io/portolan';
const PRIVEES = /[\\/](espace|my-account|mein-konto|area-riservata|direction)[\\/]index\.html$/;

let pages = 0;
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (['.git', 'tools', 'supabase', 'data', 'vendor', 'assets', 'node_modules'].includes(f)) continue;
    if (fs.statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(html|xml|txt)$/.test(f)) continue;
    let s = fs.readFileSync(p, 'utf8');
    const avant = s;
    s = s.split(`${INTERNE}/`).join(`${PUBLIQUE}/`).split(`"${INTERNE}"`).join(`"${PUBLIQUE}"`);
    if (f.endsWith('.html') && !PRIVEES.test(p)) {
      s = s.replace(/\s*<!-- Site de démonstration : retirer noindex pour un vrai client -->/g, '').replace(/\s*<meta name="robots" content="noindex, nofollow">/g, '');
    }
    if (s !== avant) { fs.writeFileSync(p, s); pages++; }
  }
}(ROOT));
console.log(`Adresse publique ${PUBLIQUE} appliquée (${pages} fichiers).`);
module.exports = { INTERNE, PUBLIQUE };
