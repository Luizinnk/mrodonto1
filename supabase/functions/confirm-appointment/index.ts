import { corsHeaders, htmlResponse, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) return jsonResponse({ error: "Missing confirmation token" }, 400);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("appointments")
      .update({
        status: "confirmed",
        customer_confirmed_at: new Date().toISOString(),
      })
      .eq("customer_confirmation_token", token)
      .select("customer_name, scheduled_at")
      .single();

    if (error || !data) return htmlResponse("<h1>Confirmação não encontrada.</h1>", 404);

    const time = new Date(data.scheduled_at).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    });

    return htmlResponse(`
      <html lang="pt-BR">
        <body style="font-family:Arial,sans-serif;padding:40px;line-height:1.5">
          <h1>Horário confirmado</h1>
          <p>Obrigado, <strong>${data.customer_name}</strong>. Sua reserva para <strong>${time}</strong> foi confirmada.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
    );
  }
});
