# 02 · Lot 2 : réservation, compte et paiement

Ce lot est entièrement nouveau ou profondément revu. Il dessine le cœur du MVP : le client réserve, crée son compte, paie et reçoit son contrat.

**Le parcours réel, à garder en tête :**
1. Le client choisit ses dates et envoie une **demande**. Elle bloque les dates 48 h.
2. Le courtier la **valide** sous 24 h, et le client reçoit un e-mail avec un lien de paiement.
3. Le client paie l'**acompte de 50 %** sous 72 h, par carte ou par virement.
4. Le **contrat** et la facture lui arrivent automatiquement par e-mail.
5. À **J-30**, le solde de 50 % et l'avance sur frais de croisière (APA, 30 %) sont demandés.

Le paiement lui-même se fait sur la page **Stripe Checkout**. Cette page appartient à Stripe : on ne la dessine pas, on la personnalise seulement avec notre logo et nos couleurs. Nous dessinons tout ce qui se passe avant et après.

**Montants d'exemple** (Mistral Blanc, haute saison à 215 000 €/semaine, basse saison à 185 000 €/semaine) :
- **Séjour 1**, du samedi 10 au samedi 17 juillet 2027, 7 nuits en haute saison :
  - location : 215 000 € ;
  - acompte (50 %) : 107 500 € ;
  - solde (50 %) : 107 500 €, dû le 10 juin 2027 ;
  - APA (30 %) : 64 500 € ;
  - total : 279 500 €.
- **Séjour 2**, du mercredi 30 juin au mercredi 7 juillet 2027, à cheval sur les deux saisons :
  - 3 nuits en basse saison : 79 290 € ;
  - 4 nuits en haute saison : 122 860 € ;
  - location : 202 150 €.
- La TVA est indiquée par une ligne « dont TVA » **provisoire**. Le traitement définitif sera validé avec l'expert-comptable.

---

## 2.1 · Module de réservation (sur la fiche)

```
Avec le système de design Portolan, dessine le module « Réserver en ligne » de la fiche Mistral Blanc, ouvert, sur ordinateur (dans la page, sur deux colonnes : calendrier à gauche, récapitulatif collant à droite) et sur téléphone (plein écran, en étapes, récapitulatif repliable en bas).

En-tête : « Location avec équipage » / « Réserver en ligne ». Rappel des tarifs : Basse saison 185 000 € la semaine · Haute saison, du 3 juillet au 4 septembre, 215 000 € la semaine.

ÉTAPE 1 · « Choisissez vos dates »
- Calendrier de la saison (avril à octobre 2027), deux mois visibles sur ordinateur et un sur téléphone, navigation entre les mois.
- Légende : Disponible, En option, Réservé, Haute saison, Votre séjour.
- Interaction : un premier clic fixe l'embarquement, un second le retour. Montre trois états :
  a) aucune date choisie, avec l'aide « Choisissez votre jour d'embarquement » ;
  b) embarquement choisi (sam. 10 juillet), jours de retour possibles mis en valeur, jours trop proches grisés avec le message « 7 nuits au moins en haute saison » ;
  c) séjour choisi (10 → 17 juillet), plage surlignée en laiton.
- Les dates sont mises à jour en direct : si un autre client vient de prendre une date, une notification brève apparaît : « Ces dates viennent d'être demandées par un autre client. Choisissez un autre séjour. »

ÉTAPE 2 · « Votre embarquement »
- Heure d'embarquement (liste de 10:00 à 18:00, par demi-heure, 12:00 par défaut).
- Port d'embarquement (Monaco, port d'attache, puis Saint-Tropez, Cannes, Saint-Raphaël).
- Nombre d'invités (compteur de 1 à 12).
- Vos souhaits (facultatif) : zone de texte, 2 000 caractères, avec un compteur.

ÉTAPE 3 · « Récapitulatif et conditions »
- Récapitulatif : yacht, dates (« Du samedi 10 au samedi 17 juillet 2027 · 7 nuits »), embarquement (« 12:00, Monaco »), invités.
- Détail du prix :
  · Location, équipage compris, 7 nuits en haute saison : 215 000 €
  · dont TVA : [montant provisoire]
  · Échéancier :
    – Acompte de 50 %, à régler sous 72 h après la validation par votre courtier : 107 500 €
    – Solde de 50 %, au plus tard le 10 juin 2027 : 107 500 €
    – Avance sur frais de croisière (APA) de 30 %, avec le solde : 64 500 €
      (carburant, vivres, ports : le capitaine vous rend le reliquat en fin de croisière)
  · Total : 279 500 €
- Variante à cheval sur deux saisons : 3 nuits en basse saison 79 290 € + 4 nuits en haute saison 122 860 €.
- Variante pour un départ dans moins de 30 jours : « Départ proche : la totalité (location et APA) est à régler sous 72 h après validation. »
- Case obligatoire : « J'ai lu et j'accepte le contrat de location et les conditions générales. », avec deux liens qui ouvrent les textes dans un panneau latéral (montre le panneau ouvert).
- Vérification anti-robot discrète.
- Bouton principal « Envoyer ma demande », et la mention : « Rien n'est débité maintenant. Votre courtier confirme sous 24 heures, puis vous recevez un lien pour régler l'acompte. Vos dates sont réservées pour vous pendant ce temps. »

CONFIRMATION (remplace le module)
- « Demande envoyée », référence « PTL-00042 ».
- « Merci Charlotte. Votre courtier confirme vos dates sous 24 heures, week-end compris. Vous recevrez alors un e-mail avec le lien pour régler l'acompte de 107 500 €. Un récapitulatif vient de partir à charlotte@exemple.com. »
- Frise en 5 étapes (Demande ✓, Validée, Acompte, Solde, Embarquement).
- Boutons « Suivre ma réservation » (vers Mon espace) et « Revenir à la fiche ».

ERREURS (un exemple de chaque, sous forme de message au bon endroit, sans boîte d'alerte native) :
- dates prises entre-temps ;
- séjour trop court (« 7 nuits au moins en haute saison ») ;
- départ trop proche (« Le départ doit être dans 2 jours au moins ») ;
- deux demandes déjà en attente (« Vous avez déjà deux demandes en attente. Votre courtier vous répond sous 24 heures ; vous pourrez en faire une nouvelle ensuite. ») ;
- connexion perdue.

Si le visiteur n'est pas connecté, le bouton « Envoyer ma demande » ouvre la fenêtre de connexion (écran 2.2). Ses choix sont conservés et la demande part dès qu'il est connecté.
```

