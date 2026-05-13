import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CalendarCheck, CheckCircle2, Clock3, Loader2, UserRoundCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PremiumServiceIcon } from "@/components/PremiumServiceIcon";
import { FALLBACK_SERVICES, loadServices } from "@/lib/services";

const searchSchema = z.object({ service: z.string().optional() });

export const Route = createFileRoute("/agenda")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Agendar horário | MR Odontologia Estética" },
      {
        name: "description",
        content: "Reserve seu horário online em poucos passos. Confirmação imediata.",
      },
    ],
  }),
  component: AgendaPage,
});

const STEPS = ["Tratamento", "Profissional", "Data", "Horário", "Dados", "Confirmação"];
const HOURS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PROFESSIONALS = [
  {
    id: "dr-derick",
    name: "Dr. Derick Meinelecki",
    text: "Cirurgião-dentista CRO-PR 33538, responsável por clínica geral, facetas, botox e implantodontia.",
  },
  {
    id: "equipe",
    name: "Equipe MR Odontologia",
    text: "A equipe direciona seu atendimento para o profissional ideal conforme o tratamento escolhido.",
  },
];

type BusySlotRow = {
  scheduled_at: string;
};

function AgendaPage() {
  const search = Route.useSearch();
  const [step, setStep] = useState(0);
  const [serviceSlug, setServiceSlug] = useState<string | null>(search.service ?? null);
  const [professional, setProfessional] = useState(PROFESSIONALS[0].id);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => loadServices(),
    placeholderData: FALLBACK_SERVICES,
  });

  const visibleServices = services?.length ? services : FALLBACK_SERVICES;
  const selectedService = visibleServices.find((s) => s.slug === serviceSlug) ?? null;
  const selectedProfessional = PROFESSIONALS.find((p) => p.id === professional) ?? PROFESSIONALS[0];

  const { data: busy, isFetching: busyLoading } = useQuery({
    queryKey: ["busy", date?.toDateString()],
    enabled: !!date,
    queryFn: async () => {
      if (!date) return [];
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from("busy_slots")
        .select("scheduled_at")
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString());
      if (error) throw error;
      return ((data ?? []) as BusySlotRow[]).map((slot) =>
        new Date(slot.scheduled_at).toTimeString().slice(0, 5),
      );
    },
  });

  const canNext =
    (step === 0 && !!serviceSlug) ||
    (step === 1 && !!professional) ||
    (step === 2 && !!date) ||
    (step === 3 && !!time) ||
    (step === 4 &&
      form.name.trim().length > 1 &&
      /\S+@\S+\.\S+/.test(form.email) &&
      form.phone.trim().length >= 8);

  async function submit() {
    if (!selectedService || !date || !time) return;
    setSubmitting(true);
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(date);
    dt.setHours(h, m, 0, 0);
    const notes = [form.notes.trim(), `Profissional/triagem: ${selectedProfessional.name}`]
      .filter(Boolean)
      .join("\n");
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        service_id: selectedService.id,
        scheduled_at: dt.toISOString(),
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim(),
        notes: notes || null,
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao agendar. Tente novamente.");
      return;
    }
    setConfirmedId(data.id);
    setStep(5);
    toast.success("Agendamento confirmado!");
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(135deg,var(--ivory),var(--clinical-light))] px-6 py-16">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <span className="badge-tag">
              <CalendarCheck className="h-3.5 w-3.5" />
              Agendamento online
            </span>
            <h1 className="mt-5 text-5xl text-[var(--petrol)] md:text-6xl">
              Agende seu horário sem complicação.
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Escolha o tratamento, veja os horários disponíveis e envie seus dados. A equipe recebe
              tudo organizado para confirmar seu atendimento.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white bg-white/78 p-5 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Tratamento"],
                ["2", "Horário"],
                ["3", "Confirmação"],
              ].map(([number, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--ivory)] p-3"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--petrol)] text-sm font-semibold text-white">
                    {number}
                  </span>
                  <span className="text-sm font-medium text-[var(--petrol)]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[var(--shadow-luxe)]">
          <div className="grid border-b border-border bg-[var(--ivory)] sm:grid-cols-3 lg:grid-cols-6">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`flex items-center gap-3 border-b-2 px-4 py-4 transition-colors ${i === step ? "border-[var(--gold)] bg-white" : "border-transparent"}`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${i <= step ? "bg-[var(--petrol)] text-white" : "bg-white text-muted-foreground"}`}
                >
                  {i + 1}
                </span>
                <span
                  className={`text-xs font-semibold uppercase tracking-[0.08em] ${i === step ? "text-[var(--petrol)]" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-6 md:p-10">
            {step === 0 && (
              <Panel
                title="Escolha o tratamento"
                text="Comece selecionando o serviço desejado. Você pode ajustar depois com a equipe."
              >
                {servicesLoading && !visibleServices.length ? (
                  <LoadingBlock text="Carregando tratamentos" />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleServices.map((s) => {
                      const selected = s.slug === serviceSlug;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setServiceSlug(s.slug)}
                          className={`rounded-2xl border p-5 text-left transition-all duration-300 ${selected ? "border-[var(--petrol)] bg-[var(--petrol)] text-white shadow-[var(--shadow-soft)]" : "border-border bg-[var(--ivory)] hover:-translate-y-0.5 hover:border-[var(--gold)] hover:shadow-[var(--shadow-soft)]"}`}
                        >
                          <PremiumServiceIcon slug={s.slug} active={selected} className="mb-4" />
                          <div className="font-serif text-2xl">{s.name}</div>
                          <div
                            className={`mt-2 text-sm ${selected ? "text-white/72" : "text-muted-foreground"}`}
                          >
                            {s.duration_min} min · {s.price_text}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Panel>
            )}

            {step === 1 && (
              <Panel
                title="Profissional responsável"
                text="A clínica organiza internamente o profissional mais adequado para o procedimento."
              >
                <div className="grid gap-4">
                  {PROFESSIONALS.map((item) => {
                    const selected = item.id === professional;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setProfessional(item.id)}
                        className={`rounded-2xl border p-6 text-left transition-all ${selected ? "border-[var(--petrol)] bg-[var(--clinical-light)]" : "border-border bg-white hover:-translate-y-0.5 hover:border-[var(--gold)]"}`}
                      >
                        <UserRoundCheck
                          className={`mb-4 h-7 w-7 ${selected ? "text-[var(--petrol)]" : "text-[var(--gold-dark)]"}`}
                        />
                        <div className="font-serif text-2xl text-[var(--petrol)]">{item.name}</div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {item.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Panel>
            )}

            {step === 2 && (
              <Panel
                title="Escolha a data"
                text={`Dias disponíveis para ${selectedService?.name ?? "o atendimento"}.`}
              >
                <Calendar
                  month={month}
                  setMonth={setMonth}
                  value={date}
                  onChange={(d) => {
                    setDate(d);
                    setTime(null);
                  }}
                />
              </Panel>
            )}

            {step === 3 && (
              <Panel
                title="Escolha o horário"
                text={date ? formatLongDate(date) : "Selecione uma data para ver horários."}
              >
                {busyLoading ? (
                  <LoadingBlock text="Verificando horários disponíveis" />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    {HOURS.map((h) => {
                      const occupied = busy?.includes(h);
                      const selected = time === h;
                      return (
                        <button
                          key={h}
                          disabled={!date || occupied}
                          onClick={() => setTime(h)}
                          className={`group rounded-2xl border px-4 py-4 text-sm font-semibold transition-all duration-300
                            ${selected ? "border-[var(--petrol)] bg-[var(--petrol)] text-white shadow-[0_18px_36px_rgb(15_42_58_/_0.22)] ring-4 ring-[var(--clinical-light)]" : ""}
                            ${!selected && !occupied ? "border-border bg-[var(--ivory)] text-[var(--petrol)] hover:-translate-y-1 hover:border-[var(--gold)] hover:bg-white hover:shadow-[var(--shadow-soft)]" : ""}
                            ${occupied ? "cursor-not-allowed border-border bg-muted text-muted-foreground/45 line-through" : ""}
                            ${!date ? "cursor-not-allowed opacity-40" : ""}
                          `}
                        >
                          <Clock3
                            className={`mx-auto mb-2 h-4 w-4 transition-transform duration-300 ${!occupied ? "group-hover:scale-110" : ""}`}
                          />
                          {h}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <Legend color="bg-[var(--ivory)]" label="Disponível" />
                  <Legend color="bg-[var(--petrol)]" label="Selecionado" />
                  <Legend color="bg-muted" label="Indisponível" />
                </div>
              </Panel>
            )}

            {step === 4 && (
              <Panel
                title="Confirme seus dados"
                text="Usaremos essas informações para confirmação e lembrete do horário."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Nome completo">
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input"
                      placeholder="Seu nome"
                      maxLength={120}
                    />
                  </Field>
                  <Field label="Telefone">
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input"
                      placeholder="41988551599"
                      maxLength={20}
                    />
                  </Field>
                  <Field label="Email" className="md:col-span-2">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input"
                      placeholder="seu@email.com"
                      maxLength={200}
                    />
                  </Field>
                  <Field label="Observações (opcional)" className="md:col-span-2">
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="input min-h-[100px] resize-none"
                      placeholder="Conte se existe alguma necessidade importante."
                      maxLength={500}
                    />
                  </Field>
                </div>
              </Panel>
            )}

            {step === 5 && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-[var(--clinical-light)] text-[var(--petrol)]">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="font-serif text-4xl text-[var(--petrol)]">
                  Agendamento confirmado!
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                  Recebemos sua solicitação e a equipe terá acesso aos dados no painel
                  administrativo.
                </p>
                <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-border bg-[var(--ivory)] p-6 text-left">
                  {[
                    ["Tratamento", selectedService?.name ?? "-"],
                    ["Profissional", selectedProfessional.name],
                    ["Data", date ? formatLongDate(date) : "-"],
                    ["Horário", time ?? "-"],
                    ["Nome", form.name],
                    ["Código", confirmedId?.slice(0, 8).toUpperCase() ?? "-"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0"
                    >
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-right font-semibold text-[var(--petrol)]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step < 5 && (
              <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-[var(--petrol)] hover:text-[var(--petrol)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Voltar
                </button>
                {step === 4 ? (
                  <button
                    onClick={submit}
                    disabled={!canNext || submitting}
                    className="btn-luxe disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Enviando..." : "Agendar horário"}
                  </button>
                ) : (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canNext}
                    className="btn-luxe disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continuar
                    <ArrowIcon />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`.input{width:100%;border:1.5px solid var(--border);background:var(--ivory);padding:13px 16px;border-radius:16px;font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s;font-family:var(--font-sans);} .input:focus{border-color:var(--gold);box-shadow:0 0 0 4px rgb(200 163 106 / .12);}`}</style>
    </section>
  );
}

function Panel({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-3xl text-[var(--petrol)]">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function LoadingBlock({ text }: { text: string }) {
  return (
    <div className="grid min-h-44 place-items-center rounded-2xl border border-border bg-[var(--ivory)] text-muted-foreground">
      <div className="flex items-center gap-3 text-sm">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--gold-dark)]" />
        {text}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function ArrowIcon() {
  return <span aria-hidden="true">→</span>;
}

function Calendar({
  month,
  setMonth,
  value,
  onChange,
}: {
  month: Date;
  setMonth: (d: Date) => void;
  value: Date | null;
  onChange: (d: Date) => void;
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const first = new Date(month);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  return (
    <div className="rounded-[1.5rem] border border-border bg-[var(--ivory)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-lg transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          ‹
        </button>
        <div className="font-serif text-xl capitalize text-[var(--petrol)]">
          {month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </div>
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-lg transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const past = d < today;
          const isWeekend = d.getDay() === 0;
          const disabled = past || isWeekend;
          const selected = value && d.toDateString() === value.toDateString();
          const isToday = d.toDateString() === today.toDateString();
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onChange(d)}
              className={`rounded-xl py-3 text-sm font-semibold transition-all
                ${selected ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]" : ""}
                ${!selected && !disabled ? "bg-white text-[var(--petrol)] hover:-translate-y-0.5 hover:bg-[var(--clinical-light)]" : ""}
                ${disabled ? "cursor-not-allowed text-muted-foreground/35" : ""}
                ${isToday && !selected ? "ring-1 ring-[var(--gold)]" : ""}
              `}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}
