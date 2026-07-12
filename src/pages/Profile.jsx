import { useEffect, useState } from "react";
import { Mail, LogOut, Camera, Sparkles } from "lucide-react";
import { base44 } from "../api/supabaseClient";
import { useAuth } from "../context/AuthContext";

const SUPPORT_EMAIL = "soporte@reconectar.app"; // ajuste para o e-mail real

export default function Profile() {
  const { user, refreshUser, isPremium } = useAuth();
  const [name, setName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [progressSummary, setProgressSummary] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);

  useEffect(() => {
    (async () => {
      const [prog, quizzes] = await Promise.all([
        base44.entities.Progress.filter({ user_id: user.id, completed: true }).catch(() => []),
        base44.entities.DailyQuizResult.filter({ user_id: user.id }, "-quiz_date", 5).catch(() => []),
      ]);
      setProgressSummary(prog.length);
      setQuizHistory(quizzes);
    })();
  }, [user.id]);

  const saveName = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: name });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ photo_url: file_url });
    await refreshUser();
  };

  return (
    <div className="py-6 space-y-6 max-w-lg">
      <h1 className="font-display text-3xl text-malva-700">Mi perfil</h1>

      {/* Foto + nome */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-rosa-200 overflow-hidden flex items-center justify-center">
              {user?.photo_url
                ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-malva-600">{(user?.full_name || user?.email || "?")[0]?.toUpperCase()}</span>}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-rosa-500 text-white rounded-full p-1.5">
              <Camera size={14} />
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
          </label>
          <div>
            <p className="font-bold text-malva-700">{user?.full_name || "Sin nombre"}</p>
            <p className="text-sm text-malva-400">{user?.email}</p>
            <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${isPremium ? "bg-dorado text-white" : "bg-rosa-100 text-malva-500"}`}>
              {isPremium ? "Premium ✨" : "Gratuita"}
            </span>
          </div>
        </div>

        <form onSubmit={saveName} className="mt-5 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="input" />
          <button disabled={saving} className="bg-rosa-500 text-white font-bold px-5 rounded-2xl text-sm disabled:opacity-50">
            {saved ? "✓" : "Guardar"}
          </button>
        </form>
      </div>

      {/* Resumo de progresso */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="font-bold text-malva-700 mb-2">Mi progreso</h2>
        <p className="text-malva-500 text-sm">
          Has completado <span className="font-bold text-rosa-500">{progressSummary ?? "…"}</span> módulos. ¡Sigue así! 💪
        </p>
      </div>

      {/* Histórico de quizzes */}
      {quizHistory.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="font-bold text-malva-700 mb-3 flex items-center gap-2"><Sparkles size={18} /> Mis quizzes</h2>
          <ul className="space-y-2">
            {quizHistory.map((q) => (
              <li key={q.id} className="text-sm">
                <span className="text-malva-300">{q.quiz_date}</span>{" · "}
                <span className="font-bold text-malva-600">{q.profile_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Soporte + salir */}
      <a
        href={`mailto:${SUPPORT_EMAIL}?subject=Soporte%20Reconectar`}
        className="flex items-center justify-center gap-2 w-full bg-white border border-rosa-200 text-malva-600 font-bold py-3 rounded-full hover:bg-rosa-50"
      >
        <Mail size={18} /> Contactar soporte
      </a>
      <button
        onClick={() => base44.auth.logout()}
        className="flex items-center justify-center gap-2 w-full text-malva-400 font-bold py-3 rounded-full hover:bg-rosa-50"
      >
        <LogOut size={18} /> Cerrar sesión
      </button>
    </div>
  );
}
