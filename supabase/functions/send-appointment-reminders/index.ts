import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/email.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

function saoPauloDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function nextDay(dateString: string) {
  const date = new Date(`${dateString}T03:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createAdminClient();
    const today = saoPauloDate();
    const tomorrow = nextDay(today);
    const start = `${today}T00:00:00-03:00`;
    const end = `${tomorrow}T00:00:00-03:00`;

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select(
        "id, scheduled_at, customer_name, customer_email, customer_confirmation_token, service:services(name)",
      )
      .gte("scheduled_at", start)
      .lt("scheduled_at", end)
      .in("status", ["pending", "confirmed"])
      .is("reminder_sent_at", null);

    if (error) throw error;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const appUrl = Deno.env.get("APP_PUBLIC_URL") ?? "";
    let sent = 0;

    for (const appointment of appointments ?? []) {
      const scheduled = new Date(appointment.scheduled_at);
      const confirmUrl = `${supabaseUrl}/functions/v1/confirm-appointment?token=${appointment.customer_confirmation_token}`;
      const time = scheduled.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });

      await sendEmail({
        to: appointment.customer_email,
        subject: `Confirme sua consulta de hoje às ${time}`,
        html: `
          <h2>Bom dia, ${appointment.customer_name}!</h2>
          <p>Este é um lembrete da sua reserva para hoje às <strong>${time}</strong>.</p>
          <p><strong>Procedimento:</strong> ${appointment.service?.name ?? "Atendimento odontológico"}</p>
          <p>Clique para confirmar sua presença:</p>
          <p><a href="${confirmUrl}" style="background:#075864;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;">Confirmar horário</a></p>
          ${appUrl ? `<p>Site: <a href="${appUrl}">${appUrl}</a></p>` : ""}
        `,
      });

      const { error: updateError } = await supabase
        .from("appointments")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", appointment.id);
      if (updateError) throw updateError;
      sent++;
    }

    return jsonResponse({ ok: true, date: today, sent });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
    );
  }
});
