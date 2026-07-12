import { useEffect, useState } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";
import { base44 } from "../../api/supabaseClient";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("pending");

  const load = () => base44.entities.Review.list("-created_at").then(setReviews);
  useEffect(() => { load(); }, []);

  const setStatus = async (r, status) => {
    await base44.entities.Review.update(r.id, { status });
    load();
  };

  const remove = async (r) => {
    if (!confirm("¿Eliminar esta reseña?")) return;
    await base44.entities.Review.delete(r.id);
    load();
  };

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  return (
    <div>
      <h1 className="font-display text-3xl text-malva-700 mb-6">Reseñas</h1>
      <div className="flex gap-2 mb-4">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full ${filter === f ? "bg-malva-600 text-white" : "bg-white text-malva-500"}`}
          >
            {f === "pending" ? "Pendientes" : f === "approved" ? "Aprobadas" : f === "rejected" ? "Rechazadas" : "Todas"}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-malva-700">{r.user_name || "Anónima"}</span>
                <span className="flex text-dorado">
                  {Array.from({ length: r.rating || 0 }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
                </span>
                <span className="text-xs text-malva-300">{new Date(r.created_at).toLocaleDateString("es-ES")}</span>
              </div>
              <div className="flex gap-1">
                {r.status !== "approved" && (
                  <button onClick={() => setStatus(r, "approved")} className="p-2 text-green-600" title="Aprobar"><Check size={18} /></button>
                )}
                {r.status !== "rejected" && (
                  <button onClick={() => setStatus(r, "rejected")} className="p-2 text-malva-400" title="Rechazar"><X size={18} /></button>
                )}
                <button onClick={() => remove(r)} className="p-2 text-rosa-500" title="Eliminar"><Trash2 size={18} /></button>
              </div>
            </div>
            {r.comment && <p className="text-sm text-malva-500 mt-1">{r.comment}</p>}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-malva-400">No hay reseñas aquí.</p>}
      </div>
    </div>
  );
}
