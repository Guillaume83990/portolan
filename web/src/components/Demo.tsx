'use client';
// Mode démonstration : chaque bouton qui écrit est désactivé, avec l'info-bulle « Lecture seule en démonstration ».
// (La vraie protection est dans la base : le compte de démonstration ne peut rien modifier.)
import { createContext, useContext, type ButtonHTMLAttributes } from 'react';

const Ctx = createContext(false);
export const DemoFournisseur = ({ demo, children }: { demo: boolean; children: React.ReactNode }) => <Ctx.Provider value={demo}>{children}</Ctx.Provider>;
export const useDemo = () => useContext(Ctx);
export const LECTURE_SEULE = 'Lecture seule en démonstration';

export function BoutonEcrit({ onClick, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const demo = useDemo();
  if (demo) return <button {...props} type="button" aria-disabled="true" title={LECTURE_SEULE} onClick={(e) => e.preventDefault()} />;
  return <button {...props} type={type} onClick={onClick} />;
}
