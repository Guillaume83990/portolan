// La rose des vents du logo Portolan
export function Rose({ className = 'brand__rose' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 1v30M1 16h30M5.4 5.4l21.2 21.2M26.6 5.4L5.4 26.6" />
      <circle cx="16" cy="16" r="6.5" />
    </svg>
  );
}

// Petite carte marine au trait des états vides
export function CarteVide() {
  return (
    <svg viewBox="0 0 112 80" aria-hidden="true">
      <path d="M8 62c14-6 20 2 32-4s14-18 28-20 22 6 36-2" />
      <path d="M56 8v64M24 40h64M33 17l46 46M79 17L33 63" strokeDasharray="2 4" />
      <circle cx="56" cy="40" r="9" />
      <path d="M56 31l2.5 9-2.5 9-2.5-9z" />
    </svg>
  );
}
