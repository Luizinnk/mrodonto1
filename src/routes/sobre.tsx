import { createFileRoute } from "@tanstack/react-router";
import { Award, Microscope, ShieldCheck, Smile } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre | MR Odontologia Estética" },
      { name: "description", content: "Conheça a MR Odontologia Estética: equipe especializada, atendimento humanizado e tecnologia de ponta." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-2">
        <div className="relative">
          <div className="rounded-3xl h-[520px] relative overflow-hidden bg-[var(--ivory)] clinical-grid shadow-[var(--shadow-luxe)]">
            <div className="absolute inset-0 grid grid-cols-2 gap-3 p-5">
              <img src="/mr-clinic/caso-01-rosto-depois.jpg" alt="Paciente com resultado de reabilitação estética" className="h-full w-full rounded-2xl object-cover" />
              <div className="grid gap-3">
                <img src="/mr-clinic/caso-02-comparativo.jpg" alt="Comparativo real de estética dental" className="h-full w-full rounded-2xl object-cover" />
                <img src="/mr-clinic/caso-02-depois-lateral.jpg" alt="Detalhe lateral de resultado dental" className="h-full w-full rounded-2xl object-cover" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
          </div>
          <div className="absolute -right-4 bottom-8 bg-card rounded-2xl p-6 shadow-[var(--shadow-luxe)] min-w-[220px] border border-border/40">
            <div className="font-serif text-4xl text-[var(--gold-dark)] leading-none">10+</div>
            <div className="text-sm text-muted-foreground mt-1">anos de excelência</div>
          </div>
        </div>

        <div>
          <span className="section-kicker">Sobre nós</span>
          <h1 className="text-5xl mt-3 mb-6">Cuidado que se vê em cada sorriso</h1>
          <p className="text-foreground/80 font-light leading-relaxed mb-4">
            A MR Odontologia Estética nasceu do desejo de unir excelência clínica e cuidado humano.
            Cada paciente é único — e o seu tratamento também deve ser.
          </p>
          <p className="text-foreground/80 font-light leading-relaxed">
            Trabalhamos com tecnologia de última geração, materiais premium e protocolos rigorosos
            de biossegurança. Tudo para que sua experiência seja confortável, segura e transformadora.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {[
              { icon: Award, text: "Equipe formada e em constante atualização" },
              { icon: Microscope, text: "Materiais e equipamentos de ponta" },
              { icon: ShieldCheck, text: "Atendimento personalizado e humanizado" },
              { icon: Smile, text: "Ambiente acolhedor e confortável" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm">
                <span className="w-9 h-9 rounded-xl bg-[var(--clinical-light)] text-[var(--clinical-strong)] grid place-items-center">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
