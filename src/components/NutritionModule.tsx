import React, { useState, useEffect } from "react";
import { NutritionLog, MealItem } from "../types";
import {
  COMMON_FOOD_DATABASE,
  FoodItemData,
  PRESET_SAVED_DISHES,
  SavedDish,
} from "../data/healthEngineData";
import {
  Droplets,
  Utensils,
  Plus,
  Check,
  Sparkles,
  Bookmark,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Clock,
  Search,
} from "lucide-react";

interface NutritionModuleProps {
  nutrition: NutritionLog;
  onAddWater: (amountMl: number) => void;
  onAddMeal: (meal: MealItem) => void;
  onOpenAssessment?: () => void;
  onUpdateNutritionGoals?: (goals: {
    caloriesTarget: number;
    proteinTargetG: number;
    carbsTargetG: number;
    fatTargetG: number;
    waterTargetMl: number;
  }) => void;
  onRemoveMeal?: (mealId: string) => void;
}

export const NutritionModule: React.FC<NutritionModuleProps> = ({
  nutrition,
  onAddWater,
  onAddMeal,
  onOpenAssessment,
  onUpdateNutritionGoals,
  onRemoveMeal,
}) => {
  const [activeTab, setActiveTab] = useState<"timeline" | "dish_builder" | "saved_dishes">("timeline");

  // Dish Builder State
  const [dishName, setDishName] = useState("");
  const [targetMealSlot, setTargetMealSlot] = useState<"Café da Manhã" | "Almoço" | "Lanche da Tarde" | "Jantar">("Almoço");
  const [selectedIngredients, setSelectedIngredients] = useState<
    { food: FoodItemData; portionMultiplier: number }[]
  >([]);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // User saved dishes (persisted in localStorage)
  const [userSavedDishes, setUserSavedDishes] = useState<SavedDish[]>(() => {
    try {
      const stored = localStorage.getItem("gymlabs_saved_dishes");
      if (stored) return JSON.parse(stored);
    } catch {}
    return PRESET_SAVED_DISHES;
  });

  useEffect(() => {
    try {
      localStorage.setItem("gymlabs_saved_dishes", JSON.stringify(userSavedDishes));
    } catch {}
  }, [userSavedDishes]);

  // Adjust goals modal
  const [showAdjustGoals, setShowAdjustGoals] = useState(false);
  const [goalCalories, setGoalCalories] = useState(nutrition.caloriesTarget.toString());
  const [goalProtein, setGoalProtein] = useState(nutrition.proteinTargetG.toString());
  const [goalCarbs, setGoalCarbs] = useState(nutrition.carbsTargetG.toString());
  const [goalFat, setGoalFat] = useState(nutrition.fatTargetG.toString());
  const [goalWater, setGoalWater] = useState(nutrition.waterTargetMl.toString());

  // Quick custom meal modal
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickMealName, setQuickMealName] = useState("");
  const [quickMealCalories, setQuickMealCalories] = useState("450");
  const [quickMealProtein, setQuickMealProtein] = useState("35");
  const [quickMealCarbs, setQuickMealCarbs] = useState("45");
  const [quickMealFat, setQuickMealFat] = useState("10");

  // Macro percentages
  const caloriesPercent = Math.min(
    100,
    Math.round((nutrition.caloriesCurrent / (nutrition.caloriesTarget || 2000)) * 100)
  );
  const proteinPercent = Math.min(
    100,
    Math.round((nutrition.proteinCurrentG / (nutrition.proteinTargetG || 140)) * 100)
  );
  const carbsPercent = Math.min(
    100,
    Math.round((nutrition.carbsCurrentG / (nutrition.carbsTargetG || 200)) * 100)
  );
  const fatPercent = Math.min(
    100,
    Math.round((nutrition.fatCurrentG / (nutrition.fatTargetG || 60)) * 100)
  );
  const waterPercent = Math.min(
    100,
    Math.round((nutrition.waterCurrentMl / (nutrition.waterTargetMl || 3000)) * 100)
  );

  // Filter food catalog
  const filteredFoods = COMMON_FOOD_DATABASE.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(foodSearchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate live totals for the dish builder
  const dishTotals = selectedIngredients.reduce(
    (acc, curr) => ({
      calories: acc.calories + Math.round(curr.food.calories * curr.portionMultiplier),
      proteinG: Number((acc.proteinG + curr.food.proteinG * curr.portionMultiplier).toFixed(1)),
      carbsG: Number((acc.carbsG + curr.food.carbsG * curr.portionMultiplier).toFixed(1)),
      fatG: Number((acc.fatG + curr.food.fatG * curr.portionMultiplier).toFixed(1)),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const handleAddIngredientToDish = (food: FoodItemData) => {
    setSelectedIngredients((prev) => {
      const existing = prev.find((item) => item.food.id === food.id);
      if (existing) {
        return prev.map((item) =>
          item.food.id === food.id
            ? { ...item, portionMultiplier: Number((item.portionMultiplier + 1).toFixed(1)) }
            : item
        );
      }
      return [...prev, { food, portionMultiplier: 1 }];
    });
  };

  const handleUpdatePortion = (foodId: string, delta: number) => {
    setSelectedIngredients((prev) =>
      prev
        .map((item) => {
          if (item.food.id === foodId) {
            const nextVal = Number((item.portionMultiplier + delta).toFixed(1));
            return nextVal > 0 ? { ...item, portionMultiplier: nextVal } : null;
          }
          return item;
        })
        .filter(Boolean) as { food: FoodItemData; portionMultiplier: number }[]
    );
  };

  const handleRemoveIngredient = (foodId: string) => {
    setSelectedIngredients((prev) => prev.filter((item) => item.food.id !== foodId));
  };

  // Log built dish into today's timeline
  const handleLogBuiltDish = () => {
    if (selectedIngredients.length === 0) return;

    const name = dishName.trim() || `${targetMealSlot} (${selectedIngredients.map((i) => i.food.name.split(" ")[0]).join(", ")})`;
    const meal: MealItem = {
      id: `m_${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      name,
      calories: dishTotals.calories,
      proteinG: dishTotals.proteinG,
      carbsG: dishTotals.carbsG,
      fatG: dishTotals.fatG,
      items: selectedIngredients.map(
        (i) => `${i.food.name} (${i.portionMultiplier}x ${i.food.defaultPortionLabel})`
      ),
    };

    onAddMeal(meal);
    setSelectedIngredients([]);
    setDishName("");
    setActiveTab("timeline");
  };

  // Save built dish as reusable template
  const handleSaveDishTemplate = () => {
    if (selectedIngredients.length === 0) return;

    const name = dishName.trim() || `Meu Prato Personalizado (${new Date().toLocaleDateString()})`;
    const newDish: SavedDish = {
      id: `dish_${Date.now()}`,
      name,
      totalCalories: dishTotals.calories,
      totalProteinG: dishTotals.proteinG,
      totalCarbsG: dishTotals.carbsG,
      totalFatG: dishTotals.fatG,
      items: selectedIngredients.map((i) => ({
        foodId: i.food.id,
        foodName: i.food.name,
        portionQty: i.portionMultiplier,
        portionLabel: i.food.defaultPortionLabel,
        calories: Math.round(i.food.calories * i.portionMultiplier),
        proteinG: Number((i.food.proteinG * i.portionMultiplier).toFixed(1)),
        carbsG: Number((i.food.carbsG * i.portionMultiplier).toFixed(1)),
        fatG: Number((i.food.fatG * i.portionMultiplier).toFixed(1)),
      })),
    };

    setUserSavedDishes((prev) => [newDish, ...prev]);
    alert(`Prato "${name}" salvo com sucesso na sua biblioteca de pratos!`);
  };

  // Log a saved dish directly to today with 1 click
  const handleLogSavedDish = (dish: SavedDish) => {
    const meal: MealItem = {
      id: `m_${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      name: dish.name,
      calories: dish.totalCalories,
      proteinG: dish.totalProteinG,
      carbsG: dish.totalCarbsG,
      fatG: dish.totalFatG,
      items: dish.items.map((i) => `${i.foodName} (${i.portionQty}x)`),
    };

    onAddMeal(meal);
    setActiveTab("timeline");
  };

  const handleDeleteSavedDish = (dishId: string) => {
    setUserSavedDishes((prev) => prev.filter((d) => d.id !== dishId));
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateNutritionGoals) {
      onUpdateNutritionGoals({
        caloriesTarget: Number(goalCalories) || 2000,
        proteinTargetG: Number(goalProtein) || 140,
        carbsTargetG: Number(goalCarbs) || 200,
        fatTargetG: Number(goalFat) || 60,
        waterTargetMl: Number(goalWater) || 3000,
      });
    }
    setShowAdjustGoals(false);
  };

  const handleSaveQuickMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMealName.trim()) return;

    onAddMeal({
      id: `m_${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      name: quickMealName.trim(),
      calories: Number(quickMealCalories) || 0,
      proteinG: Number(quickMealProtein) || 0,
      carbsG: Number(quickMealCarbs) || 0,
      fatG: Number(quickMealFat) || 0,
      items: [quickMealName.trim()],
    });

    setQuickMealName("");
    setShowQuickAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Assessment Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
            GYM LABS // NUTRIÇÃO & SISTEMA DE REFEIÇÕES
          </span>
          <h2 className="font-hud font-bold text-xl sm:text-2xl text-white tracking-wider">
            NUTRITION & MACROS LAB
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Monte refeições e pratos sem precisar caçar tabelas nutricionais na mão. O sistema calcula automaticamente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenAssessment && (
            <button
              onClick={onOpenAssessment}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              AVALIAÇÃO & SUGESTÃO INTELIGENTE
            </button>
          )}

          <button
            onClick={() => setShowAdjustGoals(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 bg-black hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-mono transition-colors"
            title="Ajustar metas calóricas e de macros"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            METAS
          </button>
        </div>
      </div>

      {/* Primary Energy & Macros Overview (Strictly Monochromatic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Calories Card */}
        <div className="bg-black border border-zinc-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">ENERGIA DIÁRIA</span>
            <span className="text-white font-bold">{caloriesPercent}%</span>
          </div>
          <div className="my-3">
            <span className="font-mono text-3xl font-extrabold text-white">
              {nutrition.caloriesCurrent}
            </span>
            <span className="font-mono text-xs text-zinc-500 ml-1.5">
              / {nutrition.caloriesTarget} kcal
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${caloriesPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-2 block">
            {nutrition.caloriesTarget - nutrition.caloriesCurrent > 0
              ? `${nutrition.caloriesTarget - nutrition.caloriesCurrent} kcal restantes`
              : "Meta calórica atingida"}
          </span>
        </div>

        {/* Protein Card */}
        <div className="bg-black border border-zinc-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">PROTEÍNA</span>
            <span className="text-zinc-300 font-bold">{proteinPercent}%</span>
          </div>
          <div className="my-3">
            <span className="font-mono text-3xl font-extrabold text-white">
              {nutrition.proteinCurrentG}g
            </span>
            <span className="font-mono text-xs text-zinc-500 ml-1.5">
              / {nutrition.proteinTargetG}g
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className="h-full bg-zinc-300 transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-2 block">
            Faltam {Math.max(0, nutrition.proteinTargetG - nutrition.proteinCurrentG)}g
          </span>
        </div>

        {/* Carbs Card */}
        <div className="bg-black border border-zinc-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">CARBOIDRATOS</span>
            <span className="text-zinc-300 font-bold">{carbsPercent}%</span>
          </div>
          <div className="my-3">
            <span className="font-mono text-3xl font-extrabold text-white">
              {nutrition.carbsCurrentG}g
            </span>
            <span className="font-mono text-xs text-zinc-500 ml-1.5">
              / {nutrition.carbsTargetG}g
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className="h-full bg-zinc-400 transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-2 block">
            Energia e reposição muscular
          </span>
        </div>

        {/* Fat Card */}
        <div className="bg-black border border-zinc-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">GORDURAS</span>
            <span className="text-zinc-300 font-bold">{fatPercent}%</span>
          </div>
          <div className="my-3">
            <span className="font-mono text-3xl font-extrabold text-white">
              {nutrition.fatCurrentG}g
            </span>
            <span className="font-mono text-xs text-zinc-500 ml-1.5">
              / {nutrition.fatTargetG}g
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className="h-full bg-zinc-500 transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-2 block">
            Suporte hormonal e celular
          </span>
        </div>
      </div>

      {/* Hydration Section (Monochromatic) */}
      <div className="bg-black border border-zinc-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 border border-zinc-700 bg-zinc-900 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">BALANÇO HÍDRICO:</span>
              <span className="font-mono text-sm font-bold text-white">
                {nutrition.waterCurrentMl} / {nutrition.waterTargetMl} ml ({waterPercent}%)
              </span>
            </div>
            <div className="w-48 sm:w-64 h-1.5 bg-zinc-900 border border-zinc-800 overflow-hidden mt-1.5">
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end font-mono text-xs">
          <button
            onClick={() => onAddWater(250)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            + 250ml
          </button>
          <button
            onClick={() => onAddWater(500)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            + 500ml
          </button>
          <button
            onClick={() => onAddWater(1000)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            + 1000ml
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-3 py-1.5 border transition-all ${
            activeTab === "timeline"
              ? "bg-zinc-800 border-white text-white font-bold"
              : "border-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          [ REFEIÇÕES DE HOJE ({nutrition.meals.length}) ]
        </button>

        <button
          onClick={() => setActiveTab("dish_builder")}
          className={`px-3 py-1.5 border transition-all flex items-center gap-1.5 ${
            activeTab === "dish_builder"
              ? "bg-zinc-800 border-white text-white font-bold"
              : "border-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          [ MONTAR PRATO RÁPIDO ]
        </button>

        <button
          onClick={() => setActiveTab("saved_dishes")}
          className={`px-3 py-1.5 border transition-all flex items-center gap-1.5 ${
            activeTab === "saved_dishes"
              ? "bg-zinc-800 border-white text-white font-bold"
              : "border-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          [ PRATOS SALVOS ({userSavedDishes.length}) ]
        </button>

        <button
          onClick={() => setShowQuickAddModal(true)}
          className="ml-auto px-2.5 py-1 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-mono"
        >
          + ENTRADA MANUAL
        </button>
      </div>

      {/* VIEW 1: TIMELINE DE REFEIÇÕES DO DIA */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          {nutrition.meals.length === 0 ? (
            <div className="border border-zinc-800 bg-black p-8 text-center space-y-3">
              <span className="text-zinc-500 text-xs font-mono block">
                [ NENHUMA REFEIÇÃO COMPUTADA PARA HOJE ]
              </span>
              <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto">
                Não precisa caçar tabela nutricional! Use o Montador Rápido de Prato para somar alimentos automaticamente ou registre um dos seus pratos favoritos com 1 toque.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab("dish_builder")}
                  className="px-4 py-2 bg-white text-black font-hud font-bold text-xs uppercase hover:bg-zinc-200 transition-colors"
                >
                  MONTAR PRIMEIRO PRATO
                </button>
                <button
                  onClick={() => setActiveTab("saved_dishes")}
                  className="px-4 py-2 border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-mono hover:border-zinc-500"
                >
                  VER PRATOS PRONTOS SUGERIDOS
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {nutrition.meals.map((meal) => (
                <div
                  key={meal.id}
                  className="bg-black border border-zinc-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                        {meal.time}
                      </span>
                      <span className="font-hud font-bold text-white text-sm uppercase">
                        {meal.name}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-zinc-400">
                      {meal.items.join(" • ")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-white font-bold">
                      {meal.calories} kcal
                    </span>
                    <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {meal.proteinG}g P
                    </span>
                    <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {meal.carbsG}g C
                    </span>
                    <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-500">
                      {meal.fatG}g G
                    </span>

                    {onRemoveMeal && (
                      <button
                        onClick={() => onRemoveMeal(meal.id)}
                        className="p-1 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900 transition-colors ml-1"
                        title="Remover refeição"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MONTADOR RÁPIDO DE PRATO (DISH BUILDER) */}
      {activeTab === "dish_builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Food Catalog (7 cols) */}
          <div className="lg:col-span-7 border border-zinc-800 bg-black p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-hud font-bold text-white text-sm uppercase tracking-wide">
                  CATÁLOGO DE ALIMENTOS DO DIA A DIA
                </h3>
                <span className="text-[11px] font-mono text-zinc-400">
                  Clique para adicionar ao prato. Valores calculados automaticamente.
                </span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar alimento..."
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs text-white pl-8 pr-3 py-1.5 font-mono focus:border-white focus:outline-none w-full sm:w-44"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              {[
                { id: "all", label: "Todos" },
                { id: "protein", label: "Proteínas" },
                { id: "carb", label: "Carboidratos" },
                { id: "vegetable", label: "Frutas & Legumes" },
                { id: "fat", label: "Gorduras Boas" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 border transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-zinc-800 border-white text-white font-bold"
                      : "border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Food Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredFoods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleAddIngredientToDish(food)}
                  className="bg-zinc-950 border border-zinc-800 hover:border-zinc-500 p-2.5 text-left flex items-start justify-between gap-2 transition-colors group"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-white block group-hover:underline">
                      + {food.name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 block">
                      {food.defaultPortionLabel}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                      {food.proteinG}g P • {food.carbsG}g C • {food.fatG}g G
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 shrink-0">
                    {food.calories} kcal
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Active Dish Formulation (5 cols) */}
          <div className="lg:col-span-5 border border-zinc-800 bg-[#090a0d] p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="border-b border-zinc-800 pb-3">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                  PRATO EM FORMULAÇÃO
                </span>
                <input
                  type="text"
                  placeholder="Nome do Prato (Ex: Meu Almoço Padrão)"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full bg-black border border-zinc-800 mt-1 px-3 py-1.5 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                />

                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-mono text-zinc-500">Refeição:</span>
                  {(["Café da Manhã", "Almoço", "Lanche da Tarde", "Jantar"] as const).map(
                    (slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTargetMealSlot(slot)}
                        className={`text-[10px] font-mono px-2 py-0.5 border transition-colors ${
                          targetMealSlot === slot
                            ? "bg-zinc-800 border-white text-white"
                            : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {slot.split(" ")[0]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Ingredients in this dish */}
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {selectedIngredients.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-zinc-800 text-zinc-500 font-mono text-xs">
                    Seu prato está vazio. Clique nos alimentos do catálogo ao lado para montar sua refeição.
                  </div>
                ) : (
                  selectedIngredients.map(({ food, portionMultiplier }) => (
                    <div
                      key={food.id}
                      className="bg-black border border-zinc-800 p-2 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-mono text-white block truncate">
                          {food.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 block">
                          {Math.round(food.calories * portionMultiplier)} kcal (
                          {(food.proteinG * portionMultiplier).toFixed(1)}g P)
                        </span>
                      </div>

                      {/* Portion Controls */}
                      <div className="flex items-center gap-1.5 font-mono text-xs shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdatePortion(food.id, -0.5)}
                          className="w-5 h-5 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-[11px] text-white">
                          {portionMultiplier}x
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdatePortion(food.id, 0.5)}
                          className="w-5 h-5 border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(food.id)}
                          className="text-zinc-600 hover:text-zinc-300 ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total computation & actions */}
            <div className="border-t border-zinc-800 pt-3 space-y-3 font-mono">
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs bg-black border border-zinc-800 p-2">
                <div>
                  <span className="text-[9px] text-zinc-500 block">TOTAL</span>
                  <span className="font-bold text-white text-sm">{dishTotals.calories}</span>
                  <span className="text-[9px] text-zinc-500 block">kcal</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block">PROT</span>
                  <span className="font-bold text-zinc-300 text-sm">{dishTotals.proteinG}g</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block">CARB</span>
                  <span className="font-bold text-zinc-400 text-sm">{dishTotals.carbsG}g</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block">GORD</span>
                  <span className="font-bold text-zinc-500 text-sm">{dishTotals.fatG}g</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={selectedIngredients.length === 0}
                  onClick={handleSaveDishTemplate}
                  className="px-3 py-2 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-mono disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  SALVAR PRATO
                </button>

                <button
                  type="button"
                  disabled={selectedIngredients.length === 0}
                  onClick={handleLogBuiltDish}
                  className="flex-1 px-4 py-2 bg-white text-black hover:bg-zinc-200 font-hud font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  REGISTRAR NO DIA DE HOJE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: PRATOS SALVOS & PRESETS SUGERIDOS */}
      {activeTab === "saved_dishes" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
            <div>
              <h3 className="font-hud font-bold text-white text-sm uppercase tracking-wide">
                BIBLIOTECA DE PRATOS // 1 CLIQUE PARA CONSUMIR
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Pratos já calculados para você não ter retrabalho diário. Clique em "Consumir no Dia" para computar na hora.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("dish_builder")}
              className="px-3 py-1.5 bg-white text-black font-hud font-bold text-xs uppercase hover:bg-zinc-200 transition-colors self-start"
            >
              + MONTAR NOVO PRATO
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userSavedDishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-black border border-zinc-800 p-4 space-y-3 flex flex-col justify-between hover:border-zinc-600 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-hud font-bold text-white text-sm uppercase block">
                      {dish.name}
                    </span>
                    <button
                      onClick={() => handleDeleteSavedDish(dish.id)}
                      className="text-zinc-600 hover:text-zinc-400 text-xs p-1"
                      title="Excluir este prato salvo"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="text-[11px] font-mono text-zinc-400 mt-1.5 space-y-0.5">
                    {dish.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-zinc-400">
                        <span>• {item.foodName} ({item.portionQty}x)</span>
                        <span className="text-zinc-500">{item.calories} kcal</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2 font-mono">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-white bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                      {dish.totalCalories} kcal
                    </span>
                    <span className="text-zinc-400">{dish.totalProteinG}g P</span>
                    <span className="text-zinc-500">{dish.totalCarbsG}g C</span>
                    <span className="text-zinc-600">{dish.totalFatG}g G</span>
                  </div>

                  <button
                    onClick={() => handleLogSavedDish(dish)}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-black font-hud font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    CONSUMIR HOJE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Ajustar Metas Nutricionais */}
      {showAdjustGoals && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0d10] border border-zinc-800 max-w-md w-full p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-hud font-bold text-white text-base">
                CALIBRAR METAS NUTRICIONAIS
              </h3>
              <button
                onClick={() => setShowAdjustGoals(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGoals} className="space-y-3">
              <div>
                <label className="text-zinc-400 block mb-1">CALORIAS DIÁRIAS (kcal)</label>
                <input
                  type="number"
                  value={goalCalories}
                  onChange={(e) => setGoalCalories(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">PROTEÍNA (g)</label>
                  <input
                    type="number"
                    value={goalProtein}
                    onChange={(e) => setGoalProtein(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">CARBOIDRATO (g)</label>
                  <input
                    type="number"
                    value={goalCarbs}
                    onChange={(e) => setGoalCarbs(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">GORDURA (g)</label>
                  <input
                    type="number"
                    value={goalFat}
                    onChange={(e) => setGoalFat(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">META DE ÁGUA DIÁRIA (ml)</label>
                <input
                  type="number"
                  value={goalWater}
                  onChange={(e) => setGoalWater(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustGoals(false)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-hud font-bold uppercase"
                >
                  SALVAR METAS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Add Meal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0d10] border border-zinc-800 max-w-md w-full p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-hud font-bold text-white text-base">
                ENTRADA RÁPIDA DE REFEIÇÃO
              </h3>
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickMeal} className="space-y-3">
              <div>
                <label className="text-zinc-400 block mb-1">NOME DA REFEIÇÃO</label>
                <input
                  type="text"
                  placeholder="Ex: Jantar na rua / Marmita"
                  value={quickMealName}
                  onChange={(e) => setQuickMealName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">CALORIAS (kcal)</label>
                  <input
                    type="number"
                    value={quickMealCalories}
                    onChange={(e) => setQuickMealCalories(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">PROTEÍNA (g)</label>
                  <input
                    type="number"
                    value={quickMealProtein}
                    onChange={(e) => setQuickMealProtein(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">CARBOIDRATO (g)</label>
                  <input
                    type="number"
                    value={quickMealCarbs}
                    onChange={(e) => setQuickMealCarbs(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">GORDURA (g)</label>
                  <input
                    type="number"
                    value={quickMealFat}
                    onChange={(e) => setQuickMealFat(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-hud font-bold uppercase"
                >
                  SALVAR REFEIÇÃO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
