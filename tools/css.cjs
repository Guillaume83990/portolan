// Assemble et compresse les feuilles de style : un seul fichier par type de page au lieu de 3 à 6.
// Chaque feuille de style bloque l'affichage tant qu'elle n'est pas arrivée : sur un téléphone en 4G,
// chaque fichier supplémentaire retardait la première image (PageSpeed : « requêtes de blocage du rendu »).
// On continue de modifier les fichiers d'origine (css/main.css…) ; ce script refait les assemblages.
// Usage : node tools/css.cjs (lancé automatiquement par tools/construire.cjs)
const fs = require('fs');
const path = require('path');

const CSS = path.join(__dirname, '..', 'css');
const compresser = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,>])\s*/g, '$1')
  .replace(/:\s+/g, ':')
  .replace(/;}/g, '}')
  .trim();

const LOTS = {
  'accueil.min.css': ['fonts.css', 'main.css', 'compte.css'],
  'site.min.css': ['fonts.css', 'main.css', 'flotte.css', 'visite-fiche.css', 'pages.css', 'compte.css'],
};
for (const [sortie, fichiers] of Object.entries(LOTS)) {
  const brut = fichiers.map((f) => fs.readFileSync(path.join(CSS, f), 'utf8')).join('\n');
  const min = compresser(brut);
  fs.writeFileSync(path.join(CSS, sortie), `${min}\n`);
  console.log(`css/${sortie} : ${fichiers.length} fichiers, ${Math.round(brut.length / 1024)} → ${Math.round(min.length / 1024)} Ko`);
}
