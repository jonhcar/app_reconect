// Webhook da Hotmart: libera/bloqueia o acesso POR PRODUTO automaticamente.
// Configure na Hotmart: Ferramentas > Webhook (versão 2.0) apontando para
// https://app.clubdigital.site/.netlify/functions/hotmart-webhook
//
// Fluxo: cada produto do app tem um hotmart_product_id. Quando a compra é
// aprovada, o acesso àquele produto é liberado para o e-mail do comprador.
// Se o comprador ainda não tem conta, a compra fica em pending_purchases e
// é liberada automaticamente quando ele se cadastrar (trigger no banco).
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
  const hotmartProductId = String(payload.data?.product?.id || payload.prod || "");

  if (!buyerEmail) return json({ error: "No buyer email in payload" }, 400);
  if (!APPROVED_EVENTS.includes(event) && !REVOKED_EVENTS.includes(event)) {
    return json({ ok: true, action: "ignored", event });
  }
  if (!hotmartProductId) {
    console.log(`Hotmart: evento ${event} sem ID de produto (comprador ${buyerEmail})`);
    return json({ ok: true, note: "no product id in payload" });
  }

  const supabase = adminClient();

  // Produto do app vinculado a esse produto da Hotmart
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("hotmart_product_id", hotmartProductId)
    .maybeSingle();

  if (!product) {
    console.log(`Hotmart: produto ${hotmartProductId} não vinculado a nenhum produto do app. Evento: ${event}`);
    return json({ ok: true, note: "unknown product" });
  }

  // Localiza a usuária pelo e-mail da compra
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", buyerEmail)
    .maybeSingle();

  if (APPROVED_EVENTS.includes(event)) {
    if (!profile) {
      // Compra antes do cadastro: guarda como pendente; o trigger do banco
      // libera o acesso assim que a conta for criada com esse e-mail.
      await supabase.from("pending_purchases").upsert(
        { email: buyerEmail, product_id: product.id, hotmart_transaction_id: transaction },
        { onConflict: "email,product_id" }
      );
      return json({ ok: true, action: "pending", note: "user not registered yet" });
    }
    await supabase.from("access").upsert(
      {
        user_id: profile.id,
        product_id: product.id,
        active: true,
        hotmart_transaction_id: transaction,
      },
      { onConflict: "user_id,product_id" }
    );
    return json({ ok: true, action: "granted" });
  }

  // Reembolso/cancelamento: revoga só o produto da transação
  if (profile) {
    await supabase
      .from("access")
      .update({ active: false })
      .eq("user_id", profile.id)
      .eq("product_id", product.id);
  } else {
    await supabase
      .from("pending_purchases")
      .delete()
      .eq("email", buyerEmail)
      .eq("product_id", product.id);
  }
  return json({ ok: true, action: "revoked" });
};
