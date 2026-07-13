import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, GripVertical } from "lucide-react";
import { base44 } from "../../api/supabaseClient";

const EMPTY = {
  title: "", description: "", cover_image: "", type: "ebook", category: "",
  is_free: false, published: true, featured: false, hotmart_product_id: "", price: "",
  checkout_url: "", sales_copy: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // null | {product}
  const [modules, setModules] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    base44.entities.Product.list("-created_at").then(setProducts);
    base44.entities.Category.list("name").then(setCategories);
  };
  useEffect(load, []);

  const openEdit = async (p) => {
    setEditing(p ? { ...p } : { ...EMPTY });
    setModules(p ? await base44.entities.Module.filter({ product_id: p.id }, "order") : []);
  };

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setEditing({ ...editing, [k]: v });
  };

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditing({ ...editing, cover_image: file_url });
    } catch (err) {
      alert("Error al subir la imagen: " + err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...editing, price: editing.price === "" ? null : Number(editing.price) };
      delete payload.id;
      delete payload.created_at;
      let product;
      if (editing.id) product = await base44.entities.Product.update(editing.id, payload);
      else product = await base44.entities.Product.create(payload);

      // Salva módulos
      for (const mod of modules) {
        const mp = { ...mod, product_id: product.id };
        delete mp.id;
        delete mp.created_at;
        delete mp._deleted;
        if (mod._deleted && mod.id) await base44.entities.Module.delete(mod.id);
        else if (mod.id) await base44.entities.Module.update(mod.id, mp);
        else if (!mod._deleted) await base44.entities.Module.create(mp);
      }

      setEditing(null);
      load();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!confirm(`¿Eliminar "${p.title}"? Esta acción no se puede deshacer.`)) return;
    await base44.entities.Product.delete(p.id);
    load();
  };

  const setModule = (i, k, v) => {
    const next = [...modules];
    next[i] = { ...next[i], [k]: v };
    setModules(next);
  };

  const uploadModuleFile = async (i, k, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setModule(i, k, file_url);
    } catch (err) {
      alert("Error al subir el archivo: " + err.message);
    }
  };

  // --- Construtor do diário (journal_sections) ---
  const sections = editing?.journal_sections || [];
  const setSections = (next) => setEditing({ ...editing, journal_sections: next });
  const addSection = () => setSections([...sections, { id: crypto.randomUUID(), title: "", fields: [] }]);
  const setSection = (i, k, v) => {
    const next = [...sections];
    next[i] = { ...next[i], [k]: v };
    setSections(next);
  };
  const removeSection = (i) => setSections(sections.filter((_, x) => x !== i));
  const addField = (i) => setSection(i, "fields", [...(sections[i].fields || []), { id: crypto.randomUUID(), label: "", type: "textarea" }]);
  const setField = (i, j, k, v) => {
    const fields = [...(sections[i].fields || [])];
    fields[j] = { ...fields[j], [k]: v };
    setSection(i, "fields", fields);
  };
  const removeField = (i, j) => setSection(i, "fields", (sections[i].fields || []).filter((_, x) => x !== j));

  const addMaterial = (i) => setModule(i, "materials", [...(modules[i].materials || []), { name: "", url: "", is_printable: false }]);
  const setMaterial = (i, j, k, v) => {
    const mats = [...(modules[i].materials || [])];
    mats[j] = { ...mats[j], [k]: v };
    setModule(i, "materials", mats);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-malva-700">Productos</h1>
        <button onClick={() => openEdit(null)} className="flex items-center gap-1 bg-rosa-500 text-white font-bold px-4 py-2 rounded-full text-sm">
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
            {p.cover_image
              ? <img src={p.cover_image} alt="" className="w-12 h-16 object-cover rounded-lg" />
              : <div className="w-12 h-16 bg-rosa-100 rounded-lg" />}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-malva-700 truncate">{p.title}</p>
              <p className="text-xs text-malva-400">
                {p.category || "Sin categoría"} · {p.type}
                {p.is_free && " · GRATIS"}
                {!p.published && " · borrador"}
                {p.featured && " · destacado"}
              </p>
            </div>
            <button onClick={() => openEdit(p)} className="p-2 text-malva-400 hover:text-malva-600"><Pencil size={18} /></button>
            <button onClick={() => remove(p)} className="p-2 text-malva-400 hover:text-rosa-500"><Trash2 size={18} /></button>
          </div>
        ))}
        {products.length === 0 && <p className="text-malva-400">Aún no hay productos. Crea el primero.</p>}
      </div>

      {/* Modal de edição */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-malva-800/60" onClick={() => setEditing(null)} />
          <form onSubmit={save} className="relative bg-white rounded-3xl p-6 max-w-2xl w-full my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-malva-700">{editing.id ? "Editar producto" : "Nuevo producto"}</h2>
              <button type="button" onClick={() => setEditing(null)}><X size={20} className="text-malva-400" /></button>
            </div>

            <input required placeholder="Título" value={editing.title} onChange={set("title")} className="input" />
            <textarea placeholder="Descripción" value={editing.description || ""} onChange={set("description")} className="input min-h-20" />

            <div className="grid grid-cols-2 gap-3">
              <select value={editing.type || "ebook"} onChange={set("type")} className="input">
                <option value="ebook">Ebook / PDF</option>
                <option value="curso">Curso</option>
                <option value="diario">Diario</option>
              </select>
              <select value={editing.category || ""} onChange={set("category")} className="input">
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <input placeholder="ID producto Hotmart" value={editing.hotmart_product_id || ""} onChange={set("hotmart_product_id")} className="input" />
              <input placeholder="Precio (ej. 9.90)" value={editing.price ?? ""} onChange={set("price")} className="input" />
            </div>

            {/* Venda individual: link de checkout + copy de vendas */}
            <div className="bg-rosa-50 rounded-2xl p-3 space-y-2">
              <p className="text-sm font-bold text-malva-600">Página de venta (para quien aún no compró)</p>
              <input
                placeholder="Link de pago (checkout de Hotmart, ej. https://pay.hotmart.com/...)"
                value={editing.checkout_url || ""}
                onChange={set("checkout_url")}
                className="input"
              />
              <textarea
                placeholder="Texto de venta: qué va a lograr, qué incluye, para quién es… (se muestra antes del botón de compra)"
                value={editing.sales_copy || ""}
                onChange={set("sales_copy")}
                className="input min-h-32"
              />
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-malva-600">
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!editing.is_free} onChange={set("is_free")} /> Gratuito (isca)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!editing.published} onChange={set("published")} /> Publicado</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!editing.featured} onChange={set("featured")} /> Destacado</label>
            </div>

            <div>
              <p className="text-sm font-bold text-malva-600 mb-1">Portada</p>
              <div className="flex items-center gap-3">
                {editing.cover_image && <img src={editing.cover_image} alt="" className="w-14 h-20 object-cover rounded-lg" />}
                <input type="file" accept="image/*" onChange={uploadCover} className="text-sm" />
              </div>
            </div>

            {/* Construtor do diário (só para tipo "diario") */}
            {editing.type === "diario" && (
              <div className="border-t border-rosa-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-malva-700">Campos del diario (la usuaria los rellena en pantalla)</p>
                  <button type="button" onClick={addSection} className="text-sm font-bold text-rosa-500">+ Añadir sección</button>
                </div>
                <div className="space-y-3">
                  {sections.map((section, i) => (
                    <div key={section.id} className="bg-rosa-50 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input placeholder="Título de la sección (ej: Por la mañana)" value={section.title} onChange={(e) => setSection(i, "title", e.target.value)} className="input flex-1" />
                        <button type="button" onClick={() => removeSection(i)}><Trash2 size={16} className="text-malva-400" /></button>
                      </div>
                      {(section.fields || []).map((field, j) => (
                        <div key={field.id} className="flex items-center gap-2 text-sm">
                          <input placeholder="Pregunta / etiqueta del campo" value={field.label} onChange={(e) => setField(i, j, "label", e.target.value)} className="input flex-1" />
                          <select value={field.type} onChange={(e) => setField(i, j, "type", e.target.value)} className="input !w-auto">
                            <option value="textarea">Texto largo</option>
                            <option value="text">Texto corto</option>
                            <option value="checkbox">Casilla ✓</option>
                          </select>
                          <button type="button" onClick={() => removeField(i, j)}><Trash2 size={14} className="text-malva-400" /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addField(i)} className="text-xs font-bold text-malva-400">+ campo</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Módulos */}
            <div className="border-t border-rosa-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-malva-700">Módulos / contenidos</p>
                <button type="button" onClick={() => setModules([...modules, { title: "", order: modules.length, materials: [] }])} className="text-sm font-bold text-rosa-500">+ Añadir módulo</button>
              </div>
              <div className="space-y-3">
                {modules.map((mod, i) => mod._deleted ? null : (
                  <div key={mod.id || `new-${i}`} className="bg-rosa-50 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-malva-300" />
                      <input placeholder="Título del módulo" value={mod.title} onChange={(e) => setModule(i, "title", e.target.value)} className="input flex-1" />
                      <input type="number" title="Orden" value={mod.order ?? 0} onChange={(e) => setModule(i, "order", Number(e.target.value))} className="input w-16 text-center" />
                      <button type="button" onClick={() => setModule(i, "_deleted", true)}><Trash2 size={16} className="text-malva-400" /></button>
                    </div>
                    <input placeholder="URL de vídeo (YouTube/Vimeo embed)" value={mod.video_url || ""} onChange={(e) => setModule(i, "video_url", e.target.value)} className="input" />
                    <div className="flex items-center gap-2">
                      <input placeholder="URL de audio MP3" value={mod.audio_url || ""} onChange={(e) => setModule(i, "audio_url", e.target.value)} className="input flex-1" />
                      <label className="text-xs font-bold text-rosa-500 cursor-pointer whitespace-nowrap">
                        Subir MP3
                        <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadModuleFile(i, "audio_url", e.target.files[0])} />
                      </label>
                    </div>
                    {/* Materiais */}
                    {(mod.materials || []).map((mat, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <input placeholder="Nombre del material" value={mat.name} onChange={(e) => setMaterial(i, j, "name", e.target.value)} className="input flex-1" />
                        <label className="text-xs font-bold text-rosa-500 cursor-pointer whitespace-nowrap">
                          {mat.url ? "PDF ✓" : "Subir PDF"}
                          <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const { file_url } = await base44.integrations.Core.UploadFile({ file });
                              setMaterial(i, j, "url", file_url);
                            } catch (err) {
                              alert("Error al subir el PDF: " + err.message);
                            }
                          }} />
                        </label>
                        <label className="flex items-center gap-1 text-xs text-malva-500 whitespace-nowrap">
                          <input type="checkbox" checked={!!mat.is_printable} onChange={(e) => setMaterial(i, j, "is_printable", e.target.checked)} /> Imprimible
                        </label>
                      </div>
                    ))}
                    <button type="button" onClick={() => addMaterial(i)} className="text-xs font-bold text-malva-400">+ material</button>
                  </div>
                ))}
              </div>
            </div>

            <button disabled={saving} className="w-full bg-rosa-500 text-white font-bold py-3 rounded-full disabled:opacity-50">
              {saving ? "Guardando…" : "Guardar producto"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
