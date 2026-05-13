import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Gem,
  HeartHandshake,
  ShieldCheck,
  Stethoscope,
  Timer,
  UserRoundCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Service } from "@/lib/types";
import { ServiceCard } from "@/components/ServiceCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MR Odontologia Estética | Agende seu horário" },
      { name: "description", content: "Odontologia estética, clareamento, harmonização, lentes e facetas com agendamento online simples." },
    ],
  }),
  component: HomePage,
});

const trustItems = [
  { icon: Gem, title: "Excelência", text: "Cuidado técnico, acabamento natural e atenção ao detalhe." },
  { icon: ShieldCheck, title: "Tecnologia", text: "Planejamento moderno para tratamentos mais previsíveis." },
  { icon: UserRoundCheck, title: "Atendimento", text: "Conversa clara, acolhimento e orientação em cada etapa." },
  { icon: HeartHandshake, title: "Bem-estar", text: "Ambiente pensado para uma experiência tranquila." },
];

const clinicalCases = [
  {
    title: "Reabilitação estética completa",
    before: "/mr-clinic/caso-01-rosto-antes.jpg",
    after: "/mr-clinic/caso-01-rosto-depois.jpg",
    text: "Planejamento para devolver harmonia, função e confiança ao sorrir.",
  },
  {
    title: "Estética dental com naturalidade",
    before: "/mr-clinic/caso-02-antes-frontal.jpg",
    after: "/mr-clinic/caso-02-depois-frontal.jpg",
    text: "Transformação real com luminosidade, alinhamento visual e acabamento natural.",
  },
];

const resultPortraits = [
  "/mr-carousel/carousel-01.jpg",
  "/mr-carousel/carousel-02.jpg",
  "/mr-carousel/carousel-03.jpg",
  "/mr-carousel/carousel-04.jpg",
  "/mr-carousel/carousel-05.jpg",
  "/mr-carousel/carousel-06.png",
  "/mr-carousel/carousel-07.jpg",
  "/mr-carousel/carousel-08.jpg",
];

