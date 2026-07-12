import { X, Lock } from "lucide-react";

export default function UnlockModal({ open, onClose, hotmartLink }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-malva-800/60" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-malva-400 hover:text-malva-600" aria-label="Cerrar">
          <X size={22} />
        </button>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rosa-100 flex items-center justify-center">
          <Lock className="text-rosa-500" size={28} />
        </div>
        <h2 className="font-display text-2xl text-malva-700 mb-3">
          Ten acceso a TODOS los productos por solo 9,90 ahora mismo
        </h2>
        <a
          href={hotmartLink || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full mt-4 animate-pulse-soft bg-rosa-500 hover:bg-rosa-400 text-white font-extrabold text-lg py-4 rounded-full"
        >
          DESBLOQUEAR TODO POR 9,90
        </a>
        <p className="text-xs text-malva-400 mt-4">Pago seguro a través de Hotmart. Cancela cuando quieras.</p>
      </div>
    </div>
  );
}
