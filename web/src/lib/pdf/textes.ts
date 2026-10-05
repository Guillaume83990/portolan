// Textes des documents PDF (contrat, factures, reçu de l'APA), dans la langue du client.
// Modèles à faire valider par un juriste et un expert-comptable avant tout usage réel (site de démonstration).
import type { Langue } from '@/lib/format';

export type TextesContrat = {
  titre: string; sousTitre: (yacht: string, du: string, au: string) => string; reference: string; emisLe: string; version: string;
  entete: (ref: string) => string; page: (n: number, total: number) => string; modele: string;
  articles: {
    parties: { titre: string; intro: string; courtier: string; pourCompte: string; locataire: string };
    yacht: { titre: string; nom: string; chantier: string; annee: string; longueur: string; pavillon: string; port: string; capacite: string; equipage: string; invites: (n: number) => string; membres: (n: number) => string };
    croisiere: { titre: string; embarquement: string; debarquement: string; duree: string; invites: string; zone: string; zoneValeur: string; nuits: (n: number) => string; a: string };
    prix: { titre: string; location: string; dontTva: (taux: string) => string; acompte: (t: number) => string; solde: (t: number) => string; apa: (t: number) => string; regleLe: (d: string) => string; duLe: (d: string) => string; inclus: string; exclus: string };
    apa: { titre: string; texte: string[] };
    annulation: { titre: string; points: string[] };
    bord: { titre: string; texte: string[] };
    droit: { titre: string; texte: string[] };
    particulieres: { titre: string; neant: string };
  };
  acceptation: { titre: string; texte: (nom: string, email: string, date: string, heure: string, ip: string, version: string) => string; acompte: (date: string) => string; signature: string; signatureNote: string };
};

export type TextesFacture = {
  factureAcompte: string; factureSolde: string; facture: string; recuApa: string;
  numero: string; emiseLe: string; payeeLe: string; reservation: string; client: string; tvaClient: string;
  designation: string; montantHt: string; tauxTva: string; montantTva: string; montantTtc: string;
  ligneAcompte: (t: number, yacht: string, du: string, au: string, nuits: number, ref: string) => string;
  ligneSolde: (yacht: string, du: string, au: string, nuits: number, ref: string) => string;
  totalLocation: string; acompteDeduit: (numero: string) => string; resteDu: string;
  acquittee: (date: string, moyen: string) => string; moyens: Record<'carte' | 'virement' | 'manuel', string>;
  total: string; mentions: string; tvaProvisoire: string; recuTexte: (yacht: string, du: string, au: string, ref: string) => string; recuNote: string; recuPasFacture: string;
  rappelContrat: (ref: string) => string; page: (n: number, total: number) => string;
};

