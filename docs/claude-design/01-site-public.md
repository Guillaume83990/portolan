# 01 · Lot 1 : site public

Un prompt par écran, à coller dans l'ordre, après la validation du système de design. Chaque prompt commence par la même phrase de rappel, pour que Claude Design reste dans le système.

Le site actuel sert de référence pour la mise en page : `https://portolan.sudwebproject.com/fr/…`. On garde ce qui marche et on corrige ce que le MVP change, signalé par **[MVP]** dans les prompts.

---

## 1.1 · Accueil

```
Avec le système de design Portolan validé, dessine la page d'accueil, sur ordinateur (1440 px) et téléphone (390 px). Référence : https://portolan.sudwebproject.com/fr/

Sections, dans l'ordre :

1. EN-TÊTE transparent sur l'ouverture, qui devient opaque (abysse) au défilement.

2. OUVERTURE « LA VISITE » (plein écran, sombre). Une visite continue du yacht Camarat, pilotée au défilement : une carte marine ancienne s'ouvre en brûlant depuis le yacht et révèle la mer, puis la caméra monte à bord. Dessine trois états clés de cette séquence (début sur la carte, milieu à bord, fin) avec leurs textes en surimpression :
   - instruments en haut : « Cap 128° », « Position 43°13′ N · 6°40′ E », « Altitude 300 m », compteur « I / IV » ;
   - surtitre « Courtier en yachts sur la Côte d'Azur », titre H1 « Yachts à vendre et à louer, de Saint-Tropez à Monaco », phrase « Chaque traversée commence sur une carte. Faites défiler pour embarquer. » ;
   - exemple d'étape : légende « Le salon, 62 m² », titre « Noyer, travertin, velours », texte « Les baies toute hauteur s'ouvrent sur la mer des deux côtés. » ;
   - étape finale : « Camarat · 50 m · livré en 2024 », titre « Ce yacht peut être le vôtre », texte « À vendre, 42 000 000 €. Ou à louer à la semaine, dès 240 000 €, avec son équipage. Visite à Saint-Tropez sur rendez-vous. », boutons « Acheter ce yacht », « Le louer une semaine », « Voir toute la flotte » ;
   - repères de progression à droite : La carte, L'approche, À bord, Le salon, La suite, Le pont supérieur ; indication « Faire défiler » ; lien d'évitement « Passer la visite et aller à la flotte ».

3. LA MAISON (clair). Surtitre « La maison ». Grande citation en Bodoni : « Un yacht se choisit comme une maison : à la lumière, au silence, et aux gens qui le font vivre. » Texte : « Depuis Saint-Tropez et Monaco, Portolan accompagne l'achat, la vente et la location de yachts de 20 à 70 mètres. Nous montons à bord avant vous, nous connaissons les capitaines par leur prénom, et nous ne vous montrons que ce que nous aurions choisi nous-mêmes. » Lien « Notre méthode ». Photo : Camarat au mouillage devant Pampelonne.

4. LA FLOTTE (sombre). Surtitre « Sélection de la semaine », titre « La flotte ». Carrousel horizontal des yachts **mis en avant par le directeur** [MVP : la liste vient de la base, de 3 à 8 yachts]. Carte : numéro et chantier (« 01 · Exclusivité Portolan »), nom, « 2024 · 50 m · 12 invités · 9 membres d'équipage », prix (« À vendre, 42 000 000 € · location dès 240 000 € la semaine »), actions « Voir la fiche » et « Demander le dossier ». Compteur « 01 / 06 ». Données d'exemple :
   - Camarat, Exclusivité Portolan, 2024, 50 m, 12 invités, à vendre 42 000 000 € et à louer dès 240 000 €/semaine
   - Castellane, Heesen, 2022, 50 m, 12 invités, à vendre 34 500 000 €
   - Mistral Blanc, Benetti, 2019, 44,5 m, 12 invités, à louer dès 185 000 €/semaine
   - Solenne, Perini Navi, 2012, 38 m, voilier, 8 invités, à louer dès 72 000 €/semaine
   - Tramontane, Custom Line, 2018, 33 m, 10 invités, à louer dès 95 000 €/semaine
   - Alizé, Sanlorenzo, 2021, 29,2 m, 10 invités, à vendre 7 900 000 €
   Encart « Hors marché » : titre « Un tiers de nos ventes ne sont jamais annoncées. » [MVP, nouveau texte] « Laissez-nous votre e-mail : nous vous écrivons, en confidence, dès qu'un yacht qui vous ressemble change de mains, avant sa mise en ligne. » Champ « Votre e-mail », bouton « Être prévenu ». États : envoi en cours, confirmation (« C'est noté. Nous vous écrirons. »), erreur.

5. ACHETER / LOUER : deux grands blocs côte à côte avec photo.
   - « Vente et recherche » / « Acheter » : « Nous cherchons le bateau avant qu'il ne soit annoncé. Visites, expertise, essai en mer, négociation et pavillon : vous n'avez qu'un interlocuteur, de Saint-Tropez à Monaco. » → « Acheter avec Portolan »
   - « Location avec équipage » / « Louer » : « Une semaine entre les îles de Lérins et la baie de Pampelonne, un équipage choisi, un itinéraire tracé avec le capitaine selon le vent du jour. » → « Louer avec Portolan »

6. MÉTHODE : « Notre méthode » / « Quatre temps, un seul interlocuteur », lien « Toute notre méthode ». Quatre étapes numérotées avec photo :
   - 01 L'écoute : « Un premier rendez-vous, à Saint-Tropez, à Monaco ou chez vous. Votre façon de naviguer, vos invités, vos saisons. »
   - 02 La sélection : « Nous visitons chaque yacht avant de vous le proposer. Trois bateaux plutôt que trente. »
   - 03 L'essai en mer : « Une sortie avec le capitaine, entre Pampelonne et les îles d'Hyères, pour juger le bateau là où il vivra. »
   - 04 La remise des clés : « Expertise, négociation, pavillon, équipage : nous suivons tout jusqu'au premier départ, et après. »

7. CHIFFRES (bandeau) : « 40 yachts suivis chaque semaine, de 20 à 70 mètres » · « 60 milles de côte entre nos deux bureaux » · « 24 h pour une première réponse, week-end compris » · « 4 langues au bureau et à bord ». Puis un défilé lent de noms de lieux : Saint-Tropez, Pampelonne, Porquerolles, Saint-Raphaël, Cannes, Îles de Lérins, Antibes, Villefranche, Monaco.

8. NOS EAUX : « De Saint-Tropez à Monaco », « Soixante milles de côte, deux bureaux, et les meilleurs mouillages entre les deux. » Carte marine stylisée de la côte avec les escales (Saint-Tropez bureau, Sainte-Maxime, Saint-Raphaël, Cannes, Antibes, Nice, Villefranche, Monaco bureau) et un compteur de milles.

9. CITATION : « Ils nous ont présenté trois bateaux. Nous avons acheté le deuxième, et nous n'avons jamais eu à rappeler qui que ce soit. » Propriétaire de Mistral Blanc, Monaco.

10. CONTACT (sombre) : « Parlons de votre prochain yacht », « Trois questions, deux minutes. Un courtier vous rappelle sous 24 heures, avec une première sélection. » Garanties : « Réponse d'un courtier, jamais d'un robot », « Discrétion totale, aucune donnée revendue », « En français, anglais, allemand ou italien ». Lien « Écrire à un courtier sur WhatsApp ».
    Formulaire en 3 étapes, avec indicateur « 1 / 3 · Votre projet » :
    - étape 1 « Que souhaitez-vous faire ? » : cartes de choix Acheter (« Un yacht à moteur ou un voilier »), Louer (« Une semaine avec équipage »), Vendre (« Votre yacht, en toute discrétion ») ;
    - étape 2 « Vos critères », qui change selon le choix : taille (20 à 30 m, 30 à 45 m, 45 à 70 m, À définir), budget (Moins de 5 M€, 5 à 15 M€, 15 à 40 M€, Plus de 40 M€), période (Mai-juin, Juillet, Août, Septembre), invités (Jusqu'à 6, 8 à 10, 12), échéance (Cette saison, Dans l'année, Sans urgence). Pour « Vendre » : nom du yacht, port d'attache ;
    - étape 3 « Comment vous joindre ? » : nom, e-mail, téléphone (facultatif), langue, « Être recontacté par téléphone / e-mail / WhatsApp », consentement « J'accepte que Portolan utilise ces informations pour me recontacter au sujet de mon projet. », vérification anti-robot discrète [MVP] ;
    - confirmation : « Demande reçue. Merci {prénom}. Un courtier vous recontacte sous 24 heures. Un e-mail de confirmation vient de vous être envoyé. » [MVP, l'e-mail existe désormais].
    Puis les deux bureaux (Saint-Tropez « sur le quai », Monaco) avec photo, adresse, téléphone.

11. PIED DE PAGE.
    [MVP] Pastille discrète en bas à gauche « Projet de démonstration · SudWebProject », visible seulement en mode démonstration : dessine la page avec et sans.
```

