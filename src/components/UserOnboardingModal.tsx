import React, { useState } from "react";
import { ShieldCheck, Lock, User, CheckCircle2, ChevronRight, AlertTriangle, Key } from "lucide-react";
import { UserProfile, SecuritySettings } from "../types";
import { hashPin, sanitizeInput } from "../utils/security";

interface UserOnboardingModalProps {
  isOpen: boolean;
  onCompleteOnboarding: (profile: UserProfile, security: SecuritySettings) => void;
}

export const UserOnboardingModal: React.FC<UserOnboardingModalProps> = ({
  isOpen,
  onCompleteOnboarding,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Security & Consent
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [pinError, setPinError] = useState("");

  // Step 2: Biological Baseline (Clean slate - user defines their actual metrics)
  const [handle, setHandle] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [initialWeightKg, setInitialWeightKg] = useState<number | "">("");
  const [primaryGoal, setPrimaryGoal] = useState<UserProfile["primaryGoal"]>("HEALTH_LONGEVITY");

  if (!isOpen) return null;

  const handleNextToStep2 = () => {
    setPinError("");
    if (!pin || pin.length < 4) {
      setPinError("Defina um PIN numérico de segurança com ao menos 4 dígitos.");
      return;
    }
    if (pin !== confirmPin) {
      setPinError("Os PINs informados não coincidem.");
      return;
    }
    if (!lgpdConsent) {
      setPinError("É necessário aceitar o termo de tratamento de dados sensíveis de saúde.");
      return;
    }
    setStep(2);
  };

  const handleFinish = async () => {
    setPinError("");
    if (!age || !heightCm || !initialWeightKg) {
      setPinError("Informe sua idade, altura e peso inicial real para calibrar seu perfil.");
      return;
    }

    const pinHash = await hashPin(pin);
    const sanitizedHandle = sanitizeInput(handle) || "OPERADOR_01";

    const newProfile: UserProfile = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      handle: sanitizedHandle,
      registeredAt: new Date().toISOString(),
      age: Number(age),
      gender,
      heightCm: Number(heightCm),
      initialWeightKg: Number(initialWeightKg),
      weightKg: Number(initialWeightKg),
      targetWeightKg: Number(initialWeightKg),
      primaryGoal,
      activityLevel: "MODERATE",
    };

    const newSecurity: SecuritySettings = {
      pinHash,
      hasPinSet: true,
      isLocked: false,
      autoLockMinutes: 15,
      stealthMode: false,
      lgpdConsentAccepted: true,
      consentTimestamp: new Date().toISOString(),
      vaultEncryptionEnabled: true,
    };

    onCompleteOnboarding(newProfile, newSecurity);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-3 sm:p-6">
      <div className="bg-black border-2 border-zinc-700 max-w-xl w-full flex flex-col hud-corners shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-white" />
            <div>
              <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase block">
                GYM LABS // CONFIGURAÇÃO INICIAL
              </span>
              <h2 className="font-hud font-bold text-lg sm:text-xl text-white tracking-wider">
                CONFIGURAÇÃO DO PERFIL & COFRE DE SAÚDE
              </h2>
            </div>
          </div>
          <div className="text-xs font-mono px-2 py-1 border border-zinc-800 text-zinc-400 bg-black">
            ETAPA {step}/2
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-mono text-xs text-zinc-300">
          {step === 1 && (
            <div className="space-y-5">
              <div className="border border-zinc-700 bg-zinc-900/60 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-hud font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-zinc-200" />
                  [ SEGURANÇA BIOMÉTRICA & ZERO-KNOWLEDGE ]
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  O <strong>Gym Labs</strong> opera sob o princípio de cofre local isolado. Nenhuma métrica corporal ou biomarcador de saúde é transmitido para terceiros sem consentimento. O aplicativo inicializará <strong>sem dados simulados</strong> para garantir total integridade dos seus registros.
                </p>
              </div>

              {/* Security PIN */}
              <div className="space-y-3 bg-[#050505] border border-zinc-800 p-4">
                <span className="text-white font-hud font-bold block uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-zinc-300" />
                  DEFINIR PIN DE ACESSO DO COFRE (4 A 6 DÍGITOS)
                </span>
                <p className="text-[11px] text-zinc-500">
                  Protege seus dados de exames, peso e telemetria contra acessos não autorizados neste dispositivo.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1 uppercase">PIN de Segurança</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="w-full bg-black border border-zinc-800 focus:border-emerald-400 p-2 text-sm font-mono text-white tracking-widest outline-none text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1 uppercase">Confirmar PIN</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="w-full bg-black border border-zinc-800 focus:border-emerald-400 p-2 text-sm font-mono text-white tracking-widest outline-none text-center"
                    />
                  </div>
                </div>
              </div>

              {/* LGPD / HIPAA Consent Checkbox */}
              <div className="border border-zinc-800 bg-[#050505] p-3.5 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lgpdConsent}
                    onChange={(e) => setLgpdConsent(e.target.checked)}
                    className="mt-0.5 accent-emerald-400 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] leading-relaxed text-zinc-300">
                    <strong className="text-white">Consentimento de Saúde (LGPD Art. 11 / HIPAA):</strong> Concordo expressamente com o processamento local de dados de desempenho físico, biomarcadores e métricas de composição corporal estritamente para meu acompanhamento de saúde, com direito assegurado de portabilidade e exclusão irreversível a qualquer momento.
                  </span>
                </label>
              </div>

              {pinError && (
                <div className="flex items-center gap-2 p-2 border border-red-500/50 bg-red-950/30 text-red-400 text-xs font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="border border-zinc-800 bg-[#050505] p-3.5 space-y-1">
                <span className="text-emerald-400 font-hud font-bold block uppercase tracking-wider">
                  CALIBRAÇÃO BIOMÉTRICA INICIAL (SEM DADOS SIMULADOS)
                </span>
                <p className="text-[11px] text-zinc-400">
                  Informe suas características basais reais. Todos os módulos de treino, nutrição e sono começarão em estado zero (limpo), aguardando seus primeiros registros reais.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-hud">Identificador / Pseudônimo</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Ex: ALEX_01"
                    className="w-full bg-black border border-zinc-800 focus:border-emerald-400 p-2 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-hud">Sexo Biológico</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender("male")}
                      className={`p-2 border text-center text-xs font-hud uppercase transition-colors ${
                        gender === "male"
                          ? "bg-zinc-900 border-emerald-400 text-white font-bold"
                          : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      }`}
                    >
                      MASCULINO
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("female")}
                      className={`p-2 border text-center text-xs font-hud uppercase transition-colors ${
                        gender === "female"
                          ? "bg-zinc-900 border-emerald-400 text-white font-bold"
                          : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      }`}
                    >
                      FEMININO
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-hud">Idade (Anos)</label>
                  <input
                    type="number"
                    min={14}
                    max={100}
                    value={age}
                    placeholder="Ex: 26"
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 focus:border-emerald-400 p-2 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-hud">Altura (CM)</label>
                  <input
                    type="number"
                    min={120}
                    max={230}
                    value={heightCm}
                    placeholder="Ex: 175"
                    onChange={(e) => setHeightCm(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 focus:border-emerald-400 p-2 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-hud">Peso Inicial Real (KG)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={35}
                    max={250}
                    value={initialWeightKg}
                    placeholder="Ex: 75.0"
                    onChange={(e) => setInitialWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 focus:border-emerald-400 p-2 text-sm font-mono text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-hud">Foco Primário de Treinamento</label>
                  <select
                    value={primaryGoal}
                    onChange={(e) => setPrimaryGoal(e.target.value as any)}
                    className="w-full bg-black border border-zinc-800 focus:border-emerald-400 p-2 text-xs font-mono text-white outline-none"
                  >
                    <option value="HEALTH_LONGEVITY">SAÚDE METABÓLICA & LONGEVIDADE</option>
                    <option value="STRENGTH">DESENVOLVIMENTO DE FORÇA MÁXIMA</option>
                    <option value="HYPERTROPHY">HIPERTROFIA & COMPOSIÇÃO CORPORAL</option>
                    <option value="RECOMPOSITION">RECOMPOSIÇÃO (PERDA DE GORDURA + MASSA)</option>
                    <option value="ENDURANCE">ENDURANCE & CONDICIONAMENTO CARDIO</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-zinc-800 px-6 py-4 bg-zinc-950 flex items-center justify-between">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-zinc-800 bg-black text-zinc-400 hover:text-white text-xs font-hud uppercase"
            >
              VOLTAR
            </button>
          ) : (
            <span className="text-[10px] text-zinc-500 font-mono">
              GYM LABS // SECURE VAULT
            </span>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleNextToStep2}
              className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase tracking-wider border border-white shadow-[2px_2px_0px_#27272a] flex items-center gap-1.5"
            >
              <span>AVANÇAR PARA CALIBRAÇÃO</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase tracking-wider border border-white shadow-[2px_2px_0px_#27272a] flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>INICIALIZAR COFRE LIMPO</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
