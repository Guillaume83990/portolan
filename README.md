# Portolan

Site de démonstration d'un courtier en yachts de luxe, de Saint-Tropez à Monaco, conçu et développé par [SudWebProject](https://www.sudwebproject.com/).

Société, yachts, prix et coordonnées sont fictifs ; les images sont générées par intelligence artificielle.

## Ce que montre la démo

- Site en quatre langues (français, anglais, allemand, italien), pages statiques rapides et optimisées pour le référencement
- Visites immersives à bord de chaque yacht, pilotées au défilement
- Réservation en ligne : calendrier des disponibilités en direct, prix calculé à la nuit, compte client
- Espace directeur : chiffres de la saison, réservations à confirmer, calendrier de la flotte, édition des yachts, des textes et des photos
- Démonstration de l'espace directeur en lecture seule : `/fr/direction/`, bouton « Visiter en démonstration »

## Technique

HTML, CSS et JavaScript écrits à la main, GSAP et Lenis pour les animations, Supabase (base de données à Paris, comptes, stockage des photos) pour le back-end. Toutes les règles de sécurité sont dans la base : la clé présente dans le code est la clé publique de Supabase.

Reconstruire le site après une modification : `node tools/construire.cjs`
