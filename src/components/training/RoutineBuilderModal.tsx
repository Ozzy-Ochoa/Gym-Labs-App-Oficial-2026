import React, { useState } from "react";
import { UserWorkoutRoutine, RoutineExerciseItem, RoutineScaleType } from "../../types";
import {
  MASTER_EXERCISE_CATALOG,
  EXERCISE_CATEGORIES,
  EXERCISE_MODALITIES,
  ExerciseModality,
  CatalogExercise,
} from "../../data/exerciseCatalog";
import { SCALE_SLOTS_MAP } from "../../data/defaultRoutines";
import {
  X,
  Plus,
  Trash2,
  Search,
  Check,
  ChevronUp,
  ChevronDown,
  Dumbbell,
  SlidersHorizontal,
  Sparkles,
  Flame,
} from "lucide-react";

interface RoutineBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRoutine: (routine: UserWorkoutRoutine) => void;
  editingRoutine?: UserWorkoutRoutine | null;
  currentScaleType: RoutineScaleType;
}

export const RoutineBuilderModal: React.FC<RoutineBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaveRoutine,
  editingRoutine,
  currentScaleType,
}) => {
  const [routineName, setRoutineName] = useState(() => editingRoutine?.name || "");
  const [routineFocus, setRoutineFocus] = useState(() => editingRoutine?.focus || "");
  const [scaleSlot, setScaleSlot] = useState(() => {
    if (editingRoutine?.scaleSlot) return editingRoutine.scaleSlot;
    return SCALE_SLOTS_MAP[currentScaleType][0] || "Treino A";
  });
  const [scaleType, setScaleType] = useState<RoutineScaleType>(() => editingRoutine?.scaleType || currentScaleType);
  const [exercises, setExercises] = useState<RoutineExerciseItem[]>(() => {
    if (editingRoutine?.exercises) return [...editingRoutine.exercises];
    return [];
  });

  // Catalog picker state
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [selectedModality, setSelectedModality] = useState<string>("Todas");

  // Custom exercise manual addition
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseMuscle, setCustomExerciseMuscle] = useState("Peitoral");

  if (!isOpen) return null;

  const availableSlots = SCALE_SLOTS_MAP[scaleType] || SCALE_SLOTS_MAP.letters;

  const filteredCatalog = MASTER_EXERCISE_CATALOG.filter((ex) => {
    const matchesCat = selectedCategory === "Todos" || ex.category === selectedCategory;
    const matchesModality =
      selectedModality === "Todas" ||
      (selectedModality === "Outras" && !ex.modality) ||
      ex.modality === selectedModality;
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.equipment && ex.equipment.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesModality && matchesSearch;
  });

  const handleAddFromCatalog = (ex: CatalogExercise) => {
    const newItem: RoutineExerciseItem = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      sets: ex.defaultSets,
      reps: ex.defaultReps,
      suggestedWeightKg: ex.defaultWeightKg,
    };
    setExercises((prev) => [...prev, newItem]);
  };

  const handleAddCustomManual = () => {
    if (!customExerciseName.trim()) return;
    const newItem: RoutineExerciseItem = {
      id: `ex_c_${Date.now()}`,
      name: customExerciseName.trim(),
      muscleGroup: customExerciseMuscle,
      equipment: "Livre / Máquina",
      sets: 3,
      reps: "10-12",
      suggestedWeightKg: 20,
    };
    setExercises((prev) => [...prev, newItem]);
    setCustomExerciseName("");
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveExercise = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === exercises.length - 1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setExercises((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleUpdateExercise = (
    index: number,
    field: keyof RoutineExerciseItem,
    value: any
  ) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim() || exercises.length === 0) {
      alert("Por favor, informe o nome do treino e adicione ao menos 1 exercício.");
      return;
    }

    const savedRoutine: UserWorkoutRoutine = {
      id: editingRoutine?.id || `routine_${Date.now()}`,
      name: routineName.trim(),
      focus: routineFocus.trim() || `${exercises.map((e) => e.muscleGroup).slice(0, 3).join(", ")}`,
      scaleType,
      scaleSlot,
      category: "Hypertrophy",
      estimatedMinutes: Math.max(30, exercises.length * 8 + 10),
      exercises,
      isSuggested: false,
    };

    onSaveRoutine(savedRoutine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-none shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-black">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-zinc-700 bg-zinc-900 flex items-center justify-center text-white">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                CONFIGURADOR DE ROTINA // GYM LABS
              </span>
              <h2 className="text-base sm:text-lg font-hud font-bold text-white tracking-wider">
                {editingRoutine ? "EDITAR FICHA DE TREINO" : "MONTAR NOVO TREINO"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Routine Information Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-zinc-800 bg-black p-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                Nome da Ficha / Treino
              </label>
              <input
                type="text"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="Ex: Treino A // Peito, Ombros e Tríceps"
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-white transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                Posição na Escala
              </label>
              <select
                value={scaleSlot}
                onChange={(e) => setScaleSlot(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-white transition-colors"
              >
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                Foco Muscular / Observações
              </label>
              <input
                type="text"
                value={routineFocus}
                onChange={(e) => setRoutineFocus(e.target.value)}
                placeholder="Ex: Ênfase em porção clavicular de peitoral e deltoide lateral"
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-xs font-mono focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          {/* Exercise List & Addition Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-hud font-bold text-white uppercase tracking-wider">
                  EXERCÍCIOS DA ROTINA ({exercises.length})
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  • {exercises.reduce((acc, e) => acc + (Number(e.sets) || 0), 0)} SÉRIES TOTAIS
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    isCatalogOpen
                      ? "bg-white text-black"
                      : "border border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCatalogOpen ? "FECHAR CATÁLOGO" : "+ ADICIONAR EXERCÍCIOS"}</span>
                </button>
              </div>
            </div>

            {/* Catalog Selector Drawer / Box */}
            {isCatalogOpen && (
              <div className="border border-zinc-700 bg-zinc-900/90 p-4 space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nome do exercício ou músculo..."
                      className="w-full bg-black border border-zinc-700 pl-9 pr-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  {/* Muscle Filter Scrollable */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono">
                    {EXERCISE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 whitespace-nowrap transition-colors ${
                          selectedCategory === cat
                            ? "bg-white text-black font-bold"
                            : "bg-black text-zinc-400 hover:text-white border border-zinc-800"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modality Filter Pills (Academia vs Peso Corporal/Casa vs Resistência/Elásticos vs Cardio) */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono border-t border-zinc-800 pt-2">
                  <span className="text-zinc-500 uppercase tracking-widest mr-1">MODALIDADE:</span>
                  {["Todas", ...EXERCISE_MODALITIES].map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setSelectedModality(mod)}
                      className={`px-2 py-0.5 whitespace-nowrap transition-colors border ${
                        selectedModality === mod
                          ? "bg-zinc-200 text-black border-white font-bold"
                          : "bg-black text-zinc-400 border-zinc-800 hover:text-white"
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredCatalog.map((item) => {
                    const alreadyAdded = exercises.some((e) => e.name === item.name);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddFromCatalog(item)}
                        className={`p-2.5 text-left border flex items-center justify-between gap-2 transition-all ${
                          alreadyAdded
                            ? "bg-zinc-950 border-zinc-700 text-zinc-300"
                            : "bg-black border-zinc-800 text-zinc-300 hover:border-white hover:text-white"
                        }`}
                      >
                        <div className="truncate">
                          <span className="text-xs font-mono font-bold block truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 block truncate">
                            {item.muscleGroup} • {item.equipment}
                          </span>
                          {item.modality && (
                            <span className="text-[9px] font-mono text-zinc-500 block truncate">
                              [{item.modality.toUpperCase()}]
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center justify-center w-6 h-6 border border-zinc-700 bg-zinc-900 text-xs">
                          {alreadyAdded ? <Check className="w-3.5 h-3.5 text-zinc-300" /> : <Plus className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Manual Custom Exercise Input */}
                <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-500 text-[10px] uppercase whitespace-nowrap">
                    OU ADICIONE MANUAL:
                  </span>
                  <input
                    type="text"
                    value={customExerciseName}
                    onChange={(e) => setCustomExerciseName(e.target.value)}
                    placeholder="Nome de exercício personalizado..."
                    className="flex-1 bg-black border border-zinc-700 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-white"
                  />
                  <select
                    value={customExerciseMuscle}
                    onChange={(e) => setCustomExerciseMuscle(e.target.value)}
                    className="bg-black border border-zinc-700 px-2 py-1 text-xs text-white"
                  >
                    <option value="Peitoral">Peitoral</option>
                    <option value="Costas">Costas</option>
                    <option value="Quadríceps">Quadríceps</option>
                    <option value="Posterior">Posterior</option>
                    <option value="Glúteos">Glúteos</option>
                    <option value="Ombros">Ombros</option>
                    <option value="Bíceps">Bíceps</option>
                    <option value="Tríceps">Tríceps</option>
                    <option value="Panturrilhas">Panturrilhas</option>
                    <option value="Abdômen">Abdômen</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustomManual}
                    className="px-3 py-1 bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-600 uppercase text-[10px] font-bold"
                  >
                    + ADICIONAR
                  </button>
                </div>
              </div>
            )}

            {/* Configured Exercises Table */}
            {exercises.length === 0 ? (
              <div className="border border-dashed border-zinc-800 bg-black/40 p-8 text-center space-y-2">
                <span className="text-xs font-mono text-zinc-500 block">
                  [ NENHUM EXERCÍCIO ADICIONADO A ESTA FICHA ]
                </span>
                <p className="text-xs font-mono text-zinc-400 max-w-sm mx-auto">
                  Clique em "+ Adicionar Exercícios" acima para selecionar exercícios do catálogo por grupo muscular.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {exercises.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="border border-zinc-800 bg-black p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:border-zinc-600 transition-colors"
                  >
                    {/* Exercise Info & Order */}
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveExercise(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 text-zinc-500 hover:text-white disabled:opacity-20"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveExercise(idx, "down")}
                          disabled={idx === exercises.length - 1}
                          className="p-1 text-zinc-500 hover:text-white disabled:opacity-20"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-6 h-6 border border-zinc-800 bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      <div>
                        <span className="text-sm font-hud font-bold text-white block">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {item.muscleGroup} • {item.equipment || "Livre"}
                        </span>
                      </div>
                    </div>

                    {/* Sets, Reps & Weight Parameters */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-[10px] text-zinc-500 uppercase">Séries:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={item.sets}
                          onChange={(e) =>
                            handleUpdateExercise(idx, "sets", parseInt(e.target.value) || 1)
                          }
                          className="w-12 bg-zinc-900 border border-zinc-700 text-center py-1 text-xs text-white focus:outline-none focus:border-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-[10px] text-zinc-500 uppercase">Reps:</span>
                        <input
                          type="text"
                          value={item.reps}
                          onChange={(e) => handleUpdateExercise(idx, "reps", e.target.value)}
                          placeholder="8-10"
                          className="w-16 bg-zinc-900 border border-zinc-700 text-center py-1 text-xs text-white focus:outline-none focus:border-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-[10px] text-zinc-500 uppercase">Carga Sug:</span>
                        <div className="flex items-center bg-zinc-900 border border-zinc-700">
                          <input
                            type="number"
                            min="0"
                            step="2.5"
                            value={item.suggestedWeightKg}
                            onChange={(e) =>
                              handleUpdateExercise(
                                idx,
                                "suggestedWeightKg",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-14 bg-transparent text-center py-1 text-xs text-white focus:outline-none"
                          />
                          <span className="text-[9px] text-zinc-500 pr-1.5">KG</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(idx)}
                        className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
                        title="Remover exercício"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-black flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:text-white font-mono text-xs uppercase"
          >
            CANCELAR
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>SALVAR FICHA DE TREINO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
