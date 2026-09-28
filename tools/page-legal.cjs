// Pages légales : mentions légales, confidentialité et cookies, conditions générales (utilisation et location).
// Chaque texte est écrit ici dans les 4 langues : le script génère la page française et, au passage, les dictionnaires
// tools/i18n/<langue>-legal.tsv que tools/traduire.cjs utilise pour les pages anglaises, allemandes et italiennes.
// Portolan est une société fictive : ces textes sont des modèles crédibles, à faire valider par un juriste pour un vrai client.
const fs = require('fs');
const path = require('path');

const T = (fr, en, de, it) => ({ fr, en, de, it });
const norm = (s) => s.replace(/‑/g, '-').replace(/[  ]/g, ' ').replace(/&nbsp;/g, ' ').replace(/’/g, "'").replace(/\s+/g, ' ').trim();
const hash = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };

const MAJ = T('Dernière mise à jour : 28 septembre 2026.', 'Last updated: 28 September 2026.', 'Letzte Aktualisierung: 28. September 2026.', 'Ultimo aggiornamento: 28 settembre 2026.');
const DEMO = T(
  'Portolan est une maison fictive, imaginée par <a href="https://www.sudwebproject.com/">SudWebProject</a> pour présenter son savoir-faire. Société, numéros d\'immatriculation et coordonnées sont fictifs ; les textes ci-dessous sont des modèles.',
  'Portolan is a fictitious house, created by <a href="https://www.sudwebproject.com/">SudWebProject</a> to showcase its craft. The company, registration numbers and contact details are fictitious; the texts below are templates.',
  'Portolan ist ein fiktives Haus, gestaltet von <a href="https://www.sudwebproject.com/">SudWebProject</a>, um sein Können zu zeigen. Gesellschaft, Registernummern und Kontaktdaten sind fiktiv; die folgenden Texte sind Vorlagen.',
  'Portolan è una maison fittizia, ideata da <a href="https://www.sudwebproject.com/">SudWebProject</a> per presentare il proprio saper fare. Società, numeri di registrazione e recapiti sono fittizi; i testi seguenti sono modelli.',
);

