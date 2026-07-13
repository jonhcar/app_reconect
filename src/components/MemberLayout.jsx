import { useEffect, useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { Home, Heart, Sparkles, MessageCircleHeart, User, Share2, Mail } from "lucide-react";
import { base44 } from "../api/supabaseClient";
import { useAuth } from "../context/AuthContext";

const SUPPORT_EMAIL = "soporte@reconectar.app"; // ajuste para o e-mail real
const IA_ENABLED = import.meta.env.VITE_ENABLE_IA === "true"; // Quiz del Día + Alma (requer chave da Anthropic)

export default function MemberLayout() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    base44.entities.AppSettings.list().then((rows) => setSettings(rows?.[0] || null)).catch(() => {});
  }, []);

  const share = async () => {
    const shareData = { title: "Reconectar", text: "Comparte con más personas", url: window.location.origin };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      alert("Enlace copiado 💗");
    }
  };

  const navItems = [
    { to: "/", icon: Home, label: "Inicio" },
    ...(IA_ENABLED ? [
      { to: "/quiz-del-dia", icon: Sparkles, label: "Quiz" },
      { to: "/alma", icon: MessageCircleHeart, label: "Alma" },
    ] : []),
    { to: "/favoritos", icon: Heart, label: "Favoritos" },
    { to: "/perfil", icon: User, label: "Perfil" },
  ];

  return (
    <div className="min-h-screen bg-crema pb-24">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 bg-crema/90 backdrop-blur border-b border-rosa-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="font-display text-2xl text-malva-600">Reconectar</Link>
          <div className="flex items-center gap-3">
            <button onClick={share} aria-label="Compartir" className="p-2 rounded-full hover:bg-rosa-100 text-malva-500">
              <Share2 size={20} />
            </button>
            <a href={`mailto:${SUPPORT_EMAIL}`} aria-label="Soporte" className="p-2 rounded-full hover:bg-rosa-100 text-malva-500">
              <Mail size={20} />
            </a>
            <Link to="/perfil" className="w-9 h-9 rounded-full bg-rosa-200 overflow-hidden flex items-center justify-center">
              {user?.photo_url
                ? <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-malva-600 font-bold">{(user?.full_name || user?.email || "?")[0]?.toUpperCase()}</span>}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        <Outlet context={{ settings }} />
      </main>

      {/* Navegação inferior */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-rosa-100">
        <div className="max-w-5xl mx-auto flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${isActive ? "text-rosa-500 font-bold" : "text-malva-400"}`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