## 2.2 · Fenêtre de connexion et de création de compte

```
Avec le système de design Portolan, dessine la fenêtre de compte client : une boîte de dialogue sur ordinateur, un plein écran sur téléphone. Elle s'ouvre par-dessus la fiche, quand on réserve sans être connecté, ou depuis « Mon espace ».

Contexte affiché en haut quand elle vient d'une réservation : « Pour envoyer votre demande pour Mistral Blanc (10 → 17 juillet), connectez-vous ou créez votre compte en une minute. Vos choix sont conservés. »

Deux onglets :
1. « J'ai un compte » : e-mail, mot de passe (avec bouton afficher / masquer), lien « Mot de passe oublié ? », bouton « Me connecter ».
2. « Créer mon compte » : nom et prénom, e-mail, téléphone (facultatif, « pour que votre courtier puisse vous appeler »), mot de passe (8 caractères au moins, avec un indicateur discret), langue de correspondance (FR/EN/DE/IT, présélectionnée selon la page), case « J'accepte les conditions générales et la politique de confidentialité », vérification anti-robot, bouton « Créer mon compte ».

États à dessiner :
- erreurs : identifiants incorrects, e-mail déjà utilisé, mot de passe trop court, champ manquant ;
- chargement sur le bouton ;
- « Vérifiez votre e-mail » après la création : « Nous venons d'écrire à charlotte@exemple.com. Ouvrez le lien pour confirmer votre adresse : votre demande pour Mistral Blanc partira automatiquement. », avec « Renvoyer l'e-mail » (disponible après 60 s) et « Modifier l'adresse » ;
- « E-mail non confirmé » au moment de la connexion, avec « Renvoyer le lien » ;
- mot de passe oublié : saisie de l'e-mail → « Si un compte existe pour cette adresse, un lien vient de partir. » ;
- page « Choisir un nouveau mot de passe » (après le lien reçu par e-mail) : nouveau mot de passe, confirmation, puis succès ;
- page d'atterrissage après la confirmation de l'e-mail : « Adresse confirmée. Votre demande pour Mistral Blanc est envoyée : référence PTL-00042. », puis les mêmes éléments que la confirmation de l'écran 2.1.
```

