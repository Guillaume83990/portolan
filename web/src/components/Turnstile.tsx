'use client';
// Protection anti-robot Cloudflare Turnstile (gratuite). Le défi n'apparaît que si Cloudflare a un doute.
// Le jeton (à usage unique) accompagne chaque connexion, création de compte ou envoi de formulaire :
// Supabase le vérifie pour les comptes (protection CAPTCHA activée dans le projet), le serveur pour nos formulaires.
// Sans NEXT_PUBLIC_TURNSTILE_SITE_KEY, le composant ne fait rien.
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';

type Widget = { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id: string) => void; remove: (id: string) => void };
declare global { interface Window { turnstile?: Widget; onTurnstilePret?: () => void } }

export type TurnstileApi = { jeton: () => Promise<string | undefined>; reinitialiser: () => void };
const CLE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstilePret';

let chargement: Promise<Widget> | null = null;
function charger() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  chargement ??= new Promise<Widget>((ok) => {
    window.onTurnstilePret = () => ok(window.turnstile!);
    const s = document.createElement('script');
    s.src = SCRIPT; s.async = true; s.defer = true;
    document.head.appendChild(s);
  });
  return chargement;
}

export function Turnstile({ ref, langue = 'fr', sombre = false }: { ref: Ref<TurnstileApi>; langue?: string; sombre?: boolean }) {
  const boite = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  const jeton = useRef<string | undefined>(undefined);
  const attente = useRef<((t: string | undefined) => void)[]>([]);

  useEffect(() => {
    if (!CLE || !boite.current) return;
    let fini = false;
    charger().then((w) => {
      if (fini || !boite.current) return;
      id.current = w.render(boite.current, {
        sitekey: CLE, language: langue, theme: sombre ? 'dark' : 'light', appearance: 'interaction-only', size: 'flexible',
        callback: (t: string) => { jeton.current = t; attente.current.splice(0).forEach((f) => f(t)); },
        'expired-callback': () => { jeton.current = undefined; },
        'error-callback': () => { attente.current.splice(0).forEach((f) => f(undefined)); },
      });
    });
    return () => { fini = true; if (id.current && window.turnstile) window.turnstile.remove(id.current); id.current = null; };
  }, [langue, sombre]);

  useImperativeHandle(ref, () => ({
    // Attend le jeton (15 s au plus) ; sans clé configurée : aucun jeton, la vérification est désactivée
    jeton: () => {
      if (!CLE) return Promise.resolve(undefined);
      if (jeton.current) return Promise.resolve(jeton.current);
      return new Promise((ok) => { attente.current.push(ok); setTimeout(() => ok(undefined), 15_000); });
    },
    // Un jeton ne sert qu'une fois : on en redemande un après chaque envoi
    reinitialiser: () => { jeton.current = undefined; if (id.current && window.turnstile) window.turnstile.reset(id.current); },
  }), []);

  if (!CLE) return null;
  return <div ref={boite} className="turnstile" style={{ marginTop: '.75rem' }} />;
}
