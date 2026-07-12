import { Outlet, NavLink, Link } from "react-router-dom";
import { LayoutDashboard, BookOpen, Tags, Users, Star, Settings, ArrowLeft, LogOut } from "lucide-react";
import { base44 } from "../api/supabaseClient";

const items = [
  { to: "/admin", icon: LayoutDashboard, label: "Panel", end: true },
  { to: "/admin/productos", icon: BookOpen, label: "Productos" },
  { to: "/admin/categorias", icon: Tags, label: "Categorías" },
  { to: "/admin/usuarias", icon: Users, label: "Usuarias" },
  { to: "/admin/resenas", icon: Star, label: "Reseñas" },
  { to: "/admin/ajustes", icon: Settings, label: "Ajustes" },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-crema flex flex-col md:flex-row">
      <aside className="md:w-60 bg-malva-700 text-white md:min-h-screen">
        <div className="p-4 flex items-center justify-between md:block">
          <Link to="/admin" className="font-display text-xl">Reconectar · Admin</Link>
        </div>
        <nav className="flex md:flex-col overflow-x-auto scrollbar-hide px-2 pb-2 md:pb-4 gap-1">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap ${
                  isActive ? "bg-malva-500 font-bold" : "hover:bg-malva-600"
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap hover:bg-malva-600 md:mt-4">
            <ArrowLeft size={18} /> Ver la app
          </Link>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap hover:bg-malva-600 text-left"
          >
            <LogOut size={18} /> Salir
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
