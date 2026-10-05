'use client';
// Notifications brèves (« Réservation PTL-00061 validée · lien d'acompte envoyé ») : annoncées aux lecteurs d'écran.
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Notif = { id: number; texte: string; action?: { libelle: string; faire: () => void } };
const Ctx = createContext<(texte: string, action?: Notif['action']) => void>(() => {});

export function Notifications({ children, libelleFermer = 'Fermer' }: { children: ReactNode; libelleFermer?: string }) {
  const [liste, setListe] = useState<Notif[]>([]);
  const retirer = (id: number) => setListe((l) => l.filter((n) => n.id !== id));
  const notifier = useCallback((texte: string, action?: Notif['action']) => {
    const id = Date.now() + Math.random();
    setListe((l) => [...l.slice(-2), { id, texte, action }]);
    setTimeout(() => retirer(id), 7000);
  }, []);
  return (
    <Ctx.Provider value={notifier}>
      {children}
      <div className="notifs" role="status" aria-live="polite">
        {liste.map((n) => (
          <div className="notif" key={n.id}>
            {n.texte}
            {n.action
              ? <button type="button" onClick={() => { n.action!.faire(); retirer(n.id); }}>{n.action.libelle}</button>
              : <button type="button" onClick={() => retirer(n.id)}>{libelleFermer}</button>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useNotifier = () => useContext(Ctx);
