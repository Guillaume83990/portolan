// Menu mobile (écrans de moins de 861 px) : un bouton dans l'en-tête ouvre un panneau plein écran
// avec les liens de la navigation, les langues et les moyens de contact.
// Construit à partir du HTML existant (.header__nav, .lang__list, .wa) : rien à dupliquer dans les pages.
const TXT = {
  fr: { open: 'Menu', close: 'Fermer', label: 'Menu principal', call: 'Appeler Saint‑Tropez', wa: 'WhatsApp' },
  en: { open: 'Menu', close: 'Close', label: 'Main menu', call: 'Call Saint‑Tropez', wa: 'WhatsApp' },
  de: { open: 'Menü', close: 'Schließen', label: 'Hauptmenü', call: 'Saint‑Tropez anrufen', wa: 'WhatsApp' },
  it: { open: 'Menu', close: 'Chiudi', label: 'Menu principale', call: 'Chiama Saint‑Tropez', wa: 'WhatsApp' },
};

export function initMenu(lenis) {
  const header = document.querySelector('.header');
  const nav = header?.querySelector('.header__nav');
  if (!nav || header.querySelector('.menu-toggle')) return;
  const { gsap } = window;
  const t = TXT[document.documentElement.lang] || TXT.fr;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const button = document.createElement('button');
  button.className = 'menu-toggle';
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'menu-panel');
  button.innerHTML = `<span class="menu-toggle__label">${t.open}</span><span class="menu-toggle__icon" aria-hidden="true"><i></i><i></i></span>`;
  header.insertBefore(button, header.querySelector('.lang'));

  const links = [...nav.querySelectorAll('a')].map((a, k) => `<li><a href="${a.getAttribute('href')}"${a.hasAttribute('aria-current') ? ' aria-current="page"' : ''}><span>${String(k + 1).padStart(2, '0')}</span>${a.textContent}</a></li>`).join('');
  const langs = [...document.querySelectorAll('.lang__list a')].map((a) => `<a href="${a.getAttribute('href')}" hreflang="${a.hreflang}" lang="${a.lang}"${a.hasAttribute('aria-current') ? ' aria-current="page"' : ''}>${a.lang.toUpperCase()}</a>`).join('');
  const wa = document.querySelector('.wa')?.getAttribute('href');
  const compte = header.querySelector('.compte-lien');

  const panel = document.createElement('div');
  panel.className = 'menu';
  panel.id = 'menu-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <nav class="menu__nav" aria-label="${t.label}"><ol>${links}</ol></nav>
    <div class="menu__foot">
      <p class="menu__langs">${langs}</p>
      <p class="menu__contact">${compte ? `<a href="${compte.getAttribute('href')}">${compte.textContent.trim()}</a>` : ''}<a href="tel:+33494000000">${t.call}</a>${wa ? `<a href="${wa}" target="_blank" rel="noopener">${t.wa}</a>` : ''}</p>
    </div>`;
  header.after(panel);

  const items = panel.querySelectorAll('.menu__nav li, .menu__foot > *');
  let open = false;
  const set = (value) => {
    open = value;
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('.menu-toggle__label').textContent = open ? t.close : t.open;
    document.documentElement.classList.toggle('has-menu', open);
    if (open) {
      panel.hidden = false;
      lenis?.stop();
      if (!reduce && gsap) {
        gsap.fromTo(panel, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.out' });
        gsap.fromTo(items, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out', stagger: 0.045, delay: 0.15 });
      }
      panel.querySelector('a')?.focus({ preventScroll: true });
    } else {
      lenis?.start();
      const done = () => { panel.hidden = true; };
      if (!reduce && gsap) gsap.to(panel, { clipPath: 'inset(0 0 100% 0)', duration: 0.5, ease: 'expo.in', onComplete: done });
      else done();
    }
  };
  button.addEventListener('click', () => set(!open));
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { set(false); button.focus(); }
    if (e.key === 'Tab') {
      // Le focus reste dans le menu tant qu'il est ouvert
      const f = [button, ...panel.querySelectorAll('a')];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (m) => { if (m.matches && open) set(false); });
}
