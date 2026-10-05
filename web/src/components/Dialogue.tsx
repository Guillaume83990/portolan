'use client';
// Boîte de dialogue accessible au style du site (jamais d'alerte du navigateur) : vrai <dialog> modal,
// focus piégé par le navigateur, fermeture par Échap ou en cliquant sur le voile.
import { useEffect, useRef, type ReactNode } from 'react';

export function Dialogue({ ouvert, onFermer, titre, children, actions, large, role = 'dialog' }: {
  ouvert: boolean; onFermer: () => void; titre: ReactNode; children?: ReactNode; actions?: ReactNode; large?: boolean;
  role?: 'dialog' | 'alertdialog';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouvert && !d.open) d.showModal();
    if (!ouvert && d.open) d.close();
  }, [ouvert]);
  return (
    <dialog ref={ref} className="dialogue" role={role} aria-labelledby="dialogue-titre" style={large ? { width: 'min(40rem, 100%)' } : undefined}
      onClose={onFermer} onClick={(e) => { if (e.target === ref.current) onFermer(); }}>
      {ouvert && (
        <>
          <p className="dialogue__titre" id="dialogue-titre">{titre}</p>
          {children}
          {actions && <div className="dialogue__actions">{actions}</div>}
        </>
      )}
    </dialog>
  );
}

// Panneau latéral (textes du contrat, détail d'une réservation sur téléphone)
export function PanneauLateral({ ouvert, onFermer, titre, children }: {
  ouvert: boolean; onFermer: () => void; titre: ReactNode; children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouvert && !d.open) d.showModal();
    if (!ouvert && d.open) d.close();
  }, [ouvert]);
  return (
    <dialog ref={ref} className="panneau-lat" aria-labelledby="panneau-titre" onClose={onFermer}
      onClick={(e) => { if (e.target === ref.current) onFermer(); }}>
      {ouvert && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', marginBottom: '1.25rem' }}>
            <p className="dialogue__titre" id="panneau-titre">{titre}</p>
            <button type="button" className="lien lien--discret" onClick={onFermer}>Fermer</button>
          </div>
          {children}
        </>
      )}
    </dialog>
  );
}
