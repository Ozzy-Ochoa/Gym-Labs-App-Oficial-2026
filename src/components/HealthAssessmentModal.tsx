import React, { useState } from "react";
import {
  HealthQuestionnaireData,
  calculateSuggestedPlans,
  WORKOUT_TEMPLATES,
  PRESET_SAVED_DISHES,
} from "../data/healthEngineData";
import { UserProfile, NutritionPlan, WorkoutSession } from "../types";
import { X, Sparkles, Check, Dumbbell, Utensils, Target, ArrowRight } from "lucide-react";

interface HealthAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  currentNutrition: NutritionPlan;
  onApplyPlans: (
    newNutritionGoals: {
      caloriesTarget: number;
      proteinTargetG: number;
      carbsTargetG: number;
      fatTargetG: number;
      waterTargetMl: number;
    },
    suggestedWorkouts: WorkoutSession[]
  ) => void;
}

export const HealthAssessmentModal: React.FC<HealthAssessmentModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  currentNutrition,
  onApplyPlans,
}) => {
  const [goal, setGoal] = useState<HealthQuestionnaireData["primaryGoal"]>("recomposition");
  const [mealsCount, setMealsCount] = useState<number>(4);
  const [dietaryPref, setDietaryPref] = useState<HealthQuestionnaireData["dietaryPreference"]>("all");
  const [daysAvailable, setDaysAvailable] = useState<number>(4);
  const [equipment, setEquipment] = useState<HealthQuestionnaireData["equipment"]>("gym");
  const [experience, setExperience] = useState<HealthQuestionnaireData["experienceLevel"]>("intermediate");

  const [step, setStep] = useState<"questions" | "preview">("questions");

  if (!isOpen) return null;

  // Calculate recommendation preview
  const recommendation = calculateSuggestedPlans(
    {
      primaryGoal: goal,
      mealsPerDay: mealsCount,
      dietaryPreference: dietaryPref,
      daysAvailable,
      equipment,
      experienceLevel: experience,
    },
    {
      weightKg: userProfile.weightKg || 75,
      heightCm: userProfile.heightCm || 175,
      age: userProfile.age || 28,
      gender: userProfile.gender || "male",
    }
  );

  const matchedTemplates = WORKOUT_TEMPLATES.filter((t) =>
    recommendation.recommendedWorkoutIds.includes(t.id)
  );

  const handleConfirmAndApply = () => {
    // Generate workout sessions from templates
    const sessions: WorkoutSession[] = matchedTemplates.map((template, idx) => ({
      id: `w_suggested_${Date.now()}_${idx}`,
      name: template.name,
      category: template.category,
      status: "completed",
      date: new Date(Date.now() - idx * 86400000).toISOString().split("T")[0],
      durationMinutes: template.estimatedMinutes,
      totalVolumeKg: template.exercises.reduce(
        (sum, ex) => sum + ex.sets * 10 * (ex.suggestedWeightKg || 20),
        0
      ),
      avgRpe: 8,
      exercises: template.exercises.map((ex, exIdx) => ({
        id: `ex_${Date.now()}_${exIdx}`,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        personalRecordKg: ex.suggestedWeightKg || 20,
        sets: Array.from({ length: ex.sets }).map((_, sIdx) => ({
          setNumber: sIdx + 1,
          reps: 10,
          weightKg: ex.suggestedWeightKg || 20,
          rpe: 8,
          completed: true,
        })),
      })),
    }));

    onApplyPlans(
      {
        caloriesTarget: recommendation.targetCalories,
        proteinTargetG: recommendation.targetProteinG,
        carbsTargetG: recommendation.targetCarbsG,
        fatTargetG: recommendation.targetFatG,
        waterTargetMl: recommendation.targetWaterMl,
      },
      sessions
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b0c0e] border border-zinc-800 w-full max-w-2xl my-auto text-zinc-100 p-5 sm:p-6 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
              GYM LABS // DIAGNÓSTICO E SUGESTÃO INTELIGENTE
            </span>
            <h2 className="text-lg sm:text-xl font-bold font-hud tracking-wide text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-zinc-300" />
              AVALIAÇÃO NUTRICIONAL & DE TREINOS
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Responda apenas o que souber. O Gym Labs monta seu plano e sugestões automáticas para você gerenciar com autonomia.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 border border-zinc-800 hover:border-zinc-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "questions" ? (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* 1. Objetivo Principal */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                1. Qual é o seu objetivo prioritário no momento?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "recomposition", label: "Recomposição", desc: "Perder gordura & ganhar massa" },
                  { id: "fat_loss", label: "Emagrecimento", desc: "Déficit e queima de gordura" },
                  { id: "hypertrophy", label: "Hipertrofia", desc: "Ganho de volume e força" },
                  { id: "conditioning", label: "Saúde & Fôlego", desc: "Manutenção e vitalidade" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoal(item.id as any)}
                    className={`p-2.5 border text-left flex flex-col justify-between transition-all ${
                      goal === item.id
                        ? "bg-zinc-800 border-white text-white font-bold"
                        : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-xs font-hud uppercase">{item.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500 mt-1">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Refeições por Dia */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                2. Quantas refeições você costuma ou prefere fazer ao dia?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 3, label: "3 Refeições", desc: "Café, Almoço, Jantar" },
                  { count: 4, label: "4 Refeições (Recomendado)", desc: "Café, Almoço, Lanche, Jantar" },
                  { count: 5, label: "5 Refeições", desc: "Fracionamento frequente" },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setMealsCount(item.count)}
                    className={`p-2.5 border text-left transition-all ${
                      mealsCount === item.count
                        ? "bg-zinc-800 border-white text-white font-bold"
                        : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-xs font-hud block">{item.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Preferência ou Restrição Alimentar */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                3. Alguma preferência ou restrição na alimentação?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "all", label: "Como de Tudo", desc: "Cardápio aberto e flexível" },
                  { id: "economical", label: "Acessível / Prático", desc: "Foco em ovos, frango, arroz e feijão" },
                  { id: "no_lactose", label: "Sem Lactose", desc: "Substitutos vegetais ou zero lactose" },
                  { id: "no_gluten", label: "Sem Glúten", desc: "Arroz, batata doce, mandioca, etc." },
                  { id: "vegetarian", label: "Vegetariano", desc: "Ovos, queijos, leguminosas e soja" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDietaryPref(item.id as any)}
                    className={`p-2 border text-left transition-all ${
                      dietaryPref === item.id
                        ? "bg-zinc-800 border-white text-white font-bold"
                        : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-xs font-hud block">{item.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Dias Disponíveis para Treino */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                4. Quantos dias na semana você consegue treinar?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { days: 2, label: "2 Dias", desc: "Full Body A/B" },
                  { days: 3, label: "3 Dias", desc: "Full Body A/B/C" },
                  { days: 4, label: "4 Dias", desc: "Superior / Inferior" },
                  { days: 5, label: "5 a 6 Dias", desc: "Push / Pull / Legs" },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setDaysAvailable(item.days)}
                    className={`p-2 border text-left transition-all ${
                      daysAvailable === item.days
                        ? "bg-zinc-800 border-white text-white font-bold"
                        : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-xs font-hud block">{item.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Local & Equipamento */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                5. Onde você treina e quais equipamentos tem acesso?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "gym", label: "Academia Completa", desc: "Aparelhos, polias e barras livres" },
                  { id: "home_dumbbells", label: "Em Casa com Halteres", desc: "Halteres, banco ou elásticos" },
                  { id: "bodyweight", label: "Peso do Corpo (Calistenia)", desc: "Flexões, agachamentos e barra" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEquipment(item.id as any)}
                    className={`p-2 border text-left transition-all ${
                      equipment === item.id
                        ? "bg-zinc-800 border-white text-white font-bold"
                        : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-xs font-hud block">{item.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Experiência */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                6. Qual o seu nível de experiência prática com treinos?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "beginner", label: "Iniciante", desc: "Menos de 6 meses" },
                  { id: "intermediate", label: "Intermediário", desc: "6 meses a 2 anos contínuos" },
                  { id: "advanced", label: "Avançado", desc: "Mais de 2 anos de rotina" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setExperience(item.id as any)}
                    className={`p-2 border text-left transition-all ${
                      experience === item.id
                        ? "bg-zinc-800 border-white text-white font-bold"
                        : "bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <span className="text-xs font-hud block">{item.label}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Preview of Generated Plans */
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Utensils className="w-4 h-4 text-white" />
                <span className="font-bold text-white uppercase">PLANO NUTRICIONAL CALCULADO</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
                <div className="bg-black border border-zinc-800 p-2">
                  <span className="text-[10px] text-zinc-500 block">CALORIAS</span>
                  <span className="text-lg font-bold text-white">{recommendation.targetCalories}</span>
                  <span className="text-[10px] text-zinc-500 block">kcal/dia</span>
                </div>
                <div className="bg-black border border-zinc-800 p-2">
                  <span className="text-[10px] text-zinc-500 block">PROTEÍNA</span>
                  <span className="text-lg font-bold text-white">{recommendation.targetProteinG}g</span>
                  <span className="text-[10px] text-zinc-500 block">meta diária</span>
                </div>
                <div className="bg-black border border-zinc-800 p-2">
                  <span className="text-[10px] text-zinc-500 block">CARBOIDRATOS</span>
                  <span className="text-lg font-bold text-white">{recommendation.targetCarbsG}g</span>
                  <span className="text-[10px] text-zinc-500 block">energia</span>
                </div>
                <div className="bg-black border border-zinc-800 p-2">
                  <span className="text-[10px] text-zinc-500 block">GORDURAS</span>
                  <span className="text-lg font-bold text-white">{recommendation.targetFatG}g</span>
                  <span className="text-[10px] text-zinc-500 block">hormônios</span>
                </div>
                <div className="bg-black border border-zinc-800 p-2 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-zinc-500 block">ÁGUA</span>
                  <span className="text-lg font-bold text-white">{recommendation.targetWaterMl}</span>
                  <span className="text-[10px] text-zinc-500 block">ml/dia</span>
                </div>
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Distribuído em {mealsCount} refeições ao dia. Você poderá usar o montador rápido de pratos com alimentos comuns sem ter que ficar contando tabelas nutricionais na mão.
              </p>
            </div>

            <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Dumbbell className="w-4 h-4 text-white" />
                <span className="font-bold text-white uppercase">
                  DIVISÃO DE TREINOS SUGERIDA ({matchedTemplates.length} ROTINAS)
                </span>
              </div>
              <div className="space-y-2">
                {matchedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-black border border-zinc-800 p-2.5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-hud font-bold text-white block">{template.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {template.focus} • {template.exercises.length} exercícios
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-zinc-300">
                      ~{template.estimatedMinutes} MIN
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                No dia a dia, você pode concluir a sessão inteira com 1 único clique, sem precisar registrar série por série manualmente se não quiser.
              </p>
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800 pt-4 font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            CANCELAR / FECHAR
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {step === "questions" ? (
              <button
                type="button"
                onClick={() => setStep("preview")}
                className="w-full sm:w-auto px-5 py-2.5 bg-white text-black font-hud font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
              >
                <span>VISUALIZAR PLANOS SUGERIDOS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep("questions")}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:text-white"
                >
                  VOLTAR
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndApply}
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-white text-black font-hud font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                >
                  <Check className="w-4 h-4" />
                  APLICAR ESTES PLANOS AO MEU SISTEMA
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