const fr: { contrat: TextesContrat; facture: TextesFacture } = {
  contrat: {
    titre: 'Contrat de location de yacht avec équipage',
    sousTitre: (y, du, au) => `${y} · du ${du} au ${au}`,
    reference: 'Référence', emisLe: 'Émis le', version: 'Version du contrat',
    entete: (ref) => `Portolan · Contrat ${ref}`, page: (n, t) => `Page ${n} sur ${t}`,
    modele: 'Modèle de démonstration : texte à faire valider par un juriste avant tout usage réel.',
    articles: {
      parties: {
        titre: 'Les parties',
        intro: 'Le présent contrat est conclu entre les parties suivantes.',
        courtier: 'Le courtier', pourCompte: 'agissant au nom et pour le compte du propriétaire du yacht, ci-après « le courtier ».',
        locataire: 'Le locataire, ci-après « le locataire »',
      },
      yacht: {
        titre: 'Le yacht', nom: 'Nom', chantier: 'Chantier', annee: 'Année', longueur: 'Longueur', pavillon: 'Pavillon', port: "Port d'attache",
        capacite: 'Capacité', equipage: 'Équipage', invites: (n) => `${n} invités`, membres: (n) => `${n} membres d'équipage`,
      },
      croisiere: {
        titre: 'La croisière', embarquement: 'Embarquement', debarquement: 'Débarquement', duree: 'Durée', invites: 'Invités',
        zone: 'Zone de navigation', zoneValeur: 'Méditerranée occidentale', nuits: (n) => `${n} nuits`, a: 'à',
      },
      prix: {
        titre: "Le prix et l'échéancier", location: 'Location du yacht avec équipage', dontTva: (t) => `dont TVA ${t}`,
        acompte: (t) => `Acompte de ${t} %`, solde: (t) => `Solde de ${t} %`, apa: (t) => `Avance sur frais (APA) de ${t} %`,
        regleLe: (d) => `réglé le ${d}`, duLe: (d) => `dû le ${d}`,
        inclus: "Le prix comprend la mise à disposition du yacht, le salaire et la nourriture de l'équipage, l'assurance du yacht et son entretien.",
        exclus: "Il ne comprend pas les frais de croisière (carburant, vivres, boissons, droits de port, communications), réglés par l'avance sur frais, ni le pourboire de l'équipage, laissé à l'appréciation du locataire.",
      },
      apa: {
        titre: "L'avance sur frais de croisière (APA)",
        texte: [
          "L'avance sur frais est versée avec le solde. Elle est confiée au capitaine, qui règle les dépenses de la croisière et tient un relevé détaillé, accompagné des justificatifs.",
          "Le relevé est remis au locataire au débarquement. Si l'avance n'est pas entièrement utilisée, le reliquat lui est restitué ; si elle est dépassée, le complément est réglé avant le débarquement.",
        ],
      },
      annulation: {
        titre: 'Annulation',
        points: [
          "En cas d'annulation par le locataire après le versement de l'acompte, l'acompte reste acquis au propriétaire, sauf si le yacht est reloué pour la même période et aux mêmes conditions.",
          "En cas d'annulation moins d'un mois avant l'embarquement, la totalité du prix de la location reste due ; l'avance sur frais non engagée est restituée.",
          "Si le propriétaire ne peut pas honorer la location, les sommes versées sont intégralement remboursées, ou un yacht équivalent est proposé au locataire.",
          "Ces conditions s'inspirent du contrat type MYBA.",
        ],
      },
      bord: {
        titre: 'À bord : obligations, sécurité, assurances',
        texte: [
          "Le locataire s'engage à ne pas dépasser le nombre d'invités prévu, à respecter le yacht et les consignes de l'équipage, et à ne pas embarquer de produits illicites.",
          "Le capitaine est seul juge de la sécurité : l'itinéraire ou l'heure de départ peuvent être modifiés, ou une navigation interrompue, en raison de la météo, sans que cela ouvre droit à remboursement.",
          "Le yacht est assuré par son propriétaire. Il est recommandé au locataire de souscrire une assurance annulation et responsabilité civile pour lui-même et ses invités.",
        ],
      },
      droit: {
        titre: 'Droit applicable et litiges',
        texte: ['Le présent contrat est soumis au droit français. Avant toute action en justice, les parties recherchent une solution amiable ; à défaut, le locataire consommateur peut recourir gratuitement à un médiateur de la consommation.'],
      },
      particulieres: { titre: 'Conditions particulières', neant: 'Néant.' },
    },
    acceptation: {
      titre: 'Acceptation',
      texte: (n, e, d, h, ip, v) => `Contrat accepté électroniquement par ${n} (${e}) le ${d} à ${h} (heure de Paris), depuis l'adresse IP ${ip}, version ${v}.`,
      acompte: (d) => `Acompte reçu le ${d}. La réservation est ferme.`,
      signature: 'Signature électronique', signatureNote: 'Emplacement réservé à une signature électronique certifiée (version ultérieure).',
    },
  },
  facture: {
    factureAcompte: "Facture d'acompte", factureSolde: 'Facture de solde', facture: 'Facture', recuApa: "Reçu de l'avance sur frais de croisière",
    numero: 'Numéro', emiseLe: "Date d'émission", payeeLe: 'Date du paiement', reservation: 'Réservation', client: 'Facturé à', tvaClient: 'N° de TVA',
    designation: 'Désignation', montantHt: 'Montant HT', tauxTva: 'Taux de TVA', montantTva: 'Montant de TVA', montantTtc: 'Montant TTC',
    ligneAcompte: (t, y, du, au, n, r) => `Acompte de ${t} % sur la location du yacht ${y} avec équipage, du ${du} au ${au} (${n} nuits), contrat ${r}`,
    ligneSolde: (y, du, au, n, r) => `Location du yacht ${y} avec équipage, du ${du} au ${au} (${n} nuits), contrat ${r}`,
    totalLocation: 'Total de la location', acompteDeduit: (n) => `Acompte déjà facturé (facture ${n})`, resteDu: 'Solde',
    acquittee: (d, m) => `Acquittée le ${d} ${m}.`, moyens: { carte: 'par carte bancaire', virement: 'par virement', manuel: 'par paiement enregistré par le courtier' },
    total: 'Montant reçu',
    mentions: "Pénalités de retard : trois fois le taux d'intérêt légal. Indemnité forfaitaire pour frais de recouvrement : 40 € (professionnels). Pas d'escompte pour paiement anticipé.",
    tvaProvisoire: "Montants de TVA indicatifs, à valider par l'expert-comptable (la TVA d'une location de yacht dépend des eaux naviguées).",
    recuTexte: (y, du, au, r) => `Avance sur frais de croisière pour la location du yacht ${y}, du ${du} au ${au}, contrat ${r}.`,
    recuNote: 'Somme gérée par le capitaine pour les frais de la croisière ; relevé des dépenses et restitution du reliquat en fin de croisière.',
    recuPasFacture: "Ce reçu n'est pas une facture : l'avance sur frais n'est pas soumise à la TVA.",
    rappelContrat: (r) => `Conformément au contrat de location ${r}.`, page: (n, t) => `Page ${n} sur ${t}`,
  },
};

