# 00 · Système de design

À coller en premier, après avoir donné à Claude Design le lien du site, les captures et, si possible, `css/main.css` et les polices.

```
Tu conçois le système de design de Portolan, courtier en yachts de luxe entre Saint-Tropez et Monaco : vente de yachts de 20 à 70 mètres (7 à 42 millions d'euros) et location à la semaine avec équipage (de 72 000 à 240 000 € la semaine). Clientèle internationale très aisée, en français, anglais, allemand et italien.

Le site existe déjà et son identité est validée : pars-en, ne la réinvente pas. Je te l'ai jointe (lien, captures, feuille de style).

IDENTITÉ À RESPECTER
- Couleurs :
  · abysse #0B1513 (fond sombre principal, encre du texte sur fond clair)
  · pin #16302A (fond sombre secondaire, surfaces)
  · calcaire #E7E6DF (fond clair principal, texte sur fond sombre)
  · laiton #B39A62 (accent unique : liens actifs, filets, chiffres clés, état sélectionné ; jamais en grands aplats)
  · brume #8E9A94 (texte secondaire, légendes, bordures)
- Typographie :
  · titres en Bodoni Moda, graisse 400, l'italique pour l'emphase (ex. « Camarat, *notre plus beau yacht* ») ;
  · texte en Hanken Grotesk, graisse 350, 17 px ;
  · surtitres en petites capitales espacées (Hanken, 13 px, interlettrage large) ;
  · échelle : 13 / 15 / 17 / 22 px, titres de section clamp(36px, 4.6vw, 64px), grands titres clamp(44px, 7vw, 108px).
- Grille : marge latérale clamp(20px, 4vw, 64px), en-tête de 80 px, beaucoup d'air entre les sections.
- Motifs : cartes marines anciennes (portulans), rose des vents, coordonnées et caps en petits caractères (« 43°13′ N · 6°40′ E », « Cap 128° »), numérotation 01, 02, 03 en laiton.
- Mouvement : lent et amorti (cubic-bezier(0.16, 1, 0.3, 1)), apparitions en fondu et glissement court, jamais de rebond.
- Ton : maison de prestige discrète. Aucune surenchère, aucun pictogramme générique de SaaS, aucun dégradé violet, aucune ombre portée lourde, coins très peu arrondis (2 px au plus), filets fins plutôt que cartes à ombre.

À PRODUIRE
1. Planche de jetons : couleurs (avec les paires texte / fond validées AA), typographie, espacements, rayons, filets, durées et courbes d'animation.
2. Thème clair (calcaire) et thème sombre (abysse) : le site alterne les sections claires et sombres, l'espace directeur est en clair.
3. Composants, chacun avec ses états (repos, survol, focus visible, actif, désactivé, chargement, erreur) :
   - en-tête (logo rose des vents + « Portolan », navigation : La flotte, Acheter, Louer, Méthode, Nos eaux, Contact, Mon espace, sélecteur de langue FR/EN/DE/IT) et menu plein écran sur téléphone ;
   - pied de page ;
   - boutons : principal (laiton), secondaire (filet), lien souligné, bouton icône ;
   - champs : texte, e-mail, téléphone, zone de texte, liste déroulante, cases à cocher, boutons radio en « cartes de choix », message d'aide et d'erreur ;
   - sélecteur de dates de séjour : un mois en grille de jours, avec les états disponible, en option, réservé, haute saison, embarquement, retour, séjour sélectionné, hors saison ;
   - carte de yacht (photo, numéro, chantier, nom, année · longueur · invités, prix vente et/ou location) en version « planche » et en version « ligne de registre » ;
   - badges de statut de réservation : En attente, À payer, Confirmée, Soldée, Terminée, Refusée, Expirée, Annulée (couleur + libellé, jamais la couleur seule) ;
   - frise d'avancement horizontale en 5 étapes (Demande, Validée, Acompte, Solde, Embarquement) ;
   - récapitulatif de prix (lignes, sous-total, total, notes en petits caractères) ;
   - boîte de dialogue, panneau latéral, notification brève, bandeau d'information ;
   - tableau de données dense (pour l'espace directeur), avec tri, filtres et ligne sélectionnée ;
   - états vides (avec une petite illustration au trait façon carte marine), chargement (squelettes), erreur.
4. Accessibilité : contraste AA partout, focus visible en laiton, zones tactiles de 44 px au moins sur téléphone.

Montre chaque composant en clair et en sombre, sur ordinateur et sur téléphone.
```
