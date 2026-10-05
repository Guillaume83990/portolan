# 03 · Lot 3 : Mon espace (client)

Mon espace est l'endroit où le client suit ses réservations, paie, télécharge ses documents et gère son compte. Il est accessible par le lien « Mon espace » de l'en-tête, qui passe en laiton quand le client est connecté.

**Le client d'exemple** est Charlotte Delaunay (charlotte@exemple.com, +33 6 12 34 56 78, correspondance en français). Elle a quatre réservations :
- **PTL-00042**, Mistral Blanc, du 10 au 17 juillet 2027, 7 nuits, 12:00 Monaco, 10 invités, 215 000 € : statut **Confirmée** (acompte payé le 5 octobre 2026). Solde et APA de 172 000 € dus avant le 10 juin 2027.
- **PTL-00057**, Solenne, du 4 au 8 septembre 2027, 4 nuits, 10:30 Saint-Tropez, 6 invités : statut **À payer**. Location de 41 140 € (4 nuits en basse saison), acompte de 20 570 € sous 72 h.
- **PTL-00061**, Tramontane, du 2 au 6 juin 2027 : statut **En attente** (envoyée il y a 3 heures).
- **PTL-00019**, Camarat, du 14 au 21 août 2026, 240 000 € : statut **Terminée**.

---

## 3.1 · Mes réservations (accueil de Mon espace)

```
Avec le système de design Portolan, dessine l'accueil de « Mon espace », sur ordinateur et téléphone. Fond clair (calcaire), même en-tête et pied de page que le site.

- Accueil : « Bonjour Charlotte », sous-titre « Vos croisières, vos documents, votre courtier. »
- Navigation de l'espace (onglets sur ordinateur, liste déroulante ou onglets défilants sur téléphone) : Mes réservations · Mes documents · Mon compte.
- Bloc « Votre courtier » toujours visible (colonne de droite sur ordinateur, bas de page sur téléphone) : photo, « Hélène Marchetti, courtière, bureau de Monaco », boutons Appeler / WhatsApp / Écrire. Réponse sous 24 heures, week-end compris.
- Encadré « À faire » en tête, seulement s'il y a une action en attente : « Régler l'acompte de Solenne : 20 570 €, avant le mardi 6 octobre à 18:40 », bouton « Régler l'acompte ».
- Section « À venir », triée par date d'embarquement. Une carte par réservation : photo du yacht, nom, badge de statut, dates (« Du sam. 10 au sam. 17 juillet 2027 · 7 nuits »), embarquement (« 12:00, Monaco »), invités, référence, montant, frise en 5 étapes (Demande, Validée, Acompte, Solde, Embarquement) à la bonne étape, et l'action du moment :
  · En attente → « Votre courtier vous répond sous 24 heures. » + lien discret « Annuler ma demande »
  · À payer → bouton principal « Régler l'acompte » + compte à rebours
  · Confirmée → « Solde et APA : 172 000 € avant le 10 juin 2027 » + « Télécharger mon contrat »
  · Soldée → « Tout est réglé. Embarquement dans 23 jours. »
- Section « Passées » : cartes plus compactes (Terminée, Refusée, Expirée, Annulée), avec « Réserver de nouveau » pour Terminée.
- Mot du courtier sur une carte quand il en a laissé un, en italique Bodoni, signé.

États :
- aucune réservation : illustration au trait d'une carte marine, « Votre première croisière commence ici. », boutons « Voir les yachts à louer » et « Parler à un courtier » ;
- chargement (squelettes de cartes) ;
- erreur de chargement, avec « Réessayer ».
```

## 3.2 · Détail d'une réservation

