// Apparitions au défilement, sans ScrollTrigger.
// ScrollTrigger mesure la position de chaque élément au chargement (et à chaque redimensionnement) : avec une
// quarantaine d'apparitions par page, le navigateur restait bloqué près d'une seconde sur téléphone (mauvais score
// PageSpeed). Ici, un IntersectionObserver par hauteur de déclenchement : c'est le navigateur qui signale l'entrée
// à l'écran, sans aucun calcul de mise en page. ScrollTrigger reste utilisé pour les effets liés au défilement
// (parallaxes, textes qui s'allument, visite du hero).
const observateurs = new Map();

function observateur(pourcent) {
  if (!observateurs.has(pourcent)) {
    const io = new IntersectionObserver((entrees) => {
      for (const e of entrees) {
        // Dans l'écran, ou déjà dépassé (arrivée par une ancre, page rechargée plus bas)
        if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;
        io.unobserve(e.target);
        const actions = e.target.__apparitions || [];
        delete e.target.__apparitions;
        actions.forEach((f) => f());
      }
    }, { rootMargin: `0px 0px -${100 - pourcent}% 0px` });
    observateurs.set(pourcent, io);
  }
  return observateurs.get(pourcent);
}

// Lance fn quand le haut de l'élément atteint `pourcent` % de la hauteur de l'écran (équivalent de start: 'top 90%')
export function aLEcran(el, fn, pourcent = 90) {
  const cible = typeof el === 'string' ? document.querySelector(el) : el;
  if (!cible) return;
  (cible.__apparitions ||= []).push(fn);
  observateur(pourcent).observe(cible);
}

// Réglages d'animation (tout le reste décrit l'état de départ)
const REGLAGES = new Set(['duration', 'ease', 'stagger', 'delay', 'transformOrigin']);
const ARRIVEE = { autoAlpha: 1, opacity: 1, x: 0, y: 0 };

// Un gsap.from joué à l'entrée dans l'écran. L'état de départ est posé tout de suite : pas de saut visible.
// Cas le plus courant (fondu + petite montée) : on se contente de masquer l'élément par une simple écriture,
// sans que GSAP ait à lire son style au chargement ; le mouvement complet est calculé au moment de l'apparition.
export function revele(cibles, vars, declencheur, pourcent = 90) {
  const liste = typeof cibles === 'string' ? [...document.querySelectorAll(cibles)] : (cibles instanceof Element ? [cibles] : [...cibles]);
  if (!liste.length) return null;
  const depart = Object.keys(vars).filter((k) => !REGLAGES.has(k));
  const simple = (vars.autoAlpha === 0 || vars.opacity === 0) && depart.every((k) => k in ARRIVEE);
  if (simple) {
    liste.forEach((el) => { el.style.opacity = '0'; if ('autoAlpha' in vars) el.style.visibility = 'hidden'; });
    const vers = Object.fromEntries([...depart.map((k) => [k, ARRIVEE[k]]), ...Object.entries(vars).filter(([k]) => REGLAGES.has(k))]);
    aLEcran(declencheur || liste[0], () => window.gsap.fromTo(liste, Object.fromEntries(depart.map((k) => [k, vars[k]])), vers), pourcent);
    return null;
  }
  const tw = window.gsap.from(liste, { ...vars, paused: true });
  aLEcran(declencheur || liste[0], () => tw.play(), pourcent);
  return tw;
}
