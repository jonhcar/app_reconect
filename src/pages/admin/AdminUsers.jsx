import { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const togglePremium = async (u) => {
    await supabase.from("profiles").update({ premium: !u.premium }).eq("id", u.id);
    setUsers(users.map((x) => (x.id === u.id ? { ...x, premium: !u.premium } : x)));
  };

  const filtered = users.filter((u) =>
    `${u.full_name || ""} ${u.email || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="font-display text-3xl text-malva-700 mb-6">Usuarias</h1>
      <input
        placeholder="Buscar por nombre o email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input max-w-sm mb-4"
      />
      {loading ? (
        <p className="text-malva-400 animate-pulse">Cargando…</p>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-malva-400 border-b border-rosa-100">
                <th className="p-4">Nombre</th>
                <th className="p-4">Email</th>
                <th className="p-4">Registro</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Estado</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-rosa-50">
                  <td className="p-4 font-bold text-malva-700">{u.full_name || "—"}</td>
                  <td className="p-4 text-malva-400">{u.email || "—"}</td>
                  <td className="p-4 text-malva-400">{new Date(u.created_at).toLocaleDateString("es-ES")}</td>
                  <td className="p-4 text-malva-400">{u.role}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.premium ? "bg-dorado text-white" : "bg-rosa-100 text-malva-500"}`}>
                      {u.premium ? "Premium" : "Gratuita"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => togglePremium(u)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full ${u.premium ? "bg-rosa-100 text-malva-600" : "bg-rosa-500 text-white"}`}
                    >
                      {u.premium ? "Quitar premium" : "Hacer premium"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-6 text-malva-400">Sin resultados.</p>}
        </div>
      )}
    </div>
  );
}
