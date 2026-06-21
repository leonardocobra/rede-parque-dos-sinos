import { BRAND } from "../../brand";

export default function Footer() {
  return (
    <footer className="border-t border-brand-border py-6 px-5 text-right bg-brand-surface">
      <div className="font-mono font-extrabold text-base mb-1">a_rede.</div>
      <div className="text-[11px] text-brand-grey-light">
        Nascida no Parque dos Sinos · Jacareí–SP
        <br />
        Uma iniciativa comunitária
      </div>
      <div className="w-10 h-[3px] bg-brand-red ml-auto mt-3 rounded-sm" />
    </footer>
  );
}
