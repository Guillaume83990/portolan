// Reconstruit tout le site en une commande : données lues dans Supabase, pages françaises générées,
// traductions EN/DE/IT, plan du site.
// Usage (depuis le dossier du projet) : node tools/construire.cjs
// Après une modification d'un texte français, les phrases sans traduction sont listées dans tools/i18n/manquants-<langue>.txt
const { execSync } = require('child_process');
const path = require('path');

const env = { ...process.env, NODE_PATH: 'C:/Users/propi/Tools/depth/node_modules' };
const run = (cmd) => execSync(cmd, { cwd: path.join(__dirname, '..'), stdio: 'inherit', env });

run('node tools/css.cjs');
run('node tools/supabase/exporter.cjs');
run('node tools/build-flotte.cjs');
run('node tools/traduire.cjs en de it');
run('node tools/sitemap.cjs');
run('node tools/publication.cjs');
run('node tools/demonstration.cjs');
console.log('\nSite reconstruit : fr, en, de, it et sitemap.xml.');
