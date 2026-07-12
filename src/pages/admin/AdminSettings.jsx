import { useEffect, useState } from "react";
import { base44 } from "../../api/supabaseClient";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.AppSettings.list().then((rows) => setSettings(rows?.[0] || { welcome_message: "", hotmart_link: "" }));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { welcome_message: settings.welcome_message, hotmart_link: settings.hotmart_link, updated_at: new Date().toISOString() };
      if (settings.id) await base44.entities.AppSettings.update(settings.id, payload);
      else {
        const created = await base44.entities.AppSettings.create(payload);
        setSettings(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <p className="text-malva-400 animate-pulse">Cargando…</p>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl text-malva-700 mb-6">Ajustes</h1>
      <form onSubmit={save} className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <label className="text-sm font-bold text-malva-600">Mensaje de bienvenida</label>
          <textarea
            value={settings.welcome_message || ""}
            onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
            className="input mt-1 min-h-20"
            placeholder="Tu viaje empieza aquí 💗"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-malva-600">Enlace de Hotmart (checkout 9,90)</label>
          <input
            value={settings.hotmart_link || ""}
            onChange={(e) => setSettings({ ...settings, hotmart_link: e.target.value })}
            className="input mt-1"
            placeholder="https://pay.hotmart.com/…"
          />
        </div>
        <button disabled={saving} className="w-full bg-rosa-500 text-white font-bold py-3 rounded-full disabled:opacity-50">
          {saved ? "Guardado ✓" : saving ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </div>
  );
}
