// Envia e-mail via Resend. Só envia para o e-mail da própria usuária autenticada.
import { requireUser, json } from "./_shared.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const user = await requireUser(req);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { to, subject, body } = await req.json();
  if (!to || !subject || !body) return json({ error: "Missing fields" }, 400);

  // Anti-abuso: só permite enviar para o e-mail da própria usuária
  if (to.toLowerCase() !== user.email.toLowerCase()) {
    return json({ error: "Can only send to your own email" }, 403);
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Reconectar <onboarding@resend.dev>",
      to: [to],
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    return json({ error: "Failed to send email" }, 502);
  }

  return json({ ok: true });
};
