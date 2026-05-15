import { corsHeaders, htmlResponse, jsonResponse } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/email.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const decision = url.searchParams.get("decision");
    if (!token || !["approved", "rejected"].includes(decision ?? "")) {
      return jsonResponse({ error: "Invalid token or decision" }, 400);
    }

    const supabase = createAdminClient();
    const { data: request, error } = await supabase
      .from("admin_access_requests")
      .select("id, user_id, email, full_name, status")
      .eq("decision_token", token)
      .single();

    if (error || !request) return htmlResponse("<h1>Solicitação não encontrada.</h1>", 404);

    if (decision === "approved") {
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: request.user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (roleError) throw roleError;
    } else {
      const { error: roleDeleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", request.user_id)
        .eq("role", "admin");
      if (roleDeleteError) throw roleDeleteError;
    }

    const { error: updateError } = await supabase
      .from("admin_access_requests")
      .update({
        status: decision,
        reviewed_at: new Date().toISOString(),
        reviewer_note: decision === "approved" ? "Aprovado por email" : "Recusado por email",
      })
      .eq("id", request.id);
    if (updateError) throw updateError;

    await sendEmail({
      to: request.email,
      subject:
        decision === "approved"
          ? "Acesso administrativo aprovado"
          : "Acesso administrativo recusado",
      html:
        decision === "approved"
          ? "<p>Seu acesso ao painel administrativo da MR Odontologia foi aprovado. Você já pode entrar com seu email e senha.</p>"
          : "<p>Sua solicitação de acesso ao painel administrativo da MR Odontologia foi recusada.</p>",
    });

    return htmlResponse(`
      <html lang="pt-BR">
        <body style="font-family:Arial,sans-serif;padding:40px;line-height:1.5">
          <h1>${decision === "approved" ? "Acesso aprovado" : "Acesso recusado"}</h1>
          <p>Solicitação de <strong>${request.email}</strong> atualizada com sucesso.</p>
          <p>Você pode fechar esta aba.</p>
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
