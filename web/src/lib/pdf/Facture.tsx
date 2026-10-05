// Factures d'acompte et de solde, reçu de l'APA (brief 06, §6.2) : une page A4, mentions obligatoires françaises
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { C, Cadre, Ligne, Rose, pdf, propre, s } from './commun';
import { textesPdf } from './textes';
import type { DonneesDoc } from './donnees';

export type TypeFacture = 'facture_acompte' | 'facture_solde' | 'recu_apa';

// Décomposition d'un montant TTC : HT et TVA au centime
const ventiler = (ttc: number, taux: number) => {
  const ht = Math.round((ttc / (1 + taux / 100)) * 100) / 100;
  return { ht, tva: Math.round((ttc - ht) * 100) / 100, ttc };
};

export function Facture({ d, type }: { d: DonneesDoc; type: TypeFacture }) {
  const l = d.langue;
  const t = textesPdf[l].facture;
  const r = d.reservation;
  const g = d.societe;
  const du = pdf.date(r.debut, l), au = pdf.date(r.fin, l);
  const enUneFois = r.solde === 0;
  const paye = (types: string[]) => d.paiements.filter((p) => types.includes(p.type) && p.paye_le).sort((a, b) => (b.paye_le ?? '').localeCompare(a.paye_le ?? ''))[0];
  const paiement = type === 'facture_acompte' ? paye(['acompte']) : paye(['solde', 'total', 'apa']) ?? paye(['acompte', 'total']);
  const titre = type === 'recu_apa' ? t.recuApa : type === 'facture_acompte' ? t.factureAcompte : enUneFois ? t.facture : t.factureSolde;
  const taux = d.taux.tva;
  const tauxTexte = `${String(taux).replace('.', l === 'en' ? '.' : ',')} %`;

  const montantTtc = type === 'facture_acompte' ? r.acompte : type === 'recu_apa' ? r.apa : enUneFois ? r.montant : r.montant - r.acompte;
  const v = ventiler(montantTtc, taux);
  const designation = type === 'facture_acompte'
    ? t.ligneAcompte(d.taux.acompte, d.yacht.nom, du, au, r.nuits, r.reference)
    : type === 'recu_apa' ? t.recuTexte(d.yacht.nom, du, au, r.reference)
    : t.ligneSolde(d.yacht.nom, du, au, r.nuits, r.reference);

  return (
    <Document title={`${titre} ${d.numero}`} author={g.raison_sociale ?? 'Portolan'} language={l}>
      <Page size="A4" style={[s.page, { paddingTop: 18 * 2.835 }]}>
        <Cadre page={t.page} societe={g} />

        {/* Émetteur */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Rose taille={26} />
            <Text style={{ fontFamily: 'Bodoni', fontSize: 17 }}>Portolan</Text>
          </View>
          <View style={{ alignItems: 'flex-end', maxWidth: '55%' }}>
            <Text style={s.fort}>{g.raison_sociale}</Text>
            {[g.forme, g.siege, g.rcs, g.siret && `SIRET ${g.siret}`, g.tva && `TVA ${g.tva}`, g.telephone, g.email].filter(Boolean)
              .map((x) => <Text key={x} style={[s.second, { fontSize: 8, textAlign: 'right' }]}>{x}</Text>)}
          </View>
        </View>

        {/* Titre et références */}
        <View style={{ marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', gap: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.kicker}>{t.reservation} {r.reference}</Text>
            <Text style={[s.titre, { fontSize: 22 }]}>{titre}</Text>
          </View>
          <View style={{ width: '42%' }}>
            <Ligne libelle={t.numero} valeur={d.numero} fort />
            <Ligne libelle={t.emiseLe} valeur={pdf.date(d.emisLe, l)} />
            {paiement?.paye_le && <Ligne libelle={t.payeeLe} valeur={pdf.date(paiement.paye_le, l)} />}
          </View>
        </View>

        {/* Client */}
        <View style={[s.encadre, { marginTop: 22, width: '55%' }]}>
          <Text style={s.kicker}>{t.client}</Text>
          <Text style={[s.fort, { marginTop: 4 }]}>{d.client.nom}</Text>
          {d.client.societe ? <Text>{d.client.societe}</Text> : null}
          {d.client.adresse.map((x) => <Text key={x}>{x}</Text>)}
          <Text>{d.client.email}</Text>
          {d.client.tva ? <Text>{t.tvaClient} {d.client.tva}</Text> : null}
        </View>

        {/* Désignation et montants */}
        <View style={{ marginTop: 22 }}>
          <View style={{ flexDirection: 'row', borderBottomWidth: 0.8, borderBottomColor: C.abysse, paddingBottom: 4 }}>
            <Text style={[s.kicker, { flex: 1, color: C.abysse }]}>{t.designation}</Text>
          </View>
          <Text style={{ paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: C.filet }}>{propre(designation)}</Text>
          <View style={{ alignSelf: 'flex-end', width: '55%', marginTop: 10 }}>
            {type === 'facture_solde' && !enUneFois && (
              <>
                <Ligne libelle={t.totalLocation} valeur={pdf.centimes(r.montant, l)} />
                <Ligne libelle={t.acompteDeduit(d.factureAcompte ?? '—')} valeur={`− ${pdf.centimes(r.acompte, l)}`} />
              </>
            )}
            {type === 'recu_apa' ? (
              <Ligne libelle={t.total} valeur={pdf.centimes(r.apa, l)} fort />
            ) : (
              <>
                <Ligne libelle={t.montantHt} valeur={pdf.centimes(v.ht, l)} />
                <Ligne libelle={`${t.tauxTva}`} valeur={tauxTexte} />
                <Ligne libelle={t.montantTva} valeur={pdf.centimes(v.tva, l)} />
                <Ligne libelle={type === 'facture_solde' && !enUneFois ? `${t.resteDu} · ${t.montantTtc}` : t.montantTtc} valeur={pdf.centimes(v.ttc, l)} fort />
              </>
            )}
          </View>
        </View>

        {paiement?.paye_le && (
          <Text style={[s.fort, { marginTop: 18, color: C.pin }]}>{t.acquittee(pdf.date(paiement.paye_le, l), t.moyens[paiement.methode])}</Text>
        )}

        {/* Mentions */}
        <View style={{ marginTop: 'auto', paddingTop: 20 }}>
          {type === 'recu_apa' ? (
            <>
              <Text style={s.para}>{t.recuNote}</Text>
              <Text style={[s.second, { fontSize: 8 }]}>{t.recuPasFacture}</Text>
            </>
          ) : (
            <>
              <Text style={[s.second, { fontSize: 8, marginBottom: 4 }]}>{t.tvaProvisoire}</Text>
              <Text style={[s.second, { fontSize: 8, marginBottom: 4 }]}>{l === 'fr' && g.mentions ? g.mentions : t.mentions}</Text>
            </>
          )}
          <Text style={[s.second, { fontSize: 8 }]}>{t.rappelContrat(r.reference)}</Text>
        </View>
      </Page>
    </Document>
  );
}
