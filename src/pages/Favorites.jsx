import { useEffect, useState } from "react";
import { base44 } from "../api/supabaseClient";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

export default function Favorites() {
  const { user, isPremium } = useAuth();
  const [products, setProducts] = useState([]);
  const [access, setAccess] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const favs = await base44.entities.Favorite.filter({ user_id: user.id }, "-created_at");
        const acc = await base44.entities.Access.filter({ user_id: user.id, active: true }).catch(() => []);
        const prods = await Promise.all(favs.map((f) => base44.entities.Product.get(f.product_id).catch(() => null)));
        setProducts(prods.filter(Boolean));
        setAccess(acc);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const hasAccess = (p) => isPremium || p.is_free || access.some((a) => a.product_id === p.id);

  if (loading) return <div className="py-20 text-center text-malva-400 animate-pulse">Cargando…</div>;

  return (
    <div className="py-6">
      <h1 className="font-display text-3xl text-malva-700 mb-6">Mis favoritos 💗</h1>
      {products.length === 0 ? (
        <p className="text-malva-400">Aún no tienes favoritos. Toca el corazón en cualquier contenido para guardarlo aquí.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} unlocked={hasAccess(p)} size="lg" />
          ))}
        </div>
      )}
    </div>
  );
}
