# 06 · Lot 6 : documents PDF

Les documents sont générés automatiquement en PDF (A4) avec @react-pdf/renderer, dans la langue du client. Ils seront conservés dans Mon espace et envoyés par e-mail.

**À dessiner** : le contrat de location, la facture d'acompte, la facture de solde, le reçu de l'APA et la brochure de vente.

**Contraintes techniques** (à rappeler à Claude Design) :
- format A4 portrait, marges de 18 mm, polices Bodoni Moda et Hanken Grotesk intégrées ;
- pas d'effet impossible en PDF (pas de flou, pas de transparence complexe), couleurs à plat ;
- doit rester lisible en impression noir et blanc ;
- les pages se suivent avec un en-tête et un pied répétés (numéro « Page 2 sur 6 »).

Les textes juridiques sont des **modèles** à faire valider par un juriste et l'expert-comptable du vrai client.

---

## 6.1 · Contrat de location

```
Avec le système de design Portolan, dessine le contrat de location d'un yacht avec équipage, en PDF A4, sur plusieurs pages. Exemple : réservation PTL-00042, Mistral Blanc, Charlotte Delaunay.

PAGE DE GARDE : rose des vents, « Contrat de location de yacht avec équipage », « Mistral Blanc · du 10 au 17 juillet 2027 », référence PTL-00042, date d'émission, version du contrat v1.2. Photo du yacht en bandeau sobre.

PAGES SUIVANTES, articles numérotés, typographie de lecture :
1. Les parties : le courtier, Portolan SAS (capital de 150 000 €, RCS Fréjus 000 000 000, Quai Suffren, 83990 Saint-Tropez, TVA FR00 000000000), agissant pour le compte du propriétaire du yacht ; le locataire, Charlotte Delaunay (adresse de facturation, e-mail, téléphone).
2. Le yacht : nom, chantier, longueur, pavillon, port d'attache, capacité (12 invités), équipage (9).
3. La croisière : embarquement le samedi 10 juillet 2027 à 12:00 à Monaco, débarquement le samedi 17 juillet 2027 à Monaco, 7 nuits, 10 invités, zone de navigation (Méditerranée occidentale).
4. Le prix et l'échéancier, sous forme de tableau : location 215 000 € (dont TVA) ; acompte de 50 % : 107 500 €, réglé le 5 octobre 2026 ; solde de 50 % : 107 500 €, dû le 10 juin 2027 ; APA de 30 % : 64 500 €, due le 10 juin 2027. Ce qui est inclus (équipage, assurance du yacht) et ce qui est exclu (carburant, vivres, ports, communications : réglés par l'APA).
5. L'avance sur frais de croisière (APA) : fonctionnement, relevé des dépenses tenu par le capitaine, restitution du reliquat.
6. L'annulation : conditions inspirées du contrat MYBA (l'acompte reste acquis au propriétaire sauf relocation pour la même période, etc.).
7. Les obligations du locataire et du capitaine, la sécurité, la météo (décision du capitaine), les assurances.
8. Le droit applicable et les litiges.
9. Les conditions particulières (champ libre rédigé par le courtier, éventuellement vide).

DERNIÈRE PAGE, bloc d'acceptation :
« Contrat accepté électroniquement par Charlotte Delaunay (charlotte@exemple.com) le 3 octobre 2026 à 14:12 (heure de Paris), depuis l'adresse IP 203.0.113.42, version v1.2. Acompte reçu le 5 octobre 2026. La réservation est ferme. »
Ajoute un emplacement prévu pour une signature électronique future (Yousign, version 2), présent mais vide dans le MVP.

En-tête répété : « Portolan · Contrat PTL-00042 ». Pied : « Page X sur Y », mentions de la société.
Montre aussi la version allemande de la page de garde et d'une page d'articles, pour vérifier la longueur.
```

## 6.2 · Factures et reçu

```
Avec le système de design Portolan, dessine les factures en PDF A4 (une page). Elles doivent porter toutes les mentions obligatoires d'une facture française, dans une présentation élégante mais rigoureuse :

FACTURE D'ACOMPTE n° F-2026-0031 (numérotation continue, sans trou)
- En-tête : logo, raison sociale, adresse, RCS et SIRET, n° de TVA, téléphone, e-mail.
- « Facture d'acompte », numéro, date d'émission, date du paiement, référence de réservation PTL-00042.
- Client : nom, adresse de facturation, n° de TVA du client s'il en a un.
- Désignation : « Acompte de 50 % sur la location du yacht Mistral Blanc avec équipage, du 10 au 17 juillet 2027 (7 nuits), contrat PTL-00042 ».
- Tableau des montants : montant HT, taux de TVA, montant de TVA, montant TTC (107 500 €). Les montants de TVA sont provisoires et seront validés par l'expert-comptable.
- « Acquittée le 5 octobre 2026 par carte bancaire » (ou par virement).
- Mentions de bas de page : pénalités de retard, indemnité forfaitaire de recouvrement de 40 € pour les professionnels, absence d'escompte, rappel du contrat.

FACTURE DE SOLDE n° F-2027-0112
- Même structure, avec en plus le rappel de l'acompte déjà facturé (F-2026-0031) et la déduction : total de la location, acompte déjà réglé, solde dû.

REÇU DE L'AVANCE SUR FRAIS (APA)
- Ce n'est pas une facture : « Reçu de l'avance sur frais de croisière », 64 500 €, avec la mention « Somme gérée par le capitaine pour les frais de la croisière ; relevé des dépenses et restitution du reliquat en fin de croisière ».

Montre une version avec et une version sans n° de TVA du client.
```

## 6.3 · Brochure de vente

```
Avec le système de design Portolan, dessine la brochure PDF d'un yacht à vendre (exemple : Castellane), en A4 sur 6 à 8 pages, générée automatiquement à partir des données du yacht. Le gabarit doit donc fonctionner avec des longueurs de texte et un nombre de photos variables.

1. Couverture : photo plein cadre, « Castellane », « Heesen · 2022 · 50 m », « À vendre · 34 500 000 € », rose des vents, « Exclusivité Portolan » si c'est le cas.
2. Présentation : accroche en Bodoni, paragraphes, trois points forts.
3. Galerie : 2 à 3 pages de photos (mises en page qui s'adaptent selon qu'il y a 4 ou 12 photos), avec leurs légendes.
4. Plan de pont : la liste des ponts et leurs aménagements, dessinés comme sur la fiche.
5. Caractéristiques : le tableau technique complet.
6. Dernière page : « Visite à bord, historique complet, essai en mer », le courtier en charge (photo, nom, téléphone, e-mail), les deux bureaux, un QR code vers la fiche en ligne, et la mention « Document non contractuel, établi le 4 octobre 2026 ».
Montre aussi la couverture d'un yacht à la fois à vendre et à louer (Camarat), avec les deux prix.
```
