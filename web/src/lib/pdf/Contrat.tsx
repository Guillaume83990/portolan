// Contrat de location de yacht avec équipage (brief 06, §6.1) : page de garde, 9 articles, bloc d'acceptation
import { Document, Image, Page, Text, View } from '@react-pdf/renderer';
import { heureMinute } from '@/lib/format';
import { C, Cadre, Ligne, MM, Rose, pdf, propre, s } from './commun';
import { textesPdf } from './textes';
import type { DonneesDoc } from './donnees';

function Article({ n, titre, children }: { n: number; titre: string; children: React.ReactNode }) {
  return (
    <View style={s.article}>
      <View wrap={false} minPresenceAhead={60}>
        <Text style={s.titreS}><Text style={s.numero}>{n}. </Text>{titre}</Text>
      </View>
      {children}
    </View>
  );
}

export function Contrat({ d }: { d: DonneesDoc }) {
  const l = d.langue;
  const t = textesPdf[l].contrat;
  const a = t.articles;
  const r = d.reservation;
  const du = pdf.date(r.debut, l), au = pdf.date(r.fin, l);
  const tauxSolde = 100 - d.taux.acompte;
  const acompte = d.paiements.find((p) => (p.type === 'acompte' || p.type === 'total') && p.paye_le);
  const enUneFois = r.solde === 0;
  const g = d.societe;
  const ville = (g.siege ?? '').split(',').pop()?.replace(/\d+/g, '').trim();

  return (
    <Document title={`${t.titre} ${r.reference}`} author={g.raison_sociale ?? 'Portolan'} language={l}>
      {/* Page de garde */}
      <Page size="A4" style={s.couverture}>
        <View style={{ flexGrow: 1, justifyContent: 'space-between' }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Rose taille={34} />
              <Text style={{ fontFamily: 'Bodoni', fontSize: 18 }}>Portolan</Text>
            </View>
            <View style={{ marginTop: 52 * MM }}>
              <Text style={s.kicker}>{t.reference} {r.reference}</Text>
              <Text style={[s.titre, { fontSize: 30, maxWidth: 140 * MM }]}>{t.titre}</Text>
              <Text style={[s.italique, { fontSize: 15, marginTop: 10, color: C.pin }]}>{propre(t.sousTitre(d.yacht.nom, du, au))}</Text>
            </View>
          </View>
          {/* Image du PDF (react-pdf) : pas d'attribut alt, la photo est décorative */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {d.photo && <Image src={{ data: d.photo, format: 'jpg' }} style={{ width: '100%', height: 70 * MM, objectFit: 'cover' }} />}
          <View style={{ borderTopWidth: 0.5, borderTopColor: C.filet, paddingTop: 8 }}>
            <Ligne libelle={t.reference} valeur={r.reference} />
            <Ligne libelle={t.emisLe} valeur={pdf.date(d.emisLe, l)} />
            <Ligne libelle={t.version} valeur={r.contrat_version ?? 'v1.0'} />
            <Text style={[s.second, { fontSize: 7, marginTop: 10 }]}>{t.modele}</Text>
          </View>
        </View>
      </Page>

      {/* Articles */}
      <Page size="A4" style={s.page}>
        <Cadre entete={t.entete(r.reference)} page={t.page} societe={g} />

        <Article n={1} titre={a.parties.titre}>
          <Text style={s.para}>{a.parties.intro}</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
            <View style={[s.encadre, { flex: 1, marginTop: 0 }]} wrap={false}>
              <Text style={s.kicker}>{a.parties.courtier}</Text>
              <Text style={[s.fort, { marginTop: 4 }]}>{g.raison_sociale}</Text>
              {[g.forme, g.rcs, g.siege, g.tva && `TVA ${g.tva}`].filter(Boolean).map((x) => <Text key={x}>{x}</Text>)}
              <Text style={[s.second, { marginTop: 4 }]}>{a.parties.pourCompte}</Text>
            </View>
            <View style={[s.encadre, { flex: 1, marginTop: 0 }]} wrap={false}>
              <Text style={s.kicker}>{a.parties.locataire}</Text>
              <Text style={[s.fort, { marginTop: 4 }]}>{d.client.nom}</Text>
              {d.client.societe ? <Text>{d.client.societe}</Text> : null}
              {d.client.adresse.map((x) => <Text key={x}>{x}</Text>)}
              <Text>{d.client.email}</Text>
              {d.client.telephone ? <Text>{d.client.telephone}</Text> : null}
              {d.client.tva ? <Text>TVA {d.client.tva}</Text> : null}
            </View>
          </View>
        </Article>

        <Article n={2} titre={a.yacht.titre}>
          <Ligne libelle={a.yacht.nom} valeur={d.yacht.nom} />
          {d.yacht.chantier && <Ligne libelle={a.yacht.chantier} valeur={d.yacht.chantier} />}
          {d.yacht.annee && <Ligne libelle={a.yacht.annee} valeur={String(d.yacht.annee)} />}
          {d.yacht.longueur && <Ligne libelle={a.yacht.longueur} valeur={`${String(d.yacht.longueur).replace('.', l === 'en' ? '.' : ',')} m`} />}
          {d.yacht.pavillon && <Ligne libelle={a.yacht.pavillon} valeur={d.yacht.pavillon} />}
          <Ligne libelle={a.yacht.port} valeur={d.yacht.port} />
          <Ligne libelle={a.yacht.capacite} valeur={a.yacht.invites(d.yacht.capacite)} />
          {d.yacht.equipage && <Ligne libelle={a.yacht.equipage} valeur={a.yacht.membres(d.yacht.equipage)} />}
        </Article>

        <Article n={3} titre={a.croisiere.titre}>
          <Ligne libelle={a.croisiere.embarquement} valeur={`${pdf.jour(r.debut, l)}, ${(r.heure ?? '12:00').slice(0, 5)}, ${r.port}`} />
          <Ligne libelle={a.croisiere.debarquement} valeur={`${pdf.jour(r.fin, l)}, ${r.port}`} />
          <Ligne libelle={a.croisiere.duree} valeur={a.croisiere.nuits(r.nuits)} />
          {r.invites ? <Ligne libelle={a.croisiere.invites} valeur={String(r.invites)} /> : null}
          <Ligne libelle={a.croisiere.zone} valeur={a.croisiere.zoneValeur} />
        </Article>

        <Article n={4} titre={a.prix.titre}>
          <Ligne libelle={`${a.prix.location} (${a.prix.dontTva(`${String(d.taux.tva).replace('.', ',')} %`)})`} valeur={pdf.euros(r.montant, l)} fort />
          {enUneFois ? (
            <Ligne libelle={`${a.prix.location} + APA`} valeur={`${pdf.euros(r.montant + r.apa, l)}${acompte?.paye_le ? `, ${a.prix.regleLe(pdf.date(acompte.paye_le, l))}` : ''}`} />
          ) : (
            <>
              <Ligne libelle={a.prix.acompte(d.taux.acompte)} valeur={`${pdf.euros(r.acompte, l)}${acompte?.paye_le ? `, ${a.prix.regleLe(pdf.date(acompte.paye_le, l))}` : ''}`} />
              <Ligne libelle={a.prix.solde(tauxSolde)} valeur={`${pdf.euros(r.solde, l)}${r.solde_du_le ? `, ${a.prix.duLe(pdf.date(r.solde_du_le, l))}` : ''}`} />
            </>
          )}
          <Ligne libelle={a.prix.apa(d.taux.apa)} valeur={`${pdf.euros(r.apa, l)}${r.solde_du_le && !enUneFois ? `, ${a.prix.duLe(pdf.date(r.solde_du_le, l))}` : ''}`} />
          <Text style={[s.para, { marginTop: 8 }]}>{a.prix.inclus}</Text>
          <Text style={s.para}>{a.prix.exclus}</Text>
        </Article>

        <Article n={5} titre={a.apa.titre}>{a.apa.texte.map((x) => <Text key={x} style={s.para}>{x}</Text>)}</Article>

        <Article n={6} titre={a.annulation.titre}>
          {a.annulation.points.map((x) => <View key={x} style={s.puce}><Text style={{ color: C.laiton }}>—</Text><Text style={{ flex: 1 }}>{x}</Text></View>)}
        </Article>

        <Article n={7} titre={a.bord.titre}>{a.bord.texte.map((x) => <Text key={x} style={s.para}>{x}</Text>)}</Article>
        <Article n={8} titre={a.droit.titre}>{a.droit.texte.map((x) => <Text key={x} style={s.para}>{x}</Text>)}</Article>
        <Article n={9} titre={a.particulieres.titre}><Text style={s.para}>{d.conditions.trim() || a.particulieres.neant}</Text></Article>

        {/* Acceptation */}
        <View wrap={false} style={{ marginTop: 10, borderTopWidth: 0.5, borderTopColor: C.laiton, paddingTop: 12 }}>
          <Text style={s.titreS}>{t.acceptation.titre}</Text>
          <Text style={s.para}>{propre(t.acceptation.texte(d.client.nom, d.client.email,
            r.accepte_le ? pdf.date(r.accepte_le, l) : '—', r.accepte_le ? heureMinute(r.accepte_le, l) : '—', r.accepte_ip || '—', r.contrat_version ?? 'v1.0'))}</Text>
          {acompte?.paye_le && <Text style={[s.para, s.fort]}>{t.acceptation.acompte(pdf.date(acompte.paye_le, l))}</Text>}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
            <View style={{ flex: 1, height: 26 * MM, borderWidth: 0.5, borderColor: C.filet, borderStyle: 'dashed', padding: 8 }}>
              <Text style={s.kicker}>{t.acceptation.signature}</Text>
              <Text style={[s.second, { fontSize: 7.5, marginTop: 4 }]}>{t.acceptation.signatureNote}</Text>
            </View>
            <View style={{ flex: 1, padding: 8 }}>
              <Text style={s.second}>{ville || 'Saint-Tropez'}, {pdf.date(d.emisLe, l)}</Text>
              <Text style={[s.italique, { fontSize: 12, marginTop: 6 }]}>{g.raison_sociale ?? 'Portolan'}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
