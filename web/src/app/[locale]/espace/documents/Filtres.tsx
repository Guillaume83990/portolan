'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cheminEspace, dico } from '@/lib/i18n';
import type { Langue } from '@/lib/format';

export function FiltresDocuments({ langue, famille, q: initial }: { langue: Langue; famille: string; q: string }) {
  const t = dico(langue).documents;
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const aller = (type: string, recherche: string) => {
    const p = new URLSearchParams({ ...(type !== 'tous' ? { type } : {}), ...(recherche ? { q: recherche } : {}) });
    router.replace(`${cheminEspace(langue, 'documents')}${p.size ? `?${p}` : ''}`, { scroll: false });
  };
  useEffect(() => { const x = setTimeout(() => { if (q !== initial) aller(famille, q); }, 300); return () => clearTimeout(x); });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center' }}>
      {(['tous', 'contrats', 'factures', 'apa'] as const).map((f) => (
        <button key={f} type="button" className="chip" aria-pressed={famille === f} onClick={() => aller(f, q)}>{t.filtres[f]}</button>
      ))}
      <div className="champ" style={{ marginLeft: 'auto', minWidth: '14rem' }}>
        <label htmlFor="doc-q" className="visually-hidden">{t.rechercher}</label>
        <input id="doc-q" type="search" placeholder={t.rechercher} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
    </div>
  );
}
