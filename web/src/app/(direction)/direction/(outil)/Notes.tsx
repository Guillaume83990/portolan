'use client';
// Notes internes datées (client, demande) : visibles par la direction seulement
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { BoutonEcrit, useDemo } from '@/components/Demo';
import { useNotifier } from '@/components/Notifications';
import { ajouterNote } from '../actions';
import { dateCourte, heureMinute } from '@/lib/format';

export function NotesInternes({ cible, id, notes }: { cible: 'client' | 'demande'; id: string; notes: { id: number; texte: string; auteur: string; cree_le: string }[] }) {
  const router = useRouter();
  const notifier = useNotifier();
  const demo = useDemo();
  const [texte, setTexte] = useState('');
  const [envoi, demarrer] = useTransition();
  return (
    <>
      {notes.length > 0 && (
        <ol className="journal">
          {notes.map((n) => <li key={n.id}><time dateTime={n.cree_le}>{dateCourte(n.cree_le)} {heureMinute(n.cree_le)}</time><span>{n.auteur ? `${n.auteur} : ` : ''}{n.texte}</span></li>)}
        </ol>
      )}
      {!demo && (
        <div className="champ" style={{ marginTop: '.75rem' }}>
          <label htmlFor={`note-${id}`}>Ajouter une note</label>
          <textarea id={`note-${id}`} rows={2} value={texte} onChange={(e) => setTexte(e.target.value)} />
          <p style={{ marginTop: '.5rem' }}>
            <BoutonEcrit className={`btn btn--filet btn--petit${envoi ? ' is-envoi' : ''}`} disabled={!texte.trim() || envoi}
              onClick={() => demarrer(async () => { const r = await ajouterNote(cible, id, texte); if (r.ok) { setTexte(''); router.refresh(); } else notifier(r.erreur); })}>Ajouter la note</BoutonEcrit>
          </p>
        </div>
      )}
    </>
  );
}
