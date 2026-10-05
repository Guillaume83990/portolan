# Brief pour Claude Code · intégrer les maquettes du MVP Portolan

À coller tel quel dans Claude Code, à la racine du dépôt.

```
Tu intègres dans le code Next.js de Portolan les maquettes validées du MVP, qui sont dans docs/claude-design/maquettes/. Lis d'abord docs/claude-design/maquettes/README.md, puis les prompts d'origine docs/claude-design/02-reservation-paiement.md, 03-mon-espace.md et 04-espace-directeur.md : ils décrivent les règles métier que les maquettes illustrent.

PÉRIMÈTRE (le site public ne change pas)
- Lot 2, réservation et paiement : docs/claude-design/maquettes/lot-2/ (module de réservation de la fiche, fenêtre de compte, régler l'acompte ou le solde, retours de paiement Stripe, réglages de marque Stripe).
- Lot 3, Mon espace client : lot-3/ (mes réservations, détail d'une réservation, mes documents, mon compte).
- Lot 4, espace directeur : lot-4/ (connexion, tableau de bord, mode démonstration, réservations, calendrier de la flotte, yachts, éditeur de yacht, demandes, clients, réglages).
- Chaque lot a une page etats.html (ou *-etats.html) avec les états à implémenter : chargement, vide, erreur, confirmation, boîtes de dialogue.

RÈGLES DE LECTURE DES MAQUETTES
- Les maquettes sont des pages HTML statiques construites avec les vraies feuilles du site (css/main.css, compte.css, flotte.css) : reprends exactement leurs classes, espacements et textes.
- ajouts.css et espaces.css contiennent les règles NOUVELLES à intégrer (thème clair des espaces, badges de statut, frise d'avancement, tableaux, dialogues, notifications, module de réservation ouvert, fenêtre de compte, pages de paiement).
- maquette.css et les attributs data-mvp="…" sont des annotations de maquette : ne les intègre pas, mais lis leur texte, il explique le comportement attendu.
- Les montants, noms de clients et dates sont des exemples. Les calculs réels (acompte 50 %, solde 50 % à J-30, APA 30 %, prorata basse/haute saison) viennent de la base. La ligne « dont TVA » est provisoire, à valider avec l'expert-comptable.
- Textes en français ; prévois les clés de traduction EN, DE, IT pour le lot 2 et le lot 3 (l'espace directeur est en français seulement).

ORDRE DE TRAVAIL
1. Tokens et composants communs (espaces.css : thème clair, badges, frise, dialogues, notifications, tableaux).
2. Lot 2, puis lot 3, puis lot 4, un écran à la fois, en vérifiant chaque écran à 1440 px et à 390 px contre la maquette.
3. Pour chaque écran, implémente tous les états de la page etats correspondante.
4. Accessibilité : contraste AA, focus visible, zones tactiles de 44 px, boîtes de dialogue accessibles (jamais d'alerte native).

Avant de coder, liste-moi les écrans et composants que tu vas créer, et pose-moi tes questions sur ce qui n'est pas clair.
```

## Pour revoir les maquettes

Depuis la racine du dépôt : `npx serve .`, puis `http://localhost:3000/docs/claude-design/maquettes/`.
