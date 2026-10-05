'use client';
// Mon compte (maquette lot 3, 3.4) : coordonnées, facturation, e-mail, mot de passe, session, suppression
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { Dialogue } from '@/components/Dialogue';
import { Turnstile, type TurnstileApi } from '@/components/Turnstile';
import { useNotifier } from '@/components/Notifications';
import { dico } from '@/lib/i18n';
import { plage, type Langue } from '@/lib/format';
import type { Profil } from '@/lib/supabase/serveur';
import { changerEmail, changerMotDePasse, deconnexion, enregistrerProfil, supprimerCompte } from '../actions';

const PAYS = ['France', 'Monaco', 'Italie', 'Suisse', 'Allemagne', 'Belgique', 'Royaume-Uni', 'Pays-Bas', 'Espagne', 'Autriche', 'Luxembourg', 'États-Unis', 'Émirats arabes unis', 'Autre'];

function Champ({ id, label, v, set, type = 'text', aide, auto, erreur }: { id: string; label: string; v: string; set: (s: string) => void; type?: string; aide?: string; auto?: string; erreur?: string }) {
  return (
    <div className="champ">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} autoComplete={auto} value={v} onChange={(e) => set(e.target.value)} aria-invalid={erreur ? true : undefined} aria-describedby={erreur ? `${id}-err` : aide ? `${id}-aide` : undefined} />
      {aide && !erreur && <p className="champ__aide" id={`${id}-aide`}>{aide}</p>}
      {erreur && <p className="champ__erreur" id={`${id}-err`}>{erreur}</p>}
    </div>
  );
}

