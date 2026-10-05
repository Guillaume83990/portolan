// Gabarit commun des e-mails (brief 05, §5.1) : une colonne de 600 px, polices de secours Georgia et Arial,
// bouton en vrai bloc de couleur, lisible images bloquées et en mode sombre. Version « interne » plus dense pour la direction.
import { Body, Button, Column, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from '@react-email/components';
import type { Langue } from '@/lib/format';

const C = { abysse: '#0B1513', pin: '#16302A', calcaire: '#E7E6DF', papier: '#FBFAF6', laiton: '#B39A62', laitonTexte: '#8A7343', brume: '#5E6A64', filet: '#DCD8CC' };
const SERIF = "'Bodoni Moda', Georgia, 'Times New Roman', serif";
const SANS = "'Hanken Grotesk', Arial, Helvetica, sans-serif";

export type Courtier = { prenom?: string; nom?: string; titre?: string; titre_en?: string; titre_de?: string; titre_it?: string; telephone?: string; whatsapp?: string; email?: string };
export type PropsGabarit = {
  langue: Langue; apercu: string; kicker?: string; titre: string; paragraphes: string[];
  mot?: { texte: string; auteur: string }; recap?: [string, string][]; recapTitre?: string;
  coordonnees?: { lignes: [string, string][]; consigne: string };
  bouton?: { libelle: string; url: string }; secondaire?: { libelle: string; url: string };
  photo?: { url: string; alt: string }; pieces?: { titre: string; noms: string[] };
  courtier?: { titre: string; c: Courtier; repondre: string };
  pied: { adresses: string; liens: { libelle: string; url: string }[]; mention: string; demo?: string };
  base: string; interne?: boolean;
};

const p = { fontFamily: SANS, fontSize: '15px', lineHeight: '1.6', color: '#25302C', margin: '0 0 14px' };

export function Gabarit(x: PropsGabarit) {
  return (
    <Html lang={x.langue}>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{x.apercu}</Preview>
      <Body style={{ backgroundColor: C.calcaire, margin: 0, padding: '24px 0' }}>
        <Container style={{ width: '100%', maxWidth: '600px', backgroundColor: C.papier }}>
          {/* En-tête : rose des vents et « Portolan » sur abysse, filet laiton */}
          <Section style={{ backgroundColor: C.abysse, borderBottom: `2px solid ${C.laiton}`, padding: x.interne ? '16px 28px' : '22px 32px' }}>
            <Row>
              <Column style={{ width: '40px' }}>
                <Img src={`${x.base}/email/rose.png`} width="32" height="32" alt="" style={{ display: 'block' }} />
              </Column>
              <Column>
                <Text style={{ fontFamily: SERIF, fontSize: '22px', color: C.calcaire, margin: 0, letterSpacing: '0.5px' }}>Portolan</Text>
              </Column>
              {x.interne && <Column align="right"><Text style={{ fontFamily: SANS, fontSize: '11px', color: C.laiton, margin: 0, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Direction</Text></Column>}
            </Row>
          </Section>

          {x.photo && <Img src={x.photo.url} width="600" alt={x.photo.alt} style={{ display: 'block', width: '100%', maxWidth: '600px', height: 'auto' }} />}

          <Section style={{ padding: x.interne ? '24px 28px 8px' : '36px 32px 12px' }}>
            {x.kicker && <Text style={{ fontFamily: SANS, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: C.laitonTexte, margin: '0 0 10px' }}>{x.kicker}</Text>}
            <Text style={{ fontFamily: SERIF, fontSize: x.interne ? '22px' : '30px', lineHeight: '1.2', color: C.abysse, margin: '0 0 20px' }}>{x.titre}</Text>
            {x.paragraphes.map((t, i) => <Text key={i} style={p}>{t}</Text>)}

            {x.mot && (
              <Section style={{ borderLeft: `2px solid ${C.laiton}`, padding: '4px 0 4px 16px', margin: '6px 0 18px' }}>
                <Text style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '17px', lineHeight: '1.5', color: C.pin, margin: '0 0 6px' }}>{x.mot.texte}</Text>
                <Text style={{ fontFamily: SANS, fontSize: '13px', color: C.brume, margin: 0 }}>{x.mot.auteur}</Text>
              </Section>
            )}

            {x.coordonnees && (
              <Section style={{ backgroundColor: '#F1EEE5', padding: '16px 20px', margin: '8px 0 18px' }}>
                {x.coordonnees.lignes.map(([l, v]) => (
                  <Row key={l}>
                    <Column style={{ fontFamily: SANS, fontSize: '13px', color: C.brume, padding: '5px 0', width: '42%', verticalAlign: 'top' }}>{l}</Column>
                    <Column style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '15px', color: C.abysse, padding: '5px 0', fontWeight: 600 }}>{v}</Column>
                  </Row>
                ))}
                <Text style={{ ...p, fontSize: '13px', color: C.brume, margin: '10px 0 0' }}>{x.coordonnees.consigne}</Text>
              </Section>
            )}

            {x.recap && x.recap.length > 0 && (
              <Section style={{ margin: '6px 0 22px' }}>
                {x.recapTitre && <Text style={{ fontFamily: SANS, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: C.laitonTexte, margin: '0 0 6px' }}>{x.recapTitre}</Text>}
                {x.recap.map(([l, v]) => (
                  <Row key={l} style={{ borderBottom: `1px solid ${C.filet}` }}>
                    <Column style={{ fontFamily: SANS, fontSize: '14px', color: C.brume, padding: '9px 12px 9px 0', width: '42%', verticalAlign: 'top' }}>{l}</Column>
                    <Column style={{ fontFamily: SANS, fontSize: '14px', color: C.abysse, padding: '9px 0', textAlign: 'right' }}>{v}</Column>
                  </Row>
                ))}
              </Section>
            )}

            {x.pieces && x.pieces.noms.length > 0 && (
              <Section style={{ margin: '0 0 22px' }}>
                <Text style={{ fontFamily: SANS, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: C.laitonTexte, margin: '0 0 6px' }}>{x.pieces.titre}</Text>
                {x.pieces.noms.map((n) => <Text key={n} style={{ ...p, margin: '0 0 4px' }}>— {n} (PDF)</Text>)}
              </Section>
            )}

            {x.bouton && (
              <Section style={{ margin: '8px 0 14px' }}>
                <Button href={x.bouton.url} style={{ backgroundColor: C.laiton, color: C.abysse, fontFamily: SANS, fontSize: '15px', fontWeight: 600, padding: '14px 28px', borderRadius: '999px', textDecoration: 'none', display: 'inline-block' }}>
                  {x.bouton.libelle}
                </Button>
              </Section>
            )}
            {x.secondaire && <Text style={{ ...p, fontSize: '14px' }}><Link href={x.secondaire.url} style={{ color: C.pin, textDecoration: 'underline' }}>{x.secondaire.libelle}</Link></Text>}
          </Section>

          {/* Votre courtier */}
          {x.courtier && (
            <Section style={{ padding: '0 32px 28px' }}>
              <Hr style={{ borderColor: C.filet, margin: '8px 0 20px' }} />
              <Text style={{ fontFamily: SANS, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: C.laitonTexte, margin: '0 0 8px' }}>{x.courtier.titre}</Text>
              <Text style={{ fontFamily: SERIF, fontSize: '19px', color: C.abysse, margin: '0 0 2px' }}>{[x.courtier.c.prenom, x.courtier.c.nom].filter(Boolean).join(' ')}</Text>
              {x.courtier.c.titre && <Text style={{ ...p, fontSize: '13px', color: C.brume, margin: '0 0 8px' }}>{x.courtier.c.titre}</Text>}
              <Text style={{ ...p, fontSize: '14px', margin: '0 0 4px' }}>
                {x.courtier.c.telephone && <Link href={`tel:${x.courtier.c.telephone.replace(/\s/g, '')}`} style={{ color: C.pin }}>{x.courtier.c.telephone}</Link>}
                {x.courtier.c.whatsapp && <> · <Link href={`https://wa.me/${x.courtier.c.whatsapp.replace(/\D/g, '')}`} style={{ color: C.pin }}>WhatsApp</Link></>}
              </Text>
              <Text style={{ ...p, fontSize: '14px', color: C.brume, margin: 0 }}>{x.courtier.repondre}</Text>
            </Section>
          )}

          {/* Pied */}
          <Section style={{ backgroundColor: C.abysse, padding: '22px 32px' }}>
            <Text style={{ fontFamily: SANS, fontSize: '12px', color: C.calcaire, margin: '0 0 8px' }}>{x.pied.adresses}</Text>
            <Text style={{ fontFamily: SANS, fontSize: '12px', margin: '0 0 8px' }}>
              {x.pied.liens.map((l, i) => <span key={l.url}>{i > 0 ? ' · ' : ''}<Link href={l.url} style={{ color: C.laiton }}>{l.libelle}</Link></span>)}
            </Text>
            <Text style={{ fontFamily: SANS, fontSize: '11px', lineHeight: '1.5', color: '#9AA49F', margin: 0 }}>{x.pied.mention}</Text>
            {x.pied.demo && <Text style={{ fontFamily: SANS, fontSize: '11px', lineHeight: '1.5', color: '#9AA49F', margin: '8px 0 0' }}>{x.pied.demo}</Text>}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
