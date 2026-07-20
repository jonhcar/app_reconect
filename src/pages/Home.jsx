import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { base44 } from "../api/supabaseClient";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import AutoScrollRow from "../components/AutoScrollRow";

export default function Home() {
  const { user, isPremium } = useAuth();
  const { settings } = useOutletContext();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [access, setAccess] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Product.filter({ published: true }, "-created_at"),
      base44.entities.Access.filter({ user_id: user.id, active: true }).catch(() => []),
    ])
      .then(([prods, acc]) => {
        setProducts(prods);
        setAccess(acc);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  // Los productos gratis solo desbloquean después de cualquier compra
  const hasAnyPurchase = access.length > 0;
  const hasAccess = (p) => isPremium || (p.is_free ? hasAnyPurchase : access.some((a) => a.product_id === p.id));

  const featuredProduct = products.find((p) => p.featured && !p.is_free) || products.find((p) => p.featured);
  const rest = products.filter((p) => p.id !== featuredProduct?.id);

  const categories = [...new Set(rest.map((p) => p.category).filter(Boolean))];
  const uncategorized = rest.filter((p) => !p.category);

  if (loading) {
    return <div className="py-20 text-center text-malva-400 animate-pulse">Cargando…</div>;
  }

  return (
    <div className="py-6 space-y-8">
      {/* Bienvenida */}
      <div>
        <h1 className="font-display text-3xl text-malva-700">
          Bienvenida, {user.full_name?.split(" ")[0] || ""} 💗
        </h1>
        <p className="text-malva-400 mt-1">{settings?.welcome_message || "Tu viaje empieza aquí"}</p>
      </div>

      {/* Destaque: producto principal (punto de entrada) */}
      {featuredProduct && (
        <button
          onClick={() => navigate(`/producto/${featuredProduct.id}`)}
          className="w-full text-left relative rounded-3xl overflow-hidden bg-gradient-to-r from-malva-600 to-rosa-500 text-white shadow-lg"
        >
          <div className="flex items-center gap-4 p-5">
            {featuredProduct.cover_image && (
              <img src={featuredProduct.cover_image} alt="" className="w-24 h-32 object-cover rounded-xl shadow" />
            )}
            <div className="flex-1">
              <span className="text-xs font-bold bg-dorado px-2 py-1 rounded-full">COMIENZA AQUÍ</span>
              <h2 className="font-display text-2xl mt-2 leading-tight">{featuredProduct.title}</h2>
              <p className="text-sm text-white/80 mt-1 line-clamp-2">{featuredProduct.description}</p>
              <span className="inline-block mt-3 bg-white text-malva-600 font-bold text-sm px-4 py-2 rounded-full">
                Descubrir →
              </span>
            </div>
          </div>
        </button>
      )}

      {/* Categorias em fileiras horizontais */}
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="font-bold text-lg text-malva-700 mb-3">{cat}</h2>
          <AutoScrollRow>
            {rest.filter((p) => p.category === cat).map((p) => (
              <ProductCard key={p.id} product={p} unlocked={hasAccess(p)} />
            ))}
          </AutoScrollRow>
        </section>
      ))}

      {uncategorized.length > 0 && (
        <section>
          <h2 className="font-bold text-lg text-malva-700 mb-3">Para ti</h2>
          <AutoScrollRow>
            {uncategorized.map((p) => (
              <ProductCard key={p.id} product={p} unlocked={hasAccess(p)} />
            ))}
          </AutoScrollRow>
        </section>
      )}

      {products.length === 0 && (
        <p className="text-center text-malva-400 py-10">Pronto habrá contenidos nuevos aquí 💗</p>
      )}
    </div>
  );
}
