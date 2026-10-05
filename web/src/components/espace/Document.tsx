// Une ligne de document (contrat, facture, reçu) avec son bouton de téléchargement
import { dico } from '@/lib/i18n';
import { dateMoyenne, type Langue } from '@/lib/format';
import type { DocumentClient } from '@/lib/espace/donnees';

export function LigneDocument({ d, langue, reference }: { d: DocumentClient; langue: Langue; reference: string }) {
  const t = dico(langue).documents;
  const titre = t.types[d.type as keyof typeof t.types] ?? d.type;
  return (
    <div className="doc">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.5h8l4 4v15H6z" /><path d="M14 2.5v4h4M9 12h6M9 15h6M9 18h4" /></svg>
      <p className="doc__nom"><b>{titre} {d.type === 'contrat' ? reference : d.numero}</b><span>PDF · {dateMoyenne(d.cree_le, langue)}{d.taille ? ` · ${Math.max(1, Math.round(d.taille / 1024))} Ko` : ''}</span></p>
      <a className="btn btn--filet btn--petit" href={`/api/documents/${d.id}?langue=${langue}`}>{t.telecharger}</a>
    </div>
  );
}
