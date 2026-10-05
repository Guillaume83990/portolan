# Maquettes du MVP Portolan

Maquettes HTML des lots décrits dans `docs/claude-design/01` à `06`, construites avec les vraies feuilles de style, polices et photos du site. Elles servent de référence pour l'intégration en Next.js.

## Ouvrir les maquettes

Les pages chargent des modules JavaScript : elles doivent être servies, pas ouvertes en double-cliquant.

```
npx serve .
```

depuis la racine du dépôt (ou l'extension Live Server de VS Code), puis ouvrir `/docs/claude-design/maquettes/`. La planche `index.html` montre chaque écran en ordinateur (1440 px) et en téléphone (390 px), avec un lien plein écran.

## Ce que contient le dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Planche de revue : liste des écrans par lot, cadres ordinateur et téléphone |
| `BRIEF-CLAUDE-CODE.md` | Le prompt à donner à Claude Code pour l'intégration |
| `ajouts.css` | **Règles nouvelles à intégrer** : anti-robot, réservation fermée, états d'envoi, squelettes, gabarit légal avec sommaire, page 404, correction du titre des fiches sur téléphone |
| `maquette.css` | Annotations de maquette (étiquettes « MVP »), **à ne pas intégrer** |
| `espaces.css` | **Thème clair des espaces** (Mon espace et direction) : couleurs, badges de statut, frise, tableaux, dialogues, notifications, mises en page. À intégrer |
| `lot-2/` | Réservation et paiement : module de réservation, fenêtre de compte, régler l'acompte ou le solde, retours de paiement, personnalisation Stripe, et leurs états |
| `lot-3/` | Mon espace (client) : réservations, détail, documents, compte, `etats.html` |
| `lot-4/` | Espace directeur : connexion, tableau de bord (et démonstration), réservations, calendrier, yachts, éditeur, demandes, clients, réglages, `etats.html` |
| `lot-1/` | Hors périmètre (site public), conservé pour mémoire |

## Conventions

- Les pages de `lot-1/` sont des copies des pages de `fr/` (une balise `<base>` les fait pointer vers les vraies ressources), avec les changements du MVP appliqués.
- Tout ce qui change par rapport au site actuel porte un attribut `data-mvp="…"` qui décrit le changement. Ajouter `?propre` à l'adresse masque les annotations.
- `etats.html` regroupe ce que les pages ne montrent pas au premier affichage : étapes de la visite, envois, confirmations, erreurs, état vide, chargement, plein écrans.
- Les jetons, composants et la charte sont dans le design system Portolan (artefact Claude). Ils reprennent `css/main.css`, `compte.css` et `flotte.css`.

## Avancement

| Lot | État |
|---|---|
| 1 · Site public | Hors périmètre |
| 2 · Réservation et paiement | À valider |
| 3 · Mon espace | À valider |
| 4 · Espace directeur | À valider |
| 5 · E-mails | À venir |
| 6 · Documents PDF | À venir |
