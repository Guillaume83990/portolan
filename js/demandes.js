// Une demande de formulaire → le serveur de l'application (/api/demandes), qui vérifie l'anti-robot et les champs,
// puis l'enregistre dans la table « demandes » (la base n'accepte plus d'écriture directe depuis le navigateur).
// Les champs connus ont leur colonne, les autres vont dans « détails ».
import { jetonRobot, preparerRobot } from './robot.js';

// Le défi anti-robot se prépare dès que le visiteur touche un formulaire du site
document.addEventListener('focusin', (e) => {
  const form = e.target.closest?.('form');
  if (form && !form.closest('.resa')) preparerRobot(form);
});

export async function enregistrerDemande(form, type) {
  const champs = Object.fromEntries(new FormData(form).entries());
  const { nom = '', email = '', tel = '', telephone = '', message = '', demande, consentement, 'cf-turnstile-response': _jeton, ...details } = champs;
  const reponse = await fetch('/api/demandes', {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: (type || demande || form.dataset.type || 'contact').slice(0, 40),
      yacht: form.dataset.slug || null,
      nom: (nom.trim() || email.trim()).slice(0, 120),
      email: email.trim(),
      telephone: (tel || telephone).trim().slice(0, 40),
      message: message.trim().slice(0, 4000),
      details: { ...details, ...(form.dataset.yacht && !form.dataset.slug ? { yacht: form.dataset.yacht } : {}) },
      langue: (document.documentElement.lang || 'fr').slice(0, 2),
      page: location.pathname.slice(0, 300),
      captcha: await jetonRobot(form),
    }),
  });
  const r = await reponse.json().catch(() => ({ ok: false, code: 'erreur' }));
  if (!r.ok) throw new Error(r.code || 'erreur');
}
