// Socle des documents PDF : polices de la marque (SIL Open Font License), couleurs à plat lisibles en noir et blanc,
// rose des vents, en-tête et pied répétés. A4 portrait, marges de 18 mm.
import path from 'node:path';
import { Font, StyleSheet, Svg, Path, Circle, Text, View } from '@react-pdf/renderer';
import type { Langue } from '@/lib/format';
import { dateLongue, euros, eurosCentimes, jourSemaine } from '@/lib/format';

const POLICES = path.join(process.cwd(), 'src/lib/pdf/polices');
let polices = false;
export function enregistrerPolices() {
  if (polices) return;
  Font.register({ family: 'Bodoni', fonts: [
    { src: path.join(POLICES, 'bodoni-moda-latin-400-normal.woff') },
    { src: path.join(POLICES, 'bodoni-moda-latin-400-italic.woff'), fontStyle: 'italic' },
  ] });
  Font.register({ family: 'Hanken', fonts: [
    { src: path.join(POLICES, 'hanken-grotesk-latin-300-normal.woff'), fontWeight: 300 },
    { src: path.join(POLICES, 'hanken-grotesk-latin-400-normal.woff'), fontWeight: 400 },
    { src: path.join(POLICES, 'hanken-grotesk-latin-500-normal.woff'), fontWeight: 500 },
  ] });
  Font.registerHyphenationCallback((mot) => [mot]); // pas de césure automatique
  polices = true;
}

export const C = { abysse: '#0B1513', pin: '#16302A', laiton: '#9A8250', brume: '#5E6A64', filet: '#CFCABD', fond: '#F3F1EA' };
export const MM = 2.835;

// Les polices n'ont que le sous-ensemble latin : espace fine insécable → insécable, flèche → tiret
export const propre = (s: string) => s.replace(/\u202F/g, '\u00A0').replace(/→/g, '–');
// « 1 octobre » → « 1er octobre » (usage français)
const premier = (s: string, l: Langue) => (l === 'fr' ? s.replace(/(^|\s)1(?=[\s ]\p{L})/u, '$11er') : s);
export const pdf = {
  euros: (n: number, l: Langue) => propre(euros(n, l)),
  centimes: (n: number, l: Langue) => propre(eurosCentimes(n, l)),
  date: (d: string, l: Langue) => premier(propre(dateLongue(d, l)), l),
  jour: (d: string, l: Langue) => premier(propre(jourSemaine(d, l)), l),
};

export const s = StyleSheet.create({
  page: { fontFamily: 'Hanken', fontSize: 9.5, color: C.abysse, lineHeight: 1.5, paddingTop: 30 * MM, paddingBottom: 26 * MM, paddingHorizontal: 18 * MM, backgroundColor: '#FFFFFF' },
  couverture: { fontFamily: 'Hanken', fontSize: 9.5, color: C.abysse, padding: 18 * MM, backgroundColor: '#FFFFFF' },
  entete: { position: 'absolute', top: 12 * MM, left: 18 * MM, right: 18 * MM, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: C.filet, paddingBottom: 6 },
  enteteTexte: { fontSize: 7.5, letterSpacing: 1.2, textTransform: 'uppercase', color: C.brume },
  piedFilet: { position: 'absolute', bottom: 17 * MM, left: 18 * MM, right: 18 * MM, borderTopWidth: 0.5, borderTopColor: C.filet },
  piedTexte: { position: 'absolute', bottom: 9 * MM, left: 18 * MM, width: 135 * MM, fontSize: 6.8, color: C.brume, lineHeight: 1.4 },
  // Texte calculé page par page : placé depuis le haut de la feuille (297 mm), en police standard du PDF
  // (react-pdf n'affiche pas un texte calculé placé depuis le bas, ni en police WOFF ajoutée)
  piedPage: { position: 'absolute', top: 284 * MM, left: 18 * MM, right: 18 * MM, fontFamily: 'Helvetica', fontSize: 6.5, color: C.brume, textAlign: 'right' },
  kicker: { fontSize: 7.5, letterSpacing: 1.6, textTransform: 'uppercase', color: C.laiton, fontWeight: 500 },
  titre: { fontFamily: 'Bodoni', fontSize: 26, lineHeight: 1.15, marginTop: 8 },
  titreS: { fontFamily: 'Bodoni', fontSize: 13.5, lineHeight: 1.25, marginBottom: 6 },
  italique: { fontFamily: 'Bodoni', fontStyle: 'italic' },
  para: { marginBottom: 6 },
  second: { color: C.brume },
  article: { marginBottom: 14 },
  numero: { fontFamily: 'Bodoni', fontStyle: 'italic', color: C.laiton },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.filet },
  libelle: { color: C.brume, width: '48%', paddingRight: 12 },
  valeur: { textAlign: 'right', width: '52%' },
  puce: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  encadre: { backgroundColor: C.fond, padding: 10, marginTop: 8 },
  fort: { fontWeight: 500 },
});

export function Rose({ taille = 28, couleur = C.laiton }: { taille?: number; couleur?: string }) {
  return (
    <Svg width={taille} height={taille} viewBox="0 0 32 32">
      <Path d="M16 1v30M1 16h30M5.4 5.4l21.2 21.2M26.6 5.4L5.4 26.6" stroke={couleur} strokeWidth={0.9} fill="none" />
      <Circle cx={16} cy={16} r={6.5} stroke={couleur} strokeWidth={0.9} fill="none" />
    </Svg>
  );
}

export type Societe = { raison_sociale?: string; forme?: string; rcs?: string; siret?: string; tva?: string; siege?: string; bureau_monaco?: string; telephone?: string; email?: string; mentions?: string };
export const mentionsSociete = (g: Societe) =>
  [g.raison_sociale ?? 'Portolan', g.forme, g.siege, g.rcs, g.siret && `SIRET ${g.siret}`, g.tva && `TVA ${g.tva}`].filter(Boolean).join(' · ');

// En-tête (facultatif) et pied répétés sur chaque page
export function Cadre({ entete, page, societe }: { entete?: string; page: (n: number, t: number) => string; societe: Societe }) {
  return (
    <>
      {entete ? (
        <View fixed style={s.entete}>
          <Text style={s.enteteTexte}>{entete}</Text>
          <Rose taille={12} />
        </View>
      ) : null}
      <View fixed style={s.piedFilet} />
      <Text fixed style={s.piedTexte}>{mentionsSociete(societe)}</Text>
      <Text fixed style={s.piedPage} render={({ pageNumber, totalPages }) => page(pageNumber, totalPages)} />
    </>
  );
}

export function Ligne({ libelle, valeur, fort }: { libelle: string; valeur: string; fort?: boolean }) {
  return (
    <View style={s.ligne} wrap={false}>
      <Text style={s.libelle}>{libelle}</Text>
      <Text style={[s.valeur, fort ? s.fort : {}]}>{valeur}</Text>
    </View>
  );
}
