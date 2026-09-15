import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Download,
  Trash2,
  X,
  Key,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Copy,
  Check,
  LogOut,
  Fingerprint,
} from "lucide-react";
import { SecuritySettings, UserProfile, AuthUser, LoginAuditLog } from "../types";
import {
  hashPin,
  hashPassword,
  generateCryptographicSalt,
  getAuditLogs,
  getAllUsers,
  saveAllUsers,
  logAuditEvent,
} from "../utils/security";

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  security: SecuritySettings;
  userProfile: UserProfile;
  authUser: AuthUser | null;
  onUpdateSecurity: (newSec: SecuritySettings) => void;
  onExportVault: () => void;
  onExportEncryptedVault?: (passphrase: string) => Promise<void>;
  onPurgeVault: () => void;
  onLockTerminalNow: () => void;
  onLogout: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({
  isOpen,
  onClose,
  security,
  userProfile,
  authUser,
  onUpdateSecurity,
  onExportVault,
  onExportEncryptedVault,
  onPurgeVault,
  onLockTerminalNow,
  onLogout,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"general" | "credentials" | "audit">("general");

  // PIN
  const [newPin, setNewPin] = useState("");
  const [pinSuccessMsg, setPinSuccessMsg] = useState(false);

  // Encrypted Export Passphrase
  const [showEncryptedExportModal, setShowEncryptedExportModal] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Copied Recovery Key
  const [copiedKey, setCopiedKey] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // Audit Logs
  const auditLogs: LoginAuditLog[] = getAuditLogs();

  if (!isOpen) return null;

  const handleSavePin = async () => {
    if (newPin.length >= 4) {
      const pinHash = await hashPin(newPin);
      onUpdateSecurity({
        ...security,
        pinHash,
        hasPinSet: true,
      });
      setNewPin("");
      setPinSuccessMsg(true);
      setTimeout(() => setPinSuccessMsg(false), 3000);
    }
  };

  const handleToggleStealth = () => {
    onUpdateSecurity({
      ...security,
      stealthMode: !security.stealthMode,
    });
  };

  const handleChangeAutoLock = (minutes: number) => {
    onUpdateSecurity({
      ...security,
      autoLockMinutes: minutes,
    });
  };

  const handleToggle2FA = () => {
    const updated2FA = !security.twoFactorEnabled;
    onUpdateSecurity({
      ...security,
      twoFactorEnabled: updated2FA,
    });

    // Update in auth user
    if (authUser) {
      const users = getAllUsers();
      const idx = users.findIndex((u) => u.id === authUser.id);
      if (idx !== -1) {
        users[idx].twoFactorEnabled = updated2FA;
        saveAllUsers(users);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (!authUser) return;

    if (newPassword.length < 8) {
      setPwdMsg({ text: "A nova senha deve ter no mínimo 8 caracteres.", error: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: "A confirmação da nova senha não confere.", error: true });
      return;
    }

    // Verify current password
    const testCurrentHash = await hashPassword(currentPassword, authUser.passwordSalt);
    if (testCurrentHash !== authUser.passwordHash) {
      setPwdMsg({ text: "Senha atual incorreta.", error: true });
      return;
    }

    // Generate new salt and update
    const newSalt = generateCryptographicSalt(16);
    const newHash = await hashPassword(newPassword, newSalt);

    const users = getAllUsers();
    const idx = users.findIndex((u) => u.id === authUser.id);
    if (idx !== -1) {
      users[idx].passwordHash = newHash;
      users[idx].passwordSalt = newSalt;
      saveAllUsers(users);
    }

    logAuditEvent({
      userId: authUser.id,
      emailOrHandle: authUser.email,
      status: "SUCCESS",
      reason: "PASSWORD_CHANGED_IN_SETTINGS",
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwdMsg({ text: "Senha alterada com sucesso no cofre!", error: false });
    setTimeout(() => setPwdMsg(null), 4000);
  };

  const copyRecoveryKey = () => {
    if (!authUser?.recoveryKey) return;
    navigator.clipboard.writeText(authUser.recoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-black border-2 border-zinc-700 max-w-2xl w-full flex flex-col hud-corners shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-white" />
            <div>
              <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase block">
                GYM LABS // ENCLAVE DE SEGURANÇA & PRIVACIDADE
              </span>
              <h2 className="font-hud font-bold text-lg sm:text-xl text-white tracking-wider">
                CENTRAL DE SEGURANÇA & AUDITORIA
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black border border-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="grid grid-cols-3 border-b border-zinc-800 bg-[#07090D] font-mono text-xs">
          <button
            onClick={() => setActiveSubTab("general")}
            className={`py-2.5 text-center font-bold tracking-wider transition-colors border-r border-zinc-800 ${
              activeSubTab === "general"
                ? "bg-zinc-900 text-amber-400 border-b-2 border-b-amber-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            GERAL & PRIVACIDADE
          </button>

          <button
            onClick={() => setActiveSubTab("credentials")}
            className={`py-2.5 text-center font-bold tracking-wider transition-colors border-r border-zinc-800 ${
              activeSubTab === "credentials"
                ? "bg-zinc-900 text-amber-400 border-b-2 border-b-amber-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            CREDENCIAIS & 2FA
          </button>

          <button
            onClick={() => setActiveSubTab("audit")}
            className={`py-2.5 text-center font-bold tracking-wider transition-colors ${
              activeSubTab === "audit"
                ? "bg-zinc-900 text-amber-400 border-b-2 border-b-amber-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            AUDITORIA ({auditLogs.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto font-mono text-xs text-zinc-300">
          {/* Operator Identity Ribbon */}
          <div className="border border-zinc-800 bg-[#050505] p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-hud">OPERADOR AUTENTICADO</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">{userProfile.handle}</span>
                {authUser?.email && (
                  <span className="text-xs text-zinc-400 font-mono">({authUser.email})</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-3 py-1.5 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 text-xs font-hud font-bold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ENCERRAR SESSÃO</span>
              </button>
            </div>
          </div>

          {/* ==================================================== */}
          {/* SUB-TAB 1: GERAL & PRIVACIDADE                       */}
          {/* ==================================================== */}
          {activeSubTab === "general" && (
            <div className="space-y-4">
              {/* Lock Now */}
              <div className="border border-zinc-800 bg-[#050505] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-white font-hud font-bold block uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    BLOQUEAR TERMINAL IMEDIATAMENTE
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Trava a interface e exige o PIN ou senha para reabrir a telemetria.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onLockTerminalNow();
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-hud font-bold text-xs uppercase tracking-wider"
                >
                  BLOQUEAR AGORA
                </button>
              </div>

              {/* Stealth Mode */}
              <div className="border border-zinc-800 bg-[#050505] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-white font-hud font-bold block uppercase tracking-wider flex items-center gap-2">
                    {security.stealthMode ? (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-emerald-400" />
                    )}
                    MODO PRIVACIDADE BIOMÉTRICA (STEALTH)
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Ofusca valores de peso, gordura corporal e exames na tela para uso em ambientes públicos.
                  </p>
                </div>
                <button
                  onClick={handleToggleStealth}
                  className={`px-4 py-2 border font-hud font-bold text-xs uppercase tracking-wider ${
                    security.stealthMode
                      ? "bg-amber-400 text-black border-amber-400"
                      : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {security.stealthMode ? "[ ATIVADO ]" : "[ DESATIVADO ]"}
                </button>
              </div>

              {/* Auto Lock Timeout */}
              <div className="border border-zinc-800 bg-[#050505] p-4 space-y-2">
                <span className="text-white font-hud font-bold block uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  TEMPO LIMITE PARA AUTO-BLOQUEIO
                </span>
                <p className="text-[11px] text-zinc-400">
                  Trava o terminal após inatividade do operador.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[0, 5, 15, 30].map((min) => (
                    <button
                      key={min}
                      onClick={() => handleChangeAutoLock(min)}
                      className={`p-2 border text-center font-hud text-xs uppercase ${
                        security.autoLockMinutes === min
                          ? "bg-zinc-900 border-emerald-400 text-white font-bold"
                          : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      }`}
                    >
                      {min === 0 ? "DESLIGADO" : `${min} MIN`}
                    </button>
                  ))}
                </div>
              </div>

              {/* LGPD Portability & Purge */}
              <div className="border-t border-zinc-800 pt-4 space-y-3">
                <span className="text-white font-hud font-bold block uppercase tracking-wider">
                  CONFORMIDADE LGPD (LEI 13.709/2018) // DIREITO DO TITULAR
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={onExportVault}
                    className="p-3 bg-black border border-zinc-800 hover:border-emerald-400 flex items-center gap-2.5 text-left group"
                  >
                    <Download className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-white font-hud font-bold block uppercase text-xs">
                        EXPORTAR COFRE (ART. 18 JSON)
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        JSON legível com metadados para conformidade LGPD.
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowEncryptedExportModal(true)}
                    className="p-3 bg-black border border-zinc-800 hover:border-amber-400 flex items-center gap-2.5 text-left group"
                  >
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-white font-hud font-bold block uppercase text-xs">
                        EXPORTAR CRIPTOGRAFADO (AES-GCM)
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        Arquivo .glvault cifrado com PBKDF2 (100k iterações) e senha mestra.
                      </span>
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowPurgeConfirm(true)}
                    className="w-full p-3 bg-black border border-zinc-800 hover:border-red-500 flex items-center gap-2.5 text-left group"
                  >
                    <Trash2 className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <span className="text-red-400 font-hud font-bold block uppercase text-xs">
                        PURGA TOTAL (DIREITO AO ESQUECIMENTO)
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        Exclui irreversivelmente a conta e zera o cofre do operador.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {showEncryptedExportModal && (
                <div className="border-2 border-amber-500/80 bg-zinc-950 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2 text-amber-400 font-hud font-bold text-xs uppercase">
                      <Key className="w-4 h-4" />
                      <span>EXPORTAÇÃO BLINDADA // AES-256-GCM + PBKDF2</span>
                    </div>
                    <button
                      onClick={() => setShowEncryptedExportModal(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Defina uma senha de criptografia para proteger o arquivo exportado. Os dados serão cifrados no próprio navegador com AES-GCM 256-bit e chave derivada via PBKDF2 (100.000 iterações com salt criptográfico único).
                  </p>
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={exportPassphrase}
                      onChange={(e) => setExportPassphrase(e.target.value)}
                      placeholder="SENHA PARA CIFRAGEM DO COFRE"
                      className="w-full bg-black border border-zinc-800 focus:border-amber-400 p-2 text-xs font-mono text-white outline-none"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowEncryptedExportModal(false)}
                        className="px-3 py-1.5 border border-zinc-700 bg-black text-xs font-hud uppercase text-zinc-300"
                      >
                        CANCELAR
                      </button>
                      <button
                        disabled={exportPassphrase.length < 6 || exportLoading}
                        onClick={async () => {
                          if (!onExportEncryptedVault || exportPassphrase.length < 6) return;
                          setExportLoading(true);
                          try {
                            await onExportEncryptedVault(exportPassphrase);
                            setExportSuccess(true);
                            setTimeout(() => {
                              setExportSuccess(false);
                              setShowEncryptedExportModal(false);
                              setExportPassphrase("");
                            }, 2000);
                          } finally {
                            setExportLoading(false);
                          }
                        }}
                        className="px-4 py-1.5 bg-amber-400 disabled:opacity-40 hover:bg-amber-300 text-black text-xs font-hud font-bold uppercase flex items-center gap-1.5"
                      >
                        {exportSuccess ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> EXPORTADO!
                          </>
                        ) : exportLoading ? (
                          "CIFRANDO..."
                        ) : (
                          "CIFRAR & BAIXAR (.GLVAULT)"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showPurgeConfirm && (
                <div className="border-2 border-red-500/80 bg-red-950/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-hud font-bold text-xs uppercase">
                    <AlertOctagon className="w-5 h-5" />
                    <span>CONFIRMAÇÃO DE PURGA IRREVERSÍVEL (ART. 18 LGPD)</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Esta ação apagará permanentemente o perfil do operador, credenciais, PIN e todas as métricas isoladas.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowPurgeConfirm(false)}
                      className="px-3 py-1.5 border border-zinc-700 bg-black text-xs font-hud uppercase text-zinc-300"
                    >
                      CANCELAR
                    </button>
                    <button
                      onClick={() => {
                        setShowPurgeConfirm(false);
                        onPurgeVault();
                      }}
                      className="px-4 py-1.5 bg-red-500 hover:bg-red-400 text-white text-xs font-hud font-bold uppercase"
                    >
                      CONFIRMAR PURGA DEFINITIVA
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* SUB-TAB 2: CREDENCIAIS & 2FA                         */}
          {/* ==================================================== */}
          {activeSubTab === "credentials" && (
            <div className="space-y-5">
              {/* Emergency Recovery Key */}
              {authUser?.recoveryKey && (
                <div className="border border-amber-500/40 bg-[#090D14] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-hud font-bold block uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      CHAVE MESTRA DE RECUPERAÇÃO DE EMERGÊNCIA
                    </span>
                    <button
                      onClick={copyRecoveryKey}
                      className="px-2.5 py-1 bg-amber-400/10 border border-amber-400/40 hover:bg-amber-400/20 text-amber-300 text-xs flex items-center gap-1 font-mono"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? "COPIADO!" : "COPIAR"}</span>
                    </button>
                  </div>
                  <div className="font-mono text-sm font-bold text-amber-400 bg-black/70 p-2.5 border border-zinc-800 text-center tracking-wider select-all">
                    {authUser.recoveryKey}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Use esta chave caso perca a senha ou o dispositivo 2FA. Guarde fora do navegador.
                  </p>
                </div>
              )}

              {/* 2FA Toggle */}
              <div className="border border-zinc-800 bg-[#050505] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-white font-hud font-bold block uppercase tracking-wider flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    AUTENTICAÇÃO DE DOIS FATORES (2FA)
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Exige confirmação de código de 6 dígitos ao realizar login no sistema.
                  </p>
                </div>
                <button
                  onClick={handleToggle2FA}
                  className={`px-4 py-2 border font-hud font-bold text-xs uppercase tracking-wider ${
                    security.twoFactorEnabled
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {security.twoFactorEnabled ? "[ 2FA ATIVO ]" : "[ 2FA INATIVO ]"}
                </button>
              </div>

              {/* Change PIN */}
              <div className="border border-zinc-800 bg-[#050505] p-4 space-y-3">
                <span className="text-white font-hud font-bold block uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  ALTERAR PIN RÁPIDO DO TERMINAL
                </span>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="NOVO PIN (4 A 6 DÍGITOS)"
                    className="flex-1 bg-black border border-zinc-800 focus:border-emerald-400 p-2 text-xs font-mono text-white outline-none"
                  />
                  <button
                    onClick={handleSavePin}
                    disabled={newPin.length < 4}
                    className="px-4 py-2 bg-emerald-400 disabled:opacity-40 hover:bg-emerald-300 text-black font-hud font-bold text-xs uppercase"
                  >
                    SALVAR PIN
                  </button>
                </div>
                {pinSuccessMsg && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PIN atualizado com sucesso no cofre.
                  </span>
                )}
              </div>

              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="border border-zinc-800 bg-[#050505] p-4 space-y-3">
                <span className="text-white font-hud font-bold block uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  ALTERAR SENHA MESTRA (PBKDF2-SHA256)
                </span>

                {pwdMsg && (
                  <div
                    className={`p-2.5 text-xs font-mono border ${
                      pwdMsg.error
                        ? "bg-rose-950/40 border-rose-600/50 text-rose-300"
                        : "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                    }`}
                  >
                    {pwdMsg.text}
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 uppercase mb-1">Senha Atual</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-black border border-zinc-800 focus:border-amber-400 p-2 text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 uppercase mb-1">Nova Senha (Mínimo 8 caracteres)</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black border border-zinc-800 focus:border-amber-400 p-2 text-xs font-mono text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 uppercase mb-1">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black border border-zinc-800 focus:border-amber-400 p-2 text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-hud font-bold text-xs uppercase"
                >
                  ATUALIZAR SENHA
                </button>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* SUB-TAB 3: AUDITORIA DE SEGURANÇA                    */}
          {/* ==================================================== */}
          {activeSubTab === "audit" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-hud font-bold uppercase tracking-wider">
                  LOGS DE AUTENTICAÇÃO & TENTATIVAS DE ACESSO
                </span>
                <span className="text-[11px] text-zinc-500">ÚLTIMOS 100 REGISTROS</span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-6 text-center border border-zinc-800 bg-[#050505] text-zinc-500">
                  Nenhum evento registrado ainda.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-[#090D14] border border-zinc-800/80 flex items-start justify-between gap-3 text-[11px]"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                                : log.status === "2FA_REQUIRED"
                                ? "bg-amber-950 text-amber-400 border border-amber-800/60"
                                : log.status === "RECOVERY_USED"
                                ? "bg-cyan-950 text-cyan-400 border border-cyan-800/60"
                                : "bg-rose-950 text-rose-400 border border-rose-800/60"
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-zinc-200 font-bold">{log.emailOrHandle}</span>
                        </div>
                        <div className="text-zinc-500 text-[10px] flex items-center gap-2">
                          <span>{log.device}</span>
                          <span>•</span>
                          <span>IP: {log.ip}</span>
                          {log.reason && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-400">{log.reason}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
