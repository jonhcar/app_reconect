import { useEffect, useState } from "react";
import { Users, BookOpen, Star, TrendingUp } from "lucide-react";
import { supabase } from "../../api/supabaseClient";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-rosa-100 flex items-center justify-center text-rosa-500">
          <Icon size={22} />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-malva-700">{value ?? "…"}</p>
          <p className="text-sm text-malva-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    (async () => {
      const [users, premium, products, pendingReviews, avgRating] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("premium", true),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reviews").select("rating").eq("status", "approved"),
      ]);
      const ratings = avgRating.data || [];
      const avg = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : "—";
      setStats({
        users: users.count ?? 0,
        premium: premium.count ?? 0,
        products: products.count ?? 0,
        pendingReviews: pendingReviews.count ?? 0,
        avg,
      });
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-malva-700 mb-6">Panel</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Miembros" value={stats.users} />
        <StatCard icon={TrendingUp} label="Premium" value={stats.premium} />
        <StatCard icon={BookOpen} label="Productos" value={stats.products} />
        <StatCard icon={Star} label={`Reseñas pendientes · media ${stats.avg ?? ""}`} value={stats.pendingReviews} />
      </div>
      <p className="text-sm text-malva-400 mt-8">
        Usa el menú para gestionar productos, categorías, usuarias, reseñas y los ajustes de la app.
      </p>
    </div>
  );
}