## 1.2 · La flotte

```
Avec le système de design Portolan, dessine la page « La flotte », sur ordinateur et téléphone. Référence : https://portolan.sudwebproject.com/fr/flotte/

- Fil d'Ariane « Accueil / La flotte », surtitre « Saison 2027 », H1 « La flotte », chapeau « Six yachts que nous avons visités, essayés et choisis, de 29,2 à 50 mètres, entre Saint-Tropez et Monaco. » Compteurs : « 3 à vendre », « 4 à louer », « jusqu'à 12 invités ». [MVP : ces chiffres viennent de la base.]
- Filtres : Tous, À vendre, À louer, Voiliers, Plus de 40 m. Compteur « 6 yachts ». Bascule d'affichage « Planches » / « Registre ».
- Vue PLANCHES : grandes cartes alternées, photo et texte. Exemple Camarat : « 01 · Exclusivité Portolan », « Camarat », accroche « Cinquante mètres de noyer, de travertin et de lumière, livrés en 2024. », données Longueur 50 m · Année 2024 · Invités 12 · Cabines 6 · Croisière 13 nœuds, prix « À vendre, 42 000 000 € · À louer dès 240 000 € la semaine », actions « Voir la fiche », « Demander le dossier ». Castellane : « Une coque bleu nuit, rapide et silencieuse, pensée pour les traversées. » (reprendre les 6 yachts de l'accueil).
- Vue REGISTRE : un tableau façon registre maritime (n°, nom, chantier, année, longueur, invités, vente, location). Au survol d'une ligne, un aperçu photo suit la souris (sur ordinateur).
- États : filtre sans résultat (« Aucun voilier à vendre en ce moment. Nous en suivons hors marché : parlons-en. » + lien contact), chargement.
```

