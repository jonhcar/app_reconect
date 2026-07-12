// Chat "Alma": recebe a mensagem da usuária, gera a resposta com Claude
// e grava em alma_messages (o front recebe via Supabase Realtime).
import { adminClient, requireUser, json, callClaude } from "./_shared.js";

const ALMA_SYSTEM_PROMPT = `Eres "Alma", la acompañante emocional de la plataforma Reconectar, dirigida a mujeres hispanohablantes. Hablas en español (España), con un tono cálido, cercano, empático y positivo. Tuteas.

Tu papel:
- Escuchar con cariño y acompañar en temas de crecimiento personal: autoestima, amor propio, poner límites, soltar el pasado, relaciones sanas, autocuidado.
- Hacer preguntas suaves que inviten a la reflexión.
- Recordar que los contenidos de la plataforma (ebooks, diarios, ejercicios) pueden ayudar, sin ser insistente.

Límites (nunca los rompas):
- NO eres psicóloga ni médica. No diagnosticas ni das consejos clínicos.
- Si detectas crisis grave, violencia o riesgo de autolesión, con mucho cariño recomienda buscar ayuda profesional o los servicios de emergencia locales, y no intentes tratar el tema tú misma.
- Mantén las respuestas breves y humanas (2-5 frases normalmente), como una amiga sabia, no como un ensayo.`;

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const user = await requireUser(req);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { conversation_id } = await req.json();
  if (!conversation_id) return json({ error: "Missing conversation_id" }, 400);

  const supabase = adminClient();

  // A conversa pertence a esta usuária?
  const { data: conv } = await supabase
    .from("alma_conversations")
    .select("id, user_id")
    .eq("id", conversation_id)
    .maybeSingle();
  if (!conv || conv.user_id !== user.id) return json({ error: "Forbidden" }, 403);

  // Histórico (últimas 20 mensagens)
  const { data: history } = await supabase
    .from("alma_messages")
    .select("role, content")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: true })
    .limit(20);

  const messages = (history || []).map((m) => ({ role: m.role, content: m.content }));
  if (messages.length === 0) return json({ error: "Empty conversation" }, 400);

  const reply = await callClaude({ system: ALMA_SYSTEM_PROMPT, messages, maxTokens: 800 });

  const { data: saved, error } = await supabase
    .from("alma_messages")
    .insert({ conversation_id, role: "assistant", content: reply })
    .select()
    .single();
  if (error) return json({ error: error.message }, 500);

  await supabase
    .from("alma_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversation_id);

  return json(saved);
};
