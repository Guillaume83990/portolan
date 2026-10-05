'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Langue } from '@/lib/format';

// « Nous vérifions votre paiement… » : la page se recharge jusqu'à ce que la réservation ait avancé
export function Verification({ titre, texte }: { langue: Langue; titre: string; texte: string }) {
  const router = useRouter();
  useEffect(() => { const x = setInterval(() => router.refresh(), 2500); return () => clearInterval(x); }, [router]);
  return (
    <main className="esp" style={{ maxWidth: '68rem' }}>
      <div className="vide" style={{ minHeight: '50vh', alignContent: 'center' }} role="status" aria-live="polite">
        <svg className="rose-attente" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1v30M1 16h30M5.4 5.4l21.2 21.2M26.6 5.4L5.4 26.6" /><circle cx="16" cy="16" r="6.5" /></svg>
        <p className="vide__titre">{titre}</p><p>{texte}</p>
      </div>
    </main>
  );
}

export function Copier({ valeur, libelle, fait }: { valeur: string; libelle: string; fait: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <button className="btn btn--filet btn--petit" type="button" aria-label={`${libelle} : ${valeur}`}
      onClick={async () => { await navigator.clipboard.writeText(valeur.replace(/ | /g, ' ')); setCopie(true); setTimeout(() => setCopie(false), 2000); }}>
      {copie ? fait : libelle}
    </button>
  );
}
