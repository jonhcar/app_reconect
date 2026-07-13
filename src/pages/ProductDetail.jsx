import { useEffect, useState } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, CheckCircle2, Circle, Download, Printer, Mail, Star } from "lucide-react";
import { base44 } from "../api/supabaseClient";
import { useAuth } from "../context/AuthContext";
import AudioPlayer from "../components/AudioPlayer";
import Journal from "../components/Journal";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { openUnlock } = useOutletContext();

  const [product, setProduct] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [favorite, setFavorite] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewSent, setReviewSent] = useState(false);
  const [emailSent, setEmailSent] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [p, mods, prog, revs, favs, acc] = await Promise.all([
          base44.entities.Product.get(id),
          base44.entities.Module.filter({ product_id: id }, "order"),
          base44.entities.Progress.filter({ user_id: user.id, product_id: id }),
          base44.entities.Review.filter({ product_id: id, status: "approved" }, "-created_at", 10),
          base44.entities.Favorite.filter({ user_id: user.id, product_id: id }),
          base44.entities.Access.filter({ user_id: user.id, product_id: id, active: true }).catch(() => []),
        ]);
        setProduct(p);
        setModules(mods);
        setProgress(prog);
        setReviews(revs);
        setFavorite(favs[0] || null);
        setUnlocked(isPremium || p.is_free || acc.length > 0);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user.id, isPremium]);

  if (loading) return <div className="py-20 text-center text-malva-400 animate-pulse">Cargando…</div>;
  if (!product) return <div className="py-20 text-center text-malva-400">Producto no encontrado.</div>;

  if (!unlocked) {
    openUnlock();
    navigate("/");
    return null;
  }

  const done = (moduleId) => progress.find((pr) => pr.module_id === moduleId)?.completed;
  const completedCount = modules.filter((m) => done(m.id)).length;
  const pct = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;

  const toggleModule = async (mod) => {
    const existing = progress.find((pr) => pr.module_id === mod.id);
    if (existing) {
      const updated = await base44.entities.Progress.update(existing.id, { completed: !existing.completed });
      setProgress(progress.map((pr) => (pr.id === existing.id ? updated : pr)));
    } else {
      const created = await base44.entities.Progress.create({
        user_id: user.id, product_id: id, module_id: mod.id, completed: true,
      });
      setProgress([...progress, created]);
    }
  };

  const toggleFavorite = async () => {
    if (favorite) {
      await base44.entities.Favorite.delete(favorite.id);
      setFavorite(null);
    } else {
      const f = await base44.entities.Favorite.create({ user_id: user.id, product_id: id });
      setFavorite(f);
    }
  };

  const sendReview = async (e) => {
    e.preventDefault();
    await base44.entities.Review.create({
      user_id: user.id,
      product_id: id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      user_name: user.full_name || user.email,
    });
    setReviewSent(true);
  };

  const printMaterial = (url) => window.open(url, "_blank");

  const emailMaterial = async (mat) => {
    setEmailSent(mat.url);
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Tu material de Reconectar: ${mat.name}`,
        body: `¡Hola, ${user.full_name || ""}! Aquí está tu material de Reconectar listo para imprimir: ${mat.url}\n\nCon cariño, Reconectar 💗`,
      });
      alert("¡Enviado! Revisa tu correo. 💌");
    } catch {
      alert("No se pudo enviar el correo. Inténtalo más tarde.");
    } finally {
      setEmailSent("");
    }
  };

  return (
    <div className="py-6 space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-malva-400 text-sm">
        <ArrowLeft size={16} /> Volver
      </button>

      {/* Cabeçalho */}
      <div className="flex gap-5">
        {product.cover_image && (
          <img src={product.cover_image} alt="" className="w-32 h-44 object-cover rounded-2xl shadow" />
        )}
        <div className="flex-1">
          <h1 className="font-display text-2xl text-malva-700">{product.title}</h1>
          <p className="text-malva-400 text-sm mt-2">{product.description}</p>
          <button onClick={toggleFavorite} className="mt-3 flex items-center gap-1.5 text-sm font-bold text-rosa-500">
            <Heart size={18} fill={favorite ? "currentColor" : "none"} />
            {favorite ? "En favoritos" : "Añadir a favoritos"}
          </button>
        </div>
      </div>

      {/* Diário interativo (produtos tipo "diario") */}
      {product.type === "diario" && <Journal product={product} user={user} />}

      {/* Progresso */}
      {modules.length > 0 && (
        <div>
          <div className="flex justify-between text-sm text-malva-500 mb-1">
            <span>Tu progreso</span>
            <span className="font-bold">{pct}%</span>
          </div>
          <div className="h-3 bg-rosa-100 rounded-full">
            <div className="h-full bg-rosa-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Módulos */}
      {modules.map((mod) => (
        <div key={mod.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-malva-700">{mod.title}</h3>
              {mod.description && <p className="text-sm text-malva-400">{mod.description}</p>}
              {mod.duration_minutes && <p className="text-xs text-malva-300 mt-1">{mod.duration_minutes} min</p>}
            </div>
            <button onClick={() => toggleModule(mod)} className="text-rosa-500 shrink-0" aria-label="Marcar como completado">
              {done(mod.id) ? <CheckCircle2 size={26} /> : <Circle size={26} className="text-rosa-200" />}
            </button>
          </div>

          {mod.video_url && (
            <div className="aspect-video rounded-xl overflow-hidden bg-malva-800">
              <iframe
                src={mod.video_url}
                title={mod.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {mod.audio_url && <AudioPlayer src={mod.audio_url} title={mod.title} />}

          {(mod.materials || []).map((mat, i) => (
            <div key={i} className="flex items-center justify-between bg-rosa-50 rounded-xl px-3 py-2">
              <span className="text-sm font-bold text-malva-600 truncate">{mat.name}</span>
              <div className="flex gap-2 shrink-0">
                <a href={mat.url} target="_blank" rel="noopener noreferrer" className="p-2 text-malva-500" aria-label="Descargar">
                  <Download size={18} />
                </a>
                {mat.is_printable && (
                  <>
                    <button onClick={() => printMaterial(mat.url)} className="p-2 text-malva-500" aria-label="Imprimir">
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={() => emailMaterial(mat)}
                      disabled={emailSent === mat.url}
                      className="p-2 text-malva-500 disabled:opacity-40"
                      aria-label="Enviar a mi email"
                    >
                      <Mail size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Reseñas */}
      <section>
        <h2 className="font-bold text-lg text-malva-700 mb-3">Reseñas</h2>
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-malva-600">{r.user_name}</span>
                <span className="flex text-dorado">
                  {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </span>
              </div>
              {r.comment && <p className="text-sm text-malva-500 mt-1">{r.comment}</p>}
            </div>
          ))}
          {reviews.length === 0 && <p className="text-sm text-malva-300">Sé la primera en dejar una reseña 💗</p>}
        </div>

        {!reviewSent ? (
          <form onSubmit={sendReview} className="bg-white rounded-2xl p-4 shadow-sm mt-4 space-y-3">
            <p className="font-bold text-sm text-malva-600">Deja tu reseña</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })} className="text-dorado">
                  <Star size={24} fill={n <= reviewForm.rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <textarea
              placeholder="¿Qué te ha parecido?"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="input min-h-20"
            />
            <button className="bg-rosa-500 text-white font-bold px-5 py-2 rounded-full text-sm">Enviar</button>
          </form>
        ) : (
          <p className="text-sm text-malva-500 mt-4">¡Gracias! Tu reseña se publicará tras la moderación 💗</p>
        )}
      </section>
    </div>
  );
}
