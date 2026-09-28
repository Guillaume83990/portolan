// Page « Mon espace » (fr/espace/) : le client connecté retrouve ses réservations et ses coordonnées.
// Tout le contenu personnel est chargé par js/espace.js depuis Supabase ; la page statique n'en contient aucun.
module.exports = function pageEspace(t) {
  const { page, consentement, SITE } = t;
  const root = '../../';
  const body = `
    <section class="espace" aria-labelledby="esp-titre">
      <p class="kicker">Espace client</p>
      <h1 id="esp-titre" class="espace__titre">Mon espace</h1>
      <p class="espace__intro espace__attente">Un instant…</p>

      <div class="espace__deconnecte" hidden>
        <p class="espace__intro">Suivez vos réservations, retrouvez vos dates et vos confirmations, et réservez en quelques clics depuis la fiche de chaque yacht.</p>
        <div class="espace__porte">
          <button class="btn btn--light" type="button" data-action="connexion">Se connecter</button>
          <button class="btn btn--ghost" type="button" data-action="creation">Créer un compte</button>
        </div>
      </div>

      <div class="espace__mdp" hidden>
        <p class="espace__intro">Choisissez votre nouveau mot de passe.</p>
        <form class="espace__profil" novalidate>
          <div class="champ"><label for="m-mdp">Nouveau mot de passe <small>(8 caractères au moins)</small></label><input id="m-mdp" name="mdp" type="password" autocomplete="new-password" minlength="8" required></div>
          <div><button class="btn btn--light" type="submit">Enregistrer</button></div>
          <p class="note" role="status" aria-live="polite"></p>
        </form>
      </div>

      <div class="espace__connecte" hidden>
        <p class="espace__intro espace__bonjour"></p>

        <section class="espace__bloc" aria-labelledby="esp-resa">
          <h2 id="esp-resa">Mes réservations</h2>
          <ul class="espace__liste"></ul>
          <p class="espace__vide" hidden>Aucune réservation pour le moment. <a class="link" href="../flotte/">Choisir un yacht</a></p>
        </section>

        <section class="espace__bloc" aria-labelledby="esp-profil">
          <h2 id="esp-profil">Mes coordonnées</h2>
          <form class="espace__profil" novalidate>
            <div class="champs champs--2">
              <div class="champ"><label for="p-nom">Nom et prénom</label><input id="p-nom" name="nom" autocomplete="name" maxlength="120" required></div>
              <div class="champ"><label for="p-mail">E-mail</label><input id="p-mail" name="email" type="email" readonly></div>
              <div class="champ"><label for="p-tel">Téléphone</label><input id="p-tel" name="telephone" type="tel" autocomplete="tel" maxlength="40"></div>
              <div class="champ"><label for="p-langue">Langue de correspondance</label><select id="p-langue" name="langue"><option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option><option value="it">Italiano</option></select></div>
            </div>
            <div><button class="btn btn--light" type="submit">Enregistrer</button></div>
            <p class="note" role="status" aria-live="polite"></p>
          </form>
        </section>

        <div class="espace__pied">
          <p>Une question sur une réservation ? Votre courtier répond au <a href="tel:+33494000000">+33&nbsp;4&nbsp;94&nbsp;00&nbsp;00&nbsp;00</a>.</p>
          <button class="lien-discret" type="button" data-action="deconnexion">Se déconnecter</button>
        </div>
      </div>
      <noscript><p class="espace__intro">Mon espace nécessite JavaScript.</p></noscript>
    </section>`;

  const html = page({
    root, url: '/fr/espace/', bodyClass: 'inner page-espace', script: 'espace.js', image: 'flotte/camarat',
    alt: 'Le yacht Camarat en navigation au coucher du soleil',
    title: 'Mon espace | Portolan',
    description: 'Votre espace client Portolan : vos réservations de yachts, leurs dates et vos coordonnées.',
    jsonld: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Mon espace', url: `${SITE}/fr/espace/` },
    body,
  });
  return [['fr/espace/index.html', html]];
};
