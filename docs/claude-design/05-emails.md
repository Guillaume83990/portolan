# 05 · Lot 5 : e-mails automatiques

Tous les e-mails partent automatiquement, dans la langue du client (FR, EN, DE ou IT). Ils seront codés avec React Email : le design doit tenir dans les contraintes des clients de messagerie, à savoir Gmail, Outlook, Apple Mail et le mode sombre.

On dessine **le gabarit et chaque e-mail en français**, et un exemple en allemand pour vérifier la longueur.

---

## 5.1 · Gabarit commun

```
Avec le système de design Portolan, dessine le gabarit des e-mails automatiques, en version ordinateur (600 px de large) et téléphone, en clair et tel qu'il apparaît en mode sombre.

Contraintes techniques à respecter (l'e-mail sera codé ensuite) :
- une seule colonne de 600 px au plus, mise en page simple en blocs empilés ;
- polices : Bodoni Moda et Hanken Grotesk si le client les charge, sinon Georgia et Arial (prévois le rendu de secours, notamment dans Outlook) ;
- pas d'image de fond indispensable à la lecture ; boutons en vrais blocs de couleur (laiton), pas en images ;
- photo du yacht de 600 × 300 px au plus, avec un texte alternatif ;
- le texte reste lisible si les images sont bloquées.

Structure :
1. En-tête : rose des vents et « Portolan » sur fond abysse, filet laiton.
2. Photo du yacht concerné (facultative selon l'e-mail).
3. Surtitre (ex. « Réservation PTL-00042 »), titre en Bodoni, texte, encadré récapitulatif (lignes clé : valeur), bouton principal, lien secondaire.
4. Bloc « Votre courtier » : photo ronde, nom, téléphone, WhatsApp, « Répondez simplement à cet e-mail ».
5. Pied : « Portolan · Quai Suffren, Saint-Tropez · Quai Antoine Ier, Monaco », liens vers Mon espace et les conditions, mention « E-mail lié à votre réservation : vous le recevez même sans inscription à nos actualités ».
```

## 5.2 · E-mails au client