```
Avec le système de design Portolan, dessine la page de détail de la réservation PTL-00042 (Mistral Blanc, Confirmée), sur ordinateur et téléphone.

- Ouverture : photo du yacht en bandeau, badge « Confirmée », « Mistral Blanc », « Du samedi 10 au samedi 17 juillet 2027 », référence PTL-00042.
- Frise détaillée (verticale sur téléphone), chaque étape datée :
  · Demande envoyée, 3 oct. 2026, 14:12
  · Validée par Hélène, 4 oct. 2026, 09:30
  · Acompte reçu (carte), 5 oct. 2026, 11:02, 107 500 €
  · Solde et APA, à régler avant le 10 juin 2027, 172 000 € (étape à venir, avec un rappel automatique le 10 mai)
  · Embarquement, sam. 10 juillet 2027, 12:00, Monaco
- Votre croisière : embarquement (heure, port), débarquement, invités, vos souhaits (texte du client), mot du courtier.
- Paiements : tableau Échéance / Montant / Statut / Moyen / Date. Acompte 107 500 € Payé (carte, 5 oct.) · Solde 107 500 € À venir · APA 64 500 € À venir. Total réglé 107 500 € sur 279 500 €. Le bouton « Régler le solde » apparaît à partir du 10 mai.
- Documents : Contrat de location PTL-00042 (PDF), Facture d'acompte F-2026-0031 (PDF), chacun avec un bouton « Télécharger ».
- Conditions d'annulation, résumées, avec un lien vers les conditions générales : « Votre contrat est signé et l'acompte versé : les conditions d'annulation du contrat MYBA s'appliquent. Parlez-en d'abord à votre courtier. »
- Lien « Une question sur cette réservation ? Écrire à Hélène » (e-mail prérempli avec la référence).

Variantes à montrer :
- En attente : bouton « Annuler ma demande ». Au clic, une boîte de dialogue au style du site (pas une alerte native) : « Annuler votre demande pour Tramontane ? Les dates seront libérées pour d'autres clients. », boutons « Garder ma demande » et « Annuler la demande », puis la confirmation.
- Refusée : le mot du courtier (« Le yacht est en arrêt technique à ces dates. Je vous propose Camarat à la place : … ») et « Voir d'autres yachts ».
- Expirée : « L'acompte n'a pas été réglé dans les 72 heures ; les dates ont été libérées. » et « Refaire une demande ».
```

## 3.3 · Mes documents

```
Avec le système de design Portolan, dessine l'onglet « Mes documents », sur ordinateur et téléphone : tous les documents du client, classés par réservation, de la plus récente à la plus ancienne.
- Pour chaque réservation : nom du yacht, dates, référence ; puis une ligne par document (icône PDF au trait, type, numéro, date, taille, bouton « Télécharger »).
- Types : Contrat de location, Facture d'acompte, Facture de solde, Reçu de l'avance sur frais (APA).
- Filtre par type, recherche par référence.
- Mention : « Vos documents restent disponibles ici aussi longtemps que votre compte existe. Les factures sont conservées 10 ans, comme la loi l'exige. »
- État vide : « Vos contrats et factures apparaîtront ici dès votre premier acompte. »
```

## 3.4 · Mon compte

```
Avec le système de design Portolan, dessine l'onglet « Mon compte », sur ordinateur et téléphone, en sections séparées par des filets :

1. Coordonnées : nom et prénom, téléphone, langue de correspondance (FR/EN/DE/IT : « Vos e-mails, contrats et factures seront rédigés dans cette langue »), bouton « Enregistrer », confirmation « Coordonnées enregistrées » en notification brève.
2. Adresse de facturation (facultative, utilisée sur les factures) : société (facultatif), adresse, code postal, ville, pays, n° de TVA (facultatif).
3. E-mail de connexion : adresse actuelle ; « Changer d'adresse » ouvre un champ, puis « Un lien de confirmation vient de partir à la nouvelle adresse. Votre adresse actuelle reste active en attendant. »
4. Mot de passe : mot de passe actuel, nouveau, confirmation.
5. Se déconnecter.
6. Zone sensible, en bas, très sobre : « Supprimer mon compte ». Boîte de dialogue de confirmation : « Vos données personnelles seront effacées. Les réservations et factures passées sont conservées de façon anonyme, comme la loi l'exige. Impossible si une croisière est à venir : parlez-en d'abord à votre courtier. » La suppression se confirme en tapant « SUPPRIMER ». Montre aussi l'état où la suppression est bloquée parce qu'une croisière est à venir.

États d'erreur sur les champs, chargement sur les boutons.
```
