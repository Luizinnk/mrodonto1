import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/email.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { userId, email, name } = await req.json();
    if (!userId || !email) return jsonResponse({ error: "userId and email are required" }, 400);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("admin_access_requests")
      .upsert(
        {
          user_id: userId,
          email,
          full_name: name ?? null,
          status:
            email.toLowerCase() === "luiznovakiresner228@gmail.com" ? "approved" : "pending",
          reviewed_at:
            email.toLowerCase() === "luiznovakiresner228@gmail.com"
              ? new Date().toISOString()
              : null,
          reviewer_note:
            email.toLowerCase() === "luiznovakiresner228@gmail.com"
              ? "Acesso principal aprovado automaticamente."
              : null,
        },
        { onConflict: "user_id" },
      )
      .select("id, decision_token")
      .single();

    if (error) throw error;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const ownerEmail = Deno.env.get("ADMIN_APPROVAL_EMAIL") ?? "luiznovakiresner228@gmail.com";
    const approveUrl = `${supabaseUrl}/functions/v1/review-admin-request?token=${data.decision_token}&decision=approved`;
    const rejectUrl = `${supabaseUrl}/functions/v1/review-admin-request?token=${data.decision_token}&decision=rejected`;

    await sendEmail({
      to: ownerEmail,
      subject: "Nova solicitação de acesso ao painel MR Odontologia",
      html: `
        <h2>Solicitação de acesso administrativo</h2>
        <p><strong>Nome:</strong> ${name || "Não informado"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Escolha uma ação:</p>
        <p>
          <a href="${approveUrl}" style="background:#075864;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;">Aprovar acesso</a>
          &nbsp;
          <a href="${rejectUrl}" style="background:#991b1b;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;">Recusar acesso</a>
        </p>
        <p>Se você recusar, a pessoa continuará sem permissão para abrir o painel admin.</p>
      `,
      text: `Nova solicitação de acesso: ${name || "Sem nome"} <${email}>. Aprovar: ${approveUrl} Recusar: ${rejectUrl}`,
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
    );
  }
});