## 1.3 · Fiche d'un yacht à louer (Mistral Blanc)

```
Avec le système de design Portolan, dessine la fiche du yacht Mistral Blanc, à louer, sur ordinateur et téléphone. Référence : https://portolan.sudwebproject.com/fr/flotte/mistral-blanc/
Le module de réservation fait l'objet d'un écran séparé (lot 2) : ici, montre-le fermé, à sa place, avec seulement les tarifs et le bouton d'accès.

1. OUVERTURE plein écran (photo à quai à Port Hercule, heure bleue) : badge « À louer », H1 « Mistral Blanc », accroche « L'élégance italienne, à quai à Monaco, prête à appareiller. », données Longueur 44,5 m · Chantier Benetti · Année 2019 · Invités 12 · Cabines 6 · Équipage 9.
2. PRÉSENTATION : « 03 · Benetti », « Présentation de Mistral Blanc », deux paragraphes :
   « Mistral Blanc a été livré à Livourne et entièrement rafraîchi en 2024 : laque blanche, frêne clair, cuir ivoire et touches d'or pâle. Tout y est lumineux, jusqu'au grand salon du pont principal. »
   « Basé à Monaco, il part volontiers vers Portofino ou la Corse. Son chef a travaillé dix ans dans des maisons étoilées de la Riviera ; la table se dresse sur le pont arrière, face au port qui s'illumine. »
   Trois points forts : Table (« Un chef formé dans les maisons étoilées de la Riviera »), Refit 2024 (« Intérieurs, literie et équipements audiovisuels renouvelés »), Au départ de Monaco (« Portofino, la Corse ou les îles de Lérins en une journée »).
3. VISITE À BORD : « Monter à bord de Mistral Blanc », « Six étapes, du quai de Monaco au pont soleil, à l'heure bleue. Un seul mouvement de caméra, que vous guidez en faisant défiler. », grande affiche et bouton « Monter à bord ». Dessine aussi la visite ouverte en plein écran : image, légende de l'étape, barre de progression, bouton fermer, aide « molette, doigt ou flèches ».
4. GALERIE « 5 vues de Mistral Blanc », filtres par pont (Tout, Extérieur, Pont principal, Pont supérieur, Pont soleil), compteur « 01 / 05 », flèches. Dessine aussi la visionneuse plein écran avec la légende de chaque photo (ex. « Le grand salon de Mistral Blanc : laque blanche, cuir ivoire et or pâle, face au port de Monaco »).
5. BROCHURE : « Mistral Blanc, en vingt pages. », « Plans, inventaire, historique d'entretien et photographies en haute définition. Envoyée par e-mail, en toute discrétion. », champ e-mail, bouton « Recevoir la brochure ». [MVP : la brochure PDF part vraiment] Confirmation : « La brochure de Mistral Blanc est partie. Vérifiez votre boîte de réception d'ici quelques minutes. »
6. PLAN DE PONT : « 4 niveaux, 12 invités », un plan stylisé par pont : Pont soleil (Jacuzzi, bains de soleil, bar), Pont supérieur (Salon du ciel, salle à manger d'extérieur), Pont principal (Salon, salle à manger, suite du propriétaire), Pont inférieur (2 VIP, 2 doubles, 1 twin).
7. CARACTÉRISTIQUES, en tableau : Chantier Benetti · Année 2019, refit 2024 · Longueur 44,5 m · Largeur 8,6 m · Tirant d'eau 2,5 m · Coque Acier et aluminium · Architecture Giorgio M. Cassetta · Invités 12 · Cabines « 6 cabines : suite du propriétaire, 2 VIP, 2 doubles, 1 twin » · Équipage 9 · Vitesse « 12 nœuds en croisière, 15 en pointe » · Autonomie 3 500 milles · Motorisation 2 × Caterpillar C32 · Stabilité « À ailerons, actifs au mouillage » · Pavillon Monaco · Port d'attache Monaco.
8. RÉSERVER EN LIGNE (fermé) : « Location avec équipage » / « Réserver en ligne », tarifs « Basse saison 185 000 € la semaine » et « Haute saison, 3 juillet au 4 septembre, 215 000 € la semaine », conditions résumées : « Embarquement le jour et à l'heure de votre choix, à Monaco ou dans un autre port de la Riviera. 7 nuits au moins en haute saison, 3 en basse saison. Frais de croisière (carburant, vivres, ports) réglés par une avance de 30 %. » Bouton « Choisir mes dates ».
9. VOTRE DEMANDE : « Parlons de Mistral Blanc », choix Recevoir le dossier / Organiser une visite / Poser une question, nom, e-mail, téléphone (facultatif), langue, message (facultatif), consentement, anti-robot, « Envoyer ma demande ». Confirmation avec mention de l'e-mail envoyé.
10. BARRE COLLANTE : sur ordinateur, colonne à droite qui suit le défilement (« Mistral Blanc · 44,5 m · 2019 · 12 invités · À louer, la semaine dès 185 000 € », actions « Réserver en ligne », « Organiser une visite », « Monter à bord », « Réponse d'un courtier sous 24 heures, week-end compris. »). Sur téléphone, une barre en bas de l'écran avec le prix et « Réserver ».
11. « Continuer la visite » : trois autres yachts de la flotte.
```

