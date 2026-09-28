// Espace directeur de Portolan : tableau de bord, réservations (confirmer, refuser, bloquer des dates), calendrier
// de la flotte, demandes des formulaires, yachts (textes en 4 langues, prix, photos), clients et réglages de la saison.
// Les droits sont vérifiés par la base : le rôle « directeur » peut tout faire, le rôle « demo » ne fait que regarder
// (données personnelles des vrais clients masquées). Cette page ne fait qu'afficher ce que la base autorise.
import { db, SUPABASE_URL } from './supabase.js';
import { demanderConnexion, deconnexion, messageErreur } from './compte.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const eur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n || 0));
const date = (s) => new Date(`${s}T12:00:00Z`);
const fCourt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const fMois = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' });
const fQuand = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const jour = (s) => fCourt.format(date(s));
const ecart = (a, b) => Math.round((date(b) - date(a)) / 864e5);
const aujourdhui = new Date().toISOString().slice(0, 10);
const RACINE = '../../';

// Compte de démonstration, à montrer aux prospects : volontairement public, en lecture seule (rôle « demo ») ;
// la base lui refuse toute écriture et masque les coordonnées des vrais clients. Ce n'est pas un secret.
const DEMO = { email: 'demo@portolan.example', password: 'portolan-demo-2027' };

const STATUTS = { en_attente: 'À confirmer', confirmee: 'Confirmée', refusee: 'Refusée', annulee: 'Annulée' };
const LANGUES = { fr: 'Français', en: 'Anglais', de: 'Allemand', it: 'Italien' };
const TYPES = {
  dossier: 'Dossier', visite: 'Visite à bord', question: 'Question', brochure: 'Brochure', contact: 'Contact',
  'hors-marche': 'Sélection hors marché', 'projet-acheter': 'Projet : acheter', 'projet-louer': 'Projet : louer',
  'projet-vendre': 'Projet : vendre', achat: 'Achat', location: 'Location', vente: 'Vente', recherche: 'Recherche',
};

let sb;
let moi = null;
let demo = false;
const donnees = { bord: null, resas: [], demandes: [], clients: [], yachts: [], reglages: null };

