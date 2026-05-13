import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock3 } from "lucide-react";
import type { Service } from "@/lib/types";
import { PremiumServiceIcon } from "@/components/PremiumServiceIcon";

const SERVICE_META: Record<string, { label: string }> = {
  avaliacao: { label: "Avaliação estética" },
  clareamento: { label: "Clareamento supervisionado" },
  harmonizacao: { label: "Harmonia facial" },
  limpeza: { label: "Limpeza dental" },
  profilaxia: { label: "Profilaxia clínica" },
  botox: { label: "Toxina botulinica" },
  preenchimento: { label: "Preenchimento facial" },
  facetas: { label: "Facetas de porcelana" },
  lentes: { label: "Lentes de contato dental" },
  personalizado: { label: "Plano personalizado" },
};

export function ServiceCard({ service: s }: { service: Service }) {
  const meta = SERVICE_META[s.slug] ?? { label: "Tratamento MR" };

  return (
    <article className="group pro-card relative overflow-hidden rounded-[1.35rem] bg-white p-6">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--clinical)]/55 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="flex items-center justify-between gap-3 mb-4">
        <PremiumServiceIcon slug={s.slug} />
        <span className="max-w-[150px] rounded-full border border-[var(--border)] bg-[var(--ivory)] px-3 py-1 text-right text-[10px] uppercase tracking-[0.14em] text-[var(--gold-dark)]">
          {meta.label}
        </span>
      </div>
      <h3 className="relative mb-2 font-serif text-2xl text-[var(--petrol)]">{s.name}</h3>
      <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
        {s.description}
      </p>
      <div className="flex items-center justify-between py-3 border-y border-border/60 mb-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          {s.duration_min} min
        </span>
        <span className="font-serif text-[var(--petrol)] font-semibold">{s.price_text}</span>
      </div>
      <Link
        to="/agenda"
        search={{ service: s.slug }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-semibold text-[var(--petrol)] transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground"
      >
        Agendar este serviço
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
