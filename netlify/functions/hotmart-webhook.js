// Webhook da Hotmart: libera/bloqueia o acesso premium automaticamente.
// Configure na Hotmart: Ferramentas > Webhook (versão 2.0) apontando para
// https://SEU-SITE.netlify.app/.netlify/functions/hotmart-webhook
import { adminClient, json } from "./_shared.js";

const APPROVED_EVENTS = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE", "SUBSCRIPTION_REACTIVATION"];
const REVOKED_EVENTS = [
  "PURCHASE_CANCELED",
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "SUBSCRIPTION_CANCELLATION",
  "PURCHASE_PROTEST",
  "PURCHASE_EXPIRED",
];

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Hotmart envia o token no header X-HOTMART-HOTTOK
  const hottok = req.headers.get("x-hotmart-hottok");
  if (!process.env.HOTMART_WEBHOOK_SECRET || hottok !== process.env.HOTMART_WEBHOOK_SECRET) {
    return json({ error: "Invalid webhook token" }, 401);
  }

  const payload = await req.json();
  const event = payload.event || payload.event_name;
  const buyerEmail = (payload.data?.buyer?.email || payload.buyer?.email || "").toLowerCase();
  const transaction = payload.data?.purchase?.transaction || payload.transaction || null;
  const productId = String(payload.data?.product?.id || payload.prod || "");

  if (!buyerEmail) return json({ error: "No buyer email in payload" }, 400);

  const supabase = adminClient();

  // Localiza a usuária pelo e-mail
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", buyerEmail)
    .maybeSingle();

  if (!profile) {
    // Compra antes do cadastro: registra em log e responde 200 para a Hotmart não reenviar.
    console.log(`Hotmart: comprador ${buyerEmail} ainda não tem conta. Evento: ${event}`);
    return json({ ok: true, note: "user not registered yet" });
  }

  if (APPROVED_EVENTS.includes(event)) {
    await supabase.from("profiles").update({ premium: true }).eq("id", profile.id);

    // Se o produto Hotmart estiver vinculado a um produto específico, registra o acesso
    if (productId) {
      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("hotmart_product_id", productId)
        .maybeSingle();
      if (product) {
        await supabase.from("access").upsert(
          {
            user_id: profile.id,
            product_id: product.id,
            active: true,
            hotmart_transaction_id: transaction,
          },
          { onConflict: "user_id,product_id" }
        );
      }
    }
    return json({ ok: true, action: "granted" });
  }

  if (REVOKED_EVENTS.includes(event)) {
    await supabase.from("profiles").update({ premium: false }).eq("id", profile.id);
    await supabase.from("access").update({ active: false }).eq("user_id", profile.id);
    return json({ ok: true, action: "revoked" });
  }

  return json({ ok: true, action: "ignored", event });
};
