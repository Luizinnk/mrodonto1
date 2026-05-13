import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, Menu, ShieldCheck, X } from "lucide-react";

const links = [
  { to: "/", label: "Início" },
  { to: "/servicos", label: "Serviços" },
  { to: "/agenda", label: "Agenda" },
  { to: "/sobre", label: "Sobre" },
  { to: "/localizacao", label: "Localização" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-white/90 text-foreground shadow-[0_16px_44px_rgb(15_42_58_/_0.08)] backdrop-blur-xl">
      <div className="max-w-[1280px] mx-auto px-6 h-[88px] flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/mr-brand/logo-compact.png"
            alt="MR Odontologia e Estética"
            className="h-20 w-[210px] object-contain object-left"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3.5 py-2 text-[13px] text-foreground/62 hover:text-foreground transition-colors"
              activeProps={{ className: "px-3.5 py-2 text-[13px] text-[var(--petrol)] font-semibold border-b border-[var(--gold)]" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--clinical)] bg-[var(--clinical-light)] px-3.5 py-2 text-[12px] font-semibold text-[var(--petrol)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            CRO-PR 33538
          </span>
          <Link to="/agenda" className="ml-3 btn-luxe !py-2 !px-5 !text-[13px]">
            <CalendarCheck className="h-4 w-4" />
            Agendar agora
          </Link>
        </nav>

        <button
          className="md:hidden grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-white/95 backdrop-blur-xl">
          <div className="flex flex-col p-4 gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="font-serif text-2xl py-2 text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <Link to="/agenda" onClick={() => setOpen(false)} className="btn-luxe mt-3 justify-center">
              <CalendarCheck className="h-4 w-4" />
              Agendar horário
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
