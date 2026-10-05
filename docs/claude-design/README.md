# Portolan × Claude Design : mode d'emploi

Ce dossier contient les prompts à coller dans Claude Design pour dessiner le MVP de Portolan. Un fichier correspond à un lot. On avance dans l'ordre, et on valide chaque lot avant de passer au suivant.

| Fichier | Lot | État |
|---|---|---|
| `00-systeme-de-design.md` | Système de design (jetons, typographie, composants) | Prêt |
| `01-site-public.md` | Lot 1 : site public (accueil, flotte, fiches, pages) | Prêt |
| `02-reservation-paiement.md` | Lot 2 : réservation, compte, paiement | Prêt |
| `03-mon-espace.md` | Lot 3 : Mon espace (réservations, détail, documents, compte) | Prêt |
| `04-espace-directeur.md` | Lot 4 : outil du directeur (9 écrans) | Prêt |
| `05-emails.md` | Lot 5 : gabarit et e-mails automatiques (client, directeur, compte) | Prêt |
| `06-documents-pdf.md` | Lot 6 : contrat, factures, reçu de l'APA, brochure | Prêt |

**Ordre conseillé** : 00 → 01 → 02 → 03 → 04 → 05 → 06. Les lots 1 et 2 passent en premier, parce que le développement des fondations peut commencer dès qu'ils sont validés.

## Déroulé

1. **Créer un projet** « Portolan » dans Claude Design.
2. **Donner l'identité existante** avant le premier prompt :
   - le lien du site actuel, `https://portolan.sudwebproject.com/fr/` ;
   - si Claude Design propose d'importer un dépôt de code ou des fichiers, le dépôt GitHub de Portolan, ou au minimum `css/main.css` et les polices de `assets/fonts/` ;
   - 4 à 6 captures du site actuel, sur ordinateur et sur téléphone : accueil (ouverture et sélection), flotte, fiche Mistral Blanc (galerie et réservation), espace directeur.
3. **Coller le prompt du système de design** (`00`), puis corriger jusqu'à ce que les jetons et les composants vous conviennent.
4. **Coller les prompts du lot 1**, un écran par prompt, dans l'ordre. Chaque écran se fait en **deux versions, ordinateur (1440 px) et téléphone (390 px)**.
5. **Me transmettre chaque lot validé**, de préférence par l'export ou le transfert vers Claude Code s'il est proposé, sinon par le lien de partage ou l'export HTML. Je l'intègre dans le code Next.js.

## Règles à garder en tête pendant les retouches
- **De vrais textes, pas de faux texte** : les prompts contiennent les textes actuels du site. Si Claude Design invente du contenu, demandez-lui de reprendre ceux du prompt.
- **Une seule identité** : le site public, l'espace client et l'espace directeur partagent les mêmes jetons. L'outil du directeur est seulement plus dense.
- **Allemand long** : vérifier qu'un libellé deux fois plus long qu'en français ne casse ni les boutons ni la navigation.
- **Tous les états** : chargement, vide, erreur, désactivé. Je ne peux pas les inventer au moment de l'intégration sans trahir le design.
- **Les montants des maquettes sont des exemples.** Le calcul réel (acompte, solde, APA, TVA) est fait par la base. La TVA reste à valider avec l'expert-comptable du client.
