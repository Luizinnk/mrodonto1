import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
} from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre | MR Odontologia Estética" },
      {
        name: "description",
        content:
          "Conheça a MR Odontologia Estética e o Dr. Derick Meinelecki, cirurgião-dentista CRO-PR 33538.",
      },
    ],
  }),
  component: SobrePage,
});

const specialties = [
  {
    icon: Stethoscope,
    title: "Clínico geral",
    text: "Cuidado completo para saúde, prevenção e acompanhamento.",
  },
  {
    icon: Sparkles,
    title: "Facetas",
    text: "Planejamento estético para transformar formato, cor e harmonia do sorriso.",
  },
  {
    icon: Syringe,
    title: "Botox",
    text: "Técnica precisa para suavização de linhas e resultado natural.",
  },
  {
    icon: ShieldCheck,
    title: "Implantodontia",
    text: "Reabilitação oral com foco em função, estabilidade e estética.",
  },
];

function SobrePage() {
  return (
    <section className="overflow-hidden bg-[var(--ivory)]">
      <div className="relative mx-auto grid max-w-[1280px] gap-14 px-6 py-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-[var(--clinical)]/40 blur-3xl" />
        <div className="relative">
          <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-3 shadow-[var(--shadow-luxe)]">
            <img
              src="/mr-brand/dr-derick.png"
              alt="Dr. Derick Meinelecki, cirurgião-dentista responsável pela MR Odonto"
              className="h-[520px] w-full rounded-[1.45rem] object-cover object-[58%_center]"
            />
            <div className="absolute inset-x-3 bottom-3 rounded-b-[1.45rem] bg-gradient-to-t from-[var(--petrol)]/88 via-[var(--petrol)]/35 to-transparent p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold-light)]">
                Responsável técnico
              </p>
              <h2 className="mt-2 font-serif text-3xl">Dr. Derick Meinelecki</h2>
              <p className="mt-1 text-sm text-white/78">Cirurgião-dentista · CRO-PR 33538</p>
            </div>
          </div>

          <div className="absolute -right-3 -top-4 rounded-2xl border border-white/70 bg-white/92 p-5 shadow-[var(--shadow-soft)] backdrop-blur md:-right-8 md:top-8">
            <Award className="mb-3 h-6 w-6 text-[var(--gold-dark)]" />
            <p className="font-serif text-2xl text-[var(--petrol)]">MR Odonto</p>
            <p className="text-xs text-muted-foreground">Odontologia & Estética</p>
          </div>
        </div>

        <div className="relative">
          <span className="section-kicker">Sobre nós</span>
          <h1 className="mt-3 text-balance text-5xl text-[var(--petrol)] md:text-6xl">
            Cuidado técnico, estética natural e atendimento humano.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-foreground/78">
            A MR Odontologia Estética une planejamento clínico, estética avançada e uma comunicação
            clara para que cada paciente entenda seu tratamento com segurança desde a primeira
            conversa.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            O atendimento é conduzido pelo Dr. Derick Meinelecki, cirurgião-dentista inscrito no
            CRO-PR 33538, com atuação em clínica geral, facetas, botox e implantodontia. A proposta
            é entregar resultados bonitos, funcionais e compatíveis com a identidade de cada
            sorriso.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {specialties.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white bg-white/82 p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[var(--clinical-light)] text-[var(--gold-dark)]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-2xl text-[var(--petrol)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-[var(--petrol)]/10 bg-white p-6 shadow-[var(--shadow-soft)]">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                "Planejamento individual",
                "Biossegurança em cada etapa",
                "Tratamentos com foco em naturalidade",
              ].map((text) => (
                <div key={text} className="flex items-start gap-3 text-sm text-[var(--petrol)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold-dark)]" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/agenda" className="btn-luxe">
              <CalendarCheck className="h-4 w-4" />
              Agendar avaliação
            </Link>
            <Link to="/servicos" className="btn-outline-luxe bg-white">
              <HeartHandshake className="h-4 w-4" />
              Conhecer tratamentos
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
