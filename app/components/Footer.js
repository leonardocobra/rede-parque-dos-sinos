import { BRAND } from "../brand";

export default function Footer() {
  return (
    <footer className="border-t border-brand-border py-6 px-5 text-center bg-brand-surface">
      <div className="font-display text-base mb-1">{BRAND.nomeCompleto}</div>
      <div className="text-[11px] text-brand-grey-light">
        {BRAND.origemLonga} · Uma iniciativa comunitária
      </div>
      <div className="w-10 h-[3px] bg-brand-red mx-auto mt-3 rounded-sm" />
    </footer>
  );
}
