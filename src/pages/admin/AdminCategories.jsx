import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { base44 } from "../../api/supabaseClient";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");

  const load = () => base44.entities.Category.list("name").then(setCategories);
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await base44.entities.Category.create({ name: name.trim() });
    setName("");
    load();
  };

  const remove = async (c) => {
    if (!confirm(`¿Eliminar la categoría "${c.name}"?`)) return;
    await base44.entities.Category.delete(c.id);
    load();
  };

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl text-malva-700 mb-6">Categorías</h1>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <input placeholder="Nueva categoría" value={name} onChange={(e) => setName(e.target.value)} className="input" />
        <button className="bg-rosa-500 text-white font-bold px-5 rounded-2xl text-sm">Añadir</button>
      </form>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
            <span className="font-bold text-malva-700">{c.name}</span>
            <button onClick={() => remove(c)} className="text-malva-400 hover:text-rosa-500"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
