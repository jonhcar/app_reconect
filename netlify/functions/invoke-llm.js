// Gera conteúdo com IA. Ação principal: "daily-quiz" — gera o quiz do dia
// UMA vez e guarda em daily_quizzes (todas as usuárias veem o mesmo).
import { adminClient, requireUser, json, callClaude } from "./_shared.js";

const QUIZ_SYSTEM_PROMPT = `Eres un generador de quizzes diarios para "Reconectar", una plataforma de bienestar emocional y crecimiento personal dirigida a mujeres, en español (español de España). Tu tarea es crear UN quiz nuevo cada día.

Reglas del quiz que generas:
- Idioma: español, tono cálido, cercano, empático y positivo. Tuteas (usas "tú").
- Tema: elige uno de estos ejes y varíalo cada día para no repetir: autoestima, amor propio, poner límites, dependencia emocional, soltar el pasado, relaciones sanas, autocuidado, confianza en una misma, gestión de emociones.
- Formato de salida (devuélvelo SIEMPRE en este formato JSON, sin texto adicional):
{
  "titulo": "un título cálido y atractivo",
  "intro": "una frase breve de introducción",
  "preguntas": [
    { "pregunta": "...", "opciones": ["...", "...", "..."] }
  ],
  "perfiles": [
    { "nombre": "nombre del perfil", "mensaje": "mensaje cálido de resultado", "recomendacion": "contenido de la plataforma recomendado" }
  ]
}
Exactamente 5 preguntas (3 o 4 opciones cada una) y 3 perfiles posibles.

Reglas de contenido y seguridad (nunca las rompas):
- Es un quiz de reflexión y autoconocimiento, NO un diagnóstico psicológico ni médico. Nunca uses lenguaje clínico ni diagnostiques.
- Nada de preguntas que puedan hacer sentir mal, culpar o angustiar a la persona. Siempre desde el cariño y el crecimiento.
- No toques temas de violencia, autolesión, trastornos ni crisis graves. Mantente en el terreno del crecimiento personal cotidiano.
- Los mensajes de resultado siempre son amables, esperanzadores y empoderadores.
- Las recomendaciones deben referirse a contenidos generales de la plataforma (ebooks de autoestima, límites, amor propio, relaciones), sin inventar títulos que quizá no existan.`;

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const user = await requireUser(req);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const payload = await req.json();
  const supabase = adminClient();

  if (payload.action === "daily-quiz") {
    const date = payload.date || new Date().toISOString().slice(0, 10);

    // Já existe? Devolve o existente (evita gerar duas vezes)
    const { data: existing } = await supabase.from("daily_quizzes").select("*").eq("date", date).maybeSingle();
    if (existing) return json(existing);

    const text = await callClaude({
      system: QUIZ_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Genera el quiz del día ${date}. Devuelve solo el JSON.` }],
      maxTokens: 2000,
    });

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return json({ error: "Invalid AI response" }, 502);
    const quiz = JSON.parse(match[0]);

    const { data, error } = await supabase
      .from("daily_quizzes")
      .upsert(
        {
          date,
          title: quiz.titulo,
          intro: quiz.intro,
          questions: quiz.preguntas,
          perfiles: quiz.perfiles,
        },
        { onConflict: "date" }
      )
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);
    return json(data);
  }

  // Modo genérico: { prompt }
  if (payload.prompt) {
    const text = await callClaude({
      system: "Eres un asistente útil de la plataforma Reconectar. Responde en español.",
      messages: [{ role: "user", content: payload.prompt }],
    });
    return json({ text });
  }

  return json({ error: "Unknown action" }, 400);
};