export function FormulairesCompte({ langue, profil, avenir, courtier }: {
  langue: Langue; profil: Profil; avenir: { yacht: string; debut: string; fin: string } | null; courtier: { prenom: string; email: string };
}) {
  const t = dico(langue).compte;
  const router = useRouter();
  const notifier = useNotifier();
  const [envoi, demarrer] = useTransition();
  const [c, setC] = useState({ prenom: profil.prenom, nom: profil.nom, telephone: profil.telephone, langue: profil.langue });
  const [fa, setFa] = useState({ societe: profil.societe, adresse: profil.adresse, code_postal: profil.code_postal, ville: profil.ville, pays: profil.pays || 'France', tva: profil.tva });
  const [changeEmail, setChangeEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [emailEnvoye, setEmailEnvoye] = useState(false);
  const [mdp, setMdp] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const robot = useRef<TurnstileApi>(null);
  const [erreurMdp, setErreurMdp] = useState<{ champ: string; texte: string } | null>(null);
  const [suppr, setSuppr] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [erreurSuppr, setErreurSuppr] = useState('');

  const sauver = (modif: Parameters<typeof enregistrerProfil>[0], message: string) => demarrer(async () => {
    const r = await enregistrerProfil(modif); notifier(r.ok ? message : dico(langue).espace.erreur.texte); if (r.ok) router.refresh();
  });
  const titre = (h: string, p?: string) => <div><h2>{h}</h2>{p && <p>{p}</p>}</div>;
  const btn = (libelle: string, onClick: () => void, classe = 'btn--plein') =>
    <p><button className={`btn ${classe} btn--petit${envoi ? ' is-envoi' : ''}`} type="button" disabled={envoi} onClick={onClick}>{libelle}</button></p>;

  return (
    <>
      <section className="compte-sec" style={{ borderTop: 0 }}>
        {titre(t.coordonnees)}
        <div className="champs" style={{ maxWidth: '44rem' }}>
          <div className="champs champs--2">
            <Champ id="c-prenom" label={t.prenom} v={c.prenom} set={(v) => setC({ ...c, prenom: v })} auto="given-name" />
            <Champ id="c-nom" label={t.nom} v={c.nom} set={(v) => setC({ ...c, nom: v })} auto="family-name" />
          </div>
          <Champ id="c-tel" label={t.telephone} type="tel" v={c.telephone} set={(v) => setC({ ...c, telephone: v })} auto="tel" />
          <div className="champ"><label htmlFor="c-langue">{t.langue}</label>
            <select id="c-langue" value={c.langue} onChange={(e) => setC({ ...c, langue: e.target.value as Langue })} aria-describedby="c-langue-aide">
              <option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option><option value="it">Italiano</option>
            </select><p className="champ__aide" id="c-langue-aide">{t.langueAide}</p></div>
          {btn(t.enregistrer, () => sauver(c, t.enregistre))}
        </div>
      </section>

      <section className="compte-sec">
        {titre(t.facturation, t.facturationAide)}
        <div className="champs" style={{ maxWidth: '44rem' }}>
          <Champ id="f-soc" label={t.societe} v={fa.societe} set={(v) => setFa({ ...fa, societe: v })} auto="organization" />
          <Champ id="f-adr" label={t.adresse} v={fa.adresse} set={(v) => setFa({ ...fa, adresse: v })} auto="street-address" />
          <div className="champs champs--2">
            <Champ id="f-cp" label={t.codePostal} v={fa.code_postal} set={(v) => setFa({ ...fa, code_postal: v })} auto="postal-code" />
            <Champ id="f-ville" label={t.ville} v={fa.ville} set={(v) => setFa({ ...fa, ville: v })} auto="address-level2" />
          </div>
          <div className="champs champs--2">
            <div className="champ"><label htmlFor="f-pays">{t.pays}</label>
              <select id="f-pays" value={fa.pays} onChange={(e) => setFa({ ...fa, pays: e.target.value })}>{PAYS.map((p) => <option key={p}>{p}</option>)}</select></div>
            <Champ id="f-tva" label={t.tva} v={fa.tva} set={(v) => setFa({ ...fa, tva: v })} />
          </div>
          {btn(t.enregistrer, () => sauver(fa, t.facturationEnregistree))}
        </div>
      </section>

      <section className="compte-sec">
        {titre(t.email)}
        <div className="champs" style={{ maxWidth: '44rem' }}>
          <p>{profil.email}</p>
          {!changeEmail ? <p><button className="lien" type="button" onClick={() => setChangeEmail(true)}>{t.changerEmail}</button></p> : <>
            <Champ id="e-new" label={t.nouvelleAdresse} type="email" v={email} set={setEmail} auto="email" />
            {emailEnvoye && <p className="note" role="status">{t.lienEnvoye}</p>}
            {btn(t.envoyerLien, () => demarrer(async () => {
              const r = await changerEmail(email, langue);
              if (r.ok) setEmailEnvoye(true); else notifier(r.code === 'existe' ? dico(langue).auth.erreurs.existe : r.code === 'trop' ? dico(langue).auth.erreurs.trop : dico(langue).espace.erreur.texte);
            }))}
          </>}
        </div>
      </section>

      <section className="compte-sec">
        {titre(t.motDePasse)}
        <div className="champs" style={{ maxWidth: '44rem' }}>
          <Champ id="m-act" label={t.actuel} type="password" auto="current-password" v={mdp.actuel} set={(v) => setMdp({ ...mdp, actuel: v })} erreur={erreurMdp?.champ === 'actuel' ? erreurMdp.texte : undefined} />
          <div className="champs champs--2">
            <Champ id="m-new" label={t.nouveau} type="password" auto="new-password" v={mdp.nouveau} set={(v) => setMdp({ ...mdp, nouveau: v })} aide={t.regle} erreur={erreurMdp?.champ === 'nouveau' ? erreurMdp.texte : undefined} />
            <Champ id="m-conf" label={t.confirmation} type="password" auto="new-password" v={mdp.confirmation} set={(v) => setMdp({ ...mdp, confirmation: v })} erreur={erreurMdp?.champ === 'confirmation' ? erreurMdp.texte : undefined} />
          </div>
          {btn(t.changer, () => {
            if (mdp.nouveau.length < 10) { setErreurMdp({ champ: 'nouveau', texte: t.regle }); return; }
            if (mdp.nouveau !== mdp.confirmation) { setErreurMdp({ champ: 'confirmation', texte: t.differents }); return; }
            setErreurMdp(null);
            demarrer(async () => {
              const j = await robot.current?.jeton(); robot.current?.reinitialiser();
              const r = await changerMotDePasse(mdp.actuel, mdp.nouveau, j);
              if (r.ok) { notifier(t.change); setMdp({ actuel: '', nouveau: '', confirmation: '' }); }
              else if (r.code === 'actuel') setErreurMdp({ champ: 'actuel', texte: t.actuelFaux });
              else if (r.code === 'robot') notifier(dico(langue).auth.erreurs.robot);
              else notifier(dico(langue).espace.erreur.texte);
            });
          }, 'btn--filet')}
          <Turnstile ref={robot} langue={langue} />
        </div>
      </section>

      <section className="compte-sec">
        {titre(t.session)}
        <form action={() => deconnexion(langue)}><button className="btn btn--filet btn--petit" type="submit">{t.deconnecter}</button></form>
      </section>

      <section className="compte-sec zone-sensible">
        {titre(t.supprimer, t.supprimerTexte)}
        <p><button className="btn btn--danger btn--petit" type="button" onClick={() => setSuppr(true)}>{t.supprimer}</button></p>
      </section>

      {avenir ? (
        <Dialogue ouvert={suppr} onFermer={() => setSuppr(false)} titre={t.impossibleTitre} actions={<>
          <button className="btn btn--filet btn--petit" type="button" onClick={() => setSuppr(false)}>{t.fermer}</button>
          {courtier.email && <a className="btn btn--plein btn--petit" href={`mailto:${courtier.email}`}>{t.ecrireA(courtier.prenom)}</a>}</>}>
          <p className="second">{t.impossible(avenir.yacht, `${plage(avenir.debut, avenir.fin, langue)} ${avenir.fin.slice(0, 4)}`)}</p>
        </Dialogue>
      ) : (
        <Dialogue ouvert={suppr} onFermer={() => { setSuppr(false); setErreurSuppr(''); }} titre={t.supprimerTitre} role="alertdialog" actions={<>
          <button className="btn btn--filet btn--petit" type="button" onClick={() => setSuppr(false)}>{t.garder}</button>
          <button className={`btn btn--danger btn--petit${envoi ? ' is-envoi' : ''}`} type="button" disabled={confirm.trim().toUpperCase() !== t.mot || envoi}
            onClick={() => demarrer(async () => { const r = await supprimerCompte(langue); if (r && !r.ok) setErreurSuppr(r.code === 'indisponible' ? t.indisponible : dico(langue).espace.erreur.texte); })}>{t.definitivement}</button></>}>
          <p className="second">{t.supprimerTexte}</p>
          <div className="champ"><label htmlFor="s-conf">{t.taper}</label><input id="s-conf" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" /></div>
          {erreurSuppr && <p className="note is-erreur" role="alert">{erreurSuppr}</p>}
        </Dialogue>
      )}
    </>
  );
}