// ---------------------------------------------------------------------------------------------
// Contacter un client : e-mail et WhatsApp préremplis (en attendant les e-mails automatiques)
// ---------------------------------------------------------------------------------------------
function numeroWhatsApp(tel) {
  let n = String(tel || '').replace(/[^\d+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  else if (n.startsWith('00')) n = n.slice(2);
  else if (/^0\d{9}$/.test(n)) n = `33${n.slice(1)}`;
  return n.length >= 8 ? n : '';
}
function messageClient(r, cas) {
  const en = r.langue && r.langue !== 'fr';
  const prenom = (r.client_nom || '').trim();
  const sejour = en
    ? `${r.yacht_nom}, from ${fLong.format(date(r.debut))} to ${fLong.format(date(r.fin))} (${r.reference})`
    : `${r.yacht_nom}, du ${fLong.format(date(r.debut))} au ${fLong.format(date(r.fin))} (${r.reference})`;
  const textes = {
    confirmee: en
      ? [`Your charter aboard ${r.yacht_nom} is confirmed`, `Dear ${prenom},\n\nWe are delighted to confirm your charter: ${sejour}, boarding at ${String(r.heure || '').slice(0, 5)} in ${r.port}.\n\nYour charter contract will follow shortly.\n\nWarm regards,\nPortolan`]
      : [`Votre location à bord de ${r.yacht_nom} est confirmée`, `Bonjour ${prenom},\n\nNous avons le plaisir de vous confirmer votre location : ${sejour}, embarquement à ${String(r.heure || '').slice(0, 5)} à ${r.port}.\n\nVotre contrat de location suit dans un prochain message.\n\nBien à vous,\nPortolan`],
    refusee: en
      ? [`Your request for ${r.yacht_nom}`, `Dear ${prenom},\n\nUnfortunately ${r.yacht_nom} is not available for these dates: ${sejour}.\n\nWe would be happy to suggest another yacht or other dates.\n\nWarm regards,\nPortolan`]
      : [`Votre demande pour ${r.yacht_nom}`, `Bonjour ${prenom},\n\n${r.yacht_nom} n'est malheureusement pas disponible pour ces dates : ${sejour}.\n\nNous serions heureux de vous proposer un autre yacht ou d'autres dates.\n\nBien à vous,\nPortolan`],
    autre: en
      ? [`Your charter request ${r.reference}`, `Dear ${prenom},\n\nRegarding your request: ${sejour}.\n\n\nWarm regards,\nPortolan`]
      : [`Votre demande ${r.reference}`, `Bonjour ${prenom},\n\nAu sujet de votre demande : ${sejour}.\n\n\nBien à vous,\nPortolan`],
  };
  return textes[cas] || textes.autre;
}
function liensContact(email, tel, sujet, corps) {
  const out = [];
  if (email && email.includes('@')) out.push(`<a class="lien-outil" href="mailto:${esc(email)}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}">Écrire un e-mail</a>`);
  const wa = numeroWhatsApp(tel);
  if (wa) out.push(`<a class="lien-outil" href="https://wa.me/${wa}?text=${encodeURIComponent(corps)}" target="_blank" rel="noopener">WhatsApp</a>`);
  if (tel) out.push(`<a class="lien-outil" href="tel:${esc(String(tel).replace(/\s/g, ''))}">Appeler</a>`);
  return out.join('');
}

// ---------------------------------------------------------------------------------------------
// Chargement des données
// ---------------------------------------------------------------------------------------------
async function charger(quoi = ['bord', 'resas', 'demandes', 'clients', 'yachts', 'reglages']) {
  const appels = {
    bord: () => sb.rpc('tableau_de_bord'),
    resas: () => sb.rpc('direction_reservations'),
    demandes: () => sb.rpc('direction_demandes'),
    clients: () => sb.rpc('direction_clients'),
    yachts: () => sb.from('yachts').select('*').order('ordre'),
    reglages: () => sb.from('reglages').select('*').single(),
  };
  const res = await Promise.all(quoi.map((k) => appels[k]()));
  res.forEach(({ data, error }, i) => {
    if (error) throw error;
    donnees[quoi[i]] = data;
  });
  $$('[data-compte]').forEach((p) => { const n = donnees.bord?.[p.dataset.compte]; p.textContent = n ? String(n) : ''; });
}

// ---------------------------------------------------------------------------------------------
// Tableau de bord
// ---------------------------------------------------------------------------------------------
function vueBord(el) {
  const b = donnees.bord;
  const occ = b.occupation || [];
  const nuits = occ.reduce((s, o) => s + o.nuits, 0);
  const total = occ.reduce((s, o) => s + o.total, 0) || 1;
  const maxMois = Math.max(1, ...(b.par_mois || []).map((m) => m.montant));
  const aTraiter = donnees.resas.filter((r) => r.type === 'location' && r.statut === 'en_attente').slice(0, 5);
  const arrivees = donnees.resas.filter((r) => r.type === 'location' && r.statut === 'confirmee' && r.debut >= aujourdhui).slice(0, 5);
  const prenom = (moi.nom || '').trim().split(' ')[0];
  el.innerHTML = `
    <div class="dir-titre"><h1>${prenom && !demo ? `Bonjour ${esc(prenom)}` : 'Tableau de bord'}</h1><p>Saison ${b.annee}</p></div>
    <div class="dir-kpis">
      <div class="kpi kpi--or"><span>Chiffre d'affaires confirmé</span><strong>${eur(b.ca_confirme)}</strong><small>${b.sejours_confirmes} séjours confirmés</small></div>
      <a class="kpi" href="#reservations"><span>À confirmer</span><strong>${b.a_traiter}</strong><small>${eur(b.ca_attente)} en attente de réponse</small></a>
      <a class="kpi" href="#demandes"><span>Nouvelles demandes</span><strong>${b.demandes_nouvelles}</strong><small>dossiers, visites, questions</small></a>
      <div class="kpi"><span>Occupation de la flotte</span><strong>${Math.round((nuits / total) * 100)} %</strong><small>${nuits} nuits vendues sur ${total}</small></div>
      <a class="kpi" href="#clients"><span>Clients inscrits</span><strong>${b.clients}</strong><small>comptes créés sur le site</small></a>
    </div>
    <div class="dir-grille">
      <div class="panneau">
        <h3>À confirmer</h3>
        ${aTraiter.length ? `<ul class="liste">${aTraiter.map((r) => ligneResa(r)).join('')}</ul>` : '<p class="dir-vide">Aucune demande en attente. Tout est à jour.</p>'}
      </div>
      <div class="panneau">
        <h3>Prochaines arrivées</h3>
        ${arrivees.length ? `<table class="tableau"><tbody>${arrivees.map((r) => `<tr><td>${esc(jour(r.debut))}<br><span class="ligne__sous">${esc(String(r.heure || '').slice(0, 5))}, ${esc(r.port || '')}</span></td><td><strong class="ligne__nom">${esc(r.yacht_nom)}</strong><br><span class="ligne__sous">${esc(r.client_nom)} · ${r.invites || ''} invités</span></td><td class="nombre">${r.nuits} nuits</td></tr>`).join('')}</tbody></table>` : '<p class="dir-vide">Aucune arrivée prévue.</p>'}
      </div>
      <div class="panneau">
        <h3>Occupation par yacht</h3>
        <div class="barres">${occ.map((o) => `<div class="barre"><span>${esc(o.nom)}</span><div class="barre__piste"><div class="barre__plein" style="width:${Math.round((o.nuits / o.total) * 100)}%"></div></div><b>${Math.round((o.nuits / o.total) * 100)} %</b></div>`).join('')}</div>
      </div>
      <div class="panneau">
        <h3>Chiffre d'affaires par mois d'embarquement</h3>
        <div class="mois">${(b.par_mois || []).map((m) => `<div><b>${eur(m.montant / 1000).replace('€', 'k€')}</b><i style="height:${Math.max(2, Math.round((m.montant / maxMois) * 100))}%"></i><span>${fMois.format(date(`${m.mois}-01`))}</span></div>`).join('') || '<p class="dir-vide">Pas encore de séjour confirmé.</p>'}</div>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------------------------
// Réservations
// ---------------------------------------------------------------------------------------------
let filtreResa = 'a_traiter';
let rechercheResa = '';
let ouvrirResa = null;

function ligneResa(r) {
  const blocage = r.type === 'blocage';
  const lisible = r.client_email && r.client_email.includes('@');
  const corps = [];
  if (!blocage) {
    corps.push(`<dl class="ligne__infos">
      <div><dt>Client</dt><dd>${esc(r.client_nom)}${r.client ? '' : ' <span class="ligne__sous">(saisie courtier)</span>'}</dd></div>
      <div><dt>Contact</dt><dd>${esc(r.client_email)}${r.client_telephone ? `<br>${esc(r.client_telephone)}` : ''}</dd></div>
      <div><dt>Embarquement</dt><dd>${esc(fLong.format(date(r.debut)))} à ${esc(String(r.heure || '').slice(0, 5))}, ${esc(r.port || '')}</dd></div>
      <div><dt>Débarquement</dt><dd>${esc(fLong.format(date(r.fin)))}</dd></div>
      <div><dt>Invités · langue</dt><dd>${r.invites || '—'} · ${LANGUES[r.langue] || r.langue}</dd></div>
      <div><dt>Reçue le</dt><dd>${esc(fQuand.format(new Date(r.cree_le)))}${r.decide_le ? `<br><span class="ligne__sous">décidée le ${esc(fQuand.format(new Date(r.decide_le)))}</span>` : ''}</dd></div>
    </dl>`);
    if (r.message) corps.push(`<p class="ligne__message">« ${esc(r.message)} »</p>`);
    if (r.note_directeur) corps.push(`<p class="ligne__sous">Note au client : ${esc(r.note_directeur)}</p>`);
    if (r.statut === 'en_attente') {
      corps.push(`<div class="champ"><label for="note-${r.id}">Un mot pour le client <small>(facultatif, visible dans son espace)</small></label><textarea id="note-${r.id}" rows="2" maxlength="2000" data-ecrit></textarea></div>
        <div class="actions"><button class="btn btn--light" type="button" data-decider="confirmee" data-id="${r.id}" data-ecrit>Confirmer la réservation</button><button class="btn btn--refus" type="button" data-decider="refusee" data-id="${r.id}" data-ecrit>Refuser</button></div>`);
    }
    if (r.statut === 'confirmee') corps.push(`<div class="actions"><button class="lien-outil" type="button" data-decider="annulee" data-id="${r.id}" data-ecrit>Annuler cette réservation</button></div>`);
    const [sujet, texte] = messageClient(r, r.statut === 'en_attente' ? 'autre' : r.statut);
    if (lisible) corps.push(`<div class="actions">${liensContact(r.client_email, r.client_telephone, sujet, texte)}<a class="lien-outil" href="${RACINE}fr/flotte/${esc(r.yacht)}/" target="_blank" rel="noopener">Voir la fiche</a></div>`);
  } else {
    corps.push(`<div class="actions"><button class="lien-outil" type="button" data-supprimer-blocage="${r.id}" data-ecrit>Libérer ces dates</button></div>`);
  }
  return `<li><details class="ligne" data-statut="${r.statut}" data-type="${r.type}" data-id="${r.id}"${ouvrirResa === r.id ? ' open' : ''}>
    <summary>
      <span class="ligne__ref">${esc(r.reference)}</span>
      <span><span class="ligne__nom">${blocage ? 'Dates bloquées' : esc(r.client_nom)}</span><br><span class="ligne__sous">${blocage ? esc(r.client_nom) : `${LANGUES[r.langue] || ''}${r.invites ? ` · ${r.invites} invités` : ''}`}</span></span>
      <span>${esc(r.yacht_nom)}</span>
      <span>${esc(jour(r.debut))} → ${esc(jour(r.fin))}<br><span class="ligne__sous">${ecart(r.debut, r.fin)} nuits</span></span>
      <span class="ligne__montant">${blocage ? '—' : eur(r.montant)}</span>
      <span class="etiquette etiquette--${r.statut}">${blocage ? 'Indisponible' : STATUTS[r.statut]}</span>
    </summary>
    <div class="ligne__corps">${corps.join('')}<p class="dir-note" role="status"></p></div>
  </details></li>`;
}

function vueReservations(el) {
  const filtres = {
    a_traiter: (r) => r.type === 'location' && r.statut === 'en_attente',
    confirmees: (r) => r.type === 'location' && r.statut === 'confirmee',
    blocages: (r) => r.type === 'blocage',
    toutes: () => true,
  };
  const q = rechercheResa.trim().toLowerCase();
  const liste = donnees.resas.filter(filtres[filtreResa]).filter((r) => !q || `${r.reference} ${r.client_nom} ${r.client_email} ${r.yacht_nom}`.toLowerCase().includes(q));
  const n = (k) => donnees.resas.filter(filtres[k]).length;
  const aLouer = donnees.yachts.filter((y) => y.location_basse);
  el.innerHTML = `
    <div class="dir-titre"><h2>Réservations</h2><button class="btn btn--ghost" type="button" data-action="blocage" data-ecrit>Bloquer des dates</button></div>
    <form class="dir-form" data-form="blocage" hidden novalidate>
      <h3>Bloquer des dates</h3>
      <p class="ligne__sous">Entretien, usage du propriétaire, location conclue hors du site : les dates disparaissent du calendrier public.</p>
      <div class="champs">
        <div class="champ"><label for="b-yacht">Yacht</label><select id="b-yacht" name="yacht">${aLouer.map((y) => `<option value="${y.slug}">${esc(y.nom)}</option>`).join('')}</select></div>
        <div class="champ"><label for="b-debut">Du</label><input id="b-debut" name="debut" type="date" required></div>
        <div class="champ"><label for="b-fin">Au (jour de retour)</label><input id="b-fin" name="fin" type="date" required></div>
        <div class="champ"><label for="b-motif">Motif</label><input id="b-motif" name="motif" maxlength="120" placeholder="Entretien au chantier"></div>
      </div>
      <div class="actions"><button class="btn btn--light" type="submit">Bloquer ces dates</button><button class="lien-outil" type="button" data-action="blocage">Fermer</button></div>
      <p class="dir-note" role="status"></p>
    </form>
    <div class="filtres" role="group" aria-label="Filtrer les réservations">
      ${[['a_traiter', 'À confirmer'], ['confirmees', 'Confirmées'], ['blocages', 'Dates bloquées'], ['toutes', 'Toutes']].map(([k, t]) => `<button type="button" data-filtre-resa="${k}" aria-pressed="${k === filtreResa}">${t} (${n(k)})</button>`).join('')}
      <input type="search" placeholder="Rechercher un client, un yacht, une référence" value="${esc(rechercheResa)}" data-recherche-resa aria-label="Rechercher">
    </div>
    ${liste.length ? `<ul class="liste">${liste.map(ligneResa).join('')}</ul>` : '<p class="dir-vide">Aucune réservation dans cette liste.</p>'}`;
  if (ouvrirResa) { $(`details[data-id="${ouvrirResa}"]`, el)?.scrollIntoView({ block: 'center' }); ouvrirResa = null; }
}

async function decider(bouton) {
  const { id, decider: decision } = bouton.dataset;
  const r = donnees.resas.find((x) => x.id === id);
  const noteEl = bouton.closest('.ligne__corps').querySelector('.dir-note');
  const texte = { confirmee: `Confirmer la réservation ${r.reference} de ${r.client_nom} (${r.yacht_nom}) ?`, refusee: `Refuser la demande ${r.reference} ? Les dates seront libérées.`, annulee: `Annuler la réservation ${r.reference} ? Les dates seront libérées.` }[decision];
  if (!window.confirm(texte)) return;
  bouton.disabled = true;
  const note = $(`#note-${id}`)?.value.trim() || '';
  const { error } = await sb.rpc('decider_reservation', { p_id: id, p_decision: decision, p_note: note });
  if (error) { noteEl.textContent = messageErreur(error); noteEl.classList.add('is-erreur'); bouton.disabled = false; return; }
  await charger(['bord', 'resas']);
  ouvrirResa = id;
  afficher();
  // Tant que les e-mails automatiques ne sont pas branchés : on propose de prévenir le client en un clic
  const ligne = $(`details[data-id="${id}"]`);
  const maj = donnees.resas.find((x) => x.id === id);
  if (ligne && maj) {
    const [sujet, corps] = messageClient(maj, decision);
    const n = $('.dir-note', ligne);
    n.innerHTML = `${decision === 'confirmee' ? 'Réservation confirmée.' : decision === 'refusee' ? 'Demande refusée, dates libérées.' : 'Réservation annulée, dates libérées.'} Prévenez le client : <span class="actions">${liensContact(maj.client_email, maj.client_telephone, sujet, corps)}</span>`;
  }
}

async function bloquer(form) {
  const note = $('.dir-note', form);
  const { yacht, debut, fin, motif } = Object.fromEntries(new FormData(form));
  if (!debut || !fin || fin <= debut) { note.textContent = 'Indiquez une date de début et une date de retour postérieure.'; note.classList.add('is-erreur'); return; }
  const { error } = await sb.from('reservations').insert({ yacht, type: 'blocage', client_nom: motif.trim() || 'Indisponible', debut, fin, nuits: ecart(debut, fin), statut: 'confirmee' });
  if (error) {
    note.textContent = /reservations_sans_chevauchement|exclusion/.test(error.message) ? 'Ces dates chevauchent une réservation existante.' : messageErreur(error);
    note.classList.add('is-erreur');
    return;
  }
  await charger(['bord', 'resas']);
  filtreResa = 'blocages';
  afficher();
}

// ---------------------------------------------------------------------------------------------
// Calendrier de la flotte
// ---------------------------------------------------------------------------------------------
function vueCalendrier(el) {
  const R = donnees.reglages;
  const total = ecart(R.saison_debut, R.saison_fin);
  const pct = (d) => `${(Math.max(0, Math.min(total, ecart(R.saison_debut, d))) / total) * 100}%`;
  const mois = [];
  for (let d = date(`${R.saison_debut.slice(0, 7)}-01`); d.toISOString().slice(0, 10) < R.saison_fin; d.setUTCMonth(d.getUTCMonth() + 1)) {
    const debut = d.toISOString().slice(0, 10) < R.saison_debut ? R.saison_debut : d.toISOString().slice(0, 10);
    const suivant = new Date(d); suivant.setUTCMonth(suivant.getUTCMonth() + 1);
    const fin = suivant.toISOString().slice(0, 10) > R.saison_fin ? R.saison_fin : suivant.toISOString().slice(0, 10);
    mois.push({ nom: fMois.format(d), part: ecart(debut, fin) });
  }
  const yachts = donnees.yachts.filter((y) => y.location_basse);
  const actives = donnees.resas.filter((r) => ['en_attente', 'confirmee'].includes(r.statut));
  const haute = `<span class="planning__haute" style="left:${pct(R.haute_debut)};width:calc(${pct(R.haute_fin)} - ${pct(R.haute_debut)})"></span>`;
  const auj = aujourdhui >= R.saison_debut && aujourdhui <= R.saison_fin ? `<span class="planning__aujourdhui" style="left:${pct(aujourdhui)}"></span>` : '';
  el.innerHTML = `
    <div class="dir-titre"><h2>Calendrier ${R.annee}</h2><p>Plein : confirmée · hachuré : à confirmer · gris : dates bloquées · fond doré : haute saison. Cliquez sur une période pour l'ouvrir.</p></div>
    <div class="planning"><div class="planning__grille">
      <span></span><div class="planning__mois" style="grid-template-columns:${mois.map((m) => `${m.part}fr`).join(' ')}">${mois.map((m) => `<span>${m.nom}</span>`).join('')}</div>
      ${yachts.map((y) => `<div class="planning__nom">${esc(y.nom)}</div><div class="planning__piste" style="background-size:calc(100% / ${total} * 7) 100%">${haute}${auj}${actives.filter((r) => r.yacht === y.slug).map((r) => `<button type="button" class="planning__barre planning__barre--${r.type === 'blocage' ? 'blocage' : r.statut}" style="left:${pct(r.debut)};width:calc(${pct(r.fin)} - ${pct(r.debut)})" data-voir-resa="${r.id}" title="${esc(`${r.type === 'blocage' ? 'Bloqué' : r.client_nom} · ${jour(r.debut)} → ${jour(r.fin)}`)}">${esc(r.type === 'blocage' ? r.client_nom : r.client_nom)}</button>`).join('')}</div>`).join('')}
    </div></div>`;
}

// ---------------------------------------------------------------------------------------------
// Demandes des formulaires
// ---------------------------------------------------------------------------------------------
let filtreDemandes = 'nouvelles';
function vueDemandes(el) {
  const filtres = { nouvelles: (d) => !d.traitee, traitees: (d) => d.traitee, toutes: () => true };
  const liste = donnees.demandes.filter(filtres[filtreDemandes]);
  const n = (k) => donnees.demandes.filter(filtres[k]).length;
  el.innerHTML = `
    <div class="dir-titre"><h2>Demandes</h2><p>Envoyées par les formulaires du site : dossiers, visites, brochures, projets.</p></div>
    <div class="filtres" role="group" aria-label="Filtrer les demandes">
      ${[['nouvelles', 'Nouvelles'], ['traitees', 'Traitées'], ['toutes', 'Toutes']].map(([k, t]) => `<button type="button" data-filtre-demandes="${k}" aria-pressed="${k === filtreDemandes}">${t} (${n(k)})</button>`).join('')}
    </div>
    ${liste.length ? `<ul class="liste">${liste.map((d) => {
      const details = Object.entries(d.details || {}).filter(([, v]) => v);
      const sujet = `Portolan${d.yacht_nom ? ` · ${d.yacht_nom}` : ''}`;
      const corps = d.langue === 'fr' ? `Bonjour,\n\nMerci pour votre demande${d.yacht_nom ? ` au sujet de ${d.yacht_nom}` : ''}.\n\n\nBien à vous,\nPortolan` : `Dear ${d.nom},\n\nThank you for your enquiry${d.yacht_nom ? ` about ${d.yacht_nom}` : ''}.\n\n\nWarm regards,\nPortolan`;
      return `<li><details class="ligne" data-statut="${d.traitee ? 'annulee' : 'en_attente'}">
        <summary>
          <span class="ligne__ref">${esc(fQuand.format(new Date(d.cree_le)))}</span>
          <span><span class="ligne__nom">${esc(d.nom)}</span><br><span class="ligne__sous">${LANGUES[d.langue] || d.langue}</span></span>
          <span>${esc(TYPES[d.type] || d.type)}</span>
          <span>${esc(d.yacht_nom || '—')}</span>
          <span></span>
          <span class="etiquette ${d.traitee ? '' : 'etiquette--nouvelle'}">${d.traitee ? 'Traitée' : 'Nouvelle'}</span>
        </summary>
        <div class="ligne__corps">
          <dl class="ligne__infos">
            <div><dt>E-mail</dt><dd>${esc(d.email)}</dd></div>
            ${d.telephone ? `<div><dt>Téléphone</dt><dd>${esc(d.telephone)}</dd></div>` : ''}
            ${details.map(([k, v]) => `<div><dt>${esc(k.replace(/_/g, ' '))}</dt><dd>${esc(v)}</dd></div>`).join('')}
            <div><dt>Page</dt><dd>${esc(d.page)}</dd></div>
          </dl>
          ${d.message ? `<p class="ligne__message">« ${esc(d.message)} »</p>` : ''}
          <div class="actions">${liensContact(d.email, d.telephone, sujet, corps)}<button class="lien-outil" type="button" data-traiter="${d.id}" data-valeur="${!d.traitee}" data-ecrit>${d.traitee ? 'Remettre en nouvelle' : 'Marquer comme traitée'}</button></div>
        </div>
      </details></li>`;
    }).join('')}</ul>` : '<p class="dir-vide">Aucune demande dans cette liste.</p>'}`;
}

// ---------------------------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------------------------
function vueClients(el) {
  const clients = donnees.clients.filter((c) => c.role === 'client');
  el.innerHTML = `
    <div class="dir-titre"><h2>Clients</h2><p>${clients.length} comptes créés sur le site. Les réservations prises par téléphone figurent dans Réservations.</p></div>
    ${clients.length ? `<div class="defile"><table class="tableau">
      <thead><tr><th>Nom</th><th>Contact</th><th>Langue</th><th>Inscrit le</th><th class="nombre">Séjours</th><th class="nombre">Confirmé</th></tr></thead>
      <tbody>${clients.map((c) => `<tr><td>${esc(c.nom || '—')}</td><td>${esc(c.email)}${c.telephone ? `<br><span class="ligne__sous">${esc(c.telephone)}</span>` : ''}</td><td>${LANGUES[c.langue] || c.langue}</td><td>${esc(fQuand.format(new Date(c.cree_le)))}</td><td class="nombre">${c.sejours}</td><td class="nombre">${eur(c.confirme)}</td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="dir-vide">Aucun client inscrit pour le moment.</p>'}`;
}

// ---------------------------------------------------------------------------------------------
// Yachts : liste, puis édition (textes en 4 langues, prix, photos)
// ---------------------------------------------------------------------------------------------
const urlPhoto = (src, taille = 900) => (src.startsWith('supabase:')
  ? `${SUPABASE_URL}/storage/v1/object/public/yachts/${src.slice(9)}-${taille}.webp`
  : `${RACINE}assets/img/${src}-${taille}.webp`);

function vueYachts(el, slug) {
  if (slug) { vueYacht(el, slug); return; }
  el.innerHTML = `
    <div class="dir-titre"><h2>La flotte</h2><p>Cliquez sur un yacht pour modifier ses textes, ses prix et ses photos.</p></div>
    <div class="dir-yachts">${donnees.yachts.map((y) => `
      <a class="carte-yacht" href="#yachts/${y.slug}">
        <img src="${urlPhoto(y.fiche.image.src)}" alt="" loading="lazy">
        <div><strong>${esc(y.nom)}</strong><span>${[y.vente && `À vendre ${eur(y.vente)}`, y.location_basse && `Location dès ${eur(y.location_basse)} / sem.`].filter(Boolean).join(' · ')}</span><span>${y.publie ? 'En ligne' : 'Masqué du site'} · modifié le ${esc(fQuand.format(new Date(y.modifie_le)))}</span></div>
      </a>`).join('')}</div>`;
}

let edition = null; // copie de travail du yacht en cours d'édition
let langueEdition = 'fr';

function textesDe(f) {
  // Les textes modifiables, avec leur chemin dans la fiche
  const t = [['accroche', 'Accroche', f.accroche, 'court']];
  (f.description || []).forEach((p, i) => t.push([`description.${i}`, `Présentation, paragraphe ${i + 1}`, p, 'long']));
  (f.points || []).forEach(([a, b], i) => { t.push([`points.${i}.0`, `Point fort ${i + 1} : titre`, a, 'court']); t.push([`points.${i}.1`, `Point fort ${i + 1} : texte`, b, 'court']); });
  (f.ponts || []).forEach(([a, b], i) => { t.push([`ponts.${i}.0`, `Pont ${i + 1} : nom`, a, 'court']); t.push([`ponts.${i}.1`, `Pont ${i + 1} : aménagement`, b, 'court']); });
  t.push(['cabines', 'Cabines', f.cabines, 'court']);
  return t;
}
const lire = (o, chemin) => chemin.split('.').reduce((x, k) => x?.[k], o);
const ecrire = (o, chemin, v) => { const k = chemin.split('.'); const fin = k.pop(); k.reduce((x, c) => x[c], o)[fin] = v; };

function vueYacht(el, slug) {
  const source = donnees.yachts.find((y) => y.slug === slug);
  if (!source) { el.innerHTML = '<p class="dir-vide">Yacht introuvable. <a class="link" href="#yachts">Retour à la flotte</a></p>'; return; }
  if (!edition || edition.slug !== slug) edition = structuredClone(source);
  const y = edition;
  const f = y.fiche;
  const tr = y.traductions || (y.traductions = {});
  const manque = (l) => textesDe(f).some(([, , fr]) => fr && !tr[l]?.[fr]) || (f.galerie || []).some((g) => g.alt && !tr[l]?.[g.alt]);
  const champTexte = ([chemin, libelle, fr, genre]) => {
    const id = `t-${chemin.replace(/\./g, '-')}`;
    const valeur = langueEdition === 'fr' ? fr : (tr[langueEdition]?.[fr] || '');
    const aide = langueEdition === 'fr' ? '' : `<small class="${valeur ? '' : 'a-traduire'}">${valeur ? '' : 'À traduire · '}Français : ${esc(fr)}</small>`;
    const input = genre === 'long'
      ? `<textarea id="${id}" rows="4" data-texte="${chemin}" data-ecrit>${esc(valeur)}</textarea>`
      : `<input id="${id}" value="${esc(valeur)}" data-texte="${chemin}" data-ecrit>`;
    return `<div class="champ champ--large champ--fr"><label for="${id}">${libelle}</label>${input}${aide}</div>`;
  };
  el.innerHTML = `
    <div class="dir-titre"><h2>${esc(y.nom)}</h2><p><a class="link" href="#yachts">Toute la flotte</a> · <a class="link" href="${RACINE}fr/flotte/${y.slug}/" target="_blank" rel="noopener">Voir la fiche publique</a></p></div>
    <form class="edition" data-form="yacht" novalidate>
      <fieldset>
        <legend>Général</legend>
        <div class="champs champs--3">
          <div class="champ"><label for="y-nom">Nom</label><input id="y-nom" name="nom" value="${esc(y.nom)}" maxlength="60" required data-ecrit></div>
          <div class="champ"><label for="y-port">Port d'attache</label><input id="y-port" name="port" value="${esc(y.port)}" data-ecrit></div>
          <div class="champ"><label for="y-invites">Invités</label><input id="y-invites" name="invites" type="number" min="1" max="36" value="${y.invites}" data-ecrit></div>
        </div>
        <label class="form__consent"><input type="checkbox" name="publie" ${y.publie ? 'checked' : ''} data-ecrit> <span>Visible sur le site</span></label>
      </fieldset>
      <fieldset>
        <legend>Prix</legend>
        <div class="champs champs--3">
          <div class="champ"><label for="y-vente">Prix de vente <small>(vide : pas à vendre)</small></label><input id="y-vente" name="vente" type="number" min="0" step="1000" value="${y.vente ?? ''}" data-ecrit><small class="ligne__sous" data-apercu="vente">${y.vente ? eur(y.vente) : 'Pas à vendre'}</small></div>
          <div class="champ"><label for="y-basse">Location, basse saison <small>(la semaine, vide : pas à louer)</small></label><input id="y-basse" name="location_basse" type="number" min="0" step="1000" value="${y.location_basse ?? ''}" data-ecrit><small class="ligne__sous" data-apercu="location_basse">${y.location_basse ? `${eur(y.location_basse)} la semaine` : 'Pas à louer'}</small></div>
          <div class="champ"><label for="y-haute">Location, haute saison <small>(la semaine)</small></label><input id="y-haute" name="location_haute" type="number" min="0" step="1000" value="${y.location_haute ?? ''}" data-ecrit><small class="ligne__sous" data-apercu="location_haute">${y.location_haute ? `${eur(y.location_haute)} la semaine` : '—'}</small></div>
        </div>
      </fieldset>
      <fieldset>
        <legend>Textes</legend>
        <div class="langues" role="group" aria-label="Langue des textes">${['fr', 'en', 'de', 'it'].map((l) => `<button type="button" data-langue="${l}" aria-pressed="${l === langueEdition}" class="${l !== 'fr' && manque(l) ? 'is-manque' : ''}">${l.toUpperCase()}</button>`).join('')}</div>
        <p class="ligne__sous">${langueEdition === 'fr' ? 'Le français est la langue de référence. Si vous modifiez un texte, pensez à mettre à jour ses traductions (repérées par un point rouge).' : `Traduction en ${LANGUES[langueEdition].toLowerCase()} : le texte français est rappelé sous chaque champ. Un champ vide garde le texte français sur le site.`}</p>
        <div class="champs">${textesDe(f).map(champTexte).join('')}</div>
      </fieldset>
      <fieldset>
        <legend>Photos</legend>
        <p class="ligne__sous">La photo bordée de laiton est l'image principale (en tête de fiche et dans la flotte). Les autres forment la galerie, dans cet ordre. Formats acceptés : JPEG, PNG ou WebP ; elles sont redimensionnées automatiquement.</p>
        <ul class="photos">
          ${(f.galerie || []).some((g) => g.src === f.image.src) ? '' : `<li class="photo photo--principale">
            <img src="${urlPhoto(f.image.src)}" alt="" loading="lazy">
            <div class="champ"><label for="alt-principale">Image principale · description ${langueEdition === 'fr' ? '' : `(${langueEdition.toUpperCase()})`}</label><input id="alt-principale" value="${esc(langueEdition === 'fr' ? f.image.alt : (tr[langueEdition]?.[f.image.alt] || ''))}" data-alt-principale placeholder="${esc(langueEdition === 'fr' ? 'Ce que montre la photo' : f.image.alt)}" data-ecrit></div>
            <p class="ligne__sous">En tête de fiche et dans la flotte. Pour la changer, cliquez sur « Principale » sous une photo de la galerie.</p>
          </li>`}
          ${(f.galerie || []).map((g, i) => `<li class="photo${g.src === f.image.src ? ' photo--principale' : ''}">
            <img src="${urlPhoto(g.src)}" alt="" loading="lazy">
            <div class="champ"><label for="alt-${i}">Description ${langueEdition === 'fr' ? '' : `(${langueEdition.toUpperCase()})`}</label><input id="alt-${i}" value="${esc(langueEdition === 'fr' ? g.alt : (tr[langueEdition]?.[g.alt] || ''))}" data-alt="${i}" placeholder="${esc(langueEdition === 'fr' ? 'Ce que montre la photo' : g.alt)}" data-ecrit></div>
            <div class="champ"><label for="pont-${i}">Pont</label><input id="pont-${i}" value="${esc(g.pont)}" data-pont="${i}" list="ponts-liste" data-ecrit></div>
            <div class="actions">
              <button class="lien-outil" type="button" data-photo="gauche" data-i="${i}" aria-label="Avancer la photo" data-ecrit>←</button>
              <button class="lien-outil" type="button" data-photo="droite" data-i="${i}" aria-label="Reculer la photo" data-ecrit>→</button>
              ${g.src === f.image.src ? '' : `<button class="lien-outil" type="button" data-photo="principale" data-i="${i}" data-ecrit>Principale</button>`}
              <button class="lien-outil" type="button" data-photo="retirer" data-i="${i}" data-ecrit>Retirer</button>
            </div>
          </li>`).join('')}
          <li><label class="envoi-photo" data-ecrit-label>Ajouter des photos<br><small>Cliquez pour choisir sur votre ordinateur</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden data-envoi data-ecrit></label></li>
        </ul>
        <datalist id="ponts-liste">${[...new Set((f.galerie || []).map((g) => g.pont))].map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
      </fieldset>
      <div class="barre-enregistrer">
        <button class="btn btn--light" type="submit" data-ecrit>Enregistrer les modifications</button>
        <button class="lien-outil" type="button" data-action="abandonner" data-ecrit>Abandonner</button>
        <p class="dir-note" role="status"></p>
      </div>
    </form>`;
}

// Recopie ce qui est saisi dans la copie de travail (appelé à chaque frappe)
function saisieYacht(e) {
  const y = edition;
  if (!y) return;
  const t = e.target;
  const tr = y.traductions;
  if (t.dataset.texte) {
    const ancien = lire(y.fiche, t.dataset.texte);
    if (langueEdition === 'fr') ecrire(y.fiche, t.dataset.texte, t.value);
    else { tr[langueEdition] ||= {}; tr[langueEdition][ancien] = t.value; }
  } else if (t.dataset.alt != null) {
    const g = y.fiche.galerie[Number(t.dataset.alt)];
    if (langueEdition === 'fr') {
      if (g.src === y.fiche.image.src) y.fiche.image.alt = t.value;
      g.alt = t.value;
    } else { tr[langueEdition] ||= {}; tr[langueEdition][g.alt] = t.value; }
  } else if (t.dataset.altPrincipale != null) {
    if (langueEdition === 'fr') y.fiche.image.alt = t.value;
    else { tr[langueEdition] ||= {}; tr[langueEdition][y.fiche.image.alt] = t.value; }
  } else if (t.dataset.pont != null) {
    y.fiche.galerie[Number(t.dataset.pont)].pont = t.value;
  } else if (t.name) {
    if (t.type === 'checkbox') y[t.name] = t.checked;
    else if (t.type === 'number') {
      y[t.name] = t.value === '' ? null : Number(t.value);
      const apercu = document.querySelector(`[data-apercu="${t.name}"]`);
      if (apercu) apercu.textContent = y[t.name] ? `${eur(y[t.name])}${t.name === 'vente' ? '' : ' la semaine'}` : (t.name === 'vente' ? 'Pas à vendre' : t.name === 'location_basse' ? 'Pas à louer' : '—');
    }
    else y[t.name] = t.value;
  }
}

function actionPhoto(bouton) {
  const f = edition.fiche;
  const i = Number(bouton.dataset.i);
  const g = f.galerie;
  const quoi = bouton.dataset.photo;
  if (quoi === 'gauche' && i > 0) [g[i - 1], g[i]] = [g[i], g[i - 1]];
  if (quoi === 'droite' && i < g.length - 1) [g[i + 1], g[i]] = [g[i], g[i + 1]];
  if (quoi === 'principale') {
    const photo = g[i];
    // L'ancienne image principale, si elle n'était pas dans la galerie, y entre en première position (rien ne se perd)
    if (!g.some((x) => x.src === f.image.src)) g.unshift({ ...f.image, pont: g[0]?.pont || 'Extérieur' });
    f.image = { src: photo.src, w: photo.w, h: photo.h, alt: photo.alt };
  }
  if (quoi === 'retirer') {
    if (g[i].src === f.image.src) { window.alert('Choisissez d\'abord une autre photo principale.'); return; }
    if (!window.confirm('Retirer cette photo de la galerie ?')) return;
    g.splice(i, 1);
  }
  afficher();
}

// Redimensionne une photo dans le navigateur (WebP 900 et 1600 px) puis l'envoie dans le stockage Supabase
async function envoyerPhotos(input) {
  const note = $('.barre-enregistrer .dir-note');
  const fichiers = [...input.files];
  for (const [k, fichier] of fichiers.entries()) {
    note.classList.remove('is-erreur');
    note.textContent = `Préparation de la photo ${k + 1} sur ${fichiers.length}…`;
    try {
      const image = await createImageBitmap(fichier);
      const cle = `${edition.slug}/${Date.now().toString(36)}${k}`;
      let dims = null;
      for (const largeur of [1600, 900]) {
        const l = Math.min(largeur, image.width);
        const h = Math.round((image.height * l) / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = l; canvas.height = h;
        canvas.getContext('2d').drawImage(image, 0, 0, l, h);
        const blob = await new Promise((ok) => canvas.toBlob(ok, 'image/webp', 0.82));
        if (!blob || blob.type !== 'image/webp') throw new Error('Ce navigateur ne sait pas préparer les photos : utilisez Chrome, Edge ou Firefox.');
        const { error } = await sb.storage.from('yachts').upload(`${cle}-${largeur}.webp`, blob, { contentType: 'image/webp', upsert: true });
        if (error) throw error;
        if (largeur === 1600) dims = { w: l, h };
      }
      const pont = edition.fiche.galerie[edition.fiche.galerie.length - 1]?.pont || 'Extérieur';
      edition.fiche.galerie.push({ src: `supabase:${cle}`, ...dims, pont, alt: '' });
    } catch (err) {
      note.textContent = err.message?.startsWith('Ce navigateur') ? err.message : `La photo « ${fichier.name} » n'a pas pu être envoyée. ${messageErreur(err)}`;
      note.classList.add('is-erreur');
      return;
    }
  }
  afficher();
  $('.barre-enregistrer .dir-note').textContent = `${fichiers.length > 1 ? `${fichiers.length} photos ajoutées` : 'Photo ajoutée'}. Donnez-lui une description, puis enregistrez.`;
}

async function enregistrerYacht(form) {
  const y = edition;
  const note = $('.barre-enregistrer .dir-note', form);
  note.classList.remove('is-erreur');
  if (!y.nom.trim()) { note.textContent = 'Le nom est obligatoire.'; note.classList.add('is-erreur'); return; }
  if ((y.location_basse == null) !== (y.location_haute == null)) { note.textContent = 'Indiquez les deux tarifs de location (basse et haute saison), ou aucun.'; note.classList.add('is-erreur'); return; }
  if (!y.fiche.image.alt.trim() || y.fiche.galerie.some((g) => !g.alt.trim())) { note.textContent = 'Chaque photo a besoin d\'une description (elle sert à Google et aux personnes malvoyantes).'; note.classList.add('is-erreur'); return; }
  // On ne garde que les traductions des textes encore présents dans la fiche
  const presents = new Set();
  (function tous(v) { if (typeof v === 'string') presents.add(v); else if (v && typeof v === 'object') Object.values(v).forEach(tous); }(y.fiche));
  presents.add(y.nom); presents.add(y.port);
  for (const l of Object.keys(y.traductions)) for (const k of Object.keys(y.traductions[l])) if (!presents.has(k) || !y.traductions[l][k]) delete y.traductions[l][k];
  const bouton = $('[type="submit"]', form);
  bouton.disabled = true;
  note.textContent = 'Enregistrement…';
  const { error } = await sb.from('yachts').update({
    nom: y.nom.trim(), port: y.port.trim(), invites: y.invites, publie: y.publie,
    vente: y.vente || null, location_basse: y.location_basse || null, location_haute: y.location_haute || null,
    fiche: y.fiche, traductions: y.traductions,
  }).eq('slug', y.slug);
  bouton.disabled = false;
  if (error) { note.textContent = messageErreur(error); note.classList.add('is-erreur'); return; }
  await charger(['yachts', 'bord']);
  edition = null;
  afficher();
  $('.barre-enregistrer .dir-note').textContent = 'Enregistré. Les réservations utilisent déjà ces prix ; les pages du site seront mises à jour à la prochaine publication.';
}

// ---------------------------------------------------------------------------------------------
// Réglages de la saison
// ---------------------------------------------------------------------------------------------
function vueReglages(el) {
  const R = donnees.reglages;
  el.innerHTML = `
    <div class="dir-titre"><h2>Réglages de la saison</h2><p>Ces règles s'appliquent immédiatement aux réservations en ligne.</p></div>
    <form class="edition" data-form="reglages" novalidate>
      <fieldset>
        <legend>Saison ${R.annee}</legend>
        <div class="champs champs--2">
          <div class="champ"><label for="r-annee">Année</label><input id="r-annee" name="annee" type="number" value="${R.annee}" data-ecrit></div>
          <div class="champ"><label for="r-ports">Ports d'embarquement proposés <small>(séparés par des virgules)</small></label><input id="r-ports" name="ports" value="${esc(R.ports.join(', '))}" data-ecrit></div>
          <div class="champ"><label for="r-sd">Premier embarquement possible</label><input id="r-sd" name="saison_debut" type="date" value="${R.saison_debut}" data-ecrit></div>
          <div class="champ"><label for="r-sf">Dernier débarquement possible</label><input id="r-sf" name="saison_fin" type="date" value="${R.saison_fin}" data-ecrit></div>
          <div class="champ"><label for="r-hd">Début de la haute saison <small>(première nuit)</small></label><input id="r-hd" name="haute_debut" type="date" value="${R.haute_debut}" data-ecrit></div>
          <div class="champ"><label for="r-hf">Fin de la haute saison <small>(jour de débarquement)</small></label><input id="r-hf" name="haute_fin" type="date" value="${R.haute_fin}" data-ecrit></div>
          <div class="champ"><label for="r-mh">Nuits minimum en haute saison</label><input id="r-mh" name="min_nuits_haute" type="number" min="1" max="28" value="${R.min_nuits_haute}" data-ecrit></div>
          <div class="champ"><label for="r-mb">Nuits minimum en basse saison</label><input id="r-mb" name="min_nuits_basse" type="number" min="1" max="28" value="${R.min_nuits_basse}" data-ecrit></div>
          <div class="champ"><label for="r-hmin">Embarquement au plus tôt</label><input id="r-hmin" name="heure_min" type="time" value="${R.heure_min.slice(0, 5)}" data-ecrit></div>
          <div class="champ"><label for="r-hmax">Embarquement au plus tard</label><input id="r-hmax" name="heure_max" type="time" value="${R.heure_max.slice(0, 5)}" data-ecrit></div>
        </div>
      </fieldset>
      <div class="barre-enregistrer"><button class="btn btn--light" type="submit" data-ecrit>Enregistrer les réglages</button><p class="dir-note" role="status"></p></div>
    </form>`;
}

async function enregistrerReglages(form) {
  const v = Object.fromEntries(new FormData(form));
  const note = $('.dir-note', form);
  note.classList.remove('is-erreur');
  const maj = {
    annee: Number(v.annee), saison_debut: v.saison_debut, saison_fin: v.saison_fin, haute_debut: v.haute_debut, haute_fin: v.haute_fin,
    min_nuits_haute: Number(v.min_nuits_haute), min_nuits_basse: Number(v.min_nuits_basse), heure_min: v.heure_min, heure_max: v.heure_max,
    ports: v.ports.split(',').map((p) => p.trim()).filter(Boolean),
  };
  if (maj.saison_fin <= maj.saison_debut || maj.haute_fin <= maj.haute_debut) { note.textContent = 'Vérifiez les dates : chaque fin doit suivre son début.'; note.classList.add('is-erreur'); return; }
  const { error } = await sb.from('reglages').update(maj).eq('id', true);
  if (error) { note.textContent = messageErreur(error); note.classList.add('is-erreur'); return; }
  await charger(['reglages', 'bord']);
  afficher();
  $('[data-vue="reglages"] .dir-note').textContent = 'Réglages enregistrés : ils s\'appliquent dès maintenant aux réservations.';
}

// ---------------------------------------------------------------------------------------------
// Navigation et événements
// ---------------------------------------------------------------------------------------------
const VUES = { bord: vueBord, reservations: vueReservations, calendrier: vueCalendrier, demandes: vueDemandes, yachts: vueYachts, clients: vueClients, reglages: vueReglages };

function afficher() {
  const [vue, detail] = (location.hash.slice(1) || 'bord').split('/');
  const nom = VUES[vue] ? vue : 'bord';
  if (nom !== 'yachts' || !detail) edition = null;
  $$('[data-vue]').forEach((s) => { s.hidden = s.dataset.vue !== nom; });
  $$('.dir-onglets a').forEach((a) => (a.getAttribute('href') === `#${nom}` ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const el = $(`[data-vue="${nom}"]`);
  VUES[nom](el, detail);
  if (demo) $$('[data-ecrit]', el).forEach((c) => { c.disabled = true; c.title = 'Lecture seule en démonstration'; });
}

function etat(nom) {
  $('.dir-chargement').hidden = true;
  $$('[data-etat]').forEach((e) => { e.hidden = e.dataset.etat !== nom; });
  const ouvert = nom === 'ouvert';
  $('.dir-onglets').hidden = !ouvert;
  $('.dir-top__moi').hidden = !ouvert && nom !== 'refuse';
}

document.addEventListener('click', async (e) => {
  const c = e.target.closest('button, [data-voir-resa]');
  if (!c) return;
  const d = c.dataset;
  if (d.action === 'connexion') { const s = await demanderConnexion({ raison: 'Espace réservé à la direction de Portolan.' }); if (s) demarrer(); }
  if (d.action === 'demo') {
    c.disabled = true;
    sb ??= await db();
    const { error } = await sb.auth.signInWithPassword(DEMO);
    c.disabled = false;
    if (error) { const n = $('[data-etat="deconnecte"] .dir-note'); n.textContent = messageErreur(error); n.classList.add('is-erreur'); return; }
    demarrer();
  }
  if (d.action === 'deconnexion') { await deconnexion(); moi = null; location.hash = ''; etat('deconnecte'); }
  if (d.action === 'blocage') { const f = $('[data-form="blocage"]'); f.hidden = !f.hidden; if (!f.hidden) f.querySelector('select').focus(); }
  if (d.action === 'abandonner') { edition = null; location.hash = '#yachts'; }
  if (d.filtreResa) { filtreResa = d.filtreResa; afficher(); }
  if (d.filtreDemandes) { filtreDemandes = d.filtreDemandes; afficher(); }
  if (d.decider) decider(c);
  if (d.voirResa) { ouvrirResa = d.voirResa; filtreResa = 'toutes'; location.hash = '#reservations'; }
  if (d.supprimerBlocage) {
    if (!window.confirm('Libérer ces dates ? Elles redeviennent réservables sur le site.')) return;
    const { error } = await sb.from('reservations').delete().eq('id', d.supprimerBlocage);
    if (error) { window.alert(messageErreur(error)); return; }
    await charger(['bord', 'resas']); afficher();
  }
  if (d.traiter) {
    const { error } = await sb.from('demandes').update({ traitee: d.valeur === 'true' }).eq('id', d.traiter);
    if (error) { window.alert(messageErreur(error)); return; }
    await charger(['bord', 'demandes']); afficher();
  }
  if (d.langue) { langueEdition = d.langue; afficher(); }
  if (d.photo) actionPhoto(c);
});
document.addEventListener('input', (e) => {
  if (e.target.closest('[data-form="yacht"]') && !e.target.matches('[data-envoi]')) saisieYacht(e);
  if (e.target.matches('[data-recherche-resa]')) {
    rechercheResa = e.target.value;
    const pos = e.target.selectionStart;
    afficher();
    const champ = $('[data-recherche-resa]');
    champ.focus(); champ.setSelectionRange(pos, pos);
  }
});
document.addEventListener('change', (e) => {
  if (e.target.matches('[data-envoi]')) envoyerPhotos(e.target);
  else if (e.target.closest('[data-form="yacht"]')) saisieYacht(e);
});
document.addEventListener('submit', (e) => {
  const f = e.target;
  e.preventDefault();
  if (f.dataset.form === 'blocage') bloquer(f);
  if (f.dataset.form === 'yacht') enregistrerYacht(f);
  if (f.dataset.form === 'reglages') enregistrerReglages(f);
});
window.addEventListener('hashchange', () => { if (moi) afficher(); });
window.addEventListener('beforeunload', (e) => { if (edition && JSON.stringify(edition) !== JSON.stringify(donnees.yachts.find((y) => y.slug === edition.slug))) e.preventDefault(); });

async function demarrer() {
  try {
    sb ??= await db();
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user) { etat('deconnecte'); return; }
    const { data: profil } = await sb.from('profils').select('*').eq('id', user.id).maybeSingle();
    if (!profil || !['directeur', 'demo'].includes(profil.role)) { moi = null; etat('refuse'); return; }
    moi = profil;
    demo = profil.role === 'demo';
    $('.dir-top__nom').textContent = demo ? 'Démonstration' : (profil.nom || profil.email);
    $('.dir-demo').hidden = !demo;
    await charger();
    etat('ouvert');
    afficher();
  } catch (err) {
    $('.dir-chargement').hidden = false;
    $('.dir-chargement').textContent = messageErreur(err);
  }
}

demarrer();
