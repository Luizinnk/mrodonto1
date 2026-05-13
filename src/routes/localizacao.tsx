import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/localizacao")({
  head: () => ({
    meta: [
      { title: "Localização | MR Odontologia Estética" },
      {
        name: "description",
        content: "Onde estamos: endereço, horário de funcionamento e contato direto pelo WhatsApp.",
      },
    ],
  }),
  component: LocalizacaoPage,
});

const phone = "41988551599";
const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent("Olá! Gostaria de agendar uma consulta na MR Odonto.")}`;
const address =
  "Av. Miguel Komarchewski, Galeria Momm, sala 12 - Centro, Campo do Tenente - PR, 83870-000";
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

const infoCards = [
  {
    icon: MapPin,
    title: "Endereço",
    value:
      "Av. Miguel Komarchewski\nGaleria Momm, sala 12 - Centro\nCampo do Tenente - PR, 83870-000",
  },
  {
    icon: Clock,
    title: "Horário",
    value: "Segunda a sexta · 9h às 19h\nSábado · 9h às 14h",
  },
  {
    icon: Phone,
    title: "Telefone",
    value: phone,
  },
  {
    icon: Mail,
    title: "Email",
    value: "contato@mrodonto.com",
  },
];

function LocalizacaoPage() {
  return (
    <section className="relative overflow-hidden bg-[var(--ivory)] px-6 py-24">
      <div className="absolute inset-0 clinical-grid opacity-70" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--clinical)]/55 blur-3xl" />
      <div className="absolute right-10 top-1/3 h-80 w-80 rounded-full bg-[var(--beige)]/70 blur-3xl" />

      <div className="relative mx-auto max-w-[1280px]">
        <div className="mx-auto mb-14 max-w-3xl text-center animate-fade-up">
          <span className="badge-tag mx-auto">
            <Navigation className="h-3.5 w-3.5" />
            Como chegar
          </span>
          <h1 className="mt-5 text-balance text-5xl text-[var(--petrol)] md:text-6xl">
            Visite a MR Odonto com tranquilidade.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Atendimento em sala privativa na Galeria Momm, no Centro de Campo do Tenente, com acesso
            simples pelo mapa e contato direto pelo WhatsApp.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-stretch">
          <div className="flex flex-col gap-5">
            <div className="glass-panel rounded-[1.75rem] p-5 md:p-7">
              <div className="mb-5 flex items-start justify-between gap-5 border-b border-border/70 pb-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--gold-dark)]">
                    Contato e endereço
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-[var(--petrol)]">
                    Tudo para chegar sem dúvida
                  </h2>
                </div>
                <span className="hidden rounded-full border border-[var(--clinical)] bg-[var(--clinical-light)] px-3 py-1.5 text-xs font-semibold text-[var(--petrol)] sm:inline-flex">
                  CRO-PR 33538
                </span>
              </div>

              <div className="grid gap-3">
                {infoCards.map((item) => (
                  <article
                    key={item.title}
                    className="group flex gap-4 rounded-2xl border border-transparent p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/35 hover:bg-white/70 hover:shadow-[var(--shadow-soft)]"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--clinical-light)] text-[var(--clinical-strong)] transition-colors group-hover:bg-[var(--petrol)] group-hover:text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--petrol)]">{item.title}</div>
                      <div className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {item.value}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-[var(--petrol)] p-6 text-white shadow-[var(--shadow-luxe)]">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/8 text-[var(--gold-light)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl">Agende antes de ir</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/68">
                    Fale com a equipe para confirmar disponibilidade e receber orientação rápida
                    antes do atendimento.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-luxe !bg-white !text-[var(--petrol)]"
                >
                  <Navigation className="h-4 w-4" />
                  Como chegar
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgb(37_211_102_/_0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#1da851]"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white bg-white shadow-[var(--shadow-luxe)]">
            <div className="absolute left-5 top-5 z-10 rounded-2xl border border-white/75 bg-white/90 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold-dark)]">
                MR Odonto
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--petrol)]">
                Galeria Momm, sala 12
              </p>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute right-5 top-5 z-10 inline-flex items-center gap-2 rounded-full bg-[var(--petrol)] px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5"
            >
              Abrir no Maps
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <iframe
              title="Localização MR Odontologia"
              src={embedUrl}
              className="h-full min-h-[520px] w-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
