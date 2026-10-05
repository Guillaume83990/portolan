// Génération des documents d'une réservation : numéro réservé dans la base (sans trou), PDF produit ici,
// fichier rangé dans le stockage privé « documents » sous <client>/<référence>/<numéro>.pdf.
import 'server-only';
import { renderToBuffer } from '@react-pdf/renderer';
import sharp from 'sharp';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { urlPhoto, type Fiche } from '@/lib/yachts';
import type { Langue } from '@/lib/format';
import { enregistrerPolices } from './commun';
import { Contrat } from './Contrat';
import { Facture } from './Facture';
import type { DonneesDoc, Paiement } from './donnees';

export type TypeDoc = 'contrat' | 'facture_acompte' | 'facture_solde' | 'recu_apa';
export type Document = { id: string; type: TypeDoc; numero: string; chemin: string; taille: number; client: string | null };

const LANGUES = ['fr', 'en', 'de', 'it'];
const photos = new Map<string, Promise<Buffer | null>>();

// Photo du yacht pour la page de garde (le PDF ne lit pas le WebP : conversion en JPEG, gardée en mémoire)
function photo(src: string | undefined) {
  if (!src) return Promise.resolve(null);
  if (!photos.has(src)) {
    photos.set(src, fetch(urlPhoto(src, 1600))
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((b) => sharp(Buffer.from(b)).resize(1600, 700, { fit: 'cover' }).jpeg({ quality: 78 }).toBuffer())
      .catch(() => { photos.delete(src); return null; }));
  }
  return photos.get(src)!;
}

// Documents dus selon l'état de la réservation et les paiements reçus
export function documentsDus(r: { statut: string; solde: number; apa: number }, paiements: Pick<Paiement, 'type'>[]): TypeDoc[] {
  if (!['confirmee', 'soldee', 'terminee'].includes(r.statut)) return [];
  const dus: TypeDoc[] = [];
  const enUneFois = r.solde === 0;
  if (paiements.some((p) => p.type === 'acompte' || p.type === 'total')) dus.push('contrat');
  if (!enUneFois && paiements.some((p) => p.type === 'acompte')) dus.push('facture_acompte');
  if (r.statut === 'soldee' || r.statut === 'terminee') {
    if (!dus.includes('contrat')) dus.push('contrat');
    dus.push('facture_solde');
    if (r.apa > 0) dus.push('recu_apa');
  }
  return dus;
}

async function donnees(reservationId: string, doc: Document): Promise<DonneesDoc> {
  const admin = supabaseAdmin();
  const { data: r, error } = await admin.from('reservations').select('*').eq('id', reservationId).single();
  if (error || !r) throw error ?? new Error('reservation_introuvable');
  const [profil, yacht, reglages, paiements, version, factureAcompte] = await Promise.all([
    r.client ? admin.from('profils').select('*').eq('id', r.client).maybeSingle().then((x) => x.data) : null,
    admin.from('yachts').select('nom, port, invites, fiche').eq('slug', r.yacht).maybeSingle().then((x) => x.data),
    admin.from('reglages').select('societe, contrat_conditions, taux_acompte, taux_apa, taux_tva').limit(1).single().then((x) => x.data),
    admin.from('paiements').select('type, montant, methode, paye_le').eq('reservation', reservationId).eq('statut', 'paye').then((x) => x.data ?? []),
    r.contrat_version ? admin.from('versions_contrat').select('conditions').eq('version', r.contrat_version).maybeSingle().then((x) => x.data) : null,
    doc.type === 'facture_solde' ? admin.from('documents').select('numero').eq('reservation', reservationId).eq('type', 'facture_acompte').maybeSingle().then((x) => x.data) : null,
  ]);
  const fiche = (yacht?.fiche ?? {}) as Fiche;
  const langue = (LANGUES.includes(r.langue) ? r.langue : LANGUES.includes(profil?.langue) ? profil?.langue : 'fr') as Langue;
  const nom = [profil?.prenom, profil?.nom].filter(Boolean).join(' ').trim() || r.client_nom;
  return {
    langue, numero: doc.numero, emisLe: new Date().toISOString(),
    reservation: r,
    client: {
      nom, email: profil?.email ?? r.client_email, telephone: profil?.telephone || r.client_telephone || '', societe: profil?.societe ?? '', tva: profil?.tva ?? '',
      adresse: [profil?.adresse, [profil?.code_postal, profil?.ville].filter(Boolean).join(' '), profil?.pays].filter((x): x is string => Boolean(x && x.trim())),
    },
    yacht: {
      nom: yacht?.nom ?? r.yacht, chantier: fiche.chantier, annee: fiche.annee, longueur: fiche.longueur, pavillon: fiche.pavillon,
      port: yacht?.port ?? r.port, capacite: yacht?.invites ?? 0, equipage: fiche.equipage,
    },
    photo: doc.type === 'contrat' ? await photo(fiche.image?.src ?? fiche.galerie?.[0]?.src) : null,
    societe: reglages?.societe ?? {},
    conditions: version?.conditions || reglages?.contrat_conditions || '',
    taux: { acompte: reglages?.taux_acompte ?? 50, apa: reglages?.taux_apa ?? 30, tva: Number(reglages?.taux_tva ?? 20) },
    paiements: paiements as Paiement[],
    factureAcompte: factureAcompte?.numero ?? null,
  };
}

// Produit (ou reproduit, avec le même numéro) un document et le range dans le stockage privé
export async function genererDocument(reservationId: string, type: TypeDoc): Promise<Document> {
  const admin = supabaseAdmin();
  const { data: doc, error } = await admin.rpc('document_reserver', { p_reservation: reservationId, p_type: type });
  if (error || !doc) throw error ?? new Error('document_non_reserve');
  const d = await donnees(reservationId, doc as Document);
  enregistrerPolices();
  const pdf = await renderToBuffer(type === 'contrat' ? <Contrat d={d} /> : <Facture d={d} type={type} />);
  const envoi = await admin.storage.from('documents').upload(doc.chemin, pdf, { contentType: 'application/pdf', upsert: true });
  if (envoi.error) throw envoi.error;
  await admin.from('documents').update({ taille: pdf.length }).eq('id', doc.id);
  return { ...(doc as Document), taille: pdf.length };
}

// Tous les documents dus pour une réservation, en ne régénérant que ceux qui manquent
export async function assurerDocuments(reservationId: string): Promise<Document[]> {
  const admin = supabaseAdmin();
  const [{ data: r }, { data: pay }, { data: existants }] = await Promise.all([
    admin.from('reservations').select('statut, solde, apa').eq('id', reservationId).single(),
    admin.from('paiements').select('type').eq('reservation', reservationId).eq('statut', 'paye'),
    admin.from('documents').select('id, type, numero, chemin, taille, client').eq('reservation', reservationId),
  ]);
  if (!r) return [];
  const docs: Document[] = [];
  for (const type of documentsDus(r, pay ?? [])) {
    const e = (existants ?? []).find((x) => x.type === type) as Document | undefined;
    docs.push(e && e.taille > 0 ? e : await genererDocument(reservationId, type));
  }
  return docs;
}
