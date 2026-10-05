# 04 · Lot 4 : espace directeur

L'outil de gestion de Portolan est en français uniquement et réservé au directeur. Il doit être **dense, rapide et sans ambiguïté** (c'est un outil de travail quotidien) tout en restant dans l'identité : calcaire, abysse, laiton, Bodoni pour les titres, Hanken pour tout le reste.

Il se conçoit d'abord pour un **ordinateur portable (1440 px)**. Une version **tablette et téléphone** est attendue pour les actions du quotidien seulement : valider une demande, consulter le calendrier, appeler un client.

**Utilisateur d'exemple** : Hélène Marchetti, directrice. **Données d'exemple** : les 6 yachts (Camarat, Castellane, Mistral Blanc, Solenne, Tramontane, Alizé), saison 2027, une vingtaine de réservations et une dizaine de demandes.

---

## 4.1 · Structure, connexion et mode démonstration

```
Avec le système de design Portolan, dessine la structure de l'espace directeur et sa page de connexion.

CONNEXION : page sobre sur fond abysse, rose des vents et « Portolan · Direction », e-mail, mot de passe, « Mot de passe oublié ? », « Me connecter ». Erreurs : identifiants incorrects, « Ce compte n'a pas accès à la direction ».
Sous le formulaire, uniquement en mode démonstration : un encadré « Visiter en démonstration » (« Lecture seule, données des clients masquées ») avec un bouton.

STRUCTURE (une fois connecté) :
- Barre latérale à gauche, repliable : logo, puis Tableau de bord, Réservations (pastille avec le nombre à traiter, ex. 3), Calendrier, Demandes (pastille 5), Clients, Yachts, Réglages. En bas : nom de l'utilisateur, « Voir le site », « Se déconnecter ».
- Barre du haut : titre de la page, recherche globale (référence PTL-, nom de client, e-mail, nom de yacht) avec résultats groupés, bouton « + Nouveau » (blocage de dates, yacht).
- Sur téléphone : barre de navigation en bas avec 4 entrées (Tableau, Réservations, Calendrier, Plus).
- Notifications brèves en bas à droite pour confirmer chaque action (« Réservation PTL-00061 validée · lien d'acompte envoyé à Charlotte Delaunay »).

MODE DÉMONSTRATION : un bandeau laiton fin en haut, « Démonstration en lecture seule : les données des clients sont masquées », et tous les boutons d'action désactivés avec l'info-bulle « Lecture seule en démonstration ». Les noms apparaissent masqués (« C. D. »).
```

## 4.2 · Tableau de bord

```
Avec le système de design Portolan, dessine le tableau de bord du directeur.

- Salutation « Bonjour Hélène », date du jour, rappel de la saison (« Saison 2027 · J-180 avant l'ouverture »).
- Rangée d'indicateurs (cartes à filet, gros chiffres en Bodoni, sans graphique superflu) :
  · Encaissé : 1 284 500 € (acomptes et soldes reçus)
  · À encaisser : 2 016 000 € (soldes et APA à venir, acomptes attendus)
  · Demandes à traiter : 3 (dont 1 depuis plus de 24 h, en alerte)
  · Taux d'occupation de la saison : 46 %
  · Nouveaux clients ce mois : 7
- « À traiter maintenant », une liste priorisée avec une action directe sur chaque ligne :
  · Demande PTL-00061, Tramontane, 2 → 6 juin, Charlotte D. : « reçue il y a 3 h · expire dans 45 h » → Valider / Refuser
  · Acompte attendu PTL-00057, Solenne, 20 570 € : « échéance dans 71 h » → Relancer
  · Virement reçu à rapprocher (cas rare) → Voir
  · Demande de dossier Castellane, Markus Weber : « il y a 1 jour » → Ouvrir
- « Prochains embarquements » : 5 lignes (date, yacht, client, port, heure, statut du paiement : Soldée en vert, Solde en retard en rouge).
- « Occupation par yacht » : une barre horizontale par yacht à louer, nuits réservées sur nuits de saison.
- « Chiffre d'affaires par mois » : histogramme sobre (mai à octobre), confirmé (laiton) et en attente (laiton clair).
États : saison vide, chargement.
```

