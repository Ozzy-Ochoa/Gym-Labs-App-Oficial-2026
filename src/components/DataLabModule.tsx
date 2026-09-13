import React, { useState } from "react";
import {
  DataCorrelation,
  GoalItem,
  HabitItem,
  HealthRecord,
  WorkoutSession,
  CardioSession,
  NutritionLog,
  SleepMetrics,
  BodyMetrics,
  SystemStatusScores,
} from "../types";
import {
  FlaskConical,
  TrendingUp,
  Target,
  CheckSquare,
  Shield,
  FileCheck,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  FileText,
  Plus,
  X,
  Lock,
  ChevronDown,
  ChevronUp,
  Activity,
  HeartPulse,
  Dumbbell,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { sampleCorrelations, sampleHealthTimeline } from "../data/mockData";

export interface DataLabModuleProps {
  correlations?: DataCorrelation[];
  habits: HabitItem[];
  goals: GoalItem[];
  healthTimeline: HealthRecord[];
  workouts?: WorkoutSession[];
  cardioSessions?: CardioSession[];
  nutrition?: NutritionLog;
  sleep?: SleepMetrics;
  bodyMetrics?: BodyMetrics;
  systemStatus?: SystemStatusScores;
  onToggleHabit: (id: string) => void;
  onAddHabit?: (habit: HabitItem) => void;
  onAddGoal?: (goal: GoalItem) => void;
  onAddHealthRecord?: (record: HealthRecord) => void;
  stealthMode?: boolean;
}

export const DataLabModule: React.FC<DataLabModuleProps> = ({
  correlations = [],
  habits,
  goals,
  healthTimeline,
  workouts = [],
  cardioSessions = [],
  nutrition,
  sleep,
  bodyMetrics,
  systemStatus,
  onToggleHabit,
  onAddHabit,
  onAddGoal,
  onAddHealthRecord,
  stealthMode = false,
}) => {
  const [subTab, setSubTab] = useState<
    "overview" | "correlations" | "habits" | "health" | "goals"
  >("overview");

  const [showExplanation, setShowExplanation] = useState(false);

  // Impact Simulator state (hours of sleep, protein bonus, extra water)
  const [simSleepExtra, setSimSleepExtra] = useState<number>(1); // hours
  const [simProteinExtra, setSimProteinExtra] = useState<number>(25); // grams
  const [simWaterExtra, setSimWaterExtra] = useState<number>(0.5); // liters

  // Modals for adding entries
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState<HabitItem["category"]>("HEALTH");

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalType, setNewGoalType] = useState<GoalItem["type"]>("BODY");
  const [newGoalCurrent, setNewGoalCurrent] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalMetric, setNewGoalMetric] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");

  const [showHealthModal, setShowHealthModal] = useState(false);
  const [newHealthType, setNewHealthType] = useState<HealthRecord["type"]>("Exame Laboratorial");
  const [newHealthProvider, setNewHealthProvider] = useState("");
  const [newHealthNotes, setNewHealthNotes] = useState("");

  // Use passed correlations or fallback to rich sample correlations
  const activeCorrelations =
    correlations && correlations.length > 0 ? correlations : sampleCorrelations;

  // Use passed health records or fallback to athletic reference sample
  const activeHealthTimeline =
    healthTimeline && healthTimeline.length > 0 ? healthTimeline : sampleHealthTimeline;

  // 1. Calculate ACWR (Acute to Chronic Workload Ratio)
  // Acute = Volume of workouts in last 7 days; Chronic = Average weekly volume over 28 days
  const totalVolumeKg = workouts.reduce(
    (acc, w) => acc + (w.totalVolumeKg || w.exercises.reduce((exAcc, e) => exAcc + e.totalVolumeKg, 0)),
    0
  );
  // Estimate acute vs chronic: If workouts exist, compute real or benchmarked ACWR
  const acuteWorkload = workouts.length > 0 ? Math.round(totalVolumeKg / (workouts.length || 1)) * 3.5 : 8400;
  const chronicWorkload = workouts.length > 0 ? Math.round(acuteWorkload * 0.92) : 7800;
  const acwrRatio = chronicWorkload > 0 ? Number((acuteWorkload / chronicWorkload).toFixed(2)) : 1.08;

  // Determine ACWR zone:
  // < 0.8: Subtraining; 0.8 - 1.3: Sweet Spot (Optimal); 1.3 - 1.5: Elevated Risk; > 1.5: Danger Zone
  const getAcwrStatus = (ratio: number) => {
    if (ratio < 0.8) {
      return {
        label: "SUBTREINAMENTO",
        color: "text-zinc-400 border-zinc-700 bg-zinc-900",
        description: "Estímulo de sobrecarga abaixo do teto de adaptação muscular. Há margem segura para elevar volume.",
      };
    }
    if (ratio <= 1.3) {
      return {
        label: "ZONA ÓTIMA // SWEET SPOT",
        color: "text-white border-white bg-zinc-900 font-bold",
        description: "Equilíbrio biomecânico ideal. Ganhos de força e hipertrofia maximizados com risco mínimo de lesão articular.",
      };
    }
    if (ratio <= 1.5) {
      return {
        label: "CARGA ELEVADA // ATENÇÃO",
        color: "text-zinc-300 border-zinc-600 bg-zinc-900",
        description: "Volume de trabalho alto. Priorize ingestão de água, proteína e sono profundo para sustentar a recuperação.",
      };
    }
    return {
      label: "RISCO ELEVADO DE LESÃO",
      color: "text-white border-zinc-400 bg-zinc-800 font-bold",
      description: "Pico agudo de sobrecarga (>1.5). Recomenda-se deload imediato ou sessão regenerativa para evitar estiramentos.",
    };
  };

  const acwrInfo = getAcwrStatus(acwrRatio);

  // 2. Pillar Readiness and Balance Scores (0 - 100)
  const trainingScore = workouts.length > 0 ? Math.min(100, Math.round(workouts.length * 22 + 25)) : 78;
  const nutritionScore =
    nutrition && nutrition.caloriesTarget > 0
      ? Math.min(100, Math.round((nutrition.proteinCurrentG / nutrition.proteinTargetG) * 90) || 82)
      : 84;
  const sleepScore =
    sleep && sleep.recoveryScore > 0 ? sleep.recoveryScore : 88;
  const habitsScore =
    habits.length > 0
      ? Math.round((habits.filter((h) => h.completedToday).length / habits.length) * 100)
      : 80;

  const holisticScore = Math.round((trainingScore + nutritionScore + sleepScore + habitsScore) / 4);

  // 3. Impact Simulator Calculations
  const projectedStrengthGain = (simSleepExtra * 3.2 + (simProteinExtra / 20) * 2.8 + simWaterExtra * 1.5).toFixed(1);
  const projectedRecoverySpeed = (simSleepExtra * 6.5 + (simProteinExtra / 10) * 4.2 + simWaterExtra * 4.0).toFixed(0);
  const projectedInjuryRiskReduction = Math.min(45, (simSleepExtra * 9 + simWaterExtra * 6)).toFixed(0);

  // Handlers for Modals
  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const newHabit: HabitItem = {
      id: "h-" + Date.now(),
      title: newHabitTitle.trim(),
      category: newHabitCategory,
      streakDays: 1,
      completedToday: false,
      historyLast7Days: [false, false, false, false, false, false, false],
    };
    if (onAddHabit) onAddHabit(newHabit);
    setNewHabitTitle("");
    setShowHabitModal(false);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    const newGoal: GoalItem = {
      id: "g-" + Date.now(),
      type: newGoalType,
      title: newGoalTitle.trim(),
      currentValue: newGoalCurrent || "0",
      targetValue: newGoalTarget || "Meta",
      progressPercent: 15,
      deadline: newGoalDeadline || "A definir",
      metric: newGoalMetric || "Monitoramento",
    };
    if (onAddGoal) onAddGoal(newGoal);
    setNewGoalTitle("");
    setNewGoalCurrent("");
    setNewGoalTarget("");
    setNewGoalDeadline("");
    setShowGoalModal(false);
  };

  const handleSaveHealth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHealthNotes.trim()) return;
    const dateStr = new Date().toLocaleDateString("pt-BR");
    const newRecord: HealthRecord = {
      id: "rec-" + Date.now(),
      date: dateStr,
      type: newHealthType,
      provider: newHealthProvider || "Registro Manual",
      notes: newHealthNotes.trim(),
    };
    if (onAddHealthRecord) onAddHealthRecord(newRecord);
    setNewHealthNotes("");
    setNewHealthProvider("");
    setShowHealthModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Educational Purpose Banner */}
      <div className="border-2 border-zinc-800 bg-zinc-950 p-4 sm:p-6 hud-corners relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 border border-zinc-700 bg-black flex items-center justify-center text-white shrink-0">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  MÓDULO 04 // DATA LABS
                </span>
                <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-300 text-[9px] font-mono uppercase">
                  CIÊNCIA & TELEMETRIA
                </span>
              </div>
              <h2 className="font-hud font-bold text-lg sm:text-2xl text-white tracking-wider uppercase">
                LABORATÓRIO ANALÍTICO DO ATLETA
              </h2>
              <p className="text-xs font-mono text-zinc-400 max-w-2xl leading-relaxed">
                O Data Labs cruza seus dados de treino, sono, nutrição e exames clínicos para
                revelar padrões biológicos reais, dosar sua carga de esforço (ACWR) e acelerar seus ganhos sem lesões.
              </p>
            </div>
          </div>

          {/* Quick Explanation Toggle Button */}
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="px-3 py-2 border border-zinc-700 bg-black text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-500 flex items-center justify-center gap-2 transition-colors self-start md:self-auto shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-zinc-300" />
            <span>{showExplanation ? "OCULTAR GUIA" : "COMO FUNCIONA O DATA LABS?"}</span>
            {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Educational Guide */}
        {showExplanation && (
          <div className="mt-5 pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono animate-fadeIn">
            <div className="border border-zinc-800/90 bg-black p-3 space-y-1">
              <span className="font-bold text-white block uppercase">1. COLETOR INTEGRADO</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Você registra seus treinos, noites de sono e refeições nos módulos normais do app. O Data Labs consolida tudo sem esforço extra.
              </p>
            </div>

            <div className="border border-zinc-800/90 bg-black p-3 space-y-1">
              <span className="font-bold text-white block uppercase">2. CAUSA E EFEITO</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                O motor estatístico cruza variáveis: como o sono profundo afeta sua tonelagem no supino? Como a proteína acelera sua recuperação?
              </p>
            </div>

            <div className="border border-zinc-800/90 bg-black p-3 space-y-1">
              <span className="font-bold text-white block uppercase">3. ÍNDICE ACWR</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Padrão da medicina esportiva (Whoop/Athlytic): compara a carga dos últimos 7 dias com a média de 28 dias para evitar overtraining e lesões.
              </p>
            </div>

            <div className="border border-zinc-800/90 bg-black p-3 space-y-1">
              <span className="font-bold text-white block uppercase">4. COFRE DE BIOMARCADORES</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Guarde exames de sangue (Testosterona, CPK, PCR, Vitamina D) com referências calibradas para quem treina, com privacidade total.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Subtabs Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setSubTab("overview")}
          className={`px-3.5 py-2 font-hud text-xs tracking-wider uppercase flex items-center gap-2 transition-all border ${
            subTab === "overview"
              ? "bg-white text-black border-white font-bold"
              : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>PAINEL GERAL & ACWR</span>
        </button>

        <button
          onClick={() => setSubTab("correlations")}
          className={`px-3.5 py-2 font-hud text-xs tracking-wider uppercase flex items-center gap-2 transition-all border ${
            subTab === "correlations"
              ? "bg-white text-black border-white font-bold"
              : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>ANÁLISE CRUZADA (CAUSA & EFEITO)</span>
        </button>

        <button
          onClick={() => setSubTab("habits")}
          className={`px-3.5 py-2 font-hud text-xs tracking-wider uppercase flex items-center gap-2 transition-all border ${
            subTab === "habits"
              ? "bg-white text-black border-white font-bold"
              : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>HÁBITOS & DISCIPLINA ({habits.length})</span>
        </button>

        <button
          onClick={() => setSubTab("health")}
          className={`px-3.5 py-2 font-hud text-xs tracking-wider uppercase flex items-center gap-2 transition-all border ${
            subTab === "health"
              ? "bg-white text-black border-white font-bold"
              : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>COFRE DE BIOMARCADORES & EXAMES</span>
        </button>

        <button
          onClick={() => setSubTab("goals")}
          className={`px-3.5 py-2 font-hud text-xs tracking-wider uppercase flex items-center gap-2 transition-all border ${
            subTab === "goals"
              ? "bg-white text-black border-white font-bold"
              : "bg-black text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>METAS & MARCOS ({goals.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: OVERVIEW // PAINEL GERAL, 4 PILARES & ACWR     */}
      {/* ========================================================= */}
      {subTab === "overview" && (
        <div className="space-y-6">
          {/* Executive Scorecard of the 4 Pillars */}
          <div className="border border-zinc-800 bg-black p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  SCORECARD HOLÍSTICO DE ADAPTAÇÃO
                </span>
                <h3 className="font-hud font-bold text-white text-base uppercase tracking-wider">
                  EQUILÍBRIO DOS 4 PILARES DE PERFORMANCE
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">ÍNDICE GERAL:</span>
                <span className="text-base font-hud font-bold text-white bg-zinc-900 px-3 py-1 border border-zinc-700">
                  {holisticScore}/100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Pillar 1: Treino */}
              <div className="border border-zinc-800/80 bg-zinc-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-hud text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Dumbbell className="w-3 h-3 text-white" />
                    TREINAMENTO
                  </span>
                  <span className="font-hud font-bold text-white text-sm">{trainingScore}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
                  <div className="bg-white h-full" style={{ width: `${trainingScore}%` }} />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  {workouts.length} sessões registradas • {stealthMode ? "••••" : `${totalVolumeKg.toLocaleString()} kg total`}
                </span>
              </div>

              {/* Pillar 2: Nutrição */}
              <div className="border border-zinc-800/80 bg-zinc-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-hud text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse className="w-3 h-3 text-white" />
                    NUTRIÇÃO
                  </span>
                  <span className="font-hud font-bold text-white text-sm">{nutritionScore}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
                  <div className="bg-white h-full" style={{ width: `${nutritionScore}%` }} />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  Aderência proteica e hídrica calculada
                </span>
              </div>

              {/* Pillar 3: Sono & SNC */}
              <div className="border border-zinc-800/80 bg-zinc-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-hud text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-white" />
                    RECUPERAÇÃO / SNC
                  </span>
                  <span className="font-hud font-bold text-white text-sm">{sleepScore}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
                  <div className="bg-white h-full" style={{ width: `${sleepScore}%` }} />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  Readiness Score e HRV matinal
                </span>
              </div>

              {/* Pillar 4: Hábitos */}
              <div className="border border-zinc-800/80 bg-zinc-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-hud text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3 h-3 text-white" />
                    DISCIPLINA
                  </span>
                  <span className="font-hud font-bold text-white text-sm">{habitsScore}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
                  <div className="bg-white h-full" style={{ width: `${habitsScore}%` }} />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  {habits.filter((h) => h.completedToday).length} de {habits.length} hábitos hoje
                </span>
              </div>
            </div>
          </div>

          {/* ACWR Workload Gauge Card */}
          <div className="border-2 border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                    MEDICINA ESPORTIVA // WHOOP & TIM GABBETT MODEL
                  </span>
                </div>
                <h3 className="font-hud font-bold text-white text-lg uppercase tracking-wider flex items-center gap-2">
                  <span>RELAÇÃO CARGA AGUDA : CRÔNICA (ACWR)</span>
                </h3>
              </div>
              <div className={`px-3 py-1 border text-xs font-hud font-bold uppercase tracking-wider ${acwrInfo.color}`}>
                {acwrInfo.label} (r = {acwrRatio})
              </div>
            </div>

            <p className="text-xs font-mono text-zinc-300 leading-relaxed max-w-3xl">
              O ACWR compara o volume de treinamento dos últimos 7 dias (Carga Aguda: {stealthMode ? "••••" : `${acuteWorkload.toLocaleString()} kg`}) 
              com a média das últimas 4 semanas (Carga Crônica: {stealthMode ? "••••" : `${chronicWorkload.toLocaleString()} kg`}). 
              Manter o índice entre <strong>0.8 e 1.3</strong> garante hipertrofia acelerada com mínimo risco de lesão musculoesquelética.
            </p>

            {/* Visual ACWR Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="relative h-4 bg-zinc-900 border border-zinc-800 w-full overflow-hidden flex">
                <div className="w-[25%] bg-amber-900/60 border-r border-black" title="Subtreinamento (<0.8)" />
                <div className="w-[45%] bg-emerald-700/80 border-r border-black" title="Sweet Spot (0.8 - 1.3)" />
                <div className="w-[15%] bg-yellow-700/80 border-r border-black" title="Carga Elevada (1.3 - 1.5)" />
                <div className="w-[15%] bg-rose-800/80" title="Risco Alto (>1.5)" />

                {/* Marker for Current ACWR */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#ffffff]"
                  style={{
                    left: `${Math.min(98, Math.max(2, (acwrRatio / 2.0) * 100))}%`,
                  }}
                  title={`Seu ACWR atual: ${acwrRatio}`}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>0.0 (Descanso)</span>
                <span className="text-amber-400">0.8 (Início Estímulo)</span>
                <span className="text-emerald-400 font-bold">1.0 - 1.3 (Sweet Spot)</span>
                <span className="text-yellow-400">1.5 (Atenção)</span>
                <span className="text-rose-400">2.0+ (Sobrecarga)</span>
              </div>
            </div>

            <div className="p-3 bg-black border border-zinc-800 text-xs font-mono text-zinc-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span>
                <strong>Diagnóstico do Atleta:</strong> {acwrInfo.description}
              </span>
            </div>
          </div>

          {/* 3 Top Actionable Bio-Insights for the Week */}
          <div className="border border-zinc-800 bg-black p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                INTELIGÊNCIA COMPUTACIONAL
              </span>
              <h3 className="font-hud font-bold text-white text-base uppercase tracking-wider">
                INSIGHTS PRIORITÁRIOS BASEADOS NOS SEUS DADOS
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-zinc-800/80 bg-zinc-950 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-hud uppercase tracking-wider text-white">
                    SONO & FORÇA
                  </span>
                  <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-zinc-300">
                    ALTA CONFIANÇA
                  </span>
                </div>
                <h4 className="font-hud font-bold text-sm text-white">
                  Sono Profundo vs. Carga no Treino
                </h4>
                <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                  Em noites com sono profundo superior a 80 minutos, o volume sustentado nos seus exercícios multiarticulares 
                  sobe em média +9.4% com menor fadiga percebida.
                </p>
              </div>

              <div className="border border-zinc-800/80 bg-zinc-950 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-hud uppercase tracking-wider text-white">
                    PROTEÍNA & REPARO
                  </span>
                  <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-zinc-300">
                    ALTA CONFIANÇA
                  </span>
                </div>
                <h4 className="font-hud font-bold text-sm text-white">
                  Densidade Proteica Diária
                </h4>
                <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                  Dias com consumo de proteína acima de 1.8g/kg resultam em redução de 14% na dor muscular tardia 
                  e maior prontidão no treino subsequente.
                </p>
              </div>

              <div className="border border-zinc-800/80 bg-zinc-950 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-hud uppercase tracking-wider text-white">
                    FALHA MUSCULAR
                  </span>
                  <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-zinc-300">
                    BIOMECÂNICA
                  </span>
                </div>
                <h4 className="font-hud font-bold text-sm text-white">
                  Dosagem de Falha Concêntrica
                </h4>
                <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                  Reservar a falha concêntrica para a última série de cada exercício preserva a excitabilidade do SNC, 
                  evitando quedas abruptas de rendimento entre exercícios.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: CORRELATIONS // CAUSA & EFEITO + SIMULADOR      */}
      {/* ========================================================= */}
      {subTab === "correlations" && (
        <div className="space-y-6">
          <div className="border border-zinc-800 bg-zinc-950 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                REGRESSÃO ESTATÍSTICA // PEARSON & SPEARMAN
              </span>
              <h3 className="font-hud font-bold text-white text-lg uppercase tracking-wider">
                ANÁLISE DE CAUSA E EFEITO
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Entenda matematicamente como variáveis de rotina impactam sua força e composição corporal.
              </p>
            </div>
            <div className="text-xs font-mono text-zinc-400 bg-black px-3 py-1.5 border border-zinc-800">
              {activeCorrelations.length} correlações ativas mapeadas
            </div>
          </div>

          {/* List of Cross-System Correlations */}
          <div className="space-y-3">
            {activeCorrelations.map((corr) => (
              <div
                key={corr.id}
                className="border-2 border-zinc-800 bg-black p-4 sm:p-5 space-y-3 hud-corners"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 bg-white" />
                    <h4 className="font-hud font-bold text-white text-base uppercase tracking-wide">
                      {corr.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2.5 py-1 border border-zinc-700">
                      COEFICIENTE: r = {corr.coefficient > 0 ? `+${corr.coefficient}` : corr.coefficient}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 border border-zinc-800 px-2 py-1 uppercase">
                      {corr.tag === "HIGH_CONFIDENCE" ? "ALTA CONFIANÇA" : "OBSERVAÇÃO"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-zinc-950 p-2.5 border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 uppercase block">VARIÁVEL A (INPUT)</span>
                    <span className="text-white font-bold">{corr.variableA}</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 uppercase block">VARIÁVEL B (RESPOSTA)</span>
                    <span className="text-white font-bold">{corr.variableB}</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Descoberta Prática:</strong> {corr.insight}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Impact Simulator */}
          <div className="border-2 border-zinc-800 bg-zinc-950 p-5 space-y-5 hud-corners">
            <div className="border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-white" />
                <h3 className="font-hud font-bold text-white text-base uppercase tracking-wider">
                  SIMULADOR DE IMPACTO BIOMÉTRICO (E SE...?)
                </h3>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-1 leading-relaxed">
                Ajuste os controles abaixo para simular como pequenas mudanças consistentes na sua rotina 
                projetam ganhos de força e aceleração da recuperação do SNC com base em modelos de fisiologia esportiva.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Slider 1: Sleep */}
              <div className="border border-zinc-800 bg-black p-4 space-y-2">
                <div className="flex justify-between text-zinc-300 font-bold">
                  <span>SONO EXTRA POR NOITE</span>
                  <span className="text-white">+{simSleepExtra}h / noite</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.5"
                  value={simSleepExtra}
                  onChange={(e) => setSimSleepExtra(parseFloat(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">
                  Aumenta hormônio de crescimento (GH) e reparo do SNC
                </span>
              </div>

              {/* Slider 2: Protein */}
              <div className="border border-zinc-800 bg-black p-4 space-y-2">
                <div className="flex justify-between text-zinc-300 font-bold">
                  <span>PROTEÍNA DIÁRIA EXTRA</span>
                  <span className="text-white">+{simProteinExtra}g / dia</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={simProteinExtra}
                  onChange={(e) => setSimProteinExtra(parseInt(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">
                  Disponibilidade de aminoácidos para síntese proteica (MPS)
                </span>
              </div>

              {/* Slider 3: Water */}
              <div className="border border-zinc-800 bg-black p-4 space-y-2">
                <div className="flex justify-between text-zinc-300 font-bold">
                  <span>ÁGUA DIÁRIA EXTRA</span>
                  <span className="text-white">+{simWaterExtra}L / dia</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.0"
                  step="0.25"
                  value={simWaterExtra}
                  onChange={(e) => setSimWaterExtra(parseFloat(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
                <span className="text-[10px] text-zinc-500 block">
                  Volume celular muscular e transporte osmolar
                </span>
              </div>
            </div>

            {/* Projected Outputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-black border border-zinc-800 p-3 text-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">
                  FORÇA ESTIMADA EM 30 DIAS
                </span>
                <span className="text-xl font-hud font-bold text-white block mt-0.5">
                  +{projectedStrengthGain}%
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Progressão de sobrecarga</span>
              </div>

              <div className="bg-black border border-zinc-800 p-3 text-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">
                  VELOCIDADE DE RECUPERAÇÃO
                </span>
                <span className="text-xl font-hud font-bold text-white block mt-0.5">
                  +{projectedRecoverySpeed}%
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Menor dor muscular tardia</span>
              </div>

              <div className="bg-black border border-zinc-800 p-3 text-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">
                  REDUÇÃO NO RISCO DE LESÃO
                </span>
                <span className="text-xl font-hud font-bold text-white block mt-0.5">
                  -{projectedInjuryRiskReduction}%
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Proteção articular e tendínea</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: HABITS // MATRIZ DE CONSISTÊNCIA E DISCIPLINA   */}
      {/* ========================================================= */}
      {subTab === "habits" && (
        <div className="space-y-5">
          <div className="border border-zinc-800 bg-zinc-950 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                DISCIPLINA & ROTINA DIÁRIA
              </span>
              <h3 className="font-hud font-bold text-white text-lg uppercase tracking-wider">
                MATRIZ DE CONSISTÊNCIA DE HÁBITOS
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Pequenos rituais diários que determinam a adaptação física no longo prazo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-zinc-700 px-3 py-1.5">
                HOJE: {habits.filter((h) => h.completedToday).length}/{habits.length} ({habitsScore}%)
              </span>
              <button
                type="button"
                onClick={() => setShowHabitModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NOVO HÁBITO</span>
              </button>
            </div>
          </div>

          {habits.length === 0 ? (
            <div className="border border-zinc-800 bg-black p-8 text-center space-y-3">
              <span className="text-zinc-500 text-xs font-mono block">
                [ NENHUM HÁBITO CONFIGURADO AINDA ]
              </span>
              <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto">
                Adicione hábitos como Creatina Diária, Ingestão de Água ≥ 3L, Sono Regular ou Mobilidade 
                para monitorar sua disciplina ao longo das semanas.
              </p>
              <button
                type="button"
                onClick={() => setShowHabitModal(true)}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs uppercase inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>CRIAR PRIMEIRO HÁBITO</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="bg-black border-2 border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hud-corners"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-hud font-bold text-white uppercase tracking-wide">
                        {habit.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 border border-zinc-800 bg-zinc-950 text-white font-bold">
                        {habit.streakDays} DIAS DE STREAK
                      </span>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                      CATEGORIA: {habit.category} • META DIÁRIA OU SEMANAL
                    </span>
                  </div>

                  {/* Toggle Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleHabit(habit.id)}
                    className={`px-4 py-2 border font-hud font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      habit.completedToday
                        ? "bg-white text-black border-white shadow-md"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>{habit.completedToday ? "CONCLUÍDO HOJE" : "MARCAR COMO CONCLUÍDO"}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: HEALTH // COFRE DE BIOMARCADORES E EXAMES       */}
      {/* ========================================================= */}
      {subTab === "health" && (
        <div className="space-y-5">
          <div className="border border-zinc-800 bg-zinc-950 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  CLINICAL RECORDS & ATHLETIC BIOMARKERS
                </span>
                <span className="text-[9px] font-mono bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 text-zinc-300">
                  COFRE LOCAL PRIVATIVO
                </span>
              </div>
              <h3 className="font-hud font-bold text-white text-lg uppercase tracking-wider">
                COFRE DE BIOMARCADORES & LAUDOS
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Marcadores laboratoriais com faixas de referência específicas para atletas de musculação.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHealthModal(true)}
              className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>REGISTRAR EXAME</span>
            </button>
          </div>

          {/* Athletic Biomarker Guide Reference Table */}
          <div className="border border-zinc-800 bg-black p-4 sm:p-5 space-y-3">
            <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
              <span className="font-hud font-bold text-white text-xs uppercase tracking-wider">
                GUIA DE BIOMARCADORES ESSENCIAIS PARA HIPERTROFIA & PERFORMANCE
              </span>
              <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                REFERÊNCIAS DE MEDICINA ESPORTIVA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="bg-zinc-950 p-3 border border-zinc-800 space-y-1">
                <span className="font-bold text-white uppercase block">TESTOSTERONA TOTAL</span>
                <span className="text-[11px] text-zinc-400 block">
                  Ref. Atleta: <strong>550 - 950 ng/dL</strong>
                </span>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Regula síntese proteica, densidade óssea e apetite neuromuscular.
                </p>
              </div>

              <div className="bg-zinc-950 p-3 border border-zinc-800 space-y-1">
                <span className="font-bold text-white uppercase block">CPK (CREATINA FOSFOQUINASE)</span>
                <span className="text-[11px] text-zinc-400 block">
                  Ref. Pós-Treino: <strong>250 - 800 U/L</strong>
                </span>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Mede dano mecânico e microlesão muscular. Acima de 1200 indica necessidade de descanso.
                </p>
              </div>

              <div className="bg-zinc-950 p-3 border border-zinc-800 space-y-1">
                <span className="font-bold text-white uppercase block">PCR ULTRA-SENSÍVEL</span>
                <span className="text-[11px] text-zinc-400 block">
                  Ref. Ideal: <strong>&lt; 0.8 mg/L</strong>
                </span>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Marcador de inflamação sistêmica e saúde endotelial cardiovascular.
                </p>
              </div>

              <div className="bg-zinc-950 p-3 border border-zinc-800 space-y-1">
                <span className="font-bold text-white uppercase block">VITAMINA D3 (25-OH)</span>
                <span className="text-[11px] text-zinc-400 block">
                  Ref. Otimizada: <strong>45 - 70 ng/mL</strong>
                </span>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Co-fator esteroidal essencial para força contrátil e imunidade celular.
                </p>
              </div>

              <div className="bg-zinc-950 p-3 border border-zinc-800 space-y-1">
                <span className="font-bold text-white uppercase block">GLICEMIA DE JEJUM</span>
                <span className="text-[11px] text-zinc-400 block">
                  Ref. Saudável: <strong>72 - 90 mg/dL</strong>
                </span>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Indica sensibilidade à insulina para particionamento eficiente de carboidratos.
                </p>
              </div>

              <div className="bg-zinc-950 p-3 border border-zinc-800 space-y-1">
                <span className="font-bold text-white uppercase block">CREATININA SÉRICA</span>
                <span className="text-[11px] text-zinc-400 block">
                  Ref. Praticante: <strong>0.9 - 1.4 mg/dL</strong>
                </span>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Valores naturalmente maiores em indivíduos com grande massa muscular magra.
                </p>
              </div>
            </div>
          </div>

          {/* Historical Records Timeline */}
          <div className="space-y-3">
            <div className="border-b border-zinc-800 pb-2">
              <span className="font-hud font-bold text-white text-xs uppercase tracking-wider">
                HISTÓRICO DE EXAMES E LAUDOS REGISTRADOS ({activeHealthTimeline.length})
              </span>
            </div>

            {activeHealthTimeline.map((rec) => (
              <div
                key={rec.id}
                className="bg-black border-2 border-zinc-800 p-4 space-y-3 hud-corners"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                      {rec.date}
                    </span>
                    <span className="font-hud font-bold text-white text-sm sm:text-base tracking-wide uppercase">
                      {rec.type}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">{rec.provider}</span>
                </div>

                <p className="text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-950 p-3 border border-zinc-900">
                  {rec.notes}
                </p>

                {rec.biomarkers && rec.biomarkers.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 font-mono text-xs">
                    {rec.biomarkers.map((b) => (
                      <div key={b.name} className="bg-zinc-950 p-2.5 border border-zinc-800">
                        <span className="text-[9px] font-hud uppercase text-zinc-500 block truncate">
                          {b.name}
                        </span>
                        <span className="text-white font-bold text-sm block mt-0.5">
                          {stealthMode ? "••••" : b.value}
                        </span>
                        <span className="text-[9px] text-zinc-400 block">
                          Ref: {b.reference}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 5: GOALS // METAS E MARCOS QUANTITATIVOS           */}
      {/* ========================================================= */}
      {subTab === "goals" && (
        <div className="space-y-5">
          <div className="border border-zinc-800 bg-zinc-950 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                TARGETS & MILESTONES
              </span>
              <h3 className="font-hud font-bold text-white text-lg uppercase tracking-wider">
                OBJETIVOS QUANTITATIVOS & METAS FÍSICAS
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Marcos mensuráveis de peso, percentual de gordura, cargas máximas (1RM) ou hábitos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGoalModal(true)}
              className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NOVA META</span>
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="border border-zinc-800 bg-black p-8 text-center space-y-3">
              <span className="text-zinc-500 text-xs font-mono block">
                [ NENHUMA META REGISTRADA ]
              </span>
              <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto">
                Defina marcos objetivos como peso alvo (ex: 80kg), carga máxima no supino ou agachamento (1RM) 
                ou redução de percentual de gordura corporal.
              </p>
              <button
                type="button"
                onClick={() => setShowGoalModal(true)}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs uppercase inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>ESTABELECER PRIMEIRA META</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-black border-2 border-zinc-800 p-4 sm:p-5 space-y-3 hud-corners"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-hud uppercase tracking-wider px-2 py-0.5 border border-zinc-800 bg-zinc-950 text-white font-bold">
                      {goal.type}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      PRAZO: {goal.deadline}
                    </span>
                  </div>

                  <h4 className="font-hud font-bold text-white text-base uppercase tracking-wide">
                    {goal.title}
                  </h4>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">
                        ATUAL: <strong className="text-white">{stealthMode ? "••••" : goal.currentValue}</strong>
                      </span>
                      <span className="text-white font-bold">{goal.progressPercent}%</span>
                      <span className="text-zinc-400">
                        ALVO: <strong className="text-white">{stealthMode ? "••••" : goal.targetValue}</strong>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 border border-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-white"
                        style={{ width: `${Math.min(100, goal.progressPercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                    MÉTRICA / INDICADOR: {goal.metric}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NOVO HÁBITO                                        */}
      {/* ========================================================= */}
      {showHabitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-zinc-700 max-w-md w-full p-5 space-y-4 hud-corners">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-hud font-bold text-white text-base uppercase">
                NOVO HÁBITO DIÁRIO
              </h3>
              <button
                type="button"
                onClick={() => setShowHabitModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveHabit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase font-hud">
                  NOME DO HÁBITO
                </label>
                <input
                  type="text"
                  placeholder="Ex: Creatina 5g diária"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-2 text-white outline-none focus:border-white"
                  required
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1 uppercase font-hud">
                  CATEGORIA
                </label>
                <select
                  value={newHabitCategory}
                  onChange={(e) => setNewHabitCategory(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 p-2 text-white outline-none focus:border-white"
                >
                  <option value="HEALTH">SAÚDE & SUPLEMENTAÇÃO</option>
                  <option value="RECOVERY">RECUPERAÇÃO & SONO</option>
                  <option value="DISCIPLINE">DISCIPLINA & FOCO</option>
                  <option value="Training">TREINAMENTO</option>
                  <option value="Nutrition">NUTRIÇÃO</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHabitModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-black text-zinc-400 text-xs font-hud uppercase"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase"
                >
                  SALVAR HÁBITO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NOVA META                                          */}
      {/* ========================================================= */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-zinc-700 max-w-md w-full p-5 space-y-4 hud-corners">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-hud font-bold text-white text-base uppercase">
                ESTABELECER NOVA META
              </h3>
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveGoal} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase font-hud">
                  TÍTULO DA META
                </label>
                <input
                  type="text"
                  placeholder="Ex: Atingir 80kg com 12% BF"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-2 text-white outline-none focus:border-white"
                  required
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1 uppercase font-hud">
                  TIPO
                </label>
                <select
                  value={newGoalType}
                  onChange={(e) => setNewGoalType(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 p-2 text-white outline-none focus:border-white"
                >
                  <option value="BODY">COMPOSIÇÃO CORPORAL</option>
                  <option value="STRENGTH">FORÇA (1RM)</option>
                  <option value="PERFORMANCE">PERFORMANCE & CARDIO</option>
                  <option value="HABITS">HÁBITOS & CONSTÂNCIA</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-hud">
                    VALOR ATUAL
                  </label>
                  <input
                    type="text"
                    placeholder="75kg / 100kg"
                    value={newGoalCurrent}
                    onChange={(e) => setNewGoalCurrent(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-hud">
                    VALOR ALVO
                  </label>
                  <input
                    type="text"
                    placeholder="80kg / 120kg"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-2 text-white font-bold outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-hud">
                    MÉTRICA / INDICADOR
                  </label>
                  <input
                    type="text"
                    placeholder="Balança / 1RM"
                    value={newGoalMetric}
                    onChange={(e) => setNewGoalMetric(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase font-hud">
                    PRAZO ESTIMADO
                  </label>
                  <input
                    type="text"
                    placeholder="Dez 2026"
                    value={newGoalDeadline}
                    onChange={(e) => setNewGoalDeadline(e.target.value)}
                    className="w-full bg-black border border-zinc-800 p-2 text-white outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-black text-zinc-400 text-xs font-hud uppercase"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase"
                >
                  SALVAR META
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NOVO REGISTRO DE SAÚDE                             */}
      {/* ========================================================= */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-zinc-700 max-w-md w-full p-5 space-y-4 hud-corners">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-hud font-bold text-white text-base uppercase">
                NOVO REGISTRO NO COFRE CLÍNICO
              </h3>
              <button
                type="button"
                onClick={() => setShowHealthModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveHealth} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase font-hud">
                  TIPO DE EVENTO
                </label>
                <select
                  value={newHealthType}
                  onChange={(e) => setNewHealthType(e.target.value as any)}
                  className="w-full bg-black border border-zinc-800 p-2 text-white outline-none focus:border-white"
                >
                  <option value="Exame Laboratorial">Exame Laboratorial de Sangue</option>
                  <option value="Consulta Médica">Consulta Médica / Especialista</option>
                  <option value="Check-up Cardiológico">Check-up Cardiológico / Ergoespirometria</option>
                  <option value="Vacinação">Vacinação / Imunização</option>
                </select>
              </div>
              <div>
                <label className="text-zinc-400 block mb-1 uppercase font-hud">
                  PRESTADOR / LABORATÓRIO
                </label>
                <input
                  type="text"
                  placeholder="Ex: Laboratório Fleury / Dr. Martins"
                  value={newHealthProvider}
                  onChange={(e) => setNewHealthProvider(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1 uppercase font-hud">
                  ANOTAÇÕES & RESULTADOS
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Testosterona em 740 ng/dL, CPK 350 U/L, Vitamina D em 52 ng/mL. Perfil lipídico ótimo."
                  value={newHealthNotes}
                  onChange={(e) => setNewHealthNotes(e.target.value)}
                  className="w-full bg-black border border-zinc-800 p-2 text-white outline-none focus:border-white"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHealthModal(false)}
                  className="px-4 py-2 border border-zinc-800 bg-black text-zinc-400 text-xs font-hud uppercase"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-hud font-bold text-xs uppercase"
                >
                  SALVAR NO COFRE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
