import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../api/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.resetPassword({ newPassword: password });
      navigate("/");
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-crema flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm p-6">
        <h1 className="font-bold text-lg text-malva-700 mb-4">Crea tu nueva contraseña</h1>
        <form onSubmit={submit} className="space-y-3">
          <input
            required
            type="password"
            minLength={6}
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          {error && <p className="text-sm text-rosa-500">{error}</p>}
          <button disabled={loading} className="w-full bg-rosa-500 hover:bg-rosa-400 text-white font-bold py-3 rounded-full disabled:opacity-50">
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