const en: typeof fr = {
  contrat: {
    titre: 'Crewed yacht charter agreement',
    sousTitre: (y, du, au) => `${y} · ${du} to ${au}`,
    reference: 'Reference', emisLe: 'Issued on', version: 'Contract version',
    entete: (ref) => `Portolan · Contract ${ref}`, page: (n, t) => `Page ${n} of ${t}`,
    modele: 'Demonstration template: to be reviewed by a lawyer before any real use.',
    articles: {
      parties: {
        titre: 'The parties', intro: 'This agreement is entered into by the following parties.',
        courtier: 'The broker', pourCompte: 'acting in the name and on behalf of the owner of the yacht, hereinafter “the broker”.',
        locataire: 'The charterer, hereinafter “the charterer”',
      },
      yacht: {
        titre: 'The yacht', nom: 'Name', chantier: 'Shipyard', annee: 'Year', longueur: 'Length', pavillon: 'Flag', port: 'Home port',
        capacite: 'Capacity', equipage: 'Crew', invites: (n) => `${n} guests`, membres: (n) => `${n} crew members`,
      },
      croisiere: {
        titre: 'The cruise', embarquement: 'Embarkation', debarquement: 'Disembarkation', duree: 'Duration', invites: 'Guests',
        zone: 'Cruising area', zoneValeur: 'Western Mediterranean', nuits: (n) => `${n} nights`, a: 'at',
      },
      prix: {
        titre: 'Price and payment schedule', location: 'Charter of the yacht with crew', dontTva: (t) => `incl. VAT ${t}`,
        acompte: (t) => `${t}% deposit`, solde: (t) => `${t}% balance`, apa: (t) => `${t}% advance provisioning allowance (APA)`,
        regleLe: (d) => `paid on ${d}`, duLe: (d) => `due on ${d}`,
        inclus: 'The price includes the use of the yacht, crew wages and food, the insurance of the yacht and its maintenance.',
        exclus: 'It does not include cruising expenses (fuel, provisions, drinks, harbour dues, communications), covered by the APA, nor the crew gratuity, at the charterer’s discretion.',
      },
      apa: {
        titre: 'Advance provisioning allowance (APA)',
        texte: [
          'The APA is paid together with the balance. It is entrusted to the captain, who pays the cruise expenses and keeps a detailed statement with receipts.',
          'The statement is handed to the charterer on disembarkation. Any unused amount is refunded; if the APA is exceeded, the difference is paid before disembarkation.',
        ],
      },
      annulation: {
        titre: 'Cancellation',
        points: [
          'If the charterer cancels after paying the deposit, the deposit is retained by the owner, unless the yacht is re-chartered for the same period on the same terms.',
          'If the charterer cancels less than one month before embarkation, the full charter fee remains due; any unspent APA is refunded.',
          'If the owner cannot honour the charter, all sums paid are refunded in full, or an equivalent yacht is offered to the charterer.',
          'These terms are based on the MYBA standard charter agreement.',
        ],
      },
      bord: {
        titre: 'On board: obligations, safety, insurance',
        texte: [
          'The charterer undertakes not to exceed the agreed number of guests, to respect the yacht and the crew’s instructions, and not to bring any illegal substances on board.',
          'The captain alone decides on matters of safety and may change the itinerary or departure time, or interrupt a passage because of the weather, without this giving rise to a refund.',
          'The yacht is insured by its owner. The charterer is advised to take out cancellation and liability insurance for themselves and their guests.',
        ],
      },
      droit: {
        titre: 'Governing law and disputes',
        texte: ['This agreement is governed by French law. Before any legal action, the parties shall seek an amicable solution; failing that, a consumer charterer may use a consumer mediator free of charge.'],
      },
      particulieres: { titre: 'Special conditions', neant: 'None.' },
    },
    acceptation: {
      titre: 'Acceptance',
      texte: (n, e, d, h, ip, v) => `Agreement accepted electronically by ${n} (${e}) on ${d} at ${h} (Paris time), from IP address ${ip}, version ${v}.`,
      acompte: (d) => `Deposit received on ${d}. The booking is firm.`,
      signature: 'Electronic signature', signatureNote: 'Reserved for a certified electronic signature (future version).',
    },
  },
  facture: {
    factureAcompte: 'Deposit invoice', factureSolde: 'Balance invoice', facture: 'Invoice', recuApa: 'Receipt for the advance provisioning allowance',
    numero: 'Number', emiseLe: 'Issue date', payeeLe: 'Payment date', reservation: 'Booking', client: 'Billed to', tvaClient: 'VAT no.',
    designation: 'Description', montantHt: 'Amount excl. VAT', tauxTva: 'VAT rate', montantTva: 'VAT amount', montantTtc: 'Amount incl. VAT',
    ligneAcompte: (t, y, du, au, n, r) => `${t}% deposit on the charter of the yacht ${y} with crew, ${du} to ${au} (${n} nights), contract ${r}`,
    ligneSolde: (y, du, au, n, r) => `Charter of the yacht ${y} with crew, ${du} to ${au} (${n} nights), contract ${r}`,
    totalLocation: 'Total charter fee', acompteDeduit: (n) => `Deposit already invoiced (invoice ${n})`, resteDu: 'Balance',
    acquittee: (d, m) => `Paid on ${d} ${m}.`, moyens: { carte: 'by card', virement: 'by bank transfer', manuel: 'by payment recorded by the broker' },
    total: 'Amount received',
    mentions: 'Late payment penalties: three times the French legal interest rate. Fixed recovery fee: €40 (businesses). No discount for early payment.',
    tvaProvisoire: 'VAT amounts are indicative and subject to the accountant’s approval (VAT on a yacht charter depends on the waters sailed).',
    recuTexte: (y, du, au, r) => `Advance provisioning allowance for the charter of the yacht ${y}, ${du} to ${au}, contract ${r}.`,
    recuNote: 'Amount managed by the captain for the cruise expenses; statement of expenses and refund of any balance at the end of the cruise.',
    recuPasFacture: 'This receipt is not an invoice: the APA is not subject to VAT.',
    rappelContrat: (r) => `In accordance with charter agreement ${r}.`, page: (n, t) => `Page ${n} of ${t}`,
  },
};

