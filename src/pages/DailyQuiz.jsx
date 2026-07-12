import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { base44 } from "../api/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function DailyQuiz() {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      try {
        // Resultado de hoje já existe?
        const prev = await base44.entities.DailyQuizResult.filter({ user_id: user.id, quiz_date: today });
        if (prev.length > 0) {
          setResult({ nombre: prev[0].profile_name, mensaje: prev[0].message, recomendacion: prev[0].recommendation });
        }
        // Busca o quiz do dia; se não existir, pede à function para gerar
        let quizzes = await base44.entities.DailyQuiz.filter({ date: today });
        if (quizzes.length === 0) {
          await base44.integrations.Core.InvokeLLM({ action: "daily-quiz", date: today });
          quizzes = await base44.entities.DailyQuiz.filter({ date: today });
        }
        setQuiz(quizzes[0] || null);
      } catch {
        setError("No se pudo cargar el quiz de hoy. Vuelve a intentarlo más tarde.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id, today]);

  const questions = quiz?.questions || [];
  const perfiles = quiz?.perfiles || [];

  const answer = async (optionIndex) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);
    if (step + 1 < questions.length) {
      setStep(step + 1);
      return;
    }
    // Perfil mais votado: cada opção i aponta para perfiles[i % perfiles.length]
    const counts = {};
    newAnswers.forEach((a) => {
      const idx = a % (perfiles.length || 1);
      counts[idx] = (counts[idx] || 0) + 1;
    });
    const winner = perfiles[Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]) || 0] || perfiles[0];
    setResult(winner);
    try {
      await base44.entities.DailyQuizResult.create({
        user_id: user.id,
        quiz_date: today,
        quiz_title: quiz.title,
        profile_name: winner?.nombre,
        message: winner?.mensaje,
        recommendation: winner?.recomendacion,
      });
    } catch { /* já respondeu hoje */ }
  };

  if (loading) return <div className="py-20 text-center text-malva-400 animate-pulse">Preparando tu quiz…</div>;

  return (
    <div className="py-6 max-w-lg mx-auto">
      <h1 className="font-display text-3xl text-malva-700 flex items-center gap-2 mb-2">
        <Sparkles className="text-dorado" /> Quiz del día
      </h1>

      {error && <p className="text-malva-400">{error}</p>}

      {!quiz && !error && (
        <p className="text-malva-400">El quiz de hoy aún se está preparando. Vuelve en unos minutos 💗</p>
      )}

      {quiz && !result && (
        <div className="mt-4">
          <h2 className="font-bold text-xl text-malva-700">{quiz.title}</h2>
          <p className="text-malva-400 text-sm mt-1">{quiz.intro}</p>

          <div className="mt-6 bg-white rounded-3xl p-6 shadow-sm">
            <p className="text-xs text-malva-300 mb-2">Pregunta {step + 1} de {questions.length}</p>
            <div className="h-1.5 bg-rosa-100 rounded-full mb-5">
              <div className="h-full bg-rosa-400 rounded-full transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
            </div>
            <h3 className="font-bold text-malva-700 text-lg mb-4">{questions[step]?.pregunta}</h3>
            <div className="space-y-3">
              {(questions[step]?.opciones || []).map((op, i) => (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  className="w-full text-left bg-rosa-50 hover:bg-rosa-100 border border-rosa-100 rounded-2xl px-4 py-3 text-malva-600 font-semibold"
                >
                  {typeof op === "string" ? op : op.texto}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-gradient-to-br from-rosa-100 to-crema rounded-3xl p-8 text-center shadow-sm">
          <p className="text-sm text-malva-400">Tu resultado de hoy</p>
          <h2 className="font-display text-2xl text-malva-700 mt-2">{result.nombre}</h2>
          <p className="text-malva-500 mt-4">{result.mensaje}</p>
          {result.recomendacion && (
            <div className="mt-5 bg-white rounded-2xl p-4 text-sm text-malva-600">
              💡 <span className="font-bold">Para ti:</span> {result.recomendacion}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-malva-300 text-center mt-8">
        Este quiz es una herramienta de reflexión y autoconocimiento. No es un diagnóstico ni sustituye la ayuda profesional.
      </p>
    </div>
  );
}