## 4.3 · Réservations

```
Avec le système de design Portolan, dessine la gestion des réservations : une liste à gauche et un panneau de détail à droite (sur téléphone, le détail s'ouvre en plein écran).

LISTE
- Filtres en onglets : À traiter (3) · À payer (2) · Confirmées · Soldées · Passées · Blocages · Toutes.
- Filtres secondaires : yacht, mois d'embarquement. Recherche.
- Tableau dense : Référence · Yacht · Client · Embarquement → Retour · Nuits · Montant · Statut (badge) · Échéance (« expire dans 45 h », « solde le 10/06 »). Tri par colonne. Ligne sélectionnée surlignée.
- Bouton « Bloquer des dates » (entretien, usage du propriétaire).

PANNEAU DE DÉTAIL (PTL-00061, En attente)
- En-tête : référence, badge, yacht, dates, nuits, montant.
- Client : nom, e-mail, téléphone, langue, nombre de réservations passées, lien vers sa fiche. Actions de contact : Appeler, WhatsApp, E-mail.
- Croisière : heure et port d'embarquement, invités, souhaits du client (texte).
- Échéancier : acompte, solde, APA, avec leur statut et leur date.
- Historique (journal) : chaque événement daté (demande créée, e-mail envoyé au client, validée par Hélène, lien d'acompte envoyé, relance envoyée, paiement reçu, contrat généré et envoyé…).
- Documents : contrat et factures, avec Télécharger et « Renvoyer au client ».
- Note interne (visible seulement par la direction) et « Mot au client » (visible par le client et repris dans l'e-mail).
- ACTIONS selon le statut :
  · En attente → « Valider la demande » (principal) : une boîte de dialogue récapitule ce qui va se passer (« Charlotte Delaunay recevra un e-mail avec un lien pour régler l'acompte de 20 570 € sous 72 h. »), avec un champ facultatif « Mot au client », puis Valider. « Refuser » ouvre une boîte de dialogue avec un motif obligatoire, envoyé au client.
  · À payer → « Renvoyer le lien de paiement », « Prolonger le délai » (+24 h, +48 h), « Marquer l'acompte comme reçu » (paiement hors Stripe : montant, moyen, date, justificatif facultatif, avec l'avertissement « Le contrat et la facture partiront au client »), « Annuler ».
  · Confirmée / Soldée → « Envoyer l'appel de solde maintenant », « Marquer un paiement reçu », « Annuler et rembourser ».
- Boîte de dialogue « Annuler et rembourser » : rappel des sommes encaissées (acompte 107 500 €), montant à rembourser modifiable (de 0 à 107 500 €, avec le rappel des conditions MYBA : « l'acompte reste acquis sauf relocation »), motif, case « Prévenir le client par e-mail », confirmation en tapant la référence. Le remboursement passe par Stripe : montre ensuite l'état « Remboursement en cours », puis « Remboursé ».
- Boîte de dialogue « Bloquer des dates » : yacht, du, au, motif (Entretien, Propriétaire, Autre), note.

États : liste vide par onglet (« Rien à traiter. Belle journée. »), conflit (« Ces dates chevauchent la réservation PTL-00042 »), erreur réseau.
```

## 4.4 · Calendrier de la flotte

```
Avec le système de design Portolan, dessine le calendrier de la flotte : une frise de la saison (avril à octobre 2027), une ligne par yacht à louer (Camarat, Mistral Blanc, Solenne, Tramontane), les jours en colonnes et la haute saison teintée.
- Barres de réservation colorées par statut (En attente hachurée, À payer en laiton clair, Confirmée et Soldée en laiton plein, Blocage en gris rayé), avec le nom du client et le nombre de nuits si la place le permet.
- Survol : infobulle (référence, client, dates, montant, statut). Clic : ouvre le panneau de détail de la réservation (écran 4.3).
- Glisser sur des jours libres d'une ligne : ouvre « Bloquer des dates » prérempli.
- Zoom : Saison · Mois · Semaine. Aujourd'hui marqué d'un trait laiton vertical. Navigation entre les saisons.
- Sur téléphone : une liste par yacht et par semaine plutôt qu'une frise.
```