const de: typeof fr = {
  contrat: {
    titre: 'Chartervertrag für eine Yacht mit Crew',
    sousTitre: (y, du, au) => `${y} · vom ${du} bis ${au}`,
    reference: 'Referenz', emisLe: 'Ausgestellt am', version: 'Vertragsversion',
    entete: (ref) => `Portolan · Vertrag ${ref}`, page: (n, t) => `Seite ${n} von ${t}`,
    modele: 'Demonstrationsvorlage: vor jeder realen Nutzung von einem Juristen zu prüfen.',
    articles: {
      parties: {
        titre: 'Die Parteien', intro: 'Dieser Vertrag wird zwischen den folgenden Parteien geschlossen.',
        courtier: 'Der Makler', pourCompte: 'handelnd im Namen und für Rechnung des Eigners der Yacht, nachfolgend „der Makler“.',
        locataire: 'Der Charterer, nachfolgend „der Charterer“',
      },
      yacht: {
        titre: 'Die Yacht', nom: 'Name', chantier: 'Werft', annee: 'Baujahr', longueur: 'Länge', pavillon: 'Flagge', port: 'Heimathafen',
        capacite: 'Kapazität', equipage: 'Crew', invites: (n) => `${n} Gäste`, membres: (n) => `${n} Crewmitglieder`,
      },
      croisiere: {
        titre: 'Die Kreuzfahrt', embarquement: 'Einschiffung', debarquement: 'Ausschiffung', duree: 'Dauer', invites: 'Gäste',
        zone: 'Fahrtgebiet', zoneValeur: 'Westliches Mittelmeer', nuits: (n) => `${n} Nächte`, a: 'in',
      },
      prix: {
        titre: 'Preis und Zahlungsplan', location: 'Charter der Yacht mit Crew', dontTva: (t) => `inkl. MwSt. ${t}`,
        acompte: (t) => `Anzahlung von ${t} %`, solde: (t) => `Restbetrag von ${t} %`, apa: (t) => `Nebenkostenvorschuss (APA) von ${t} %`,
        regleLe: (d) => `bezahlt am ${d}`, duLe: (d) => `fällig am ${d}`,
        inclus: 'Der Preis umfasst die Bereitstellung der Yacht, Heuer und Verpflegung der Crew, die Versicherung der Yacht und ihre Instandhaltung.',
        exclus: 'Nicht enthalten sind die Nebenkosten der Kreuzfahrt (Treibstoff, Lebensmittel, Getränke, Hafengebühren, Kommunikation), die über den Nebenkostenvorschuss abgerechnet werden, sowie das Trinkgeld für die Crew, das im Ermessen des Charterers liegt.',
      },
      apa: {
        titre: 'Der Nebenkostenvorschuss (APA)',
        texte: [
          'Der Nebenkostenvorschuss wird zusammen mit dem Restbetrag gezahlt. Er wird dem Kapitän anvertraut, der die Ausgaben der Kreuzfahrt begleicht und eine detaillierte Abrechnung mit Belegen führt.',
          'Die Abrechnung wird dem Charterer bei der Ausschiffung übergeben. Ein nicht verbrauchter Betrag wird erstattet; wird der Vorschuss überschritten, ist die Differenz vor der Ausschiffung zu zahlen.',
        ],
      },
      annulation: {
        titre: 'Stornierung',
        points: [
          'Storniert der Charterer nach Zahlung der Anzahlung, verbleibt diese beim Eigner, es sei denn, die Yacht wird für denselben Zeitraum zu denselben Bedingungen erneut verchartert.',
          'Bei einer Stornierung weniger als einen Monat vor der Einschiffung bleibt der gesamte Charterpreis geschuldet; der nicht verbrauchte Nebenkostenvorschuss wird erstattet.',
          'Kann der Eigner die Charter nicht erfüllen, werden alle gezahlten Beträge vollständig erstattet oder dem Charterer wird eine gleichwertige Yacht angeboten.',
          'Diese Bedingungen orientieren sich am MYBA-Standardchartervertrag.',
        ],
      },
      bord: {
        titre: 'An Bord: Pflichten, Sicherheit, Versicherungen',
        texte: [
          'Der Charterer verpflichtet sich, die vereinbarte Anzahl an Gästen nicht zu überschreiten, die Yacht und die Anweisungen der Crew zu respektieren und keine illegalen Substanzen an Bord zu bringen.',
          'Über die Sicherheit entscheidet allein die Schiffsführung. Route oder Abfahrtszeit können geändert oder eine Fahrt wetterbedingt abgebrochen werden, ohne dass daraus ein Erstattungsanspruch entsteht.',
          'Die Yacht ist von ihrem Eigner versichert. Dem Charterer wird empfohlen, für sich und seine Gäste eine Reiserücktritts- und Haftpflichtversicherung abzuschließen.',
        ],
      },
      droit: {
        titre: 'Anwendbares Recht und Streitigkeiten',
        texte: ['Dieser Vertrag unterliegt französischem Recht. Vor jedem Rechtsstreit suchen die Parteien eine gütliche Lösung; andernfalls kann ein Charterer, der Verbraucher ist, kostenlos eine Verbraucherschlichtungsstelle anrufen.'],
      },
      particulieres: { titre: 'Besondere Bedingungen', neant: 'Keine.' },
    },
    acceptation: {
      titre: 'Annahme',
      texte: (n, e, d, h, ip, v) => `Vertrag elektronisch angenommen von ${n} (${e}) am ${d} um ${h} Uhr (Pariser Zeit), von der IP-Adresse ${ip}, Version ${v}.`,
      acompte: (d) => `Anzahlung erhalten am ${d}. Die Buchung ist verbindlich.`,
      signature: 'Elektronische Signatur', signatureNote: 'Vorgesehen für eine zertifizierte elektronische Signatur (spätere Version).',
    },
  },
  facture: {
    factureAcompte: 'Anzahlungsrechnung', factureSolde: 'Schlussrechnung', facture: 'Rechnung', recuApa: 'Quittung über den Nebenkostenvorschuss',
    numero: 'Nummer', emiseLe: 'Rechnungsdatum', payeeLe: 'Zahlungsdatum', reservation: 'Buchung', client: 'Rechnungsempfänger', tvaClient: 'USt-IdNr.',
    designation: 'Bezeichnung', montantHt: 'Nettobetrag', tauxTva: 'MwSt.-Satz', montantTva: 'MwSt.-Betrag', montantTtc: 'Bruttobetrag',
    ligneAcompte: (t, y, du, au, n, r) => `Anzahlung von ${t} % auf die Charter der Yacht ${y} mit Crew, vom ${du} bis ${au} (${n} Nächte), Vertrag ${r}`,
    ligneSolde: (y, du, au, n, r) => `Charter der Yacht ${y} mit Crew, vom ${du} bis ${au} (${n} Nächte), Vertrag ${r}`,
    totalLocation: 'Charterpreis gesamt', acompteDeduit: (n) => `Bereits in Rechnung gestellte Anzahlung (Rechnung ${n})`, resteDu: 'Restbetrag',
    acquittee: (d, m) => `Bezahlt am ${d} ${m}.`, moyens: { carte: 'per Karte', virement: 'per Überweisung', manuel: 'per vom Makler erfasster Zahlung' },
    total: 'Erhaltener Betrag',
    mentions: 'Verzugszinsen: das Dreifache des französischen gesetzlichen Zinssatzes. Pauschale Beitreibungskosten: 40 € (Unternehmen). Kein Skonto bei vorzeitiger Zahlung.',
    tvaProvisoire: 'Die MwSt.-Beträge sind vorläufig und vom Steuerberater zu bestätigen (die MwSt. einer Yachtcharter hängt vom Fahrtgebiet ab).',
    recuTexte: (y, du, au, r) => `Nebenkostenvorschuss für die Charter der Yacht ${y}, vom ${du} bis ${au}, Vertrag ${r}.`,
    recuNote: 'Vom Kapitän für die Kosten der Kreuzfahrt verwalteter Betrag; Abrechnung der Ausgaben und Erstattung des Restbetrags am Ende der Kreuzfahrt.',
    recuPasFacture: 'Diese Quittung ist keine Rechnung: Der Nebenkostenvorschuss unterliegt nicht der MwSt.',
    rappelContrat: (r) => `Gemäß Chartervertrag ${r}.`, page: (n, t) => `Seite ${n} von ${t}`,
  },
};

