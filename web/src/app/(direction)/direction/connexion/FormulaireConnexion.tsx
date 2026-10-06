'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseNavigateur } from '@/lib/supabase/navigateur';
import { Turnstile, type TurnstileApi } from '@/components/Turnstile';
import { connexionDemo } from '@/lib/demo/actions';

// Démonstration : le serveur ouvre la session du compte « directeur de démonstration » (lecture seule, règles de la base) ;
// ses identifiants restent dans les variables d'environnement du serveur, jamais dans le navigateur.

export function FormulaireConnexion({ refus = false, demo = false }: { refus?: boolean; demo?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState(refus ? "Ce compte n'a pas accès à la direction." : '');
  const [info, setInfo] = useState('');
  const [envoi, setEnvoi] = useState(false);
  // Jeton anti-robot (Turnstile), exigé par Supabase quand la protection CAPTCHA est activée
  const robot = useRef<TurnstileApi>(null);
  const jeton = async () => { const j = await robot.current?.jeton(); robot.current?.reinitialiser(); return j; };
  const ROBOT = 'La vérification anti-robot n’a pas abouti. Réessayez dans un instant.';

  async function connecter(e?: React.FormEvent) {
    e?.preventDefault();
    setEnvoi(true); setErreur(''); setInfo('');
    const captchaToken = await jeton();
    if (demo) {
      const r = await connexionDemo('directeur', captchaToken);
      if (!r.ok) { setEnvoi(false); setErreur(r.code === 'robot' ? ROBOT : 'La démonstration est momentanément indisponible.'); return; }
      router.replace('/direction/tableau-de-bord'); router.refresh(); return;
    }
    const { error } = await supabaseNavigateur().auth.signInWithPassword({ email, password: mdp, options: { captchaToken } });
    if (error) {
      setEnvoi(false);
      setErreur(/captcha/i.test(error.message) ? ROBOT : /confirm/i.test(error.message) ? "Votre adresse n'est pas encore confirmée." : "Identifiants incorrects. Vérifiez l'e-mail et le mot de passe.");
      return;
    }
    router.replace('/direction/tableau-de-bord');
    router.refresh();
  }

  async function oubli() {
    if (!email) { setErreur('Indiquez votre e-mail, puis cliquez de nouveau.'); return; }
    const { error } = await supabaseNavigateur().auth.resetPasswordForEmail(email, { captchaToken: await jeton(), redirectTo: `${location.origin}/fr/espace/nouveau-mot-de-passe` });
    if (error && /captcha/i.test(error.message)) { setErreur(ROBOT); return; }
    setErreur(''); setInfo('Si un compte existe pour cette adresse, un lien vient de partir.');
  }

  if (demo) {
    return (
      <div><button type="button" className={`btn btn--ghost${envoi ? ' is-envoi' : ''}`} style={{ padding: '.7rem 1.3rem', color: 'inherit', background: 'none', cursor: 'pointer', font: 'inherit' }}
        onClick={() => connecter()} disabled={envoi}>Visiter en démonstration</button>{erreur && <span className="note is-erreur" role="alert" style={{ display: 'block' }}>{erreur}</span>}<Turnstile ref={robot} sombre /></div>
    );
  }
  return (
    <form className="champs" onSubmit={connecter} noValidate>
      <div className="champ"><label htmlFor="e">E-mail</label>
        <input id="e" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!erreur || undefined} /></div>
      <div className="champ"><label htmlFor="m">Mot de passe</label>
        <input id="m" type="password" autoComplete="current-password" required value={mdp} onChange={(e) => setMdp(e.target.value)} aria-invalid={!!erreur || undefined} /></div>
      {erreur && <p className="note is-erreur" role="alert">{erreur}</p>}
      {info && <p className="note" role="status">{info}</p>}
      <div className="auth__actions">
        <button className="auth__oubli" type="button" onClick={oubli}>Mot de passe oublié&#8239;?</button>
        <button className={`btn btn--light${envoi ? ' is-envoi' : ''}`} type="submit" disabled={envoi}>Me connecter</button>
      </div>
      <Turnstile ref={robot} sombre />
    </form>
  );
}
