// Traduction des pages de la flotte (EN, DE, IT) côté serveur : fonction « transform » de tools/traduire.cjs,
// reprise telle quelle et exécutée avec linkedom (même API que le navigateur). Dictionnaire : empreinte du texte
// français normalisé → traduction (tools/i18n + traductions des yachts saisies dans l'espace directeur).
import { DOMParser } from 'linkedom';

export function transform(html, o) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const missing = [];
  const norm = (s) => s.replace(/\u2011/g, '-').replace(/[\u202F\u00A0]/g, ' ').replace(/&nbsp;|&#160;|&#8239;|&#8209;/g, (m) => (m === '&#8209;' ? '-' : ' ')).replace(/’/g, "'").replace(/\s+/g, ' ').trim();
  const plain = (s) => norm(s.replace(/<[^>]+>/g, ''));
  const hash = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
  const nomRe = new RegExp(o.noms.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|'), 'g');
  const identity = (text) => !/[a-zà-ÿœ]{2,}/i.test(text.replace(nomRe, ' ').replace(/\b(m|km|kn|h|k€|M€|€|°C|cm|mm)\b/g, ' ').replace(/[^A-Za-zÀ-ÿœ]+/g, ' '));
  const look = (key, where) => {
    if (!key) return null;
    const h = hash(key);
    if (h in o.dict) return o.dict[h];
    if (!identity(plain(key))) missing.push([key, where]);
    return null;
  };
  const lookPlain = (text, where) => {
    const k = norm(text);
    if (!k) return null;
    const h = hash(k);
    if (h in o.dict) return plain(o.dict[h]).replace(/&amp;/g, '&');
    if (!identity(k)) missing.push([k, where]);
    return null;
  };

  // 1. Textes : un « segment » est un élément qui ne contient que du texte et des balises de mise en forme
  const FORMAT = new Set(['EM', 'STRONG', 'B', 'I', 'BR', 'SUP', 'SUB', 'SMALL', 'ABBR', 'Q', 'CITE', 'U', 'S', 'MARK', 'TIME']);
  const INLINE = new Set([...FORMAT, 'A', 'SPAN']);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT', 'TEMPLATE', 'CODE', 'CANVAS']);
  const CONTAINER = new Set(['NAV', 'DIV', 'UL', 'OL', 'SECTION', 'HEADER', 'FOOTER', 'FORM', 'FIELDSET', 'DL', 'ARTICLE', 'FIGURE', 'MAIN', 'BODY', 'TABLE', 'TBODY', 'TR', 'ASIDE']);
  const isSegment = (el) => {
    if (CONTAINER.has(el.tagName)) return false;
    if (!/[A-Za-zÀ-ÿ]/.test(el.textContent)) return false;
    for (const d of el.querySelectorAll('*')) {
      if (!INLINE.has(d.tagName)) return false;
      if ((d.tagName === 'A' || d.tagName === 'SPAN') && [...d.children].some((c) => !FORMAT.has(c.tagName))) return false;
    }
    return true;
  };
  const visit = (el) => {
    if (SKIP.has(el.tagName)) return;
    if (el.namespaceURI === 'http://www.w3.org/2000/svg' && !['svg', 'g', 'title', 'text'].includes(el.tagName)) return;
    if (isSegment(el)) {
      const t = look(norm(el.innerHTML), el.tagName);
      if (t != null) el.innerHTML = t;
      return;
    }
    for (const n of [...el.childNodes]) {
      if (n.nodeType === 3 && /[A-Za-zÀ-ÿ]/.test(n.textContent)) {
        const t = look(norm(n.textContent), `texte dans ${el.tagName}`);
        if (t != null) n.textContent = n.textContent.match(/^\s*/)[0] + t + n.textContent.match(/\s*$/)[0];
      } else if (n.nodeType === 1) visit(n);
    }
  };
  visit(doc.body);
  const title = doc.querySelector('title');
  if (title) { const t = lookPlain(title.textContent, 'title'); if (t != null) title.textContent = t; }

  // 2. Attributs lisibles
  for (const el of doc.querySelectorAll('[alt], [placeholder], [aria-label], [data-cursor], [data-note], [data-name], [title]:not(link):not(svg *)')) {
    for (const a of ['alt', 'placeholder', 'aria-label', 'data-cursor', 'data-note', 'data-name', 'title']) {
      if (!el.hasAttribute(a) || !el.getAttribute(a).trim()) continue;
      const t = lookPlain(el.getAttribute(a), `@${a}`);
      if (t != null) el.setAttribute(a, t);
    }
  }
  for (const m of doc.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[property="og:image:alt"]')) {
    const t = lookPlain(m.getAttribute('content'), m.getAttribute('name') || m.getAttribute('property'));
    if (t != null) m.setAttribute('content', t);
  }

  // Listes « Langue » des formulaires : la langue de la page est présélectionnée
  const LANG_NAMES = { fr: 'Français', en: 'English', de: 'Deutsch', it: 'Italiano' };
  for (const sel of doc.querySelectorAll('select')) {
    const opts = [...sel.querySelectorAll('option')];
    if (!opts.some((op) => op.textContent.trim() === 'Français')) continue;
    opts.forEach((op) => { if (op.textContent.trim() === LANG_NAMES[o.lang]) op.setAttribute('selected', ''); else op.removeAttribute('selected'); });
  }

  // Titres des étapes de visite (objet JSON dans data-pieces)
  for (const el of doc.querySelectorAll('[data-pieces]')) {
    try {
      const obj = JSON.parse(el.getAttribute('data-pieces'));
      for (const k of Object.keys(obj)) { const t = lookPlain(obj[k], '@data-pieces'); if (t != null) obj[k] = t; }
      el.setAttribute('data-pieces', JSON.stringify(obj));
    } catch (e) { missing.push(['data-pieces illisible', e.message]); }
  }

  // 3. Adresses : chaque lien vers une page française pointe vers la page de la langue cible
  const target = o.localize[o.lang][o.frPath];
  const rel = (from, to) => {
    const [toPath, suffix = ''] = to.split(/(?=[#?])/);
    const a = from.split('/').filter(Boolean); const b = toPath.split('/').filter(Boolean);
    let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    const r = '../'.repeat(a.length - i) + b.slice(i).join('/') + (toPath.endsWith('/') && b.length > i ? '/' : '');
    return (r || './') + suffix;
  };
  const mapPath = (p, lang = o.lang) => o.localize[lang][p.split(/[#?]/)[0]] ? o.localize[lang][p.split(/[#?]/)[0]] + p.slice(p.split(/[#?]/)[0].length) : p;
  for (const a of doc.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (/^(#|mailto:|tel:)/.test(href)) continue;
    if (href.startsWith('https://wa.me/')) {
      const u = new URL(href);
      const t = u.searchParams.get('text') && lookPlain(u.searchParams.get('text'), 'whatsapp');
      if (t) { u.searchParams.set('text', t); a.setAttribute('href', u.toString().replace(/\+/g, '%20')); }
      continue;
    }
    if (/^https?:/.test(href) && !href.startsWith(o.site)) continue;
    const abs = new URL(href, o.site + o.frPath);
    if (!abs.pathname.startsWith('/fr/')) continue;
    a.setAttribute('href', rel(target, mapPath(abs.pathname + abs.hash)));
  }
  // Sélecteur de langue
  for (const a of doc.querySelectorAll('.lang__list a[hreflang]')) {
    const l = a.getAttribute('hreflang');
    a.setAttribute('href', rel(target, o.localize[l][o.frPath]));
    if (l === o.lang) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  const cur = doc.querySelector('.lang__current');
  if (cur) for (const n of cur.childNodes) if (n.nodeType === 3 && /FR/.test(n.textContent)) n.textContent = n.textContent.replace('FR', o.lang.toUpperCase());
  // En-tête : canonique, hreflang, Open Graph
  doc.querySelector('link[rel="canonical"]')?.setAttribute('href', o.site + target);
  for (const l of doc.querySelectorAll('link[rel="alternate"][hreflang]')) {
    const h = l.getAttribute('hreflang');
    l.setAttribute('href', o.site + o.localize[h === 'x-default' ? 'en' : h][o.frPath]);
  }
  doc.querySelector('meta[property="og:url"]')?.setAttribute('content', o.site + target);
  doc.querySelector('meta[property="og:locale"]')?.setAttribute('content', o.locales[o.lang]);
  const alts = [...doc.querySelectorAll('meta[property="og:locale:alternate"]')];
  const others = Object.keys(o.locales).filter((l) => l !== o.lang);
  alts.forEach((m, k) => m.setAttribute('content', o.locales[others[k]]));

  // 4. Données structurées : textes traduits, adresses réécrites
  const KEEP = new Set(['@type', '@context', 'telephone', 'email', 'priceCurrency', 'priceRange', 'addressCountry', 'postalCode', 'streetAddress', 'addressLocality', 'addressRegion', 'inLanguage', 'knowsLanguage', 'availableLanguage', 'areaServed', 'contactType', 'image', 'latitude', 'longitude', 'price']);
  const fixUrl = (s) => {
    if (!s.startsWith(o.site + '/fr/')) return s;
    const u = new URL(s);
    return o.site + mapPath(u.pathname) + u.hash;
  };
  const deep = (v, k) => {
    if (Array.isArray(v)) return v.map((x) => deep(x, k));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, deep(vv, kk)]));
    if (typeof v !== 'string') return v;
    if (['url', 'item', '@id'].includes(k)) return fixUrl(v);
    if (KEEP.has(k)) return v;
    const t = lookPlain(v, `json-ld ${k}`);
    return t != null ? t : v;
  };
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try { s.textContent = `\n${JSON.stringify(deep(JSON.parse(s.textContent)), null, 2).replace(/</g, '\\u003c')}\n  `; } catch (e) { missing.push(['JSON-LD illisible', e.message]); }
  }

  doc.documentElement.lang = o.lang;
  return { html: `<!doctype html>\n${doc.documentElement.outerHTML}\n`, missing };
}