// Article italien devant une date : « l'11 settembre », « l'8 maggio », « il 12 giugno »
const ilIt = (d: string) => (/^(1|8|11)[\s\u00A0]/.test(d) ? "l'" + d : 'il ' + d);

const it: typeof fr = {
  contrat: {
    titre: 'Contratto di noleggio di yacht con equipaggio',
    sousTitre: (y, du, au) => `${y} · dal ${du} al ${au}`,
    reference: 'Riferimento', emisLe: 'Emesso il', version: 'Versione del contratto',
    entete: (ref) => `Portolan · Contratto ${ref}`, page: (n, t) => `Pagina ${n} di ${t}`,
    modele: 'Modello dimostrativo: testo da far convalidare da un legale prima di qualsiasi uso reale.',
    articles: {
      parties: {
        titre: 'Le parti', intro: 'Il presente contratto è concluso tra le parti seguenti.',
        courtier: 'Il broker', pourCompte: 'che agisce in nome e per conto del proprietario dello yacht, di seguito «il broker».',
        locataire: 'Il noleggiatore, di seguito «il noleggiatore»',
      },
      yacht: {
        titre: 'Lo yacht', nom: 'Nome', chantier: 'Cantiere', annee: 'Anno', longueur: 'Lunghezza', pavillon: 'Bandiera', port: 'Porto di armamento',
        capacite: 'Capacità', equipage: 'Equipaggio', invites: (n) => `${n} ospiti`, membres: (n) => `${n} membri d'equipaggio`,
      },
      croisiere: {
        titre: 'La crociera', embarquement: 'Imbarco', debarquement: 'Sbarco', duree: 'Durata', invites: 'Ospiti',
        zone: 'Zona di navigazione', zoneValeur: 'Mediterraneo occidentale', nuits: (n) => `${n} notti`, a: 'a',
      },
      prix: {
        titre: 'Prezzo e scadenze', location: 'Noleggio dello yacht con equipaggio', dontTva: (t) => `IVA ${t} inclusa`,
        acompte: (t) => `Acconto del ${t}%`, solde: (t) => `Saldo del ${t}%`, apa: (t) => `Anticipo spese (APA) del ${t}%`,
        regleLe: (d) => `versato ${ilIt(d)}`, duLe: (d) => `dovuto ${ilIt(d)}`,
        inclus: "Il prezzo comprende la messa a disposizione dello yacht, lo stipendio e il vitto dell'equipaggio, l'assicurazione dello yacht e la sua manutenzione.",
        exclus: "Non comprende le spese di crociera (carburante, viveri, bevande, diritti portuali, comunicazioni), coperte dall'anticipo spese, né la mancia all'equipaggio, a discrezione del noleggiatore.",
      },
      apa: {
        titre: "L'anticipo spese di crociera (APA)",
        texte: [
          "L'anticipo spese è versato insieme al saldo. È affidato al comandante, che paga le spese della crociera e tiene un rendiconto dettagliato con i giustificativi.",
          "Il rendiconto è consegnato al noleggiatore allo sbarco. L'importo non utilizzato gli viene restituito; se l'anticipo è superato, la differenza è versata prima dello sbarco.",
        ],
      },
      annulation: {
        titre: 'Annullamento',
        points: [
          "In caso di annullamento da parte del noleggiatore dopo il versamento dell'acconto, l'acconto resta acquisito al proprietario, salvo se lo yacht viene noleggiato di nuovo per lo stesso periodo e alle stesse condizioni.",
          "In caso di annullamento meno di un mese prima dell'imbarco, resta dovuto l'intero prezzo del noleggio; l'anticipo spese non utilizzato è restituito.",
          'Se il proprietario non può onorare il noleggio, le somme versate sono interamente rimborsate, oppure al noleggiatore viene proposto uno yacht equivalente.',
          'Queste condizioni si ispirano al contratto tipo MYBA.',
        ],
      },
      bord: {
        titre: 'A bordo: obblighi, sicurezza, assicurazioni',
        texte: [
          "Il noleggiatore si impegna a non superare il numero di ospiti previsto, a rispettare lo yacht e le indicazioni dell'equipaggio e a non imbarcare sostanze illecite.",
          "Il comandante è l'unico giudice della sicurezza: l'itinerario o l'orario di partenza possono essere modificati, o una navigazione interrotta, a causa del meteo, senza che ciò dia diritto a un rimborso.",
          "Lo yacht è assicurato dal proprietario. Si consiglia al noleggiatore di stipulare un'assicurazione annullamento e responsabilità civile per sé e per i propri ospiti.",
        ],
      },
      droit: {
        titre: 'Legge applicabile e controversie',
        texte: ["Il presente contratto è soggetto al diritto francese. Prima di qualsiasi azione legale, le parti cercano una soluzione amichevole; in mancanza, il noleggiatore consumatore può ricorrere gratuitamente a un mediatore del consumo."],
      },
      particulieres: { titre: 'Condizioni particolari', neant: 'Nessuna.' },
    },
    acceptation: {
      titre: 'Accettazione',
      texte: (n, e, d, h, ip, v) => `Contratto accettato elettronicamente da ${n} (${e}) ${ilIt(d)} alle ${h} (ora di Parigi), dall'indirizzo IP ${ip}, versione ${v}.`,
      acompte: (d) => `Acconto ricevuto ${ilIt(d)}. La prenotazione è definitiva.`,
      signature: 'Firma elettronica', signatureNote: 'Spazio riservato a una firma elettronica certificata (versione successiva).',
    },
  },
  facture: {
    factureAcompte: 'Fattura di acconto', factureSolde: 'Fattura di saldo', facture: 'Fattura', recuApa: "Ricevuta dell'anticipo spese di crociera",
    numero: 'Numero', emiseLe: 'Data di emissione', payeeLe: 'Data del pagamento', reservation: 'Prenotazione', client: 'Intestata a', tvaClient: 'Partita IVA',
    designation: 'Descrizione', montantHt: 'Imponibile', tauxTva: 'Aliquota IVA', montantTva: 'Importo IVA', montantTtc: 'Totale IVA inclusa',
    ligneAcompte: (t, y, du, au, n, r) => `Acconto del ${t}% sul noleggio dello yacht ${y} con equipaggio, dal ${du} al ${au} (${n} notti), contratto ${r}`,
    ligneSolde: (y, du, au, n, r) => `Noleggio dello yacht ${y} con equipaggio, dal ${du} al ${au} (${n} notti), contratto ${r}`,
    totalLocation: 'Totale del noleggio', acompteDeduit: (n) => `Acconto già fatturato (fattura ${n})`, resteDu: 'Saldo',
    acquittee: (d, m) => `Pagata ${ilIt(d)} ${m}.`, moyens: { carte: 'con carta', virement: 'con bonifico', manuel: 'con pagamento registrato dal broker' },
    total: 'Importo ricevuto',
    mentions: "Penali di mora: tre volte il tasso di interesse legale francese. Indennità forfettaria per spese di recupero: 40 € (professionisti). Nessuno sconto per pagamento anticipato.",
    tvaProvisoire: "Importi IVA indicativi, da convalidare dal commercialista (l'IVA di un noleggio di yacht dipende dalle acque navigate).",
    recuTexte: (y, du, au, r) => `Anticipo spese di crociera per il noleggio dello yacht ${y}, dal ${du} al ${au}, contratto ${r}.`,
    recuNote: 'Somma gestita dal comandante per le spese della crociera; rendiconto delle spese e restituzione del residuo a fine crociera.',
    recuPasFacture: "Questa ricevuta non è una fattura: l'anticipo spese non è soggetto a IVA.",
    rappelContrat: (r) => `Ai sensi del contratto di noleggio ${r}.`, page: (n, t) => `Pagina ${n} di ${t}`,
  },
};

export const textesPdf: Record<Langue, typeof fr> = { fr, en, de, it };
