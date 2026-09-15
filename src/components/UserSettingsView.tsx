import React, { useState } from "react";
import {
  UserProfile,
  SecuritySettings,
  AuthUser,
  SystemStatusScores,
  BodyMetrics,
} from "../types";
import {
  User,
  Settings,
  Sliders,
  Scale,
  Target,
  Bell,
  Shield,
  Palette,
  RotateCcw,
  Check,
  Save,
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

export interface DashboardCustomizationConfig {
  showSystemStatus: boolean;
  showBody3D: boolean;
  showTelemetryQuad: boolean;
  showNutritionSummary: boolean;
  showHabitConsistency: boolean;
  showTodayWorkout: boolean;
  showDataInsights: boolean;
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardCustomizationConfig = {
  showSystemStatus: true,
  showBody3D: true,
  showTelemetryQuad: true,
  showNutritionSummary: true,
  showHabitConsistency: true,
  showTodayWorkout: true,
  showDataInsights: true,
};

interface UserSettingsViewProps {
  userProfile: UserProfile;
  authUser?: AuthUser | null;
  bodyMetrics: BodyMetrics;
  dashboardConfig: DashboardCustomizationConfig;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onUpdateBodyMetrics: (updatedMetrics: BodyMetrics) => void;
  onUpdateDashboardConfig: (newConfig: DashboardCustomizationConfig) => void;
  onOpenSecurityCenter?: () => void;
}

export const UserSettingsView: React.FC<UserSettingsViewProps> = ({
  userProfile,
  authUser,
  bodyMetrics,
  dashboardConfig,
  onUpdateProfile,
  onUpdateBodyMetrics,
  onUpdateDashboardConfig,
  onOpenSecurityCenter,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "dashboard" | "preferences">("profile");

  // Profile Form State (Honest values without hardcoded 75/175/26 fallbacks)
  const [name, setName] = useState(userProfile.name || "");
  const [handle, setHandle] = useState(userProfile.handle || "");
  const [age, setAge] = useState<number | "">(userProfile.age || "");
  const [gender, setGender] = useState<"male" | "female">(userProfile.gender || "male");
  const [heightCm, setHeightCm] = useState<number | "">(userProfile.heightCm || "");
  const [weightKg, setWeightKg] = useState<number | "">(bodyMetrics.weightKg || userProfile.weightKg || "");
  const [targetWeightKg, setTargetWeightKg] = useState<number | "">(userProfile.targetWeightKg || "");
  const [primaryGoal, setPrimaryGoal] = useState<UserProfile["primaryGoal"]>(
    userProfile.primaryGoal || "HYPERTROPHY"
  );
  const [activityLevel, setActivityLevel] = useState<UserProfile["activityLevel"]>(
    userProfile.activityLevel || "MODERATE"
  );

  // Local dashboard config state
  const [config, setConfig] = useState<DashboardCustomizationConfig>(dashboardConfig);

  // Feedback banner
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: UserProfile = {
      ...userProfile,
      name: name.trim() || userProfile.name,
      handle: handle.trim() || userProfile.handle,
      age: age !== "" ? Number(age) : userProfile.age,
      gender,
      heightCm: heightCm !== "" ? Number(heightCm) : userProfile.heightCm,
      weightKg: weightKg !== "" ? Number(weightKg) : userProfile.weightKg,
      targetWeightKg: targetWeightKg !== "" ? Number(targetWeightKg) : userProfile.targetWeightKg,
      primaryGoal,
      activityLevel,
    };

    const updatedBodyMetrics: BodyMetrics = {
      ...bodyMetrics,
      weightKg: weightKg !== "" ? Number(weightKg) : bodyMetrics.weightKg,
      heightCm: heightCm !== "" ? Number(heightCm) : bodyMetrics.heightCm,
      age: age !== "" ? Number(age) : bodyMetrics.age,
      gender,
    };

    onUpdateProfile(updatedProfile);
    onUpdateBodyMetrics(updatedBodyMetrics);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleToggleWidget = (key: keyof DashboardCustomizationConfig) => {
    const updated = {
      ...config,
      [key]: !config[key],
    };
    setConfig(updated);
    onUpdateDashboardConfig(updated);
  };

  const handleResetDashboard = () => {
    setConfig(DEFAULT_DASHBOARD_CONFIG);
    onUpdateDashboardConfig(DEFAULT_DASHBOARD_CONFIG);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-2">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
            SISTEMA // CONFIGURAÇÃO PESSOAL & AMBIENTE
          </span>
          <h1 className="text-xl sm:text-2xl font-hud font-bold text-white tracking-wider flex items-center gap-2">
            <Settings className="w-5 h-5 text-white" />
            CONFIGURAÇÕES DO USUÁRIO
          </h1>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-500 text-white text-xs font-mono animate-fadeIn">
            <Check className="w-3.5 h-3.5" />
            <span>CONFIGURAÇÕES SALVAS COM SUCESSO</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800 pb-2 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-3 py-1.5 flex items-center gap-1.5 transition-all ${
            activeTab === "profile"
              ? "bg-white text-black font-bold"
              : "bg-black text-zinc-400 hover:text-white border border-zinc-800"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>PERFIL BIOLÓGICO</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`px-3 py-1.5 flex items-center gap-1.5 transition-all ${
            activeTab === "dashboard"
              ? "bg-white text-black font-bold"
              : "bg-black text-zinc-400 hover:text-white border border-zinc-800"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>PERSONALIZAR PAINEL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`px-3 py-1.5 flex items-center gap-1.5 transition-all ${
            activeTab === "preferences"
              ? "bg-white text-black font-bold"
              : "bg-black text-zinc-400 hover:text-white border border-zinc-800"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>PREFERÊNCIAS VISUAIS & CORES</span>
        </button>
      </div>

      {/* TAB 1: PERFIL BIOLÓGICO */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="border border-zinc-800 bg-black p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="font-hud font-bold text-sm sm:text-base text-white tracking-wide flex items-center gap-2">
                <Scale className="w-4 h-4 text-zinc-400" />
                DADOS BIOMÉTRICOS & ANTROPOMETRIA
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Esses dados alimentam os cálculos de gasto calórico de exercícios, taxa metabólica basal e a visualização corporal 3D.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-zinc-400 block uppercase">NOME DO USUÁRIO</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:border-white focus:outline-none"
                  placeholder="Seu nome"
                  required
                />
              </div>

              {/* Identificador */}
              <div className="space-y-1">
                <label className="text-zinc-400 block uppercase">IDENTIFICADOR / APELIDO</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:border-white focus:outline-none"
                  placeholder="ex: atleta"
                  required
                />
              </div>

              {/* Sexo Biológico */}
              <div className="space-y-1">
                <label className="text-zinc-400 block uppercase">SEXO BIOLÓGICO (MODELO 3D & TMB)</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "male" | "female")}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:border-white focus:outline-none"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </div>

              {/* Idade */}
              <div className="space-y-1">
                <label className="text-zinc-400 block uppercase">IDADE (ANOS)</label>
                <input
                  type="number"
                  min="12"
                  max="100"
                  value={age}
                  placeholder="Ex: 26"
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:border-white focus:outline-none"
                />
              </div>

              {/* Altura */}
              <div className="space-y-1">
                <label className="text-zinc-400 block uppercase">ALTURA (CM)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={heightCm}
                  placeholder="Ex: 175"
                  onChange={(e) => setHeightCm(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:border-white focus:outline-none"
                />
              </div>

              {/* Peso Atual */}
              <div className="space-y-1">
                <label className="text-zinc-400 block uppercase">PESO ATUAL (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={weightKg}
                  placeholder="Ex: 75.0"
                  onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:border-white focus:outline-none"
                />
              </div>

              {/* Peso Alvo */}
              <div className="space-y-1">
                <label className="text-zinc-400 block uppercase">PESO ALVO / META (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  value={targetWeightKg}
                  placeholder="Ex: 72.0"
                  onChange={(e) => setTargetWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:border-white focus:outline-none"
                />
              </div>

              {/* Objetivo Principal */}
              <div className="space-y-1">
                <label className="text-zinc-400 block uppercase">OBJETIVO PRINCIPAL</label>
                <select
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:border-white focus:outline-none"
                >
                  <option value="HYPERTROPHY">Hipertrofia Muscular</option>
                  <option value="FAT_LOSS">Emagrecimento / Definição</option>
                  <option value="STRENGTH">Ganho de Força Bruta</option>
                  <option value="ENDURANCE">Resistência & Condicionamento</option>
                  <option value="HEALTH_LONGEVITY">Saúde & Longevidade</option>
                </select>
              </div>

              {/* Nível de Atividade */}
              <div className="space-y-1">
                <label className="text-zinc-400 block uppercase">NÍVEL DE ATIVIDADE DIÁRIA</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 px-3 py-2 text-white focus:border-white focus:outline-none"
                >
                  <option value="SEDENTARY">Sedentário (pouco ou nenhum exercício)</option>
                  <option value="LIGHT">Leve (exercício 1 a 3 dias/semana)</option>
                  <option value="MODERATE">Moderado (exercício 3 a 5 dias/semana)</option>
                  <option value="VERY_ACTIVE">Muito Ativo (exercício 6 a 7 dias/semana)</option>
                  <option value="EXTRA_ACTIVE">Atleta de Alto Rendimento (treino diário 2x)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">
                As alterações atualizarão a escala corporal 3D e os multiplicadores metabólicos imediatamente.
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 bg-white text-black font-hud font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>SALVAR DADOS BIOMÉTRICOS</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: PERSONALIZAR PAINEL (DASHBOARD) */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="border border-zinc-800 bg-black p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
              <div>
                <h2 className="font-hud font-bold text-sm sm:text-base text-white tracking-wide flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-zinc-400" />
                  MÓDULOS E WIDGETS DO PAINEL PRINCIPAL
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  O aplicativo entrega um painel completo por padrão. Você pode ativar ou ocultar cada bloco conforme sua preferência.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDashboard}
                className="px-3 py-1.5 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white font-mono text-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESTAURAR PADRÃO</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Widget 1: Status Geral */}
              <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-hud font-bold text-xs text-white uppercase block">
                    Índice Geral de Prontidão (0-100)
                  </span>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Pontuação biométrica diária integrando treino, nutrição e sono.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget("showSystemStatus")}
                  className={`w-12 h-6 flex items-center p-1 border transition-colors ${
                    config.showSystemStatus
                      ? "bg-white border-white justify-end"
                      : "bg-zinc-900 border-zinc-700 justify-start"
                  }`}
                >
                  <div
                    className={`w-4 h-4 ${
                      config.showSystemStatus ? "bg-black" : "bg-zinc-500"
                    }`}
                  />
                </button>
              </div>

              {/* Widget 2: Modelo Corporal 3D */}
              <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-hud font-bold text-xs text-white uppercase block">
                    Visualizador Anatômico 3D Realista
                  </span>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Avatar 3D giratório tridimensional calibrado às medidas e gênero do usuário.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget("showBody3D")}
                  className={`w-12 h-6 flex items-center p-1 border transition-colors ${
                    config.showBody3D
                      ? "bg-white border-white justify-end"
                      : "bg-zinc-900 border-zinc-700 justify-start"
                  }`}
                >
                  <div
                    className={`w-4 h-4 ${
                      config.showBody3D ? "bg-black" : "bg-zinc-500"
                    }`}
                  />
                </button>
              </div>

              {/* Widget 3: Quadrante de Telemetria */}
              <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-hud font-bold text-xs text-white uppercase block">
                    Quadrante de Telemetria (4 Métricas Rápidas)
                  </span>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Acesso rápido a Peso, Hidratação, Sono e Consumo Calórico.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget("showTelemetryQuad")}
                  className={`w-12 h-6 flex items-center p-1 border transition-colors ${
                    config.showTelemetryQuad
                      ? "bg-white border-white justify-end"
                      : "bg-zinc-900 border-zinc-700 justify-start"
                  }`}
                >
                  <div
                    className={`w-4 h-4 ${
                      config.showTelemetryQuad ? "bg-black" : "bg-zinc-500"
                    }`}
                  />
                </button>
              </div>

              {/* Widget 4: Resumo Nutricional */}
              <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-hud font-bold text-xs text-white uppercase block">
                    Balanço de Macronutrientes e Calorias
                  </span>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Barras de progresso com consumo de Proteínas, Carboidratos, Gorduras e Água.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget("showNutritionSummary")}
                  className={`w-12 h-6 flex items-center p-1 border transition-colors ${
                    config.showNutritionSummary
                      ? "bg-white border-white justify-end"
                      : "bg-zinc-900 border-zinc-700 justify-start"
                  }`}
                >
                  <div
                    className={`w-4 h-4 ${
                      config.showNutritionSummary ? "bg-black" : "bg-zinc-500"
                    }`}
                  />
                </button>
              </div>

              {/* Widget 5: Consistência de Hábitos */}
              <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-hud font-bold text-xs text-white uppercase block">
                    Matriz de Consistência & Hábitos
                  </span>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Acompanhamento diário de hábitos prioritários e cumprimento de rotina.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget("showHabitConsistency")}
                  className={`w-12 h-6 flex items-center p-1 border transition-colors ${
                    config.showHabitConsistency
                      ? "bg-white border-white justify-end"
                      : "bg-zinc-900 border-zinc-700 justify-start"
                  }`}
                >
                  <div
                    className={`w-4 h-4 ${
                      config.showHabitConsistency ? "bg-black" : "bg-zinc-500"
                    }`}
                  />
                </button>
              </div>

              {/* Widget 6: Sessão de Treino do Dia */}
              <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-hud font-bold text-xs text-white uppercase block">
                    Acesso Rápido ao Treino Recomendado
                  </span>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Cartão com a ficha do dia e botão direto para início do rastreador ao vivo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget("showTodayWorkout")}
                  className={`w-12 h-6 flex items-center p-1 border transition-colors ${
                    config.showTodayWorkout
                      ? "bg-white border-white justify-end"
                      : "bg-zinc-900 border-zinc-700 justify-start"
                  }`}
                >
                  <div
                    className={`w-4 h-4 ${
                      config.showTodayWorkout ? "bg-black" : "bg-zinc-500"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PREFERÊNCIAS VISUAIS & CORES */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          <div className="border border-zinc-800 bg-black p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="font-hud font-bold text-sm sm:text-base text-white tracking-wide flex items-center gap-2">
                <Palette className="w-4 h-4 text-zinc-400" />
                DIRETRIZ VISUAL & CONFORTO OCULAR
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                O aplicativo é estruturado exclusivamente em preto, cinza e branco com alto contraste e sem saturação agressiva, protegendo a visão do usuário.
              </p>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-white font-bold">
                <Check className="w-4 h-4 text-white" />
                <span>PALETA MONOCROMÁTICA ATIVA: PRETO, BRANCO E TONS INTERMEDIÁRIOS</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Todas as cores desnecessárias ou de alto contraste (como néons agressivos) foram totalmente eliminadas para manter máxima legibilidade, precisão biométrica e conforto durante o uso na academia ou no escuro.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="border border-zinc-800 p-2 bg-black text-center">
                  <div className="w-full h-8 bg-black border border-zinc-800 mb-1" />
                  <span className="text-[10px] text-zinc-400">Preto Puro (#000000)</span>
                </div>
                <div className="border border-zinc-800 p-2 bg-black text-center">
                  <div className="w-full h-8 bg-zinc-900 border border-zinc-800 mb-1" />
                  <span className="text-[10px] text-zinc-400">Cinza Escuro (#18181b)</span>
                </div>
                <div className="border border-zinc-800 p-2 bg-black text-center">
                  <div className="w-full h-8 bg-zinc-600 border border-zinc-800 mb-1" />
                  <span className="text-[10px] text-zinc-400">Cinza Médio (#52525b)</span>
                </div>
                <div className="border border-zinc-800 p-2 bg-black text-center">
                  <div className="w-full h-8 bg-white border border-zinc-300 mb-1" />
                  <span className="text-[10px] text-zinc-400">Branco Puro (#ffffff)</span>
                </div>
              </div>
            </div>

            {onOpenSecurityCenter && (
              <div className="border border-zinc-800 bg-black p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                <div>
                  <span className="font-bold text-white block">SEGURANÇA & PROTEÇÃO DE DADOS (LGPD)</span>
                  <span className="text-zinc-400 text-[11px]">
                    Gerencie seu PIN de bloqueio, modo invisível de dados e exportação de cofre.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenSecurityCenter}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-mono text-xs flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Shield className="w-3.5 h-3.5 text-zinc-300" />
                  <span>ABRIR CENTRAL DE SEGURANÇA</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
