type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

const fromEmail = Deno.env.get("FROM_EMAIL") ?? "MR Odontologia <onboarding@resend.dev>";

export async function sendEmail(payload: EmailPayload) {
  const apiKey = Deno.env.get("RESEND_API_KEY");

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY missing; email skipped:", payload.subject);
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      ...payload,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend failed: ${response.status} ${details}`);
  }

  return response.json();
}
