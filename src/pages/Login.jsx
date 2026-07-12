import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../api/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | register | otp | forgot
  const [form, setForm] = useState({ name: "", email: "", password: "", otp: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (mode === "login") {
        await base44.auth.loginViaEmailPassword(form.email, form.password);
        navigate("/");
      } else if (mode === "register") {
        const data = await base44.auth.register({ email: form.email, password: form.password, full_name: form.name });
        if (data?.session) {
          // Confirmação de e-mail desativada: entra direto
          navigate("/");
        } else {
          setMode("otp");
          setInfo("Te hemos enviado un código de 6 dígitos a tu correo 💌");
        }
      } else if (mode === "otp") {
        await base44.auth.verifyOtp({ email: form.email, otpCode: form.otp });
        navigate("/");
      } else if (mode === "forgot") {
        await base44.auth.resetPasswordRequest(form.email);
        setInfo("Revisa tu correo: te enviamos un enlace para crear una nueva contraseña.");
      }
    } catch (err) {
      setError(err.message || "Algo salió mal. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const google = () => base44.auth.loginWithProvider("google", "/");

  return (
    <div className="min-h-screen bg-crema flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl text-malva-600 text-center mb-1">Reconectar</h1>
        <p className="text-center text-malva-400 mb-8">Tu viaje empieza aquí 💗</p>

        <div className="bg-white rounded-3xl shadow-sm p-6">
          <h2 className="font-bold text-lg text-malva-700 mb-4">
            {mode === "login" && "Inicia sesión"}
            {mode === "register" && "Crea tu cuenta"}
            {mode === "otp" && "Confirma tu correo"}
            {mode === "forgot" && "Recuperar contraseña"}
          </h2>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <input required placeholder="Tu nombre" value={form.name} onChange={set("name")} className="input" />
            )}
            {mode !== "otp" && (
              <input required type="email" placeholder="Tu email" value={form.email} onChange={set("email")} className="input" />
            )}
            {(mode === "login" || mode === "register") && (
              <input required type="password" minLength={6} placeholder="Contraseña" value={form.password} onChange={set("password")} className="input" />
            )}
            {mode === "otp" && (
              <input
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="Código de 6 dígitos"
                value={form.otp}
                onChange={set("otp")}
                className="input text-center text-2xl tracking-[0.5em]"
              />
            )}

            {error && <p className="text-sm text-rosa-500">{error}</p>}
            {info && <p className="text-sm text-malva-500">{info}</p>}

            <button disabled={loading} className="w-full bg-rosa-500 hover:bg-rosa-400 text-white font-bold py-3 rounded-full disabled:opacity-50">
              {loading ? "Un momento…" :
                mode === "login" ? "Entrar" :
                mode === "register" ? "Registrarme" :
                mode === "otp" ? "Confirmar" : "Enviar enlace"}
            </button>
          </form>

          {mode === "otp" && (
            <button onClick={() => base44.auth.resendOtp(form.email).then(() => setInfo("Código reenviado 💌"))} className="w-full mt-3 text-sm text-malva-400 underline">
              Reenviar código
            </button>
          )}

          {(mode === "login" || mode === "register") && (
            <>
              <div className="flex items-center gap-3 my-4 text-malva-300 text-xs">
                <div className="flex-1 h-px bg-rosa-100" /> o <div className="flex-1 h-px bg-rosa-100" />
              </div>
              <button onClick={google} className="w-full border border-rosa-200 text-malva-600 font-bold py-3 rounded-full hover:bg-rosa-50">
                Continuar con Google
              </button>
            </>
          )}

          <div className="mt-5 text-center text-sm text-malva-400 space-y-1">
            {mode === "login" && (
              <>
                <p>¿No tienes cuenta? <button onClick={() => setMode("register")} className="text-rosa-500 font-bold">Regístrate</button></p>
                <p><button onClick={() => setMode("forgot")} className="underline">Olvidé mi contraseña</button></p>
              </>
            )}
            {mode !== "login" && (
              <p><button onClick={() => setMode("login")} className="underline">Volver a iniciar sesión</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
