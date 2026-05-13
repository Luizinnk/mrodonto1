import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";

export const Route = createFileRoute("/localizacao")({
  head: () => ({
    meta: [
      { title: "Localização | MR Odontologia Estética" },
      { name: "description", content: "Onde estamos: endereço, horário de funcionamento e contato direto pelo WhatsApp." },
    ],
  }),
  component: LocalizacaoPage,
});

function LocalizacaoPage() {
  const address = "Av. Miguel Komarchewski, Galeria Momm, sala 12 - Centro, Campo do Tenente - PR, 83870-000";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <section className="py-24 px-6 bg-[var(--ivory)] clinical-grid">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-12 animate-fade-up">
          <span className="section-kicker">Como chegar</span>
          <h1 className="text-5xl mt-3">Venha nos visitar</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Atendimento em sala privativa na Galeria Momm, no Centro de Campo do Tenente.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <div className="glass-panel rounded-2xl p-8 mb-6">
              {[
                { i: MapPin, t: "Endereço", v: "Av. Miguel Komarchewski\nGaleria Momm, sala 12 - Centro\nCampo do Tenente - PR, 83870-000" },
                { i: Clock, t: "Horário", v: "Segunda a Sexta · 9h às 19h\nSábado · 9h às 14h" },
                { i: Phone, t: "Telefone", v: "(41) 99999-9999" },
                { i: Mail, t: "Email", v: "contato@mrodonto.com" },
              ].map((it) => (
                <div key={it.t} className="flex gap-3 py-3 border-b last:border-b-0 border-border/60">
                  <div className="w-10 h-10 rounded-xl bg-[var(--clinical-light)] text-[var(--clinical-strong)] grid place-items-center flex-shrink-0">
                    <it.i className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{it.t}</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-line font-light">{it.v}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-luxe">
                <Navigation className="h-4 w-4" />
                Como chegar
              </a>
              <a
                href="https://wa.me/5541988551599"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-7 py-3 rounded-full text-sm font-semibold hover:bg-[#1da851] transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden h-[460px] bg-card border border-white/70 shadow-[var(--shadow-luxe)]">
            <iframe
              title="Localização MR Odontologia"
              src={embedUrl}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
