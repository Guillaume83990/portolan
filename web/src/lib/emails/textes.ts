// Textes des e-mails au client (brief 05, §5.2), dans sa langue. Les e-mails à la direction sont en français (direction.ts).
import type { Langue } from '@/lib/format';

// Valeurs déjà mises en forme dans la langue du client
export type V = {
  prenom: string; yacht: string; ref: string; dates: string; courtier: string;
  montant?: string; echeance?: string; total?: string; solde?: string; apa?: string;
  motif?: string; port?: string; heure?: string; jour?: string; methode?: string; demande?: string;
};

export type Modele = {
  objet: (v: V) => string; apercu: (v: V) => string; titre: (v: V) => string;
  texte: (v: V) => string[]; bouton?: string; secondaire?: string;
};

export type TextesEmail = {
  communs: {
    reservation: (ref: string) => string; bonjour: (p: string) => string; recap: string;
    yacht: string; dates: string; embarquement: string; invites: string; location: string; acompte: string; soldeApa: string; echeance: string;
    votreCourtier: string; repondre: string; adresses: string; monEspace: string; conditions: string; transactionnel: string;
    pieces: string; nuits: (n: number) => string; a: string;
    virement: { beneficiaire: string; iban: string; bic: string; reference: string; montant: string; consigne: string };
    piecesNoms: Record<'contrat' | 'facture_acompte' | 'facture_solde' | 'recu_apa', string>;
  };
  demande_recue: Modele; demande_validee: Modele; relance_paiement: Modele; option_expiree: Modele; demande_refusee: Modele;
  acompte_recu: Modele; virement: Modele; appel_solde: Modele; solde_recu: Modele; embarquement: Modele;
  annulation: Modele; remboursement: Modele; formulaire: Modele; inscription: Modele;
};

