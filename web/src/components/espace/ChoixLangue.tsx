'use client';
// Sélecteur de langue : la même page de Mon espace dans une autre langue
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { cheminEspace, LANGUES } from '@/lib/i18n';
import type { Langue } from '@/lib/format';

const NOMS: Record<Langue, string> = { fr: 'Français', en: 'English', de: 'Deutsch', it: 'Italiano' };

export function ChoixLangue({ langue, libelle }: { langue: Langue; libelle: string }) {
  const chemin = usePathname();
  const sp = useSearchParams();
  const [ouvert, setOuvert] = useState(false);
  // Partie de l'adresse après « Mon espace » (adresse affichée ou adresse interne /<langue>/espace)
  const suite = chemin.replace(/^\/[a-z]{2}\/(espace|my-account|mein-konto|area-riservata)/, '');
  const q = sp.toString();
  return (
    <div className="lang" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOuvert(false); }}>
      <button className="lang__current" type="button" aria-expanded={ouvert} aria-controls="lang-list" onClick={() => setOuvert((v) => !v)}>
        <span className="visually-hidden">{libelle} : </span>{langue.toUpperCase()}
      </button>
      <ul className="lang__list" id="lang-list" hidden={!ouvert}>
        {LANGUES.map((l) => (
          <li key={l}><a href={`${cheminEspace(l)}${suite}${q ? `?${q}` : ''}`} hrefLang={l} lang={l} aria-current={l === langue ? 'page' : undefined}>{NOMS[l]}</a></li>
        ))}
      </ul>
    </div>
  );
}