## 1.4 · Fiche d'un yacht à vendre (Castellane)

```
Avec le système de design Portolan, dessine la fiche du yacht Castellane, à vendre, sur ordinateur et téléphone, en reprenant la structure de la fiche Mistral Blanc, sans module de réservation. Référence : https://portolan.sudwebproject.com/fr/flotte/castellane/

Différences :
- badge « À vendre », accroche « Une coque bleu nuit, rapide et silencieuse, pensée pour les traversées. », Heesen, 2022, 50 m, 12 invités, 6 cabines, 10 membres d'équipage ;
- caractéristiques : Largeur 9,2 m · Tirant d'eau 2,4 m · Coque Aluminium · Architecture Frank Laupman, Omega Architects · Cabines « 6 cabines : suite du propriétaire, 3 VIP, 2 twins » · Vitesse « 14 nœuds en croisière, 17 en pointe » · Autonomie 3 800 milles · Motorisation 2 × MTU 16V 2000 M96L · Stabilité Gyroscopiques · Pavillon Îles Caïmans · Port d'attache Cannes ;
- à la place de la réservation, un bloc « À vendre » avec le prix en grand, « 34 500 000 € », et trois engagements : Visite à bord (« À Cannes, sur rendez-vous, en présence du capitaine. »), Historique complet (« Entretien, classification et inventaire, transmis avec le dossier. »), Essai en mer (« Une sortie avant l'offre, pour juger le bateau là où il vivra. ») ;
- formulaire « Parlons de Castellane » : Recevoir le dossier / Organiser une visite ;
- barre collante : « Castellane · 34 500 000 € », « Demander le dossier », « Organiser une visite ».
Montre aussi le cas d'un yacht à la fois à vendre et à louer (Camarat) : les deux blocs se suivent, et la barre collante propose « Réserver » et « Demander le dossier ».
```