## 4.5 · Yachts : la flotte

```
Avec le système de design Portolan, dessine la liste des yachts de l'espace directeur.
- Bouton principal « Ajouter un yacht ».
- Une ligne par yacht, réordonnable par glisser-déposer (poignée), car l'ordre est celui du site : photo principale en vignette, nom, chantier, année, longueur, badges (À vendre, À louer, Mis en avant à l'accueil, Brouillon, Archivé), prix, indicateur « Traductions à revoir (EN, DE) » le cas échéant, date de dernière modification.
- Actions par ligne (menu « … ») : Modifier, Voir sur le site, Dupliquer, Archiver, Supprimer.
- Filtres : Publiés · Brouillons · Archivés.
- Boîte de dialogue « Supprimer Alizé ? » : impossible s'il existe des réservations (« Archivez-le plutôt : il disparaît du site et ses réservations sont conservées »). Sinon, confirmation en tapant le nom.
- Boîte de dialogue « Ajouter un yacht » : nom, chantier, longueur, à vendre et/ou à louer, puis ouverture de l'éditeur (écran 4.6) en brouillon.
```

## 4.6 · Éditeur de yacht

```
Avec le système de design Portolan, dessine l'éditeur d'un yacht (exemple : Mistral Blanc), sur ordinateur, avec ses onglets. En-tête collant : nom, badge Publié ou Brouillon, « Voir sur le site », « Enregistrer » (principal, désactivé tant que rien n'a changé), et un rappel des modifications non enregistrées.
Après l'enregistrement : notification « Enregistré · en ligne sur le site dans quelques secondes ».

ONGLET IDENTITÉ
- Nom, adresse de la page (slug : mistral-blanc, modifiable avec l'avertissement « l'ancienne adresse sera redirigée »), chantier, nom court du chantier, type (moteur, voilier), port d'attache, pavillon, numéro dans la flotte, « Exclusivité Portolan » (interrupteur), « Mis en avant à l'accueil » (interrupteur).
- Vente et location : cases « À vendre » et « À louer », qui affichent ou masquent les prix.

ONGLET CARACTÉRISTIQUES
- Grille de champs avec leurs unités : année, refit, longueur (m), largeur (m), tirant d'eau (m), coque, architecte, invités, cabines (nombre et description), équipage, vitesse de croisière et de pointe (nœuds), autonomie (milles), motorisation, stabilisateurs.

ONGLET PRIX
- Prix de vente (€), avec un aperçu formaté « 34 500 000 € ».
- Location : tarif à la semaine en basse saison et en haute saison, avec un aperçu du prix à la nuit, et le rappel des dates de saison venant des réglages.
- Simulateur : choix de dates, puis prix calculé, acompte, solde et APA, exactement comme le client le verra.

ONGLET TEXTES (4 langues)
- Sélecteur de langue FR · EN · DE · IT. Un point rouge sur une langue signale des traductions manquantes ou « à revoir ».
- Champs : accroche ; présentation (une liste de paragraphes, avec Ajouter / Retirer / Réordonner) ; points forts (titre et texte, même liste) ; ponts (nom du pont et aménagement) ; description des cabines.
- En EN, DE et IT : chaque champ affiche le texte français de référence en petit au-dessus. Un champ dont le français a changé depuis sa traduction porte le badge « À revoir ».
- Bouton « Traduire avec l'IA » (par champ et pour toute la langue). Le résultat s'affiche en proposition à accepter ou modifier, jamais enregistré sans relecture. États : traduction en cours, proposée, acceptée.

ONGLET PHOTOS
- Zone de dépôt « Glissez vos photos ici (JPEG, PNG ou WebP, 5 Mo au plus par photo) » et un bouton.
- Grille de vignettes réordonnable par glisser-déposer. La première, ou celle marquée d'une étoile, est la photo principale.
- Sur chaque photo : le pont (Extérieur, Pont principal, Pont supérieur, Pont soleil, Pont inférieur), la description en 4 langues (obligatoire en français, avec un point rouge si elle manque), « Définir comme principale », « Supprimer » (confirmation, puis suppression réelle du fichier).
- Envoi : barre de progression par photo, avec les états préparation, envoi, terminé et erreur (fichier trop lourd, format refusé).

ONGLET VISITE
- La visite immersive est réalisée par l'agence. Interrupteur « Afficher la visite à bord sur la fiche », aperçu de l'affiche, durée, et la mention « Pour une nouvelle visite, contactez SudWebProject ».

ONGLET PUBLICATION
- État : Brouillon (visible seulement par la direction) ou Publié. Bouton « Publier » ou « Repasser en brouillon ».
- Liste de vérification avant la publication : photo principale, accroche en 4 langues, prix, au moins 3 photos décrites. Les points manquants sont listés et la publication reste possible, avec un avertissement.
- Archiver, Supprimer (zone sensible).

États : chargement, erreur d'enregistrement, modification simultanée (« Ce yacht a été modifié depuis un autre poste il y a 2 minutes. Recharger ou écraser ? »).
```

