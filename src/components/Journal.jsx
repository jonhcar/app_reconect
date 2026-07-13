import { useEffect, useState } from "react";
import { Printer, Save, CalendarDays } from "lucide-react";
import { base44 } from "../api/supabaseClient";

// Diário interativo: a usuária preenche os campos na tela,
// salva por dia e pode imprimir a versão preenchida.
export default function Journal({ product, user }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [entry, setEntry] = useState(null);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sections = product.journal_sections || [];

  useEffect(() => {
    base44.entities.JournalEntry.filter({ user_id: user.id, product_id: product.id, date })
      .then((rows) => {
        const e = rows[0] || null;
        setEntry(e);
        const map = {};
        (e?.answers || []).forEach((a) => { map[a.field_id] = a.value; });
        setAnswers(map);
      })
      .catch(() => {});
  }, [date, product.id, user.id]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        product_id: product.id,
        date,
        answers: Object.entries(answers).map(([field_id, value]) => ({ field_id, value })),
      };
      const savedEntry = await base44.entities.JournalEntry.upsert(payload, "user_id,product_id,date");
      setEntry(savedEntry);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const print = () => {
    const w = window.open("", "_blank");
    const html = `
      <html><head><title>${product.title} — ${date}</title>
      <style>
        body { font-family: Georgia, serif; color: #452136; max-width: 640px; margin: 40px auto; padding: 0 20px; }
        h1 { font-size: 24px; } h2 { font-size: 18px; margin-top: 28px; color: #7A3B5E; }
        .campo { margin: 14px 0; }
        .label { font-weight: bold; font-size: 14px; }
        .valor { border-bottom: 1px solid #ccc; min-height: 22px; padding: 6px 0; white-space: pre-wrap; }
      </style></head><body>
      <h1>${product.title}</h1>
      <p><em>${new Date(date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</em></p>
      ${sections.map((s) => `
        <h2>${s.title}</h2>
        ${(s.fields || []).map((f) => `
          <div class="campo">
            <div class="label">${f.label}</div>
            <div class="valor">${f.type === "checkbox" ? (answers[f.id] ? "✓ Sí" : "—") : (answers[f.id] || "").replace(/</g, "&lt;")}</div>
          </div>`).join("")}
      `).join("")}
      <p style="margin-top:40px; font-size:12px; color:#999;">Reconectar 💗</p>
      </body></html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  if (sections.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-lg text-malva-700">Mi diario</h2>
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-malva-400" />
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="input !w-auto !py-1.5 text-sm"
          />
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="font-bold text-malva-600 mb-3">{section.title}</h3>
          <div className="space-y-4">
            {(section.fields || []).map((field) => (
              <div key={field.id}>
                {field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm text-malva-600 font-semibold">
                    <input
                      type="checkbox"
                      checked={!!answers[field.id]}
                      onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.checked })}
                      className="w-5 h-5 accent-rosa-500"
                    />
                    {field.label}
                  </label>
                ) : (
                  <>
                    <label className="block text-sm font-semibold text-malva-600 mb-1">{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={answers[field.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                        className="input min-h-24"
                        placeholder="Escribe aquí…"
                      />
                    ) : (
                      <input
                        value={answers[field.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                        className="input"
                        placeholder="Escribe aquí…"
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-rosa-500 text-white font-bold py-3 rounded-full disabled:opacity-50">
          <Save size={18} /> {saved ? "Guardado ✓" : saving ? "Guardando…" : "Guardar"}
        </button>
        <button onClick={print} className="flex items-center justify-center gap-2 border border-rosa-200 text-malva-600 font-bold px-5 rounded-full hover:bg-rosa-50">
          <Printer size={18} /> Imprimir
        </button>
      </div>
    </div>
  );
}