## 1.5 · Pages Acheter, Louer, Méthode, Nos eaux, Contact

```
Avec le système de design Portolan, dessine les pages suivantes sur ordinateur et téléphone, en reprenant les textes et la structure des pages actuelles (liens ci-dessous) et en les harmonisant avec l'accueil et les fiches :

- Acheter : https://portolan.sudwebproject.com/fr/acheter/ : ouverture plein écran, manifeste, étapes à image collée (cahier des charges, recherche, visites, expertise, offre, pavillon, premier départ), calculateur du coût annuel d'un yacht, vendre avec Portolan, questions fréquentes, formulaire.
- Louer : https://portolan.sudwebproject.com/fr/louer/ : ouverture, escales (Pampelonne, Port-Cros…), étapes (demande, option, contrat, préparation, embarquement), estimateur de budget de location, yachts à louer (depuis la base), questions fréquentes, formulaire.
  [MVP] Les étapes doivent décrire le vrai parcours : 1. Demande en ligne, 2. Validation par le courtier sous 24 h, 3. Acompte de 50 % par carte ou virement, sous 72 h, 4. Contrat envoyé par e-mail, 5. Solde et avance sur frais (30 %) un mois avant le départ, 6. Embarquement.
- Méthode : https://portolan.sudwebproject.com/fr/methode/ : les quatre temps en détail, le carnet de visite (40 points), les engagements, les deux bureaux, les questions fréquentes, la prise de rendez-vous.
- Nos eaux : https://portolan.sudwebproject.com/fr/nos-eaux/ : carte marine de la côte avec dix mouillages placés à leurs vraies coordonnées, les vents, les saisons, le mouillage responsable.
- Contact : https://portolan.sudwebproject.com/fr/contact/ : trois façons de nous joindre (téléphone, WhatsApp, formulaire), le formulaire, les deux bureaux, les autres demandes (presse, partenaires).
```

## 1.6 · Pages légales et page 404

```
Avec le système de design Portolan, dessine :
1. Un gabarit de page légale, pour les mentions légales, la confidentialité et les cookies, et les conditions générales : sommaire collant à gauche sur ordinateur et replié sur téléphone, articles numérotés, date de mise à jour, typographie de lecture confortable (68 caractères par ligne au plus). Exemple : https://portolan.sudwebproject.com/fr/conditions/
2. Une page 404 dans l'esprit maison : fond de carte marine, titre « Ce mouillage n'est pas sur nos cartes. », lien vers la flotte et vers l'accueil. Utilisée aussi quand un yacht a été retiré de la vente.
```

Il n'y a pas de bandeau cookies : le site ne pose aucun traceur, seulement la session de connexion, qui est strictement nécessaire. Si le client ajoute un outil de mesure d'audience, on en dessinera un.