const fr: TextesEmail = {
  communs: {
    reservation: (r) => `Réservation ${r}`, bonjour: (p) => (p ? `Bonjour ${p},` : 'Bonjour,'), recap: 'Récapitulatif',
    yacht: 'Yacht', dates: 'Dates', embarquement: 'Embarquement', invites: 'Invités', location: 'Location', acompte: 'Acompte', soldeApa: 'Solde et APA', echeance: 'Échéance',
    votreCourtier: 'Votre contact', repondre: 'Répondez simplement à cet e-mail.',
    adresses: 'Portolan · Quai Suffren, Saint-Tropez · Quai Antoine Ier, Monaco', monEspace: 'Mon espace', conditions: 'Conditions de location',
    transactionnel: 'E-mail lié à votre réservation : vous le recevez même sans inscription à nos actualités.',
    pieces: 'Pièces jointes', nuits: (n) => `${n} nuits`, a: 'à',
    virement: { beneficiaire: 'Bénéficiaire', iban: 'IBAN', bic: 'BIC', reference: 'Référence obligatoire', montant: 'Montant exact', consigne: 'Indiquez bien la référence dans votre virement : c’est elle qui permet de le rapprocher de votre réservation.' },
    piecesNoms: { contrat: 'Contrat de location', facture_acompte: "Facture d'acompte", facture_solde: 'Facture de solde', recu_apa: "Reçu de l'avance sur frais" },
  },
  demande_recue: {
    objet: (v) => `Votre demande pour ${v.yacht} est bien arrivée`,
    apercu: (v) => `${v.courtier} vérifie les disponibilités et vous répond sous 24 heures.`,
    titre: () => 'Votre demande est entre de bonnes mains.',
    texte: (v) => [`Votre demande est entre les mains de ${v.courtier}. Les disponibilités de l’équipage sont vérifiées et vous recevez une réponse sous 24 heures, week-end compris.`, 'Vos dates vous sont réservées pendant ce temps.'],
    bouton: 'Suivre ma réservation',
  },
  demande_validee: {
    objet: (v) => `${v.yacht} vous attend : réglez l’acompte pour confirmer`,
    apercu: (v) => `Acompte de ${v.montant} à régler avant le ${v.echeance}.`,
    titre: (v) => `${v.yacht} vous attend.`,
    texte: (v) => [`Pour confirmer votre croisière, réglez l’acompte de ${v.montant} avant le ${v.echeance}.`, 'Par carte, le contrat vous parvient dans la minute ; par virement, dès réception des fonds.'],
    bouton: 'Régler l’acompte',
  },
  relance_paiement: {
    objet: (v) => `Plus que 24 heures pour confirmer ${v.yacht}`,
    apercu: (v) => `Vos dates restent réservées jusqu’au ${v.echeance}.`,
    titre: () => 'Vos dates vous attendent encore.',
    texte: (v) => [`Vos dates sur ${v.yacht} restent réservées jusqu’au ${v.echeance}. Il suffit de régler l’acompte de ${v.montant} pour confirmer la croisière.`, `Un empêchement, un plafond de carte ? Répondez à cet e-mail, ${v.courtier} trouvera une solution.`],
    bouton: 'Régler l’acompte',
  },
  option_expiree: {
    objet: (v) => `Vos dates sur ${v.yacht} ont été libérées`,
    apercu: () => 'Le délai de paiement est dépassé ; les dates sont peut-être encore disponibles.',
    titre: () => 'Vos dates ont été libérées.',
    texte: () => ['L’acompte n’a pas été réglé dans le délai prévu : nous avons libéré les dates.', 'Si votre projet tient toujours, elles sont peut-être encore disponibles.'],
    bouton: 'Refaire une demande',
  },
  demande_refusee: {
    objet: (v) => `Votre demande pour ${v.yacht}`,
    apercu: (v) => `Un mot de ${v.courtier} au sujet de vos dates.`,
    titre: () => 'Ces dates ne sont pas possibles.',
    texte: (v) => [`${v.yacht} ne pourra pas vous accueillir aux dates demandées. ${v.courtier} reste à votre disposition pour trouver une autre solution, sur ce yacht ou un autre.`],
    bouton: 'Voir les yachts disponibles',
  },
  acompte_recu: {
    objet: (v) => `C’est confirmé : ${v.yacht}, ${v.dates}`,
    apercu: () => 'Votre contrat et votre facture sont joints à cet e-mail.',
    titre: () => 'Votre croisière est confirmée.',
    texte: (v) => [`Merci. Votre contrat de location et votre facture sont joints à cet e-mail ; vous les retrouvez aussi dans votre espace.`,
      ...(v.total ? [`Prochaine échéance : solde et APA, ${v.total}, avant le ${v.echeance}. Nous vous l’écrirons un mois avant.`] : []),
      'Prochaines étapes : vos préférences à bord (régimes, boissons, activités), puis l’itinéraire avec le capitaine.'],
    bouton: 'Voir ma réservation',
  },
  virement: {
    objet: (v) => `Coordonnées pour votre virement, réservation ${v.ref}`,
    apercu: (v) => `Montant exact : ${v.montant}. Indiquez la référence dans votre virement.`,
    titre: () => 'Plus qu’un virement.',
    texte: () => ['Voici les coordonnées de votre virement. Le contrat part automatiquement dès réception des fonds, en général sous 1 à 2 jours ouvrés.'],
    bouton: 'Voir ma réservation',
  },
  appel_solde: {
    objet: (v) => `${v.yacht} approche : solde et avance sur frais`,
    apercu: (v) => `${v.total} à régler avant le ${v.echeance}.`,
    titre: () => 'Votre embarquement approche.',
    texte: (v) => [`Solde ${v.solde} + APA ${v.apa} = ${v.total}, à régler avant le ${v.echeance}.`, 'L’APA couvre le carburant, les vivres et les ports : le capitaine tient les comptes à bord et vous rend le reliquat.'],
    bouton: 'Régler le solde',
  },
  solde_recu: {
    objet: (v) => `Tout est réglé pour ${v.yacht}`,
    apercu: () => 'Votre facture de solde est jointe à cet e-mail.',
    titre: () => 'Tout est réglé.',
    texte: () => ['Votre facture de solde et le reçu de l’avance sur frais sont joints à cet e-mail.', 'Le capitaine vous écrira quelques jours avant le départ pour préparer l’itinéraire.'],
    bouton: 'Mes documents',
  },
  embarquement: {
    objet: (v) => `${v.jour}, ${v.heure}, ${v.port} : on vous attend à bord`,
    apercu: (v) => `Embarquement ${v.jour} à ${v.heure}, ${v.port}.`,
    titre: () => 'On vous attend à bord.',
    texte: (v) => [`Rendez-vous ${v.jour} à ${v.heure}, ${v.port}. L’équipage vous accueille à la passerelle.`, 'Prévoyez des chaussures à semelle claire et des bagages souples : ils se rangent plus facilement à bord.', `Une question de dernière minute ? Répondez à cet e-mail, ${v.courtier} vous répond.`],
    bouton: 'Voir ma réservation',
  },
  annulation: {
    objet: (v) => `Annulation de votre réservation ${v.ref}`,
    apercu: (v) => `Votre réservation de ${v.yacht} est annulée.`,
    titre: () => 'Votre réservation est annulée.',
    texte: (v) => [`Votre réservation de ${v.yacht}, ${v.dates}, est annulée${v.motif ? ` : ${v.motif}` : '.'}`, 'Si un remboursement est dû, il vous est confirmé par un e-mail séparé.', `${v.courtier} reste à votre disposition pour une autre croisière.`],
    bouton: 'Mon espace',
  },
  remboursement: {
    objet: (v) => `Remboursement de ${v.montant}, réservation ${v.ref}`,
    apercu: () => 'Sous 5 à 10 jours ouvrés, sur le moyen de paiement utilisé.',
    titre: () => 'Votre remboursement est en route.',
    texte: (v) => [`Nous avons remboursé ${v.montant}. Il apparaîtra sous 5 à 10 jours ouvrés sur le moyen de paiement utilisé.`],
    bouton: 'Mon espace',
  },
  formulaire: {
    objet: () => 'Bien reçu : un courtier vous répond sous 24 heures',
    apercu: (v) => `${v.courtier} s’occupe de votre demande.`,
    titre: () => 'Votre demande est bien arrivée.',
    texte: (v) => [`${v.courtier} s’occupe de votre demande${v.yacht ? ` concernant ${v.yacht}` : ''} et vous répond sous 24 heures.`, ...(v.demande ? [`Votre message : « ${v.demande} »`] : [])],
  },
  inscription: {
    objet: () => 'C’est noté, en toute confidence',
    apercu: () => 'Nous vous écrirons dès qu’un yacht qui vous ressemble change de mains.',
    titre: () => 'C’est noté, en toute confidence.',
    texte: () => ['Nous vous écrirons dès qu’un yacht qui vous ressemble change de mains, avant sa mise en ligne. Jamais plus d’un e-mail par mois.', 'Pour vous désinscrire, répondez simplement à cet e-mail.'],
  },
};

