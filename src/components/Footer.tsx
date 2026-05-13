import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground px-6 pt-16 pb-8 mt-24">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
          <div>
            <img src="/mr-brand/logo-compact.png" alt="MR Odontologia e Estética" className="h-24 w-auto object-contain" />
            <p className="text-sm mt-4 text-white/55 leading-relaxed font-light">
              Clínica odontológica focada em estética, reabilitação e uma experiência de atendimento precisa, clara e acolhedora.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--gold)]" />
              Protocolos de biossegurança
            </div>
          </div>
          <div>
            <h4 className="text-[11px] tracking-[0.14em] uppercase text-[var(--gold)] mb-4 font-sans font-medium">Navegar</h4>
            <Link to="/servicos" className="block text-sm text-white/60 hover:text-white mb-2">Serviços</Link>
            <Link to="/agenda" className="block text-sm text-white/60 hover:text-white mb-2">Agendar</Link>
            <Link to="/sobre" className="block text-sm text-white/60 hover:text-white mb-2">Sobre</Link>
            <Link to="/localizacao" className="block text-sm text-white/60 hover:text-white mb-2">Localização</Link>
          </div>
          <div>
            <h4 className="text-[11px] tracking-[0.14em] uppercase text-[var(--gold)] mb-4 font-sans font-medium">Contato</h4>
            <p className="flex items-start gap-2 text-sm text-white/60 mb-2"><Mail className="h-4 w-4 mt-0.5 text-[var(--gold)]" /> contato@mrodonto.com</p>
            <p className="flex items-start gap-2 text-sm text-white/60 mb-2"><Phone className="h-4 w-4 mt-0.5 text-[var(--gold)]" /> +55 41 98855-1599</p>
            <p className="flex items-start gap-2 text-sm text-white/60 mb-2"><Clock className="h-4 w-4 mt-0.5 text-[var(--gold)]" /> Seg-Sex 9h - 19h</p>
            <p className="flex items-start gap-2 text-sm text-white/60"><MapPin className="h-4 w-4 mt-0.5 text-[var(--gold)]" /> Galeria Momm, sala 12 - Centro</p>
          </div>
          <div>
            <h4 className="text-[11px] tracking-[0.14em] uppercase text-[var(--gold)] mb-4 font-sans font-medium">Acesso</h4>
            <Link to="/login" className="block text-sm text-white/60 hover:text-white mb-2">Painel admin</Link>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-white/35 gap-3 pt-2">
          <div>© {new Date().getFullYear()} MR Odontologia Estética. Todos os direitos reservados.</div>
          <div>CRO-PR 33538</div>
        </div>
      </div>
    </footer>
  );
}