## 2.3 · Régler l'acompte (ou le solde)

```
Avec le système de design Portolan, dessine la page « Régler l'acompte », sur ordinateur et téléphone. Le client y arrive depuis le lien de l'e-mail « Votre demande est validée » ou depuis Mon espace. Elle demande d'être connecté.

- Surtitre « Réservation PTL-00042 », titre « Régler l'acompte ».
- Photo de Mistral Blanc, dates, embarquement, invités.
- Mot du courtier, s'il en a laissé un (« Le capitaine vous propose une première escale aux îles de Lérins. À très vite, Hélène »).
- Compte à rebours sobre : « Vos dates vous sont réservées jusqu'au mardi 6 octobre à 18:40 (encore 71 heures). »
- Montant dû : « Acompte de 50 % : 107 500 € », et le rappel de l'échéancier (solde et APA à venir, avec leurs dates).
- Choix du moyen de paiement, en deux cartes de choix, expliquées simplement :
  · « Carte bancaire » : « Immédiat. Votre contrat vous est envoyé dans la minute. Vérifiez auprès de votre banque que votre plafond permet ce montant. »
  · « Virement bancaire » : « Recommandé pour les montants importants. Vous recevez un IBAN à votre nom ; le contrat part dès réception des fonds, en général sous 1 à 2 jours ouvrés. »
- Bouton « Payer 107 500 € » (redirection vers la page de paiement sécurisée Stripe), avec la mention « Paiement sécurisé par Stripe. Portolan ne voit jamais vos coordonnées bancaires. »
- Lien « Une question ? Écrire à mon courtier ».

Variante « Régler le solde » : « Solde de 50 % : 107 500 € » + « Avance sur frais de croisière (30 %) : 64 500 € » = « 172 000 € », échéance « avant le 10 juin 2027 ».

États :
- lien expiré (option dépassée) : « Ce délai est passé et les dates ont été libérées. Elles sont peut-être encore disponibles : » + bouton « Refaire une demande » ;
- déjà payé : « Cet acompte est réglé. Merci. » + lien vers les documents ;
- réservation annulée ou refusée.
```

## 2.4 · Retour de paiement

```
Avec le système de design Portolan, dessine les pages où le client revient après la page Stripe, sur ordinateur et téléphone :

1. PAIEMENT PAR CARTE RÉUSSI : « Acompte reçu. », « Votre réservation de Mistral Blanc du 10 au 17 juillet 2027 est confirmée. Votre contrat de location et votre facture viennent de partir à charlotte@exemple.com ; ils sont aussi dans votre espace. », frise (Demande ✓, Validée ✓, Acompte ✓, Solde, Embarquement), prochaine étape « Solde et APA, 172 000 €, avant le 10 juin 2027 : nous vous l'écrirons un mois avant. », boutons « Télécharger mon contrat » et « Mon espace ». Une touche de fête, mais sobre : par exemple la rose des vents qui pivote lentement.
2. VIREMENT EN ATTENTE : « Plus qu'un virement. », bloc des coordonnées à copier (bénéficiaire, IBAN, BIC, référence obligatoire, montant exact : 107 500,00 €), chaque ligne avec un bouton « Copier ». Texte : « Le contrat part automatiquement dès réception des fonds, en général sous 1 à 2 jours ouvrés. Ces coordonnées vous ont aussi été envoyées par e-mail. » Rappel : vos dates restent réservées jusqu'au 6 octobre à 18:40.
3. PAIEMENT ABANDONNÉ OU REFUSÉ : « Le paiement n'a pas abouti. », causes possibles (plafond de la carte, authentification refusée), « Vos dates restent réservées jusqu'au… », boutons « Réessayer » et « Payer par virement plutôt ».
4. EN COURS DE VÉRIFICATION (quelques secondes, le temps que Stripe confirme) : « Nous vérifions votre paiement… », animation lente, puis passage automatique à l'état 1.

Donne aussi la PERSONNALISATION de la page Stripe Checkout, telle qu'on peut la régler chez Stripe : logo, couleur d'accent (laiton), fond, police proche, nom affiché « Portolan, courtier en yachts ». Rien d'autre n'est modifiable sur cette page.
```