const en: TextesEmail = {
  communs: {
    reservation: (r) => `Booking ${r}`, bonjour: (p) => (p ? `Dear ${p},` : 'Hello,'), recap: 'Summary',
    yacht: 'Yacht', dates: 'Dates', embarquement: 'Embarkation', invites: 'Guests', location: 'Charter', acompte: 'Deposit', soldeApa: 'Balance and APA', echeance: 'Due date',
    votreCourtier: 'Your broker', repondre: 'Simply reply to this e-mail.',
    adresses: 'Portolan · Quai Suffren, Saint-Tropez · Quai Antoine Ier, Monaco', monEspace: 'My account', conditions: 'Charter terms',
    transactionnel: 'E-mail about your booking: you receive it even without subscribing to our news.',
    pieces: 'Attachments', nuits: (n) => `${n} nights`, a: 'at',
    virement: { beneficiaire: 'Beneficiary', iban: 'IBAN', bic: 'BIC', reference: 'Mandatory reference', montant: 'Exact amount', consigne: 'Please include the reference in your transfer: it is how we match it to your booking.' },
    piecesNoms: { contrat: 'Charter agreement', facture_acompte: 'Deposit invoice', facture_solde: 'Balance invoice', recu_apa: 'APA receipt' },
  },
  demande_recue: {
    objet: (v) => `Your request for ${v.yacht} has arrived`,
    apercu: (v) => `${v.courtier} is checking availability and will reply within 24 hours.`,
    titre: () => 'Your request is in good hands.',
    texte: (v) => [`Your request is in the hands of ${v.courtier}, your broker. Crew availability is being checked and you will hear back within 24 hours, weekends included.`, 'Your dates are held for you in the meantime.'],
    bouton: 'Follow my booking',
  },
  demande_validee: {
    objet: (v) => `${v.yacht} awaits you: pay the deposit to confirm`,
    apercu: (v) => `Deposit of ${v.montant} due before ${v.echeance}.`,
    titre: (v) => `${v.yacht} awaits you.`,
    texte: (v) => [`To confirm your cruise, please pay the deposit of ${v.montant} before ${v.echeance}.`, 'By card, the contract reaches you within a minute; by bank transfer, as soon as the funds arrive.'],
    bouton: 'Pay the deposit',
  },
  relance_paiement: {
    objet: (v) => `24 hours left to confirm ${v.yacht}`,
    apercu: (v) => `Your dates are held until ${v.echeance}.`,
    titre: () => 'Your dates are still waiting for you.',
    texte: (v) => [`Your dates on ${v.yacht} are held until ${v.echeance}. Paying the deposit of ${v.montant} is all it takes to confirm the cruise.`, `A problem, a card limit? Reply to this e-mail and ${v.courtier} will find a solution.`],
    bouton: 'Pay the deposit',
  },
  option_expiree: {
    objet: (v) => `Your dates on ${v.yacht} have been released`,
    apercu: () => 'The payment deadline has passed; the dates may still be available.',
    titre: () => 'Your dates have been released.',
    texte: () => ['The deposit was not paid within the agreed time, so we have released the dates.', 'If your plans still stand, the dates may still be available.'],
    bouton: 'Make a new request',
  },
  demande_refusee: {
    objet: (v) => `Your request for ${v.yacht}`,
    apercu: (v) => `A note from ${v.courtier} about your dates.`,
    titre: () => 'These dates are not possible.',
    texte: (v) => [`${v.yacht} cannot welcome you on the requested dates. ${v.courtier} remains at your disposal to find another solution, on this yacht or another.`],
    bouton: 'See available yachts',
  },
  acompte_recu: {
    objet: (v) => `Confirmed: ${v.yacht}, ${v.dates}`,
    apercu: () => 'Your contract and invoice are attached to this e-mail.',
    titre: () => 'Your cruise is confirmed.',
    texte: (v) => [`Thank you. Your charter agreement and invoice are attached to this e-mail; you will also find them in your account.`,
      ...(v.total ? [`Next payment: balance and APA, ${v.total}, before ${v.echeance}. We will write to you a month before.`] : []),
      'Next steps: your preferences on board (diets, drinks, activities), then the itinerary with the captain.'],
    bouton: 'View my booking',
  },
  virement: {
    objet: (v) => `Bank transfer details, booking ${v.ref}`,
    apercu: (v) => `Exact amount: ${v.montant}. Please include the reference.`,
    titre: () => 'Just one transfer left.',
    texte: () => ['Here are the details for your transfer. The contract is sent automatically as soon as the funds arrive, usually within 1 to 2 business days.'],
    bouton: 'View my booking',
  },
  appel_solde: {
    objet: (v) => `${v.yacht} is getting closer: balance and APA`,
    apercu: (v) => `${v.total} to be paid before ${v.echeance}.`,
    titre: () => 'Your embarkation is getting closer.',
    texte: (v) => [`Balance ${v.solde} + APA ${v.apa} = ${v.total}, to be paid before ${v.echeance}.`, 'The APA covers fuel, provisions and harbour dues: the captain keeps the accounts on board and refunds any balance.'],
    bouton: 'Pay the balance',
  },
  solde_recu: {
    objet: (v) => `Everything is settled for ${v.yacht}`,
    apercu: () => 'Your balance invoice is attached to this e-mail.',
    titre: () => 'Everything is settled.',
    texte: () => ['Your balance invoice and the APA receipt are attached to this e-mail.', 'The captain will write to you a few days before departure to prepare the itinerary.'],
    bouton: 'My documents',
  },
  embarquement: {
    objet: (v) => `${v.jour}, ${v.heure}, ${v.port}: we look forward to welcoming you aboard`,
    apercu: (v) => `Embarkation ${v.jour} at ${v.heure}, ${v.port}.`,
    titre: () => 'We look forward to welcoming you aboard.',
    texte: (v) => [`See you ${v.jour} at ${v.heure}, ${v.port}. The crew will welcome you at the gangway.`, 'Bring shoes with light-coloured soles and soft luggage: it stows more easily on board.', `A last-minute question? Reply to this e-mail and ${v.courtier} will answer.`],
    bouton: 'View my booking',
  },
  annulation: {
    objet: (v) => `Cancellation of your booking ${v.ref}`,
    apercu: (v) => `Your booking of ${v.yacht} has been cancelled.`,
    titre: () => 'Your booking has been cancelled.',
    texte: (v) => [`Your booking of ${v.yacht}, ${v.dates}, has been cancelled${v.motif ? `: ${v.motif}` : '.'}`, 'If a refund is due, it will be confirmed in a separate e-mail.', `${v.courtier} remains at your disposal for another cruise.`],
    bouton: 'My account',
  },
  remboursement: {
    objet: (v) => `Refund of ${v.montant}, booking ${v.ref}`,
    apercu: () => 'Within 5 to 10 business days, on the payment method used.',
    titre: () => 'Your refund is on its way.',
    texte: (v) => [`We have refunded ${v.montant}. It will appear within 5 to 10 business days on the payment method used.`],
    bouton: 'My account',
  },
  formulaire: {
    objet: () => 'Received: a broker will reply within 24 hours',
    apercu: (v) => `${v.courtier} is taking care of your request.`,
    titre: () => 'Your request has arrived.',
    texte: (v) => [`${v.courtier} is taking care of your request${v.yacht ? ` about ${v.yacht}` : ''} and will reply within 24 hours.`, ...(v.demande ? [`Your message: “${v.demande}”`] : [])],
  },
  inscription: {
    objet: () => 'Noted, in complete confidence',
    apercu: () => 'We will write to you as soon as a yacht that suits you changes hands.',
    titre: () => 'Noted, in complete confidence.',
    texte: () => ['We will write to you as soon as a yacht that suits you changes hands, before it goes online. Never more than one e-mail a month.', 'To unsubscribe, simply reply to this e-mail.'],
  },
};

