import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AdminAccessRequest, AppointmentStatus } from "@/lib/types";
import { toast } from "sonner";
import { CalendarDays, Download, ExternalLink, LogOut, Trash2, UsersRound } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel | MR Odontologia" }] }),
  component: AdminPage,
});

type Row = {
  id: string;
  scheduled_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  status: AppointmentStatus;
  created_at: string;
  reminder_sent_at: string | null;
  customer_confirmed_at: string | null;
  service: { name: string; icon: string } | null;
};

type ClientRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  desired_procedure: string | null;
  important_notes: string | null;
  next_appointment_at: string | null;
  last_appointment_at: string | null;
  total_appointments: number;
  created_at: string;
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  done: "Concluído",
  cancelled: "Cancelado",
};

const SPREADSHEET_URL = import.meta.env.VITE_CLIENTS_SPREADSHEET_URL as string | undefined;
function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("pt-BR") : "";
}

function downloadWorkbook({
  filename,
  title,
  subtitle,
  summary,
  headers,
  rows,
}: {
  filename: string;
  title: string;
  subtitle: string;
  summary: Array<{ label: string; value: string | number }>;
  headers: string[];
  rows: Array<{ cells: Array<string | number>; status?: AppointmentStatus | "other" }>;
}) {
  const summaryHtml = summary
    .map((item) => `<span class="summary"><strong>${escapeHtml(item.value)}</strong>${escapeHtml(item.label)}</span>`)
    .join("");
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const rowHtml = rows
    .map((row) => {
      const statusClass = row.status ? ` status-${row.status}` : "";
      return `<tr class="${statusClass}">${row.cells.map((cell, index) => `<td class="${index === 1 ? "client-name" : ""}${index === 8 ? " notes" : ""}">${escapeHtml(cell)}</td>`).join("")}</tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #17130c; background: #ffffff; }
    .sheet-title { font-size: 20px; font-weight: 700; color: #17130c; margin: 0 0 4px; }
    .sheet-subtitle { font-size: 12px; color: #6b6254; margin-bottom: 10px; }
    .summary-wrap { margin: 0 0 12px; }
    .summary { display: inline-block; margin-right: 8px; border: 1px solid #e2d4b9; padding: 6px 10px; background: #fbf7ee; font-size: 12px; color: #6b6254; }
    .summary strong { margin-right: 6px; color: #8b631f; font-size: 15px; }
    table { border-collapse: collapse; table-layout: fixed; width: 1960px; margin-top: 8px; }
    th { background: #17130c; color: #f6d284; border: 1px solid #c9963d; padding: 11px 10px; font-size: 12px; text-transform: uppercase; white-space: nowrap; }
    td { border: 1px solid #dfd4c1; padding: 10px; vertical-align: middle; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    td.notes { white-space: normal; line-height: 1.35; }
    tr.status-pending td { background: #fff8d8; }
    tr.status-cancelled td { background: #ffe2e2; }
    tr.status-done td { background: #e4f5de; }
    tr.status-confirmed td, tr.status-other td { background: #ead7bf; }
    .client-name { font-weight: 700; color: #17130c; }
    .note { margin-top: 10px; font-size: 11px; color: #6b6254; }
  </style>
</head>
<body>
  <h1 class="sheet-title">MR Odontologia - ${escapeHtml(title)}</h1>
  <div class="sheet-subtitle">${escapeHtml(subtitle)}</div>
  <div class="summary-wrap">${summaryHtml}</div>
  <table>
    <colgroup>
      <col style="width: 150px" />
      <col style="width: 230px" />
      <col style="width: 145px" />
      <col style="width: 230px" />
      <col style="width: 130px" />
      <col style="width: 120px" />
      <col style="width: 140px" />
      <col style="width: 260px" />
      <col style="width: 290px" />
      <col style="width: 130px" />
      <col style="width: 140px" />
      <col style="width: 190px" />
    </colgroup>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${rowHtml}</tbody>
  </table>
  <div class="note">Arquivo gerado pelo painel administrativo MR em ${new Date().toLocaleString("pt-BR")}.</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

function AdminPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: appointments } = useQuery({
    queryKey: ["appointments"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_at, customer_name, customer_email, customer_phone, notes, status, created_at, reminder_sent_at, customer_confirmed_at, service:services(name, icon)")
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, full_name, email, phone, desired_procedure, important_notes, next_appointment_at, last_appointment_at, total_appointments, created_at")
        .order("updated_at", { ascending: false });
      if (error) {
        console.warn("Clients table unavailable:", error.message);
        return [] as ClientRow[];
      }
      return data as ClientRow[];
    },
  });

  const { data: accessRequest } = useQuery({
    queryKey: ["admin-access-request", user?.id],
    enabled: !!user && !isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_access_requests")
        .select("id, user_id, email, full_name, status, requested_at, reviewed_at, reviewer_note")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as AdminAccessRequest | null;
    },
  });

  const metrics = useMemo(() => {
    const list = appointments ?? [];
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
    return {
      total: list.length,
      clients: clients?.length || new Set(list.map(a => a.customer_email.toLowerCase())).size,
      today: list.filter(a => { const d = new Date(a.scheduled_at); return d >= today && d < tomorrow; }).length,
      pending: list.filter(a => a.status === "pending").length,
      confirmed: list.filter(a => a.status === "confirmed").length,
    };
  }, [appointments, clients]);

  async function setStatus(id: string, status: AppointmentStatus) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["appointments"] });
    qc.invalidateQueries({ queryKey: ["clients"] });
  }

  async function removeAppointment(appointment: Row) {
    const confirmed = window.confirm(`Remover o agendamento de ${appointment.customer_name} do painel?`);
    if (!confirmed) return;

    const { error } = await supabase.from("appointments").delete().eq("id", appointment.id);
    if (error) return toast.error(error.message);
    toast.success("Agendamento removido do painel");
    qc.invalidateQueries({ queryKey: ["appointments"] });
    qc.invalidateQueries({ queryKey: ["clients"] });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  function exportAppointmentsCsv() {
    const list = appointments ?? [];
    if (!list.length) {
      toast.info("Nenhum agendamento para exportar.");
      return;
    }

    const headers = [
      "Status",
      "Cliente",
      "Telefone",
      "Procedimento",
      "Data",
      "Horário",
      "Confirmação",
      "Lembrete",
      "Informações importantes",
      "Email",
      "Criado em",
      "Código",
    ];

    const rows = list.map((a) => {
      const scheduled = new Date(a.scheduled_at);
      return {
        status: a.status,
        cells: [
          STATUS_LABEL[a.status],
          a.customer_name,
          a.customer_phone,
          a.service?.name ?? "Não informado",
          scheduled.toLocaleDateString("pt-BR"),
          scheduled.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          a.customer_confirmed_at ? "Sim" : "Não",
          a.reminder_sent_at ? "Sim" : "Não",
          a.notes ?? "",
          a.customer_email,
          new Date(a.created_at).toLocaleString("pt-BR"),
          a.id,
        ],
      };
    });

    downloadWorkbook({
      filename: "agenda-mr-odontologia",
      title: "Controle de agendamentos",
      subtitle: "Agenda, procedimento desejado, confirmacao e lembretes dos pacientes.",
      summary: [
        { label: "Agendamentos", value: list.length },
        { label: "Pendentes", value: list.filter((a) => a.status === "pending").length },
        { label: "Confirmados", value: list.filter((a) => a.status === "confirmed").length },
        { label: "Lembretes enviados", value: list.filter((a) => a.reminder_sent_at).length },
      ],
      headers,
      rows,
    });
    toast.success("Planilha visual da agenda gerada.");
  }

  function exportClientsCsv() {
    const list = clients ?? [];
    if (!list.length) {
      toast.info("Nenhum cliente consolidado para exportar. Rode a migration da tabela clients no Supabase.");
      return;
    }

    const headers = [
      "Cliente",
      "Email",
      "Telefone",
      "Procedimento desejado",
      "Informações importantes",
      "Próximo horário",
      "Último horário",
      "Total de agendamentos",
      "Criado em",
      "Código",
    ];

    const rows = list.map((c) => ({
      cells: [
        c.full_name,
        c.email,
        c.phone,
        c.desired_procedure ?? "",
        c.important_notes ?? "",
        formatDateTime(c.next_appointment_at),
        formatDateTime(c.last_appointment_at),
        c.total_appointments,
        formatDateTime(c.created_at),
        c.id,
      ],
    }));

    downloadWorkbook({
      filename: "clientes-mr-odontologia",
      title: "Controle de clientes",
      subtitle: "Dados consolidados dos pacientes, procedimento desejado e observacoes importantes.",
      summary: [
        { label: "Clientes", value: list.length },
        { label: "Com proximo horario", value: list.filter((c) => c.next_appointment_at).length },
        { label: "Agendamentos totais", value: list.reduce((sum, c) => sum + c.total_appointments, 0) },
        { label: "Com observacoes", value: list.filter((c) => c.important_notes).length },
      ],
      headers,
      rows,
    });
    toast.success("Planilha visual de clientes gerada.");
  }

  if (loading) return <div className="py-32 text-center text-muted-foreground">Carregando…</div>;
  if (!user) return null;

  if (!isAdmin) {
    return (
      <section className="py-32 px-6 max-w-2xl mx-auto text-center">
        <h1 className="font-serif text-4xl mb-3">Acesso restrito</h1>
        <p className="text-muted-foreground mb-6">Sua conta ({user.email}) ainda não tem permissão de administrador.</p>
        <div className="bg-card border border-border/60 rounded-2xl p-6 mb-6 text-left">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Status da solicitação</div>
          <div className="font-serif text-2xl capitalize">{accessRequest?.status ?? "sem solicitação"}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {accessRequest?.status === "pending" && "Aguardando aprovação por email em luiznovakiresner228@gmail.com."}
            {accessRequest?.status === "rejected" && "A solicitação foi recusada. Esta conta continuará sem acesso ao painel."}
            {accessRequest?.status === "approved" && "A solicitação foi aprovada. Entre novamente para atualizar a sessão."}
            {!accessRequest && "Crie a conta pela tela de login para disparar o email de aprovação."}
          </p>
        </div>
        <button onClick={handleLogout} className="btn-outline-luxe">Sair</button>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 max-w-[1280px] mx-auto">
      <div className="bg-card rounded-3xl shadow-[var(--shadow-luxe)] border border-border/60 overflow-hidden animate-fade-up">
        <div className="bg-primary text-primary-foreground px-8 py-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="section-kicker !text-[var(--gold-light)]">Gestão clínica</div>
            <div className="font-serif text-3xl mt-1">Painel de agendamentos</div>
            <div className="text-[12px] text-white/60 mt-1">{user.email}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SPREADSHEET_URL && (
              <a
                href={SPREADSHEET_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[12px] border border-white/20 px-4 py-2 rounded-full hover:bg-white/10"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Planilha online
              </a>
            )}
            <button
              onClick={exportAppointmentsCsv}
              className="inline-flex items-center gap-2 text-[12px] border border-white/20 px-4 py-2 rounded-full hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar Excel agenda
            </button>
            <Link to="/" className="inline-flex items-center text-[12px] text-white/70 hover:text-white px-4 py-2">Site →</Link>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 text-[12px] border border-white/20 px-4 py-2 rounded-full hover:bg-white/10">
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { l: "Total", v: metrics.total, icon: UsersRound },
              { l: "Clientes", v: metrics.clients, icon: UsersRound },
              { l: "Hoje", v: metrics.today, icon: CalendarDays },
              { l: "Pendentes", v: metrics.pending, icon: CalendarDays },
            ].map((m) => (
              <div key={m.l} className="bg-[var(--cream)] rounded-2xl p-5 border border-border/60">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
                  {m.l}
                  <m.icon className="h-4 w-4 text-[var(--clinical)]" />
                </div>
                <div className="font-serif text-4xl font-light leading-none">{m.v}</div>
              </div>
            ))}
          </div>

          <div className="mb-6 rounded-2xl border border-[var(--clinical-light)] bg-[var(--clinical-light)]/45 p-5 text-sm text-[var(--clinical-strong)]">
            A exportacao baixa uma planilha Excel com identidade MR, resumo, cliente, contato, procedimento desejado, status, observacoes e codigo do agendamento.
            {SPREADSHEET_URL ? " O botão de planilha online abre a URL configurada no ambiente." : " Para apontar para uma planilha online fixa, configure VITE_CLIENTS_SPREADSHEET_URL no .env."}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/60">
                  <th className="py-3 px-3">Quando</th>
                  <th className="py-3 px-3">Procedimento</th>
                  <th className="py-3 px-3">Paciente</th>
                  <th className="py-3 px-3">Contato</th>
                  <th className="py-3 px-3">Informações</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {(appointments ?? []).map((a) => (
                  <tr key={a.id} className="border-b border-border/40 hover:bg-[var(--cream)]/50">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium">{new Date(a.scheduled_at).toLocaleDateString("pt-BR")}</div>
                      <div className="text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="py-3 px-3">
                      {a.service?.name}
                    </td>
                    <td className="py-3 px-3">{a.customer_name}</td>
                    <td className="py-3 px-3">
                      <div className="text-xs">{a.customer_email}</div>
                      <div className="text-xs text-muted-foreground">{a.customer_phone}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[220px]">
                      <div className="text-xs text-muted-foreground line-clamp-2">{a.notes || "Sem observações"}</div>
                    </td>
                    <td className="py-3 px-3"><StatusBadge s={a.status} /></td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-2">
                      <select
                        value={a.status}
                        onChange={(e) => setStatus(a.id, e.target.value as AppointmentStatus)}
                        className="text-xs border border-border rounded-full px-3 py-1 bg-card"
                      >
                        {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map(s => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeAppointment(a)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {appointments?.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Nenhum agendamento ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ s }: { s: AppointmentStatus }) {
  const styles: Record<AppointmentStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    done: "bg-[var(--clinical-light)] text-[var(--clinical)]",
    cancelled: "bg-red-100 text-red-800",
  };
  return <span className={`text-[11px] font-medium px-3 py-1 rounded-full ${styles[s]}`}>{STATUS_LABEL[s]}</span>;
}
