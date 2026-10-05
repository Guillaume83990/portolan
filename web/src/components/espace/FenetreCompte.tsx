'use client';
// Fenêtre de compte (maquette lot 2, 2.2) : connexion, création, « vérifiez votre e-mail », mot de passe oublié.
// Supabase Auth (e-mail et mot de passe) ; la confirmation d'e-mail ramène sur /<langue>/espace/auth.
// Chaque appel porte un jeton Turnstile : Supabase refuse les robots quand la protection CAPTCHA est activée.
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { supabaseNavigateur } from '@/lib/supabase/navigateur';
import { Rose } from '@/components/Rose';
import { Turnstile, type TurnstileApi } from '@/components/Turnstile';
import { cheminEspace, dico, pageSite } from '@/lib/i18n';
import type { Langue } from '@/lib/format';

type Vue = 'connexion' | 'creation' | 'verifier' | 'oubli';
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const force = (m: string) => [m.length >= 8, m.length >= 12, /[A-Z]/.test(m) && /[a-z]/.test(m), /\d|[^\w]/.test(m)].filter(Boolean).length;

export function FenetreCompte({ langue, ouvert, vueInitiale = 'connexion', onFermer, raison }: {
  langue: Langue; ouvert: boolean; vueInitiale?: Vue; onFermer: () => void; raison?: React.ReactNode;
}) {
  const t = dico(langue).auth;
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [vue, setVue] = useState<Vue>(vueInitiale);
  const [f, setF] = useState({ prenom: '', nom: '', email: '', telephone: '', mdp: '', langue, accepte: false });
  const [voir, setVoir] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState('');
  const [nonConfirme, setNonConfirme] = useState(false);
  const [info, setInfo] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [attente, setAttente] = useState(0);
  const robot = useRef<TurnstileApi>(null);
  // Jeton anti-robot pour l'appel suivant, puis un nouveau défi (un jeton ne sert qu'une fois)
  const jeton = async () => { const j = await robot.current?.jeton(); robot.current?.reinitialiser(); return j; };
  const erreurRobot = (m: string) => /captcha/i.test(m);

  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (ouvert && !d.open) d.showModal();
    if (!ouvert && d.open) d.close();
  }, [ouvert]);
  useEffect(() => { if (attente <= 0) return; const x = setTimeout(() => setAttente((a) => a - 1), 1000); return () => clearTimeout(x); }, [attente]);

  const sb = supabaseNavigateur();
  const retour = (suite: string) => `${location.origin}${cheminEspace(langue, 'auth')}?suite=${encodeURIComponent(suite)}`;
  const champ = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const reinit = () => { setErreurs({}); setErreur(''); setInfo(''); setNonConfirme(false); };

  async function connecter(e: React.FormEvent) {
    e.preventDefault(); reinit();
    if (!EMAIL.test(f.email)) { setErreurs({ email: t.erreurs.email }); return; }
    setEnvoi(true);
    const { error } = await sb.auth.signInWithPassword({ email: f.email, password: f.mdp, options: { captchaToken: await jeton() } });
    setEnvoi(false);
    if (error) {
      if (erreurRobot(error.message)) { setErreur(t.erreurs.robot); return; }
      if (/confirm/i.test(error.message)) { setNonConfirme(true); return; }
      setErreur(/rate|too many/i.test(error.message) ? t.erreurs.trop : /fetch|network/i.test(error.message) ? t.erreurs.reseau : t.erreurs.identifiants);
      return;
    }
    onFermer(); router.refresh();
  }

  async function creer(e: React.FormEvent) {
    e.preventDefault(); reinit();
    const er: Record<string, string> = {};
    if (!f.prenom.trim()) er.prenom = t.erreurs.prenom;
    if (!f.nom.trim()) er.nom = t.erreurs.nom;
    if (!EMAIL.test(f.email)) er.email = t.erreurs.email;
    if (f.mdp.length < 8) er.mdp = t.erreurs.court;
    if (!f.accepte) er.accepte = t.erreurs.conditions;
    setErreurs(er);
    if (Object.keys(er).length) return;
    setEnvoi(true);
    const { data, error } = await sb.auth.signUp({
      email: f.email, password: f.mdp,
      options: { captchaToken: await jeton(), emailRedirectTo: retour('confirmation'), data: { prenom: f.prenom.trim(), nom: f.nom.trim(), telephone: f.telephone.trim(), langue: f.langue } },
    });
    setEnvoi(false);
    if (error) { setErreur(erreurRobot(error.message) ? t.erreurs.robot : /rate|too many/i.test(error.message) ? t.erreurs.trop : /registered|exists/i.test(error.message) ? '' : t.erreurs.reseau); if (/registered|exists/i.test(error.message)) setErreurs({ email: t.erreurs.existe }); return; }
    // Adresse déjà inscrite : Supabase répond sans identité (pour ne pas révéler les comptes existants)
    if (data.user && data.user.identities?.length === 0) { setErreurs({ email: t.erreurs.existe }); return; }
    if (data.session) { onFermer(); router.refresh(); return; }
    setVue('verifier'); setAttente(60);
  }

  async function renvoyer() {
    setInfo('');
    const { error } = await sb.auth.resend({ type: 'signup', email: f.email, options: { captchaToken: await jeton(), emailRedirectTo: retour('confirmation') } });
    if (error) { setErreur(erreurRobot(error.message) ? t.erreurs.robot : t.erreurs.trop); return; }
    setInfo(t.verifier.renvoye); setAttente(60);
  }

  async function oubli(e: React.FormEvent) {
    e.preventDefault(); reinit();
    if (!EMAIL.test(f.email)) { setErreurs({ email: t.erreurs.email }); return; }
    setEnvoi(true);
    const { error } = await sb.auth.resetPasswordForEmail(f.email, { captchaToken: await jeton(), redirectTo: retour('nouveau-mot-de-passe') });
    setEnvoi(false);
    if (error && erreurRobot(error.message)) { setErreur(t.erreurs.robot); return; }
    setInfo(t.oubliEnvoye);
  }

  const err = (k: string) => erreurs[k] ? <p className="champ__erreur" id={`err-${k}`}>{erreurs[k]}</p> : null;
  const aria = (k: string) => (erreurs[k] ? { 'aria-invalid': true as const, 'aria-describedby': `err-${k}` } : {});
  const titre = vue === 'verifier' ? t.verifier.titre : vue === 'oubli' ? t.oubliTitre : t.titre;

  return (
    <dialog ref={ref} className="auth" aria-labelledby="auth-titre" onClose={onFermer}>
      {ouvert && (
        <div className="auth__inner">
          <button className="auth__close" type="button" onClick={onFermer}>{t.fermer}</button>
          <Rose className="auth__rose" />
          <p className="auth__title" id="auth-titre">{titre}</p>

          {(vue === 'connexion' || vue === 'creation') && <>
            {raison && <p className="auth__raison">{raison}</p>}
            <div className="auth__tabs" role="tablist">
              <button role="tab" type="button" aria-selected={vue === 'connexion'} onClick={() => { reinit(); setVue('connexion'); }}>{t.jaiUnCompte}</button>
              <button role="tab" type="button" aria-selected={vue === 'creation'} onClick={() => { reinit(); setVue('creation'); }}>{t.creer}</button>
            </div>
          </>}

          {vue === 'connexion' && (
            <form onSubmit={connecter} noValidate>
              <div className="champ"><label htmlFor="a-email">{t.email}</label><input id="a-email" type="email" autoComplete="username" value={f.email} onChange={champ('email')} {...aria('email')} />{err('email')}</div>
              <div className="champ champ--mdp"><label htmlFor="a-mdp">{t.motDePasse}</label>
                <input id="a-mdp" type={voir ? 'text' : 'password'} autoComplete="current-password" value={f.mdp} onChange={champ('mdp')} aria-invalid={erreur ? true : undefined} />
                <button className="voir" type="button" onClick={() => setVoir((v) => !v)} aria-pressed={voir}>{voir ? t.masquer : t.afficher}</button></div>
              {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
              {nonConfirme && <p className="note is-erreur" role="alert">{t.erreurs.nonConfirme} <button type="button" className="auth__oubli" onClick={renvoyer}>{t.erreurs.renvoyer}</button></p>}
              {info && <p className="note" role="status">{info}</p>}
              <div className="auth__actions">
                <button className="auth__oubli" type="button" onClick={() => { reinit(); setVue('oubli'); }}>{t.oubli}</button>
                <button className={`btn btn--light${envoi ? ' is-envoi' : ''}`} type="submit" disabled={envoi}>{t.connecter}</button>
              </div>
            </form>
          )}

          {vue === 'creation' && (
            <form onSubmit={creer} noValidate>
              <div className="champs champs--2">
                <div className="champ"><label htmlFor="c-prenom">{t.prenom}</label><input id="c-prenom" autoComplete="given-name" value={f.prenom} onChange={champ('prenom')} {...aria('prenom')} />{err('prenom')}</div>
                <div className="champ"><label htmlFor="c-nom">{t.nom}</label><input id="c-nom" autoComplete="family-name" value={f.nom} onChange={champ('nom')} {...aria('nom')} />{err('nom')}</div>
              </div>
              <div className="champ"><label htmlFor="c-email">{t.email}</label><input id="c-email" type="email" autoComplete="email" value={f.email} onChange={champ('email')} {...aria('email')} />
                {erreurs.email === t.erreurs.existe
                  ? <p className="champ__erreur" id="err-email">{t.erreurs.existe} <button type="button" className="auth__oubli" onClick={() => { reinit(); setVue('connexion'); }}>{t.connecter}</button></p>
                  : err('email')}</div>
              <div className="champ"><label htmlFor="c-tel">{t.telephone} <small>{t.telephoneAide}</small></label><input id="c-tel" type="tel" autoComplete="tel" value={f.telephone} onChange={champ('telephone')} /></div>
              <div className="champ champ--mdp"><label htmlFor="c-mdp">{t.motDePasse}</label>
                <input id="c-mdp" type={voir ? 'text' : 'password'} autoComplete="new-password" value={f.mdp} onChange={champ('mdp')} {...aria('mdp')} />
                <button className="voir" type="button" onClick={() => setVoir((v) => !v)} aria-pressed={voir}>{voir ? t.masquer : t.afficher}</button>
                <div className="force" aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} className={i < force(f.mdp) ? 'is-on' : ''} />)}</div>
                <small>{t.regle}</small>{err('mdp')}</div>
              <div className="champ"><label htmlFor="c-langue">{t.langue}</label>
                <select id="c-langue" value={f.langue} onChange={champ('langue')}><option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option><option value="it">Italiano</option></select></div>
              <label className="lead__consent">
                <input type="checkbox" checked={f.accepte} onChange={(e) => setF((x) => ({ ...x, accepte: e.target.checked }))} {...aria('accepte')} />
                <span>{t.accepte[0]}<a href={pageSite(langue, 'conditions')} target="_blank" rel="noopener" style={{ color: 'var(--laiton)' }}>{t.accepte[1]}</a>{t.accepte[2]}<a href={pageSite(langue, 'confidentialite')} target="_blank" rel="noopener" style={{ color: 'var(--laiton)' }}>{t.accepte[3]}</a>{t.accepte[4]}</span>
              </label>
              {err('accepte')}
              {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
              <div className="auth__actions"><span /><button className={`btn btn--light${envoi ? ' is-envoi' : ''}`} type="submit" disabled={envoi}>{t.creer}</button></div>
            </form>
          )}

          {vue === 'verifier' && <>
            <p>{t.verifier.texte(f.email)[0]}<b style={{ fontWeight: 500 }}>{f.email}</b>{t.verifier.texte(f.email)[2]}</p>
            {info && <p className="note" role="status">{info}</p>}
            {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
            <div className="auth__actions">
              <button className="btn btn--ghost" type="button" disabled={attente > 0} onClick={renvoyer}
                style={{ color: 'var(--calcaire)', background: 'none', font: 'inherit', cursor: attente > 0 ? 'not-allowed' : 'pointer', opacity: attente > 0 ? 0.65 : 1 }}>
                {t.verifier.renvoyer}{attente > 0 ? ` ${t.verifier.dans(attente)}` : ''}</button>
              <button className="auth__oubli" type="button" onClick={() => { reinit(); setVue('creation'); }}>{t.verifier.modifier}</button>
            </div>
          </>}

          {vue === 'oubli' && (
            <form onSubmit={oubli} noValidate>
              <p className="auth__raison">{t.oubliTexte}</p>
              <div className="champ"><label htmlFor="o-email">{t.email}</label><input id="o-email" type="email" autoComplete="username" value={f.email} onChange={champ('email')} {...aria('email')} />{err('email')}</div>
              {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
              {info && <p className="note" role="status">{info}</p>}
              <div className="auth__actions">
                <button className="auth__oubli" type="button" onClick={() => { reinit(); setVue('connexion'); }}>{t.retour}</button>
                <button className={`btn btn--light${envoi ? ' is-envoi' : ''}`} type="submit" disabled={envoi}>{t.envoyerLien}</button>
              </div>
            </form>
          )}
          <Turnstile ref={robot} langue={langue} sombre />
        </div>
      )}
    </dialog>
  );
}