const PAGES = [
  {
    slug: 'mentions-legales',
    titre: T('Mentions légales', 'Legal notice', 'Impressum', 'Note legali'),
    meta: T('Mentions légales | Portolan', 'Legal notice | Portolan', 'Impressum | Portolan', 'Note legali | Portolan'),
    description: T('Éditeur, hébergement, conception et propriété intellectuelle du site Portolan.', 'Publisher, hosting, design and intellectual property of the Portolan website.', 'Herausgeber, Hosting, Gestaltung und geistiges Eigentum der Website von Portolan.', 'Editore, hosting, progettazione e proprietà intellettuale del sito Portolan.'),
    sections: [
      [T('Éditeur du site', 'Website publisher', 'Herausgeber der Website', 'Editore del sito'), [
        T('Portolan SAS, société par actions simplifiée au capital de 150 000 €, immatriculée au registre du commerce et des sociétés de Fréjus sous le numéro 000 000 000 (fictif).', 'Portolan SAS, a French simplified joint-stock company with a share capital of €150,000, registered with the Fréjus Trade and Companies Register under number 000 000 000 (fictitious).', 'Portolan SAS, eine vereinfachte Aktiengesellschaft französischen Rechts mit einem Kapital von 150.000 €, eingetragen im Handels- und Gesellschaftsregister Fréjus unter der Nummer 000 000 000 (fiktiv).', 'Portolan SAS, società per azioni semplificata di diritto francese con capitale sociale di 150.000 €, iscritta al registro del commercio e delle società di Fréjus con il numero 000 000 000 (fittizio).'),
        { ul: [
          T('Siège : Quai Suffren, 83990 Saint-Tropez, France', 'Registered office: Quai Suffren, 83990 Saint-Tropez, France', 'Sitz: Quai Suffren, 83990 Saint-Tropez, Frankreich', 'Sede: Quai Suffren, 83990 Saint-Tropez, Francia'),
          T('Bureau de Monaco : Quai Antoine Ier, 98000 Monaco', 'Monaco office: Quai Antoine Ier, 98000 Monaco', 'Büro Monaco: Quai Antoine Ier, 98000 Monaco', 'Ufficio di Monaco: Quai Antoine Ier, 98000 Monaco'),
          T('Téléphone : +33 4 94 00 00 00', 'Telephone: +33 4 94 00 00 00', 'Telefon: +33 4 94 00 00 00', 'Telefono: +33 4 94 00 00 00'),
          T('E-mail : <a href="mailto:bonjour@portolan.example">bonjour@portolan.example</a>', 'Email: <a href="mailto:bonjour@portolan.example">bonjour@portolan.example</a>', 'E-Mail: <a href="mailto:bonjour@portolan.example">bonjour@portolan.example</a>', 'E-mail: <a href="mailto:bonjour@portolan.example">bonjour@portolan.example</a>'),
          T('TVA intracommunautaire : FR00 000000000 (fictif)', 'EU VAT number: FR00 000000000 (fictitious)', 'USt-IdNr.: FR00 000000000 (fiktiv)', 'Partita IVA intracomunitaria: FR00 000000000 (fittizia)'),
          T('Directeur de la publication : le président de Portolan SAS', 'Publication director: the Chairman of Portolan SAS', 'Verantwortlich für den Inhalt: der Präsident der Portolan SAS', 'Direttore della pubblicazione: il presidente di Portolan SAS'),
        ] },
      ]],
      [T('Hébergement', 'Hosting', 'Hosting', 'Hosting'), [
        T('Le site est hébergé par GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis (service GitHub Pages).', 'The website is hosted by GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, United States (GitHub Pages service).', 'Die Website wird von GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA, gehostet (Dienst GitHub Pages).', 'Il sito è ospitato da GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, Stati Uniti (servizio GitHub Pages).'),
        T('Les comptes clients, les réservations et les demandes sont conservés par Supabase, Inc., sur des serveurs situés à Paris, en France.', 'Client accounts, bookings and enquiries are stored by Supabase, Inc., on servers located in Paris, France.', 'Kundenkonten, Buchungen und Anfragen werden von Supabase, Inc. auf Servern in Paris, Frankreich, gespeichert.', 'Gli account dei clienti, le prenotazioni e le richieste sono conservati da Supabase, Inc., su server situati a Parigi, in Francia.'),
      ]],
      [T('Conception et réalisation', 'Design and development', 'Konzeption und Umsetzung', 'Progettazione e realizzazione'), [
        T('Site conçu et développé par <a href="https://www.sudwebproject.com/">SudWebProject</a>, Saint-Tropez : direction artistique, développement, visites immersives et espace client.', 'Website designed and developed by <a href="https://www.sudwebproject.com/">SudWebProject</a>, Saint-Tropez: art direction, development, immersive tours and client area.', 'Website gestaltet und entwickelt von <a href="https://www.sudwebproject.com/">SudWebProject</a>, Saint-Tropez: Art Direction, Entwicklung, immersive Rundgänge und Kundenbereich.', 'Sito progettato e sviluppato da <a href="https://www.sudwebproject.com/">SudWebProject</a>, Saint-Tropez: direzione artistica, sviluppo, visite immersive e area clienti.'),
        T('Images et visites générées par intelligence artificielle. Typographies Bodoni Moda et Hanken Grotesk, sous licence SIL Open Font License.', 'Images and tours generated by artificial intelligence. Bodoni Moda and Hanken Grotesk typefaces, under the SIL Open Font License.', 'Bilder und Rundgänge mit künstlicher Intelligenz erzeugt. Schriften Bodoni Moda und Hanken Grotesk unter der SIL Open Font License.', 'Immagini e visite generate con l\'intelligenza artificiale. Caratteri Bodoni Moda e Hanken Grotesk, con licenza SIL Open Font License.'),
      ]],
      [T('Propriété intellectuelle', 'Intellectual property', 'Geistiges Eigentum', 'Proprietà intellettuale'), [
        T('Textes, images, visites, plans, logo et mise en page sont protégés par le droit d\'auteur. Toute reproduction, même partielle, sans autorisation écrite est interdite.', 'Texts, images, tours, plans, logo and layout are protected by copyright. Any reproduction, even partial, without written permission is prohibited.', 'Texte, Bilder, Rundgänge, Pläne, Logo und Gestaltung sind urheberrechtlich geschützt. Jede auch nur teilweise Vervielfältigung ohne schriftliche Genehmigung ist untersagt.', 'Testi, immagini, visite, piani, logo e impaginazione sono protetti dal diritto d\'autore. È vietata qualsiasi riproduzione, anche parziale, senza autorizzazione scritta.'),
        T('Les noms de chantiers navals cités appartiennent à leurs propriétaires respectifs ; les yachts présentés sont fictifs.', 'The shipyard names mentioned belong to their respective owners; the yachts presented are fictitious.', 'Die genannten Werftnamen gehören ihren jeweiligen Inhabern; die vorgestellten Yachten sind fiktiv.', 'I nomi dei cantieri citati appartengono ai rispettivi proprietari; gli yacht presentati sono fittizi.'),
      ]],
      [T('Litiges et médiation', 'Disputes and mediation', 'Streitigkeiten und Schlichtung', 'Controversie e mediazione'), [
        T('Le site est soumis au droit français. En cas de litige, le client consommateur peut recourir gratuitement à un médiateur de la consommation, dont les coordonnées sont communiquées sur simple demande, ou à la plateforme européenne de règlement en ligne des litiges.', 'The website is governed by French law. In the event of a dispute, consumer clients may use a consumer mediator free of charge, whose contact details are provided on request, or the European online dispute resolution platform.', 'Für die Website gilt französisches Recht. Bei Streitigkeiten können Verbraucher kostenlos eine Verbraucherschlichtungsstelle anrufen, deren Kontaktdaten auf Anfrage mitgeteilt werden, oder die europäische Plattform zur Online-Streitbeilegung nutzen.', 'Il sito è soggetto al diritto francese. In caso di controversia, il cliente consumatore può ricorrere gratuitamente a un mediatore del consumo, i cui recapiti sono comunicati su semplice richiesta, oppure alla piattaforma europea di risoluzione online delle controversie.'),
      ]],
    ],
  },
  {
    slug: 'confidentialite',
    titre: T('Confidentialité et cookies', 'Privacy and cookies', 'Datenschutz und Cookies', 'Privacy e cookie'),
    meta: T('Confidentialité et cookies | Portolan', 'Privacy and cookies | Portolan', 'Datenschutz und Cookies | Portolan', 'Privacy e cookie | Portolan'),
    description: T('Comment Portolan protège vos données personnelles : données collectées, finalités, durées de conservation, vos droits et les cookies.', 'How Portolan protects your personal data: data collected, purposes, retention periods, your rights and cookies.', 'Wie Portolan Ihre personenbezogenen Daten schützt: erhobene Daten, Zwecke, Speicherdauer, Ihre Rechte und Cookies.', 'Come Portolan protegge i suoi dati personali: dati raccolti, finalità, durata di conservazione, diritti e cookie.'),
    sections: [
      [T('En bref', 'In short', 'Kurz gesagt', 'In breve'), [
        T('Nous ne collectons que ce qui sert à répondre à vos demandes et à organiser vos séjours. Vos données sont hébergées en France, ne sont jamais revendues, et le site n\'utilise aucun cookie publicitaire ni de mesure d\'audience.', 'We only collect what we need to answer your enquiries and organise your stays. Your data is hosted in France, is never sold, and the website uses no advertising or audience measurement cookies.', 'Wir erheben nur, was nötig ist, um Ihre Anfragen zu beantworten und Ihre Aufenthalte zu organisieren. Ihre Daten werden in Frankreich gespeichert, niemals verkauft, und die Website verwendet weder Werbe- noch Analyse-Cookies.', 'Raccogliamo solo ciò che serve a rispondere alle sue richieste e a organizzare i suoi soggiorni. I suoi dati sono ospitati in Francia, non vengono mai ceduti e il sito non utilizza cookie pubblicitari né di misurazione del pubblico.'),
      ]],
      [T('Responsable du traitement', 'Data controller', 'Verantwortlicher', 'Titolare del trattamento'), [
        T('Portolan SAS, Quai Suffren, 83990 Saint-Tropez. Pour toute question : <a href="mailto:donnees@portolan.example">donnees@portolan.example</a>.', 'Portolan SAS, Quai Suffren, 83990 Saint-Tropez. For any question: <a href="mailto:donnees@portolan.example">donnees@portolan.example</a>.', 'Portolan SAS, Quai Suffren, 83990 Saint-Tropez. Bei Fragen: <a href="mailto:donnees@portolan.example">donnees@portolan.example</a>.', 'Portolan SAS, Quai Suffren, 83990 Saint-Tropez. Per qualsiasi domanda: <a href="mailto:donnees@portolan.example">donnees@portolan.example</a>.'),
      ]],
      [T('Les données que nous traitons', 'The data we process', 'Welche Daten wir verarbeiten', 'I dati che trattiamo'), [
        { ul: [
          T('<strong>Votre compte</strong> : nom, e-mail, téléphone, langue. Le mot de passe est chiffré ; personne chez Portolan ne peut le lire.', '<strong>Your account</strong>: name, email, phone, language. The password is encrypted; nobody at Portolan can read it.', '<strong>Ihr Konto</strong>: Name, E-Mail, Telefon, Sprache. Das Passwort ist verschlüsselt; niemand bei Portolan kann es lesen.', '<strong>Il suo account</strong>: nome, e-mail, telefono, lingua. La password è cifrata; nessuno in Portolan può leggerla.'),
          T('<strong>Vos réservations</strong> : yacht, dates, heure et port d\'embarquement, nombre d\'invités, vos souhaits.', '<strong>Your bookings</strong>: yacht, dates, boarding time and port, number of guests, your wishes.', '<strong>Ihre Buchungen</strong>: Yacht, Daten, Einschiffungszeit und -hafen, Anzahl der Gäste, Ihre Wünsche.', '<strong>Le sue prenotazioni</strong>: yacht, date, orario e porto d\'imbarco, numero di ospiti, i suoi desideri.'),
          T('<strong>Vos demandes</strong> envoyées par les formulaires : coordonnées, projet, message.', '<strong>Your enquiries</strong> sent through the forms: contact details, project, message.', '<strong>Ihre Anfragen</strong> über die Formulare: Kontaktdaten, Vorhaben, Nachricht.', '<strong>Le sue richieste</strong> inviate tramite i moduli: recapiti, progetto, messaggio.'),
        ] },
      ]],
      [T('Pourquoi, et sur quelle base', 'Why, and on what basis', 'Wozu und auf welcher Grundlage', 'Perché, e su quale base'), [
        { ul: [
          T('Gérer votre compte et vos réservations : exécution du contrat ou de mesures précontractuelles prises à votre demande.', 'Managing your account and bookings: performance of the contract or of pre-contractual steps taken at your request.', 'Verwaltung Ihres Kontos und Ihrer Buchungen: Vertragserfüllung oder vorvertragliche Maßnahmen auf Ihre Anfrage.', 'Gestire il suo account e le sue prenotazioni: esecuzione del contratto o di misure precontrattuali adottate su sua richiesta.'),
          T('Répondre à vos demandes de dossier, de visite ou de brochure : votre consentement, donné en cochant la case du formulaire.', 'Answering your requests for a file, a viewing or a brochure: your consent, given by ticking the box on the form.', 'Beantwortung Ihrer Anfragen nach Dossier, Besichtigung oder Broschüre: Ihre Einwilligung, erteilt durch Ankreuzen des Kästchens im Formular.', 'Rispondere alle sue richieste di dossier, visita o brochure: il suo consenso, espresso selezionando la casella del modulo.'),
          T('Tenir notre comptabilité : obligation légale.', 'Keeping our accounts: legal obligation.', 'Buchführung: gesetzliche Pflicht.', 'Tenere la contabilità: obbligo di legge.'),
        ] },
      ]],
      [T('Qui peut y accéder', 'Who can access it', 'Wer darauf zugreifen kann', 'Chi può accedervi'), [
        T('Les courtiers de Portolan, et, pour une location confirmée, le capitaine et le propriétaire du yacht concerné. Nos prestataires techniques n\'agissent que sur nos instructions : Supabase (base de données, serveurs à Paris), GitHub (hébergement du site) et notre service d\'envoi d\'e-mails.', 'Portolan\'s brokers and, for a confirmed charter, the captain and owner of the yacht concerned. Our technical providers act only on our instructions: Supabase (database, servers in Paris), GitHub (website hosting) and our email delivery service.', 'Die Makler von Portolan und, bei einer bestätigten Charter, der Kapitän und der Eigner der betreffenden Yacht. Unsere technischen Dienstleister handeln nur auf unsere Weisung: Supabase (Datenbank, Server in Paris), GitHub (Hosting der Website) und unser E-Mail-Versanddienst.', 'I broker di Portolan e, per un noleggio confermato, il comandante e il proprietario dello yacht interessato. I nostri fornitori tecnici agiscono solo su nostra istruzione: Supabase (database, server a Parigi), GitHub (hosting del sito) e il nostro servizio di invio e-mail.'),
        T('Certains de ces prestataires sont des sociétés américaines : les transferts éventuels sont encadrés par les clauses contractuelles types de la Commission européenne.', 'Some of these providers are American companies: any transfers are governed by the European Commission\'s standard contractual clauses.', 'Einige dieser Dienstleister sind US-Unternehmen: Etwaige Übermittlungen sind durch die Standardvertragsklauseln der Europäischen Kommission abgesichert.', 'Alcuni di questi fornitori sono società statunitensi: gli eventuali trasferimenti sono disciplinati dalle clausole contrattuali tipo della Commissione europea.'),
      ]],
      [T('Combien de temps', 'For how long', 'Wie lange', 'Per quanto tempo'), [
        { ul: [
          T('Compte : tant qu\'il est actif, puis trois ans après votre dernière connexion.', 'Account: while it is active, then three years after your last sign-in.', 'Konto: solange es aktiv ist, danach drei Jahre nach Ihrer letzten Anmeldung.', 'Account: finché è attivo, poi tre anni dopo il suo ultimo accesso.'),
          T('Demandes : trois ans après notre dernier échange.', 'Enquiries: three years after our last exchange.', 'Anfragen: drei Jahre nach unserem letzten Austausch.', 'Richieste: tre anni dopo il nostro ultimo scambio.'),
          T('Réservations et factures : dix ans, comme l\'exige le Code de commerce.', 'Bookings and invoices: ten years, as required by the French Commercial Code.', 'Buchungen und Rechnungen: zehn Jahre, wie vom französischen Handelsgesetzbuch vorgeschrieben.', 'Prenotazioni e fatture: dieci anni, come previsto dal Codice di commercio francese.'),
        ] },
      ]],
      [T('Vos droits', 'Your rights', 'Ihre Rechte', 'I suoi diritti'), [
        T('Vous pouvez à tout moment accéder à vos données, les corriger (vos coordonnées se modifient aussi dans Mon espace), les faire effacer, en limiter l\'usage, vous opposer à leur traitement, les récupérer dans un format lisible et définir des directives pour après votre décès. Écrivez à <a href="mailto:donnees@portolan.example">donnees@portolan.example</a> : nous répondons sous un mois.', 'You may at any time access your data, correct it (your details can also be changed in My account), have it erased, restrict its use, object to its processing, obtain it in a readable format and set instructions for after your death. Write to <a href="mailto:donnees@portolan.example">donnees@portolan.example</a>: we reply within one month.', 'Sie können jederzeit auf Ihre Daten zugreifen, sie berichtigen (Ihre Angaben lassen sich auch unter Mein Konto ändern), löschen lassen, ihre Nutzung einschränken, der Verarbeitung widersprechen, sie in einem lesbaren Format erhalten und Verfügungen für die Zeit nach Ihrem Tod festlegen. Schreiben Sie an <a href="mailto:donnees@portolan.example">donnees@portolan.example</a>: Wir antworten innerhalb eines Monats.', 'In qualsiasi momento può accedere ai suoi dati, correggerli (i suoi recapiti si modificano anche nella sua area riservata), farli cancellare, limitarne l\'uso, opporsi al trattamento, riceverli in un formato leggibile e stabilire direttive per dopo il decesso. Scriva a <a href="mailto:donnees@portolan.example">donnees@portolan.example</a>: rispondiamo entro un mese.'),
        T('Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (<a href="https://www.cnil.fr/">cnil.fr</a>).', 'If you believe your rights are not being respected, you may lodge a complaint with the French data protection authority, the CNIL (<a href="https://www.cnil.fr/">cnil.fr</a>).', 'Wenn Sie der Ansicht sind, dass Ihre Rechte nicht gewahrt werden, können Sie sich an die französische Datenschutzbehörde CNIL wenden (<a href="https://www.cnil.fr/">cnil.fr</a>).', 'Se ritiene che i suoi diritti non siano rispettati, può rivolgersi all\'autorità francese per la protezione dei dati, la CNIL (<a href="https://www.cnil.fr/">cnil.fr</a>).'),
      ]],
      [T('Sécurité', 'Security', 'Sicherheit', 'Sicurezza'), [
        T('Les échanges sont chiffrés, les mots de passe ne sont jamais conservés en clair, et des règles strictes garantissent que chaque client ne voit que ses propres réservations.', 'All exchanges are encrypted, passwords are never stored in plain text, and strict rules ensure that each client sees only their own bookings.', 'Alle Übertragungen sind verschlüsselt, Passwörter werden nie im Klartext gespeichert, und strenge Regeln stellen sicher, dass jeder Kunde nur seine eigenen Buchungen sieht.', 'Gli scambi sono cifrati, le password non vengono mai conservate in chiaro e regole rigorose garantiscono che ogni cliente veda solo le proprie prenotazioni.'),
      ]],
      [T('Cookies', 'Cookies', 'Cookies', 'Cookie'), [
        T('Le site ne dépose aucun cookie publicitaire, aucun cookie de mesure d\'audience et aucun traceur de réseau social. C\'est pourquoi aucun bandeau ne vous demande votre accord.', 'The website sets no advertising cookies, no audience measurement cookies and no social network trackers. This is why no banner asks for your consent.', 'Die Website setzt keine Werbe-Cookies, keine Analyse-Cookies und keine Tracker sozialer Netzwerke. Deshalb bittet Sie auch kein Banner um Ihre Zustimmung.', 'Il sito non installa cookie pubblicitari, cookie di misurazione del pubblico né traccianti dei social network. Per questo nessun banner le chiede il consenso.'),
        T('Seule votre connexion est mémorisée dans votre navigateur (stockage local « portolan-session »), pour que vous restiez connecté à Mon espace. Ce stockage est strictement nécessaire au service que vous demandez et disparaît quand vous vous déconnectez.', 'Only your sign-in is remembered in your browser (local storage “portolan-session”), so that you stay signed in to My account. This storage is strictly necessary for the service you request and is removed when you sign out.', 'Nur Ihre Anmeldung wird in Ihrem Browser gespeichert (lokaler Speicher „portolan-session“), damit Sie in Mein Konto angemeldet bleiben. Diese Speicherung ist für den angeforderten Dienst unbedingt erforderlich und wird bei der Abmeldung gelöscht.', 'Nel suo browser viene memorizzato solo l\'accesso (archiviazione locale «portolan-session»), perché lei resti collegato alla sua area riservata. Questa archiviazione è strettamente necessaria al servizio richiesto e scompare quando si disconnette.'),
        T('Les polices de caractères sont servies par le site lui-même. Les liens vers WhatsApp ou Google Maps ne chargent rien tant que vous ne cliquez pas.', 'Typefaces are served by the website itself. Links to WhatsApp or Google Maps load nothing until you click them.', 'Die Schriften werden von der Website selbst bereitgestellt. Links zu WhatsApp oder Google Maps laden nichts, bevor Sie darauf klicken.', 'I caratteri tipografici sono forniti dal sito stesso. I link a WhatsApp o Google Maps non caricano nulla finché non ci clicca.'),
      ]],
    ],
  },
  {
    slug: 'conditions',
    titre: T('Conditions générales', 'Terms and conditions', 'Allgemeine Geschäftsbedingungen', 'Condizioni generali'),
    meta: T('Conditions générales d\'utilisation et de location | Portolan', 'Terms of use and charter terms | Portolan', 'Nutzungs- und Charterbedingungen | Portolan', 'Condizioni d\'uso e di noleggio | Portolan'),
    description: T('Conditions d\'utilisation du site et de l\'espace client, et conditions de réservation des locations de yachts avec équipage.', 'Terms of use of the website and client area, and booking terms for crewed yacht charters.', 'Nutzungsbedingungen der Website und des Kundenbereichs sowie Buchungsbedingungen für Yachtcharter mit Crew.', 'Condizioni d\'uso del sito e dell\'area clienti, e condizioni di prenotazione dei noleggi di yacht con equipaggio.'),
    sections: [
      [T('1. Utilisation du site', '1. Use of the website', '1. Nutzung der Website', '1. Utilizzo del sito'), [
        T('Le site présente les yachts proposés à la vente et à la location par Portolan. Les caractéristiques, photographies et prix sont donnés à titre indicatif et peuvent évoluer ; seul le contrat signé engage les parties.', 'The website presents the yachts offered for sale and charter by Portolan. Specifications, photographs and prices are given for information and may change; only the signed contract binds the parties.', 'Die Website stellt die von Portolan zum Verkauf und zur Charter angebotenen Yachten vor. Technische Daten, Fotos und Preise sind unverbindlich und können sich ändern; nur der unterzeichnete Vertrag bindet die Parteien.', 'Il sito presenta gli yacht proposti in vendita e a noleggio da Portolan. Caratteristiche, fotografie e prezzi sono indicativi e possono variare; solo il contratto firmato vincola le parti.'),
      ]],
      [T('2. Votre compte', '2. Your account', '2. Ihr Konto', '2. Il suo account'), [
        T('Le compte est personnel. Vous vous engagez à donner des informations exactes et à garder votre mot de passe confidentiel. Vous pouvez demander la suppression de votre compte à tout moment ; Portolan peut suspendre un compte utilisé de manière abusive.', 'The account is personal. You undertake to provide accurate information and to keep your password confidential. You may ask for your account to be deleted at any time; Portolan may suspend an account that is misused.', 'Das Konto ist persönlich. Sie verpflichten sich, zutreffende Angaben zu machen und Ihr Passwort vertraulich zu behandeln. Sie können jederzeit die Löschung Ihres Kontos verlangen; Portolan kann ein missbräuchlich genutztes Konto sperren.', 'L\'account è personale. Lei si impegna a fornire informazioni esatte e a mantenere riservata la password. Può chiedere in qualsiasi momento la cancellazione dell\'account; Portolan può sospendere un account utilizzato in modo abusivo.'),
      ]],
      [T('3. Le rôle de Portolan', '3. Portolan\'s role', '3. Die Rolle von Portolan', '3. Il ruolo di Portolan'), [
        T('Portolan agit comme courtier, pour le compte des propriétaires des yachts. La location fait l\'objet d\'un contrat au standard MYBA, signé entre vous et le propriétaire ; Portolan vous accompagne de la demande jusqu\'au débarquement.', 'Portolan acts as a broker on behalf of the yacht owners. The charter is governed by a MYBA-standard contract signed between you and the owner; Portolan supports you from the enquiry until disembarkation.', 'Portolan handelt als Makler im Auftrag der Yachteigner. Die Charter beruht auf einem Vertrag nach MYBA-Standard zwischen Ihnen und dem Eigner; Portolan begleitet Sie von der Anfrage bis zur Ausschiffung.', 'Portolan agisce come broker per conto dei proprietari degli yacht. Il noleggio è regolato da un contratto standard MYBA firmato tra lei e il proprietario; Portolan la accompagna dalla richiesta fino allo sbarco.'),
      ]],
      [T('4. Réserver en ligne', '4. Booking online', '4. Online buchen', '4. Prenotare online'), [
        { ul: [
          T('Votre réservation en ligne est une demande : elle bloque les dates choisies (« en option ») le temps que votre courtier vérifie la disponibilité de l\'équipage et vous réponde, sous 24 heures.', 'Your online booking is a request: it holds the chosen dates (“on option”) while your broker checks crew availability and replies to you, within 24 hours.', 'Ihre Online-Buchung ist eine Anfrage: Sie reserviert die gewählten Daten („optioniert“), während Ihr Makler die Verfügbarkeit der Crew prüft und Ihnen innerhalb von 24 Stunden antwortet.', 'La sua prenotazione online è una richiesta: blocca le date scelte («in opzione») il tempo necessario perché il suo broker verifichi la disponibilità dell\'equipaggio e le risponda, entro 24 ore.'),
          T('Une fois la demande confirmée, vous recevez le contrat de location. La réservation devient ferme à la signature du contrat et au versement de l\'acompte de 50 % ; le solde est dû un mois avant l\'embarquement.', 'Once the request is confirmed, you receive the charter contract. The booking becomes firm when the contract is signed and the 50% deposit is paid; the balance is due one month before boarding.', 'Nach Bestätigung der Anfrage erhalten Sie den Chartervertrag. Die Buchung wird mit der Unterzeichnung des Vertrags und der Anzahlung von 50 % verbindlich; der Restbetrag ist einen Monat vor der Einschiffung fällig.', 'Una volta confermata la richiesta, riceve il contratto di noleggio. La prenotazione diventa definitiva alla firma del contratto e al versamento dell\'acconto del 50%; il saldo è dovuto un mese prima dell\'imbarco.'),
          T('Aucun paiement n\'est demandé en ligne.', 'No payment is requested online.', 'Online wird keine Zahlung verlangt.', 'Online non viene richiesto alcun pagamento.'),
        ] },
      ]],
      [T('5. Prix', '5. Prices', '5. Preise', '5. Prezzi'), [
        T('Les tarifs sont indiqués à la semaine, équipage compris, et calculés au prorata des nuits de basse et de haute saison. Ils ne comprennent pas les frais de croisière (carburant, vivres, boissons, ports, communications), réglés par une avance de 30 % versée avant le départ et ajustée au retour sur justificatifs, ni la TVA, qui dépend des eaux naviguées. Le pourboire de l\'équipage est laissé à votre appréciation.', 'Rates are quoted per week, crew included, and calculated pro rata for low- and high-season nights. They do not include cruising expenses (fuel, provisions, drinks, ports, communications), covered by a 30% advance paid before departure and adjusted on return against receipts, nor VAT, which depends on the waters sailed. The crew gratuity is at your discretion.', 'Die Preise gelten pro Woche inklusive Crew und werden anteilig nach Nächten in Neben- und Hochsaison berechnet. Nicht enthalten sind die Reisekosten (Treibstoff, Proviant, Getränke, Häfen, Kommunikation), die über einen Vorschuss von 30 % vor der Abfahrt beglichen und nach der Rückkehr gegen Belege abgerechnet werden, sowie die Mehrwertsteuer, die von den befahrenen Gewässern abhängt. Das Trinkgeld für die Crew liegt in Ihrem Ermessen.', 'Le tariffe sono indicate a settimana, equipaggio incluso, e calcolate in proporzione alle notti di bassa e alta stagione. Non comprendono le spese di crociera (carburante, cambusa, bevande, porti, comunicazioni), coperte da un anticipo del 30% versato prima della partenza e conguagliato al rientro su giustificativi, né l\'IVA, che dipende dalle acque navigate. La mancia all\'equipaggio è a sua discrezione.'),
      ]],
      [T('6. Annulation', '6. Cancellation', '6. Stornierung', '6. Annullamento'), [
        { ul: [
          T('Avant la confirmation : vous annulez librement votre demande, en un clic, depuis Mon espace.', 'Before confirmation: you can cancel your request freely, in one click, from My account.', 'Vor der Bestätigung: Sie stornieren Ihre Anfrage kostenlos mit einem Klick unter Mein Konto.', 'Prima della conferma: annulla liberamente la sua richiesta, con un clic, dalla sua area riservata.'),
          T('Après la signature du contrat : les conditions d\'annulation du contrat MYBA s\'appliquent. L\'acompte reste acquis au propriétaire, sauf si le yacht est reloué pour la même période.', 'After the contract is signed: the cancellation terms of the MYBA contract apply. The deposit is retained by the owner, unless the yacht is re-chartered for the same period.', 'Nach Unterzeichnung des Vertrags: Es gelten die Stornierungsbedingungen des MYBA-Vertrags. Die Anzahlung verbleibt beim Eigner, es sei denn, die Yacht wird für denselben Zeitraum erneut verchartert.', 'Dopo la firma del contratto: si applicano le condizioni di annullamento del contratto MYBA. L\'acconto resta acquisito al proprietario, salvo se lo yacht viene noleggiato di nuovo per lo stesso periodo.'),
          T('Si le propriétaire ne peut pas honorer la location, les sommes versées vous sont intégralement remboursées, ou un yacht équivalent vous est proposé.', 'If the owner cannot honour the charter, all sums paid are refunded in full, or an equivalent yacht is offered to you.', 'Kann der Eigner die Charter nicht erfüllen, werden Ihnen alle gezahlten Beträge vollständig erstattet oder eine gleichwertige Yacht angeboten.', 'Se il proprietario non può onorare il noleggio, le somme versate le sono interamente rimborsate, oppure le viene proposto uno yacht equivalente.'),
        ] },
      ]],
      [T('7. À bord', '7. On board', '7. An Bord', '7. A bordo'), [
        T('Le nombre d\'invités ne peut dépasser la capacité indiquée pour chaque yacht. Le capitaine est seul juge de la sécurité : il peut modifier l\'itinéraire ou l\'heure de départ en fonction de la météo, sans que cela ouvre droit à remboursement.', 'The number of guests may not exceed the capacity stated for each yacht. The captain alone decides on matters of safety and may change the itinerary or departure time according to the weather, without this giving rise to a refund.', 'Die Anzahl der Gäste darf die für jede Yacht angegebene Kapazität nicht überschreiten. Über die Sicherheit entscheidet allein der Kapitän: Er kann Route oder Abfahrtszeit wetterbedingt ändern, ohne dass daraus ein Erstattungsanspruch entsteht.', 'Il numero di ospiti non può superare la capacità indicata per ogni yacht. Il comandante è l\'unico giudice della sicurezza: può modificare l\'itinerario o l\'orario di partenza in base al meteo, senza che ciò dia diritto a rimborso.'),
      ]],
      [T('8. Droit applicable', '8. Governing law', '8. Anwendbares Recht', '8. Legge applicabile'), [
        T('Les présentes conditions sont soumises au droit français. Avant toute action en justice, nous vous proposons de rechercher ensemble une solution amiable, puis, si besoin, de recourir gratuitement à un médiateur de la consommation.', 'These terms are governed by French law. Before any legal action, we invite you to seek an amicable solution together and then, if necessary, to use a consumer mediator free of charge.', 'Diese Bedingungen unterliegen französischem Recht. Vor jedem Rechtsstreit schlagen wir Ihnen vor, gemeinsam eine gütliche Lösung zu suchen und bei Bedarf kostenlos eine Verbraucherschlichtungsstelle anzurufen.', 'Le presenti condizioni sono soggette al diritto francese. Prima di qualsiasi azione legale, le proponiamo di cercare insieme una soluzione amichevole e poi, se necessario, di ricorrere gratuitamente a un mediatore del consumo.'),
      ]],
    ],
  },
];