## 4.7 · Demandes

```
Avec le système de design Portolan, dessine l'onglet « Demandes » : les formulaires du site (contact, dossier, visite, brochure, vente de yacht) et les inscriptions « Hors marché ».
- Vue en colonnes ou en liste (bascule) avec les statuts : Nouvelle · En cours · Gagnée · Perdue.
- Ligne ou carte : type (badge : Dossier, Visite, Brochure, Projet d'achat, Projet de location, Vente, Contact), yacht concerné, nom, langue, date (« il y a 1 jour »), extrait du message.
- Détail en panneau : toutes les réponses du formulaire (critères : taille, budget, période, invités, échéance), coordonnées, préférence de contact (téléphone, e-mail, WhatsApp), page d'origine, actions de contact, changement de statut, notes internes datées, « Brochure envoyée le … » si c'est le cas.
- Sous-onglet « Hors marché » : la liste des e-mails inscrits, avec leur langue et leur date, export CSV et désinscription.
```

## 4.8 · Clients

```
Avec le système de design Portolan, dessine l'onglet « Clients ».
- Tableau : nom, e-mail, téléphone, langue, nombre de réservations, total réglé, dernière croisière, date d'inscription. Recherche et tri.
- Fiche client (panneau) : coordonnées, adresse de facturation, toutes ses réservations (avec leur badge), tous ses paiements, tous ses documents, ses demandes de formulaire, notes internes. Actions : contacter, « Renvoyer le lien de connexion ».
```

## 4.9 · Réglages

```
Avec le système de design Portolan, dessine les réglages, en sections avec un enregistrement par section :

1. Saison : année, premier embarquement, dernier débarquement, début et fin de la haute saison, minimum de nuits (haute, basse), heures d'embarquement (de, à), ports d'embarquement (liste modifiable). Mention « S'applique immédiatement aux réservations et au site ».
2. Paiement : taux d'acompte (50 %), taux d'APA (30 %), délai de réponse du courtier (48 h), délai de paiement de l'acompte (72 h), appel du solde (30 jours avant), relance (24 h avant l'échéance), TVA appliquée sur la location, moyens acceptés (carte, virement).
3. Société (repris sur les contrats et factures) : raison sociale (Portolan SAS), forme et capital, RCS, SIRET, n° de TVA intracommunautaire, adresse du siège (Quai Suffren, 83990 Saint-Tropez), bureau de Monaco (Quai Antoine Ier, 98000 Monaco), téléphone, e-mail, logo, mentions de bas de facture, aperçu en direct d'un en-tête de facture.
4. Contrat : version en vigueur (v1.2, 1er octobre 2026), texte des conditions particulières, historique des versions (une réservation garde la version acceptée par le client).
5. Notifications : e-mail qui reçoit les alertes (nouvelle demande, paiement reçu, demande non traitée), case à cocher par type.
6. Équipe : la liste des comptes direction (lecture seule dans le MVP).
```
