// Construction des e-mails : au client (dans sa langue, brief 05 §5.2) et à la direction (version interne, §5.3)
import type { Langue } from '@/lib/format';
import { cheminEspace, pageSite, titreCourtier } from '@/lib/i18n';
import { Gabarit, type Courtier, type PropsGabarit } from './Gabarit';
import { textesEmail, type TextesEmail, type V } from './textes';

export type NomModele = Exclude<keyof TextesEmail, 'communs'>;

const DEMO: Record<Langue, string> = {
  fr: 'Portolan est un site de démonstration conçu par SudWebProject : société, yachts et réservations fictifs.',
  en: 'Portolan is a demonstration website by SudWebProject: company, yachts and bookings are fictitious.',
  de: 'Portolan ist eine Demonstrationsseite von SudWebProject: Unternehmen, Yachten und Buchungen sind fiktiv.',
  it: 'Portolan è un sito dimostrativo di SudWebProject: società, yacht e prenotazioni fittizi.',
};
const GUILLEMETS: Record<Langue, [string, string]> = { fr: ['« ', ' »'], en: ['“', '”'], de: ['„', '“'], it: ['«', '»'] };
export const citer = (t: string, l: Langue) => `${GUILLEMETS[l][0]}${t}${GUILLEMETS[l][1]}`;

const base = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3100';
const pied = (l: Langue): PropsGabarit['pied'] => {
  const c = textesEmail[l].communs;
  return {
    adresses: c.adresses, mention: c.transactionnel, demo: process.env.NEXT_PUBLIC_DEMO === 'true' ? DEMO[l] : undefined,
    liens: [{ libelle: c.monEspace, url: base() + cheminEspace(l) }, { libelle: c.conditions, url: pageSite(l, 'conditions') }],
  };
};

export type OptionsClient = {
  v: V; recap?: [string, string][]; mot?: { texte: string; auteur: string };
  coordonnees?: [string, string][]; pieces?: string[]; url?: string; photo?: { src: string; alt: string } | null;
  courtier: Courtier; sansReservation?: boolean;
};

// E-mail au client : objet, aperçu et contenu dans sa langue
export function emailClient(nom: NomModele, l: Langue, o: OptionsClient) {
  const t = textesEmail[l];
  const m = t[nom];
  const c = t.communs;
  const element = (
    <Gabarit
      langue={l} base={base()} apercu={m.apercu(o.v)} titre={m.titre(o.v)}
      kicker={o.sansReservation ? undefined : c.reservation(o.v.ref)}
      paragraphes={[c.bonjour(o.v.prenom), ...m.texte(o.v)]}
      mot={o.mot} recap={o.recap} recapTitre={c.recap}
      coordonnees={o.coordonnees ? { lignes: o.coordonnees, consigne: c.virement.consigne } : undefined}
      pieces={o.pieces?.length ? { titre: c.pieces, noms: o.pieces } : undefined}
      bouton={m.bouton && o.url ? { libelle: m.bouton, url: o.url } : undefined}
      photo={o.photo ? { url: `${base()}/email/photo?src=${encodeURIComponent(o.photo.src)}`, alt: o.photo.alt } : undefined}
      courtier={{ titre: c.votreCourtier, c: { ...o.courtier, titre: titreCourtier(o.courtier, l) }, repondre: c.repondre }}
      pied={pied(l)}
    />
  );
  return { objet: m.objet(o.v), apercu: m.apercu(o.v), element };
}

// E-mail à la direction : en français, dense, bouton vers l'espace directeur
export function emailDirection(o: { objet: string; kicker: string; titre: string; paragraphes: string[]; recap: [string, string][]; boutons: { libelle: string; chemin: string }[] }) {
  const [premier, second] = o.boutons;
  const element = (
    <Gabarit
      interne langue="fr" base={base()} apercu={o.paragraphes[0] ?? o.titre} kicker={o.kicker} titre={o.titre}
      paragraphes={o.paragraphes} recap={o.recap}
      bouton={premier ? { libelle: premier.libelle, url: base() + premier.chemin } : undefined}
      secondaire={second ? { libelle: second.libelle, url: base() + second.chemin } : undefined}
      pied={{ adresses: 'Portolan · espace directeur', liens: [{ libelle: 'Tableau de bord', url: `${base()}/direction/tableau-de-bord` }, { libelle: 'Boîte d’envoi', url: `${base()}/direction/boite-envoi` }], mention: 'Notification interne : réglable dans Réglages › Notifications.' }}
    />
  );
  return { objet: o.objet, apercu: o.paragraphes[0] ?? o.titre, element };
}