// Textes communs (pied de page, fenêtre de connexion) : dans les dictionnaires, pour toutes les pages
const COMMUNS = [
  T('Informations légales', 'Legal information', 'Rechtliche Hinweise', 'Informazioni legali'),
  T('Mentions légales', 'Legal notice', 'Impressum', 'Note legali'),
  T('Confidentialité et cookies', 'Privacy and cookies', 'Datenschutz und Cookies', 'Privacy e cookie'),
  T('Conditions générales', 'Terms and conditions', 'Allgemeine Geschäftsbedingungen', 'Condizioni generali'),
  T('Informations', 'Information', 'Informationen', 'Informazioni'),
  // Lien sous le bouton « Réserver » des fiches (le lien est réécrit ensuite vers la page de chaque langue)
  T('<a href="../../../fr/conditions/">Conditions de location</a>', '<a href="../../../fr/conditions/">Charter terms</a>', '<a href="../../../fr/conditions/">Charterbedingungen</a>', '<a href="../../../fr/conditions/">Condizioni di noleggio</a>'),
];

module.exports = function pagesLegales(t) {
  const { page, SITE } = t;
  const dict = { en: new Map(), de: new Map(), it: new Map() };
  const note = (x) => { for (const l of ['en', 'de', 'it']) dict[l].set(hash(norm(x.fr)), x[l]); return x.fr; };
  COMMUNS.forEach(note);
  note(MAJ); note(DEMO);

  const sorties = PAGES.map((p) => {
    const bloc = (b) => (b.ul ? `<ul>${b.ul.map((li) => `<li>${note(li)}</li>`).join('')}</ul>` : `<p>${note(b)}</p>`);
    const autres = PAGES.filter((o) => o !== p).map((o) => `<a class="link" href="../${o.slug}/">${note(o.titre)}</a>`).join('');
    const body = `
    <article class="legal" aria-labelledby="lg-titre">
      <nav class="crumbs" aria-label="Fil d'Ariane"><a href="../">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">${note(p.titre)}</span></nav>
      <p class="kicker">${note(T('Informations', 'Information', 'Informationen', 'Informazioni'))}</p>
      <h1 id="lg-titre" class="legal__titre">${note(p.titre)}</h1>
      <p class="legal__demo">${note(DEMO)}</p>
      <div class="legal__corps">
        ${p.sections.map(([h, blocs]) => `<section><h2>${note(h)}</h2>${blocs.map(bloc).join('')}</section>`).join('\n        ')}
      </div>
      <p class="legal__maj">${note(MAJ)}</p>
      <nav class="legal__autres" aria-label="${note(COMMUNS[0])}">${autres}</nav>
    </article>`;
    note(p.meta); note(p.description);
    return [`fr/${p.slug}/index.html`, page({
      root: '../../', url: `/fr/${p.slug}/`, bodyClass: 'inner page-legal', script: 'legal.js', image: 'flotte/camarat',
      alt: 'Le yacht Camarat en navigation au coucher du soleil',
      title: p.meta.fr, description: p.description.fr,
      jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: p.titre.fr, url: `${SITE}/fr/${p.slug}/`, inLanguage: 'fr' },
      body,
    })];
  });

  for (const l of ['en', 'de', 'it']) {
    const lignes = [`# Portolan : pages légales (${l}), générées par tools/page-legal.cjs. Ne pas modifier à la main.`, ...[...dict[l]].map(([h, v]) => `${h} ${v}`)];
    fs.writeFileSync(path.join(__dirname, 'i18n', `${l}-legal.tsv`), `${lignes.join('\n')}\n`);
  }
  return sorties;
};