function HomePage() {
  const { data: services } = useQuery({
    queryKey: ["services-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order")
        .limit(6);
      if (error) throw error;
      return data as Service[];
    },
  });

  return (
    <>
      <section className="hero-premium relative overflow-hidden bg-[var(--ivory)]">
        <div className="hero-ambient-light" />
        <div className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-[1280px] items-center gap-12 px-6 py-12 lg:grid-cols-[0.88fr_1.12fr] lg:py-16">
          <div className="z-10 max-w-xl animate-fade-up">
            <span className="badge-tag">
              <ShieldCheck className="h-3.5 w-3.5" />
              Clínica odontológica premium · CRO-PR 33538
            </span>
            <h1 className="mt-7 text-balance text-5xl text-[var(--petrol)] md:text-7xl">
              Sorrisos que transformam <span className="italic text-[var(--gold-dark)]">vidas e histórias.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Odontologia e estética com excelência para cuidar do que mais importa: você, sua autoestima e sua família.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/agenda" className="btn-luxe !px-8 !py-4">
                <CalendarCheck className="h-4 w-4" />
                Agendar horário
              </Link>
              <a href="#servicos" className="btn-outline-luxe !bg-white/78 !px-7 !py-4">
                Nossos tratamentos
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="hero-stats mt-10 grid grid-cols-3 gap-4 rounded-3xl border border-white bg-white/72 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
              {[
                ["500+", "pacientes atendidos"],
                ["8+", "procedimentos"],
                ["5.0", "experiência média"],
              ].map(([value, label], index) => (
                <div key={label} className="hero-stat-item" style={{ animationDelay: `${index * 90}ms` }}>
                  <div className="font-serif text-3xl text-[var(--gold-dark)]">{value}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 min-h-[520px]">
            <div className="hero-identity-card">
              <img src="/mr-brand/family.png" alt="Familia sorrindo MR Odonto" className="hero-family-image h-full w-full object-cover object-center" />
            </div>
            <div className="hero-floating-card">
              <HeartHandshake className="mb-4 h-7 w-7 text-[var(--gold-dark)]" />
              <h3 className="font-serif text-2xl text-[var(--petrol)]">Cuidar do seu sorriso<br />e cuidar do seu bem-estar.</h3>
            </div>
          </div>

          <div className="z-10 rounded-[1.5rem] border border-white bg-white/90 p-3 shadow-[var(--shadow-elegant)] lg:col-span-2">
            <div className="grid gap-2 md:grid-cols-4">
              {trustItems.map((item) => (
                <div key={item.title} className="flex gap-4 rounded-[1.1rem] p-4 transition-colors hover:bg-[var(--clinical-light)]">
                  <item.icon className="mt-1 h-7 w-7 shrink-0 text-[var(--gold-dark)]" />
                  <div>
                    <div className="text-sm font-semibold text-[var(--petrol)]">{item.title}</div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="servicos" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-12 text-center">
            <span className="section-kicker">Tratamentos</span>
            <h2 className="mx-auto mt-3 max-w-2xl text-4xl text-[var(--petrol)] md:text-5xl">
              Soluções para transformar e valorizar o seu sorriso
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Serviços organizados para o paciente entender rápido, escolher com segurança e agendar sem dificuldade.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services?.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
          <div className="mt-10 text-center">
            <Link to="/servicos" className="btn-outline-luxe">
              Ver todos os serviços
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--petrol)] px-6 py-20 text-white">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="section-kicker !text-[var(--gold-light)]">Tecnologia e conforto</span>
            <h2 className="mt-3 text-4xl md:text-5xl">Estrutura pensada para uma experiência mais tranquila.</h2>
            <p className="mt-5 max-w-xl text-white/70">
              Do primeiro contato ao retorno, a MR organiza o atendimento para que você saiba o que será feito, quando será atendido e como cuidar do resultado.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Timer, text: "Agendamento online 24h" },
                { icon: CheckCircle2, text: "Confirmação clara" },
                { icon: Stethoscope, text: "Planejamento clínico" },
                { icon: ShieldCheck, text: "Biossegurança" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 p-4">
                  <item.icon className="h-5 w-5 text-[var(--gold-light)]" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/8 p-3 shadow-[0_24px_70px_rgb(0_0_0_/_0.24)]">
            <img src="/mr-brand/banner1.png" alt="Identidade MR Odontologia" className="aspect-[16/9] w-full rounded-[1.1rem] object-cover object-center" />
          </div>
        </div>
      </section>

      <section id="resultados" className="overflow-hidden bg-[var(--ivory)] py-24">
        <div className="mx-auto max-w-[1280px] px-6 text-center">
          <span className="section-kicker">Resultados reais</span>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl text-[var(--petrol)] md:text-5xl">Sorrisos reais que mostram a identidade da MR</h2>
        </div>
        <div className="results-viewport mt-12" aria-label="Carrossel automático de sorrisos reais">
          <div className="results-carousel">
            {[0, 1].map((group) => (
              <div className="results-carousel-group" aria-hidden={group === 1} key={group}>
                {resultPortraits.map((src, index) => (
                  <article key={`${group}-${src}`} className="result-card">
                    <img src={src} alt={`Resultado real MR Odontologia ${index + 1}`} />
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="section-kicker">Antes e depois</span>
              <h2 className="mt-3 max-w-2xl text-4xl text-[var(--petrol)] md:text-5xl">Transformações com naturalidade</h2>
            </div>
            <Link to="/agenda" className="btn-luxe w-fit">
              <CalendarCheck className="h-4 w-4" />
              Agendar avaliação
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {clinicalCases.map((item) => (
              <article key={item.title} className="pro-card overflow-hidden rounded-[1.5rem] bg-white">
                <div className="grid grid-cols-2">
                  <ImagePanel src={item.before} label="Antes" />
                  <ImagePanel src={item.after} label="Depois" highlight />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-3xl text-[var(--petrol)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,var(--clinical-light),var(--ivory))] px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="section-kicker">Agendamento online</span>
          <h2 className="mt-3 text-4xl text-[var(--petrol)] md:text-5xl">Seu horário em poucos passos.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Escolha o tratamento, veja os horários disponíveis e envie seus dados. A equipe recebe tudo organizado para confirmar seu atendimento.
          </p>
          <Link to="/agenda" className="btn-luxe mt-8 !px-8 !py-4">
            <CalendarCheck className="h-4 w-4" />
            Agendar horário
          </Link>
        </div>
      </section>
    </>
  );
}

function ImagePanel({ src, label, highlight = false }: { src: string; label: string; highlight?: boolean }) {
  return (
    <div className="relative aspect-square overflow-hidden bg-[var(--clinical-light)]">
      <img src={src} alt={`${label} do tratamento`} className="h-full w-full object-cover object-center" />
      <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${highlight ? "bg-[var(--petrol)] text-white" : "bg-white/86 text-[var(--petrol)]"}`}>
        {label}
      </span>
    </div>
  );
}