const de: TextesEmail = {
  communs: {
    reservation: (r) => `Buchung ${r}`, bonjour: (p) => (p ? `Guten Tag ${p},` : 'Guten Tag,'), recap: 'Übersicht',
    yacht: 'Yacht', dates: 'Daten', embarquement: 'Einschiffung', invites: 'Gäste', location: 'Charter', acompte: 'Anzahlung', soldeApa: 'Restbetrag und APA', echeance: 'Fälligkeit',
    votreCourtier: 'Ihr persönlicher Kontakt', repondre: 'Antworten Sie einfach auf diese E-Mail.',
    adresses: 'Portolan · Quai Suffren, Saint-Tropez · Quai Antoine Ier, Monaco', monEspace: 'Mein Konto', conditions: 'Charterbedingungen',
    transactionnel: 'E-Mail zu Ihrer Buchung: Sie erhalten sie auch ohne Anmeldung zu unseren Neuigkeiten.',
    pieces: 'Anhänge', nuits: (n) => `${n} Nächte`, a: 'in',
    virement: { beneficiaire: 'Empfänger', iban: 'IBAN', bic: 'BIC', reference: 'Pflichtreferenz', montant: 'Genauer Betrag', consigne: 'Bitte geben Sie die Referenz in Ihrer Überweisung an: Nur so können wir sie Ihrer Buchung zuordnen.' },
    piecesNoms: { contrat: 'Chartervertrag', facture_acompte: 'Anzahlungsrechnung', facture_solde: 'Schlussrechnung', recu_apa: 'Quittung über den Nebenkostenvorschuss' },
  },
  demande_recue: {
    objet: (v) => `Ihre Anfrage für ${v.yacht} ist eingegangen`,
    apercu: (v) => `${v.courtier} prüft die Verfügbarkeit und antwortet Ihnen innerhalb von 24 Stunden.`,
    titre: () => 'Ihre Anfrage ist in guten Händen.',
    texte: (v) => [`Ihre Anfrage liegt bei ${v.courtier}. Die Verfügbarkeit der Crew wird geprüft, und Sie erhalten innerhalb von 24 Stunden eine Antwort, auch am Wochenende.`, 'Ihre Daten bleiben in dieser Zeit für Sie reserviert.'],
    bouton: 'Meine Buchung verfolgen',
  },
  demande_validee: {
    objet: (v) => `${v.yacht} erwartet Sie: Zahlen Sie die Anzahlung zur Bestätigung`,
    apercu: (v) => `Anzahlung von ${v.montant}, zahlbar bis ${v.echeance}.`,
    titre: (v) => `${v.yacht} erwartet Sie.`,
    texte: (v) => [`Um Ihre Kreuzfahrt zu bestätigen, zahlen Sie bitte die Anzahlung von ${v.montant} bis ${v.echeance}.`, 'Per Karte erhalten Sie den Vertrag innerhalb einer Minute, per Überweisung sobald das Geld eingegangen ist.'],
    bouton: 'Anzahlung leisten',
  },
  relance_paiement: {
    objet: (v) => `Nur noch 24 Stunden, um ${v.yacht} zu bestätigen`,
    apercu: (v) => `Ihre Daten bleiben bis ${v.echeance} reserviert.`,
    titre: () => 'Ihre Daten warten noch auf Sie.',
    texte: (v) => [`Ihre Daten auf ${v.yacht} bleiben bis ${v.echeance} reserviert. Mit der Anzahlung von ${v.montant} ist die Kreuzfahrt bestätigt.`, `Ein Hindernis, ein Kartenlimit? Antworten Sie auf diese E-Mail, ${v.courtier} findet eine Lösung.`],
    bouton: 'Anzahlung leisten',
  },
  option_expiree: {
    objet: (v) => `Ihre Daten auf ${v.yacht} wurden freigegeben`,
    apercu: () => 'Die Zahlungsfrist ist abgelaufen; die Daten sind vielleicht noch frei.',
    titre: () => 'Ihre Daten wurden freigegeben.',
    texte: () => ['Die Anzahlung ist nicht fristgerecht eingegangen, daher haben wir die Daten freigegeben.', 'Wenn Ihr Vorhaben weiterhin besteht, sind sie vielleicht noch verfügbar.'],
    bouton: 'Neue Anfrage stellen',
  },
  demande_refusee: {
    objet: (v) => `Ihre Anfrage für ${v.yacht}`,
    apercu: (v) => `Eine Nachricht von ${v.courtier} zu Ihren Daten.`,
    titre: () => 'Diese Daten sind leider nicht möglich.',
    texte: (v) => [`${v.yacht} kann Sie zu den gewünschten Daten nicht empfangen. ${v.courtier} hilft Ihnen gern, eine andere Lösung zu finden, auf dieser oder einer anderen Yacht.`],
    bouton: 'Verfügbare Yachten ansehen',
  },
  acompte_recu: {
    objet: (v) => `Bestätigt: ${v.yacht}, ${v.dates}`,
    apercu: () => 'Ihr Vertrag und Ihre Rechnung sind dieser E-Mail beigefügt.',
    titre: () => 'Ihre Kreuzfahrt ist bestätigt.',
    texte: (v) => [`Vielen Dank. Ihr Chartervertrag und Ihre Rechnung sind dieser E-Mail beigefügt; Sie finden sie auch in Ihrem Konto.`,
      ...(v.total ? [`Nächste Zahlung: Restbetrag und APA, ${v.total}, bis ${v.echeance}. Wir schreiben Ihnen einen Monat vorher.`] : []),
      'Nächste Schritte: Ihre Wünsche an Bord (Ernährung, Getränke, Aktivitäten), danach die Route mit dem Kapitän.'],
    bouton: 'Meine Buchung ansehen',
  },
  virement: {
    objet: (v) => `Bankdaten für Ihre Überweisung, Buchung ${v.ref}`,
    apercu: (v) => `Genauer Betrag: ${v.montant}. Bitte geben Sie die Referenz an.`,
    titre: () => 'Nur noch eine Überweisung.',
    texte: () => ['Hier sind die Daten für Ihre Überweisung. Der Vertrag wird nach Zahlungseingang automatisch versandt, in der Regel innerhalb von 1 bis 2 Werktagen.'],
    bouton: 'Meine Buchung ansehen',
  },
  appel_solde: {
    objet: (v) => `${v.yacht} rückt näher: Restbetrag und Nebenkostenvorschuss`,
    apercu: (v) => `${v.total}, zahlbar bis ${v.echeance}.`,
    titre: () => 'Ihre Einschiffung rückt näher.',
    texte: (v) => [`Restbetrag ${v.solde} + APA ${v.apa} = ${v.total}, zahlbar bis ${v.echeance}.`, 'Der Nebenkostenvorschuss deckt Treibstoff, Lebensmittel und Häfen: Der Kapitän führt an Bord Buch und erstattet Ihnen den Rest.'],
    bouton: 'Restbetrag zahlen',
  },
  solde_recu: {
    objet: (v) => `Für ${v.yacht} ist alles bezahlt`,
    apercu: () => 'Ihre Schlussrechnung ist dieser E-Mail beigefügt.',
    titre: () => 'Alles ist bezahlt.',
    texte: () => ['Ihre Schlussrechnung und die Quittung über den Nebenkostenvorschuss sind dieser E-Mail beigefügt.', 'Der Kapitän schreibt Ihnen einige Tage vor der Abreise, um die Route vorzubereiten.'],
    bouton: 'Meine Dokumente',
  },
  embarquement: {
    objet: (v) => `${v.jour}, ${v.heure} Uhr, ${v.port}: Wir erwarten Sie an Bord`,
    apercu: (v) => `Einschiffung ${v.jour} um ${v.heure} Uhr, ${v.port}.`,
    titre: () => 'Wir erwarten Sie an Bord.',
    texte: (v) => [`Treffpunkt ${v.jour} um ${v.heure} Uhr, ${v.port}. Die Crew empfängt Sie an der Gangway.`, 'Bitte bringen Sie Schuhe mit heller Sohle und weiche Gepäckstücke mit: Sie lassen sich an Bord leichter verstauen.', `Eine Frage in letzter Minute? Antworten Sie auf diese E-Mail, ${v.courtier} antwortet Ihnen.`],
    bouton: 'Meine Buchung ansehen',
  },
  annulation: {
    objet: (v) => `Stornierung Ihrer Buchung ${v.ref}`,
    apercu: (v) => `Ihre Buchung von ${v.yacht} wurde storniert.`,
    titre: () => 'Ihre Buchung wurde storniert.',
    texte: (v) => [`Ihre Buchung von ${v.yacht}, ${v.dates}, wurde storniert${v.motif ? `: ${v.motif}` : '.'}`, 'Ist eine Erstattung fällig, wird sie Ihnen in einer separaten E-Mail bestätigt.', `${v.courtier} steht Ihnen gern für eine andere Kreuzfahrt zur Verfügung.`],
    bouton: 'Mein Konto',
  },
  remboursement: {
    objet: (v) => `Erstattung von ${v.montant}, Buchung ${v.ref}`,
    apercu: () => 'Innerhalb von 5 bis 10 Werktagen, auf das verwendete Zahlungsmittel.',
    titre: () => 'Ihre Erstattung ist unterwegs.',
    texte: (v) => [`Wir haben ${v.montant} erstattet. Der Betrag erscheint innerhalb von 5 bis 10 Werktagen auf dem verwendeten Zahlungsmittel.`],
    bouton: 'Mein Konto',
  },
  formulaire: {
    objet: () => 'Eingegangen: Ein Makler antwortet Ihnen innerhalb von 24 Stunden',
    apercu: (v) => `${v.courtier} kümmert sich um Ihre Anfrage.`,
    titre: () => 'Ihre Anfrage ist eingegangen.',
    texte: (v) => [`${v.courtier} kümmert sich um Ihre Anfrage${v.yacht ? ` zu ${v.yacht}` : ''} und antwortet Ihnen innerhalb von 24 Stunden.`, ...(v.demande ? [`Ihre Nachricht: „${v.demande}“`] : [])],
  },
  inscription: {
    objet: () => 'Notiert, ganz vertraulich',
    apercu: () => 'Wir schreiben Ihnen, sobald eine passende Yacht den Besitzer wechselt.',
    titre: () => 'Notiert, ganz vertraulich.',
    texte: () => ['Wir schreiben Ihnen, sobald eine Yacht, die zu Ihnen passt, den Besitzer wechselt, noch vor ihrer Veröffentlichung. Nie mehr als eine E-Mail im Monat.', 'Zum Abmelden antworten Sie einfach auf diese E-Mail.'],
  },
};

