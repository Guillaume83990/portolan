# Portolan · application (espace client et espace directeur)

Next.js 16 (App Router) et Supabase. Le site public reste en HTML statique à la racine du dépôt ; cette application sert :

- **l'espace directeur** : `/direction` (tableau de bord, réservations, calendrier, demandes, clients, yachts et éditeur, réglages), en français ;
- **Mon espace** (client) : `/fr/espace`, `/en/my-account`, `/de/mein-konto`, `/it/area-riservata` (mêmes adresses que le site actuel), avec le paiement de l'acompte et du solde par Stripe.

Les maquettes de référence sont dans `docs/claude-design/maquettes/` (lots 2, 3 et 4).

## Lancer en local

Node 20.9 ou plus récent est nécessaire (sur ce poste : `C:\Users\propi\AppData\Local\nvm\v20.19.4`).

```
npm install
npm run dev        (http://localhost:3100)
```

Les variables sont dans `.env.local` (jamais envoyé sur GitHub). Base de développement : projet Supabase `portolan-mvp` (Paris).

## Où est quoi

| Dossier | Rôle |
|---|---|
| `src/app/(direction)/direction/` | Espace directeur. `actions.ts` : toutes les écritures (la base vérifie le rôle) |
| `src/app/[locale]/espace/` | Mon espace : réservations, détail, documents, compte, paiement, retours de lien e-mail (`auth/`) |
| `src/app/api/stripe/webhook/` | Paiements confirmés par Stripe (signature vérifiée, idempotent) |
| `src/app/api/documents/[id]/` | Téléchargement d'un contrat ou d'une facture (lien signé de 60 s) |
| `src/app/api/cron/` | Tâche planifiée : file des événements, documents manquants |
| `src/lib/pdf/`, `src/lib/emails/`, `src/lib/evenements/` | Documents PDF, e-mails, traitement des événements |
| `src/lib/i18n/` | Textes de l'espace client en 4 langues (le français fait référence) |
| `src/lib/paiement/stripe.ts` | Sessions Checkout (carte, virement SEPA avec IBAN dédié) |
| `src/styles/` | Feuilles du site (`main.css`, `compte.css`, `flotte.css`) + `espaces.css` et `ajouts.css` des maquettes ; `app.css` : raccords d'intégration |
| `../supabase/migrations/` | Schéma : 01 à 03 (site actuel), 04 à 11 (MVP) |

## Documents et e-mails (lots 5 et 6)

1. **La base émet un événement** à chaque étape (déclencheurs de la migration 11) : demande, validation, acompte, solde, expiration, refus, annulation, remboursement, formulaire, inscription. Les rappels datés (relance 24 h avant l'échéance, appel du solde, embarquement à J-3, demande sans réponse depuis 24 h) sont planifiés par `pg_cron` toutes les 15 minutes.
2. **Le serveur traite la file** (`src/lib/evenements/traiter.tsx`) juste après chaque action (`after()`), après le webhook Stripe, et par la tâche planifiée `/api/cron` :
   - PDF dans la langue du client (`src/lib/pdf/`) : contrat, facture d'acompte, facture de solde, reçu de l'APA. Le numéro est réservé dans la base avant la génération : numérotation continue, sans trou ;
   - e-mail dans la langue du client (`src/lib/emails/`, React Email), avec les PDF en pièces jointes, et notification à la direction selon les réglages.
3. **Boîte d'envoi** (`/direction/boite-envoi`) : chaque e-mail tel qu'il est reçu. Sans clé Resend, rien ne part : les e-mails sont seulement préparés là, et l'historique de la réservation le dit.

Variables facultatives (voir `.env.local`) : `RESEND_API_KEY`, `EMAIL_EXPEDITEUR`, `EMAILS_AUTORISES`, `CRON_SECRET`.

## Site de démonstration : rien de réel

- `NEXT_PUBLIC_DEMO=true` : le paiement n'accepte **qu'une clé Stripe de test** (`sk_test_…`) ; une clé réelle désactive le paiement au lieu de débiter un visiteur. La page de paiement l'annonce et donne la carte de test.
- En démonstration, un e-mail ne part réellement que vers les adresses de `EMAILS_AUTORISES`.
- Le compte de démonstration ne voit dans la boîte d'envoi que les e-mails des comptes fictifs (`@exemple.com`).

## Sécurité

- Toutes les lectures et écritures passent par la session de la personne connectée : les règles de la base (RLS et fonctions) décident.
- La clé secrète Supabase (`SUPABASE_SECRET_KEY`) n'est utilisée que côté serveur (`src/lib/supabase/admin.ts`, protégé par `server-only`).
- Le compte de démonstration ne peut rien modifier ; ses écrans masquent les données des clients.
