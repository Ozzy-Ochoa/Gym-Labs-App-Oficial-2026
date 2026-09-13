import React, { useState } from "react";
import { Lock, ShieldAlert, Key, Unlock, LogOut } from "lucide-react";
import { verifyPin } from "../utils/security";

interface SecurityLockScreenProps {
  isLocked: boolean;
  pinHash: string;
  onUnlock: () => void;
  operatorHandle?: string;
  onLogout?: () => void;
}

export const SecurityLockScreen: React.FC<SecurityLockScreenProps> = ({
  isLocked,
  pinHash,
  onUnlock,
  operatorHandle,
  onLogout,
}) => {
  const [enteredPin, setEnteredPin] = useState("");
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  if (!isLocked) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin) return;

    const isValid = await verifyPin(enteredPin, pinHash);
    if (isValid) {
      setError(false);
      setEnteredPin("");
      setAttempts(0);
      onUnlock();
    } else {
      setError(true);
      setEnteredPin("");
      setAttempts((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/98 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-black border border-zinc-700 max-w-sm w-full p-6 text-center hud-corners shadow-[0_0_50px_rgba(0,0,0,0.95)] space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border border-zinc-600 bg-zinc-900 flex items-center justify-center text-white">
            <Lock className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase">
            Gym Labs // Acesso Protegido
          </span>
          <h2 className="font-semibold text-lg text-white tracking-wide">
            Sessão Bloqueada
          </h2>
          {operatorHandle && (
            <span className="text-xs text-zinc-400">
              Usuário: @{operatorHandle}
            </span>
          )}
          <p className="text-xs text-zinc-400">
            Insira o PIN de segurança de 4 dígitos para desbloquear.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={6}
              autoFocus
              value={enteredPin}
              onChange={(e) => {
                setError(false);
                setEnteredPin(e.target.value.replace(/\D/g, ""));
              }}
              placeholder="••••"
              className={`w-full bg-black border ${
                error ? "border-zinc-500 text-zinc-300" : "border-zinc-700 focus:border-white text-white"
              } p-2.5 text-center text-xl font-mono tracking-[0.4em] outline-none`}
            />
            {error && (
              <span className="text-[11px] text-zinc-400 block mt-2">
                PIN incorreto. Tentativa {attempts} registrada.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs uppercase tracking-wider border border-white flex items-center justify-center gap-2 transition-colors"
          >
            <Unlock className="w-4 h-4" />
            <span>Desbloquear</span>
          </button>
        </form>

        {onLogout && (
          <div className="pt-1">
            <button
              onClick={onLogout}
              className="text-xs font-mono text-zinc-500 hover:text-rose-400 flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Trocar de Operador / Encerrar Sessão</span>
            </button>
          </div>
        )}

        <div className="border-t border-zinc-900 pt-3 text-[10px] font-mono text-zinc-600 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
          <span>PBKDF2-SHA256 • ZERO-KNOWLEDGE VAULT</span>
        </div>
      </div>
    </div>
  );
};