const it: TextesEmail = {
  communs: {
    reservation: (r) => `Prenotazione ${r}`, bonjour: (p) => (p ? `Gentile ${p},` : 'Buongiorno,'), recap: 'Riepilogo',
    yacht: 'Yacht', dates: 'Date', embarquement: 'Imbarco', invites: 'Ospiti', location: 'Noleggio', acompte: 'Acconto', soldeApa: 'Saldo e APA', echeance: 'Scadenza',
    votreCourtier: 'Il suo contatto', repondre: 'Risponda semplicemente a questa e-mail.',
    adresses: 'Portolan · Quai Suffren, Saint-Tropez · Quai Antoine Ier, Monaco', monEspace: 'Area riservata', conditions: 'Condizioni di noleggio',
    transactionnel: 'E-mail relativa alla sua prenotazione: la riceve anche senza iscrizione alle nostre novità.',
    pieces: 'Allegati', nuits: (n) => `${n} notti`, a: 'a',
    virement: { beneficiaire: 'Beneficiario', iban: 'IBAN', bic: 'BIC', reference: 'Riferimento obbligatorio', montant: 'Importo esatto', consigne: 'Indichi il riferimento nel bonifico: è ciò che ci permette di collegarlo alla sua prenotazione.' },
    piecesNoms: { contrat: 'Contratto di noleggio', facture_acompte: 'Fattura di acconto', facture_solde: 'Fattura di saldo', recu_apa: "Ricevuta dell'anticipo spese" },
  },
  demande_recue: {
    objet: (v) => `La sua richiesta per ${v.yacht} è arrivata`,
    apercu: (v) => `${v.courtier} verifica le disponibilità e le risponde entro 24 ore.`,
    titre: () => 'La sua richiesta è in buone mani.',
    texte: (v) => [`La sua richiesta è nelle mani di ${v.courtier}. Verifichiamo la disponibilità dell’equipaggio e le rispondiamo entro 24 ore, fine settimana compreso.`, 'Nel frattempo le sue date restano riservate.'],
    bouton: 'Seguire la prenotazione',
  },
  demande_validee: {
    objet: (v) => `${v.yacht} la aspetta: versi l’acconto per confermare`,
    apercu: (v) => `Acconto di ${v.montant} da versare entro il ${v.echeance}.`,
    titre: (v) => `${v.yacht} la aspetta.`,
    texte: (v) => [`Per confermare la crociera, versi l’acconto di ${v.montant} entro il ${v.echeance}.`, 'Con carta, il contratto le arriva entro un minuto; con bonifico, al ricevimento dei fondi.'],
    bouton: 'Versare l’acconto',
  },
  relance_paiement: {
    objet: (v) => `Ancora 24 ore per confermare ${v.yacht}`,
    apercu: (v) => `Le sue date restano riservate fino al ${v.echeance}.`,
    titre: () => 'Le sue date la aspettano ancora.',
    texte: (v) => [`Le sue date su ${v.yacht} restano riservate fino al ${v.echeance}. Basta versare l’acconto di ${v.montant} per confermare la crociera.`, `Un imprevisto, un massimale della carta? Risponda a questa e-mail, ${v.courtier} troverà una soluzione.`],
    bouton: 'Versare l’acconto',
  },
  option_expiree: {
    objet: (v) => `Le sue date su ${v.yacht} sono state liberate`,
    apercu: () => 'Il termine di pagamento è scaduto; le date potrebbero essere ancora disponibili.',
    titre: () => 'Le sue date sono state liberate.',
    texte: () => ['L’acconto non è stato versato entro il termine previsto: abbiamo liberato le date.', 'Se il suo progetto è ancora valido, potrebbero essere ancora disponibili.'],
    bouton: 'Fare una nuova richiesta',
  },
  demande_refusee: {
    objet: (v) => `La sua richiesta per ${v.yacht}`,
    apercu: (v) => `Un messaggio di ${v.courtier} sulle sue date.`,
    titre: () => 'Queste date non sono possibili.',
    texte: (v) => [`${v.yacht} non potrà accoglierla nelle date richieste. ${v.courtier} resta a sua disposizione per trovare un’altra soluzione, su questo yacht o su un altro.`],
    bouton: 'Vedere gli yacht disponibili',
  },
  acompte_recu: {
    objet: (v) => `Confermato: ${v.yacht}, ${v.dates}`,
    apercu: () => 'Il contratto e la fattura sono allegati a questa e-mail.',
    titre: () => 'La sua crociera è confermata.',
    texte: (v) => [`Grazie. Il contratto di noleggio e la fattura sono allegati a questa e-mail; li trova anche nella sua area riservata.`,
      ...(v.total ? [`Prossima scadenza: saldo e APA, ${v.total}, entro il ${v.echeance}. Le scriveremo un mese prima.`] : []),
      'Prossimi passi: le sue preferenze a bordo (regimi, bevande, attività), poi l’itinerario con il comandante.'],
    bouton: 'Vedere la prenotazione',
  },
  virement: {
    objet: (v) => `Coordinate per il bonifico, prenotazione ${v.ref}`,
    apercu: (v) => `Importo esatto: ${v.montant}. Indichi il riferimento nel bonifico.`,
    titre: () => 'Manca solo un bonifico.',
    texte: () => ['Ecco le coordinate per il bonifico. Il contratto parte automaticamente al ricevimento dei fondi, di solito entro 1-2 giorni lavorativi.'],
    bouton: 'Vedere la prenotazione',
  },
  appel_solde: {
    objet: (v) => `${v.yacht} si avvicina: saldo e anticipo spese`,
    apercu: (v) => `${v.total} da versare entro il ${v.echeance}.`,
    titre: () => 'Il suo imbarco si avvicina.',
    texte: (v) => [`Saldo ${v.solde} + APA ${v.apa} = ${v.total}, da versare entro il ${v.echeance}.`, 'L’APA copre carburante, viveri e porti: il comandante tiene i conti a bordo e le restituisce il residuo.'],
    bouton: 'Versare il saldo',
  },
  solde_recu: {
    objet: (v) => `Tutto saldato per ${v.yacht}`,
    apercu: () => 'La fattura di saldo è allegata a questa e-mail.',
    titre: () => 'Tutto è saldato.',
    texte: () => ['La fattura di saldo e la ricevuta dell’anticipo spese sono allegate a questa e-mail.', 'Il comandante le scriverà qualche giorno prima della partenza per preparare l’itinerario.'],
    bouton: 'I miei documenti',
  },
  embarquement: {
    objet: (v) => `${v.jour}, ${v.heure}, ${v.port}: la aspettiamo a bordo`,
    apercu: (v) => `Imbarco ${v.jour} alle ${v.heure}, ${v.port}.`,
    titre: () => 'La aspettiamo a bordo.',
    texte: (v) => [`Appuntamento ${v.jour} alle ${v.heure}, ${v.port}. L’equipaggio la accoglie alla passerella.`, 'Porti scarpe con suola chiara e bagagli morbidi: si sistemano più facilmente a bordo.', `Una domanda dell’ultimo minuto? Risponda a questa e-mail, ${v.courtier} le risponderà.`],
    bouton: 'Vedere la prenotazione',
  },
  annulation: {
    objet: (v) => `Annullamento della prenotazione ${v.ref}`,
    apercu: (v) => `La sua prenotazione di ${v.yacht} è annullata.`,
    titre: () => 'La sua prenotazione è annullata.',
    texte: (v) => [`La sua prenotazione di ${v.yacht}, ${v.dates}, è annullata${v.motif ? `: ${v.motif}` : '.'}`, 'Se è dovuto un rimborso, le sarà confermato con un’e-mail separata.', `${v.courtier} resta a sua disposizione per un’altra crociera.`],
    bouton: 'Area riservata',
  },
  remboursement: {
    objet: (v) => `Rimborso di ${v.montant}, prenotazione ${v.ref}`,
    apercu: () => 'Entro 5-10 giorni lavorativi, sul metodo di pagamento utilizzato.',
    titre: () => 'Il suo rimborso è in arrivo.',
    texte: (v) => [`Abbiamo rimborsato ${v.montant}. L’importo comparirà entro 5-10 giorni lavorativi sul metodo di pagamento utilizzato.`],
    bouton: 'Area riservata',
  },
  formulaire: {
    objet: () => 'Ricevuta: un broker le risponde entro 24 ore',
    apercu: (v) => `${v.courtier} si occupa della sua richiesta.`,
    titre: () => 'La sua richiesta è arrivata.',
    texte: (v) => [`${v.courtier} si occupa della sua richiesta${v.yacht ? ` su ${v.yacht}` : ''} e le risponde entro 24 ore.`, ...(v.demande ? [`Il suo messaggio: «${v.demande}»`] : [])],
  },
  inscription: {
    objet: () => 'Annotato, in tutta riservatezza',
    apercu: () => 'Le scriveremo appena uno yacht adatto a lei cambierà proprietario.',
    titre: () => 'Annotato, in tutta riservatezza.',
    texte: () => ['Le scriveremo appena uno yacht adatto a lei cambierà proprietario, prima della pubblicazione. Mai più di un’e-mail al mese.', 'Per annullare l’iscrizione, risponda semplicemente a questa e-mail.'],
  },
};

export const textesEmail: Record<Langue, TextesEmail> = { fr, en, de, it };
