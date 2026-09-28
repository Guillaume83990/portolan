// Plan du site pour Google (sitemap.xml) : chaque page dans ses 4 langues, reliées par hreflang, et robots.txt.
// Usage : node tools/sitemap.cjs (après build-flotte.cjs et traduire.cjs)
const fs = require('fs');
const path = require('path');
const { LANGS, localize } = require('./i18n/routes.cjs');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://portolan.example';
const today = new Date().toISOString().slice(0, 10);

const frPages = [];
(function walk(dir) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    const rel = `${dir}/${f}`;
    if (fs.statSync(path.join(ROOT, rel)).isDirectory()) walk(rel);
    else if (f === 'index.html') frPages.push(`/${rel.replace(/index\.html$/, '')}`);
  }
}('fr'));
// Pages privées (espace client) : jamais dans le plan du site
const PRIVEES = ['/fr/espace/', '/fr/direction/'];
frPages.splice(0, frPages.length, ...frPages.filter((p) => !PRIVEES.includes(p)));

const urls = [];
for (const fr of frPages.sort()) {
  const alts = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${localize(fr, l)}"/>`).join('\n')
    + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${localize(fr, 'en')}"/>`;
  for (const l of LANGS) {
    const p = localize(fr, l);
    if (!fs.existsSync(path.join(ROOT, p, 'index.html'))) continue;
    const prio = fr === '/fr/' ? '1.0' : fr.split('/').length > 4 ? '0.7' : '0.8';
    urls.push(`  <url>\n    <loc>${SITE}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${prio}</priority>\n${alts}\n  </url>`);
  }
}
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
// Site de démonstration : les pages portent « noindex ». Pour un vrai client, retirer noindex et garder ce robots.txt.
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`sitemap.xml : ${urls.length} adresses ; robots.txt écrit`);
