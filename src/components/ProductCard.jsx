import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

export default function ProductCard({ product, unlocked, size = "md" }) {
  const navigate = useNavigate();
  const locked = !unlocked && !product.is_free;

  const width = size === "lg" ? "w-full" : "w-40 sm:w-48 shrink-0";

  return (
    <button onClick={() => navigate(`/producto/${product.id}`)} className={`${width} text-left group`}>
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-rosa-100 shadow-sm group-hover:shadow-lg transition-shadow">
        {product.cover_image ? (
          <img
            src={product.cover_image}
            alt={product.title}
            className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${locked ? "brightness-75" : ""}`}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-malva-400 font-display text-lg p-4 text-center ${locked ? "brightness-75" : ""}`}>
            {product.title}
          </div>
        )}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-malva-800/30">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow">
              <Lock className="text-malva-600" size={22} />
            </div>
          </div>
        )}
        {locked && product.price && (
          <span className="absolute bottom-2 right-2 bg-white/95 text-malva-700 text-xs font-extrabold px-2.5 py-1 rounded-full shadow">
            ${product.price}
          </span>
        )}
        {product.is_free && (
          <span className="absolute top-2 left-2 bg-dorado text-white text-xs font-bold px-2 py-1 rounded-full">Gratis</span>
        )}
        {product.featured && !product.is_free && (
          <span className="absolute top-2 left-2 bg-rosa-500 text-white text-xs font-bold px-2 py-1 rounded-full">Destacado</span>
        )}
      </div>
      <h3 className="mt-2 font-bold text-malva-700 text-sm leading-snug line-clamp-2">{product.title}</h3>
      {product.description && size === "lg" && (
        <p className="text-sm text-malva-400 line-clamp-2 mt-1">{product.description}</p>
      )}
    </button>
  );
}