```
Avec le gabarit e-mail Portolan, dessine les e-mails suivants, en français (exemple : Charlotte Delaunay, Mistral Blanc, du 10 au 17 juillet 2027, PTL-00042). Pour chacun : objet, texte d'aperçu, contenu.

1. DEMANDE REÇUE
   Objet : « Votre demande pour Mistral Blanc est bien arrivée »
   « Bonjour Charlotte, votre demande est entre les mains d'Hélène, votre courtière. Elle vérifie les disponibilités de l'équipage et vous répond sous 24 heures, week-end compris. Vos dates vous sont réservées pendant ce temps. » Récapitulatif (yacht, dates, embarquement, invités, montant de la location, échéancier prévu). Bouton « Suivre ma réservation ».

2. DEMANDE VALIDÉE, LIEN DE PAIEMENT
   Objet : « Mistral Blanc vous attend : réglez l'acompte pour confirmer »
   Mot de la courtière en italique. « Pour confirmer votre croisière, réglez l'acompte de 107 500 € avant le mardi 6 octobre à 18:40. Par carte, le contrat vous parvient dans la minute ; par virement, dès réception des fonds. » Bouton « Régler l'acompte ». Rappel de l'échéancier complet.

3. RELANCE DE PAIEMENT (24 h avant l'échéance)
   Objet : « Plus que 24 heures pour confirmer Mistral Blanc »
   Ton bienveillant, pas pressant. Bouton « Régler l'acompte ». « Un empêchement, un plafond de carte ? Répondez à cet e-mail, Hélène trouvera une solution. »

4. OPTION EXPIRÉE
   Objet : « Vos dates sur Mistral Blanc ont été libérées »
   « L'acompte n'a pas été réglé dans le délai prévu : nous avons libéré les dates. Si votre projet tient toujours, elles sont peut-être encore disponibles. » Bouton « Refaire une demande ».

5. DEMANDE REFUSÉE
   Objet : « Votre demande pour Mistral Blanc »
   Mot de la courtière avec le motif et, si possible, une alternative (« Je vous propose Camarat, aux mêmes dates : … »). Bouton « Voir les yachts disponibles ». Aucun ton administratif.

6. ACOMPTE REÇU, CONTRAT ET FACTURE
   Objet : « C'est confirmé : Mistral Blanc, du 10 au 17 juillet 2027 »
   Le plus soigné de tous : grande photo, « Votre croisière est confirmée. » Pièces jointes : contrat de location (PDF) et facture d'acompte (PDF), également listées dans le corps de l'e-mail avec un lien vers Mon espace. Échéancier restant : « Solde et APA, 172 000 €, avant le 10 juin 2027 : nous vous l'écrirons un mois avant. » Prochaines étapes : préférences de bord (régimes, boissons, activités), puis itinéraire avec le capitaine.

7. VIREMENT : COORDONNÉES BANCAIRES (si le client choisit le virement)
   Objet : « Coordonnées pour votre virement, réservation PTL-00042 »
   Bloc des coordonnées très lisible (bénéficiaire, IBAN, BIC, référence obligatoire, montant exact), avec la consigne d'indiquer la référence. « Le contrat part automatiquement dès réception. »

8. APPEL DU SOLDE (J-30)
   Objet : « Dans un mois, Mistral Blanc : solde et avance sur frais »
   « Votre embarquement approche. » Solde 107 500 € + APA 64 500 € = 172 000 €, avant le 10 juin 2027. Explication courte de l'APA (« carburant, vivres, ports : le capitaine tient les comptes à bord et vous rend le reliquat »). Bouton « Régler le solde ».

9. SOLDE REÇU
   Objet : « Tout est réglé pour Mistral Blanc »
   Facture de solde jointe. « Le capitaine vous écrira quelques jours avant le départ pour préparer l'itinéraire. »

10. INFORMATIONS D'EMBARQUEMENT (J-3)
    Objet : « Samedi, 12:00, Monaco : on vous attend à bord »
    Lieu précis (quai, plan, lien de carte), heure, contact du capitaine (nom, téléphone), conseils (chaussures à semelle claire, bagages souples), météo prévue, contact d'urgence de Portolan. Pas de montant.

11. ANNULATION ET REMBOURSEMENT
    Objet : « Annulation de votre réservation PTL-00042 »
    Motif, montant remboursé et délai (« sous 5 à 10 jours ouvrés, sur le moyen de paiement utilisé »), ou l'absence de remboursement avec le rappel des conditions. Ton sobre et humain.

12. ACCUSÉ DE RÉCEPTION D'UN FORMULAIRE (contact, dossier, visite)
    Objet : « Bien reçu : un courtier vous répond sous 24 heures »
    Rappel de la demande, nom du courtier qui s'en occupe.

13. BROCHURE
    Objet : « La brochure de Castellane »
    Photo, trois lignes de présentation, brochure PDF en pièce jointe et bouton « Voir la fiche en ligne », puis « Organiser une visite ».

14. HORS MARCHÉ : CONFIRMATION D'INSCRIPTION
    Objet : « C'est noté, en toute confidence »
    « Nous vous écrirons dès qu'un yacht qui vous ressemble change de mains, avant sa mise en ligne. Jamais plus d'un e-mail par mois. » Lien de désinscription.
```

## 5.3 · E-mails au directeur

```
Avec le gabarit e-mail Portolan, en version « interne » plus dense (sans grande photo, avec un récapitulatif complet et un bouton vers l'espace directeur), dessine :
1. Nouvelle demande de réservation : « Nouvelle demande · Tramontane · 2 → 6 juin · Charlotte Delaunay », tous les détails, boutons « Valider » et « Ouvrir » (qui renvoient tous deux vers l'espace directeur), avec le rappel « Expire automatiquement dans 48 h sans réponse ».
2. Demande non traitée depuis 24 h : rappel avec le compte à rebours.
3. Paiement reçu : « Acompte reçu · 107 500 € · PTL-00042 (carte) », avec la mention que le contrat est parti au client.
4. Nouveau formulaire : type, yacht, coordonnées, réponses du formulaire.
```

## 5.4 · E-mails de compte (envoyés par l'authentification)

```
Avec le gabarit e-mail Portolan, dessine les trois e-mails de compte. Ils sont très courts, avec un seul bouton, et mentionnent « Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail » :
1. Confirmer votre adresse : « Bienvenue chez Portolan », bouton « Confirmer mon adresse ». Si une réservation attend, le préciser : « Votre demande pour Mistral Blanc partira dès la confirmation. »
2. Réinitialiser votre mot de passe : bouton « Choisir un nouveau mot de passe », lien valable 1 heure.
3. Confirmer votre nouvelle adresse e-mail.
Montre aussi la version allemande du premier, pour vérifier la longueur.
```
