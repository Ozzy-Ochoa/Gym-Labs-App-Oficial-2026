import { WorkoutSession, WorkoutExercise, MealItem } from "../types";

export interface FoodItemData {
  id: string;
  name: string;
  category: "protein" | "carb" | "vegetable" | "fat" | "ready_dish";
  defaultPortionLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface SavedDish {
  id: string;
  name: string;
  mealSlot?: "breakfast" | "lunch" | "snack" | "dinner" | "any";
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  items: {
    foodId: string;
    foodName: string;
    portionQty: number;
    portionLabel: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }[];
}

export interface HealthQuestionnaireData {
  primaryGoal: "hypertrophy" | "fat_loss" | "recomposition" | "conditioning";
  mealsPerDay: number; // 3, 4, 5
  dietaryPreference: "all" | "no_lactose" | "no_gluten" | "economical" | "vegetarian";
  daysAvailable: number; // 2, 3, 4, 5, 6
  equipment: "gym" | "home_dumbbells" | "bodyweight";
  experienceLevel: "beginner" | "intermediate" | "advanced";
}

export const COMMON_FOOD_DATABASE: FoodItemData[] = [
  // LATICÍNIOS, GORDURAS, MANTEIGAS & MARGARINAS
  { id: "f_margarina", name: "Margarina com Sal (Cremosa)", category: "fat", defaultPortionLabel: "1 ponta de faca / colher chá (10g)", calories: 72, proteinG: 0, carbsG: 0.1, fatG: 8.0 },
  { id: "f_margarina_sopa", name: "Margarina com Sal (Colher de sopa)", category: "fat", defaultPortionLabel: "1 colher de sopa (20g)", calories: 144, proteinG: 0, carbsG: 0.2, fatG: 16.0 },
  { id: "f_manteiga", name: "Manteiga de Primeira Qualidade", category: "fat", defaultPortionLabel: "1 colher de chá (10g)", calories: 74, proteinG: 0.1, carbsG: 0, fatG: 8.2 },
  { id: "f_manteiga_ghee", name: "Manteiga Clarificada Ghee", category: "fat", defaultPortionLabel: "1 colher de chá (10g)", calories: 90, proteinG: 0, carbsG: 0, fatG: 10.0 },
  { id: "f_requeijao_tradicional", name: "Requeijão Cremoso Tradicional", category: "fat", defaultPortionLabel: "1 colher de sopa (30g)", calories: 78, proteinG: 2.8, carbsG: 1.0, fatG: 7.0 },
  { id: "f_requeijao_light", name: "Requeijão Cremoso Light", category: "protein", defaultPortionLabel: "1 colher de sopa (30g)", calories: 45, proteinG: 3.5, carbsG: 1.2, fatG: 3.0 },
  { id: "f_maionese", name: "Maionese Tradicional", category: "fat", defaultPortionLabel: "1 colher de sopa (12g)", calories: 48, proteinG: 0.1, carbsG: 0.8, fatG: 5.0 },
  { id: "f_azeite", name: "Azeite de Oliva Extra Virgem", category: "fat", defaultPortionLabel: "1 colher de sopa (10ml)", calories: 90, proteinG: 0, carbsG: 0, fatG: 10 },
  { id: "f_azeite_fio", name: "Azeite de Oliva (1 fio rápido)", category: "fat", defaultPortionLabel: "1 colher de chá (5ml)", calories: 45, proteinG: 0, carbsG: 0, fatG: 5 },
  { id: "f_oleo_soja", name: "Óleo de Soja / Cozinha", category: "fat", defaultPortionLabel: "1 colher de sopa (10ml)", calories: 90, proteinG: 0, carbsG: 0, fatG: 10 },
  { id: "f_oleo_coco", name: "Óleo de Coco Extravirgem", category: "fat", defaultPortionLabel: "1 colher de sopa (10ml)", calories: 86, proteinG: 0, carbsG: 0, fatG: 9.6 },
  { id: "f_pasta_amendoim", name: "Pasta de Amendoim Integral", category: "fat", defaultPortionLabel: "1 colher de sopa (15g)", calories: 90, proteinG: 4, carbsG: 3, fatG: 7.5 },
  { id: "f_castanhas", name: "Castanhas do Pará / Caju", category: "fat", defaultPortionLabel: "1 punhado pequeno (20g)", calories: 120, proteinG: 3, carbsG: 3, fatG: 11 },
  { id: "f_abacate", name: "Abacate Fresco", category: "fat", defaultPortionLabel: "2 colheres de sopa (50g)", calories: 80, proteinG: 1, carbsG: 4, fatG: 7.5 },

  // PÃES, MASSAS & CEREAIS
  { id: "f_pao_frances", name: "Pão Francês Tradicional", category: "carb", defaultPortionLabel: "1 unidade (50g)", calories: 140, proteinG: 4.2, carbsG: 28, fatG: 1.2 },
  { id: "f_pao_frances_sem_miolo", name: "Pão Francês sem Miolo", category: "carb", defaultPortionLabel: "1 unidade (35g)", calories: 98, proteinG: 3.0, carbsG: 19.5, fatG: 0.8 },
  { id: "f_pao_integral", name: "Pão de Forma 100% Integral", category: "carb", defaultPortionLabel: "2 fatias (50g)", calories: 120, proteinG: 4.5, carbsG: 22, fatG: 1.8 },
  { id: "f_pao_forma_branco", name: "Pão de Forma Tradicional Branco", category: "carb", defaultPortionLabel: "2 fatias (50g)", calories: 135, proteinG: 4.0, carbsG: 26, fatG: 1.5 },
  { id: "f_pao_sirio", name: "Pão Sírio / Pita", category: "carb", defaultPortionLabel: "1 unidade média (50g)", calories: 130, proteinG: 4.5, carbsG: 27, fatG: 0.8 },
  { id: "f_pao_de_queijo", name: "Pão de Queijo Tradicional", category: "carb", defaultPortionLabel: "1 unidade média (40g)", calories: 115, proteinG: 2.5, carbsG: 14, fatG: 5.5 },
  { id: "f_tapioca", name: "Tapioca Goma Preparada", category: "carb", defaultPortionLabel: "3 colheres de sopa (50g)", calories: 135, proteinG: 0.2, carbsG: 34, fatG: 0.1 },
  { id: "f_cuscuz_milho", name: "Cuscuz Nordestino Cozido", category: "carb", defaultPortionLabel: "1 fatia média (100g)", calories: 112, proteinG: 2.2, carbsG: 25, fatG: 0.6 },
  { id: "f_torrada_integral", name: "Torrada Salgada Integral", category: "carb", defaultPortionLabel: "2 unidades (20g)", calories: 75, proteinG: 2.2, carbsG: 14, fatG: 1.2 },
  { id: "f_aveia", name: "Aveia em Flocos Finos", category: "carb", defaultPortionLabel: "2 colheres de sopa (30g)", calories: 105, proteinG: 4.3, carbsG: 17, fatG: 2.2 },
  { id: "f_farelo_aveia", name: "Farelo de Aveia", category: "carb", defaultPortionLabel: "2 colheres de sopa (30g)", calories: 95, proteinG: 5.2, carbsG: 14, fatG: 2.4 },
  { id: "f_granola", name: "Granola Tradicional", category: "carb", defaultPortionLabel: "3 colheres de sopa (40g)", calories: 160, proteinG: 3.5, carbsG: 28, fatG: 4.0 },

  // ARROZ, FEIJÃO, TUBÉRCULOS & LEGUMINOSAS
  { id: "f_arroz_branco", name: "Arroz Branco Cozido", category: "carb", defaultPortionLabel: "1 concha média (100g)", calories: 130, proteinG: 2.5, carbsG: 28, fatG: 0.2 },
  { id: "f_arroz_integral", name: "Arroz Integral Cozido", category: "carb", defaultPortionLabel: "1 concha média (100g)", calories: 120, proteinG: 3, carbsG: 25, fatG: 1 },
  { id: "f_feijao", name: "Feijão Carioca Cozido (Caldo e Grão)", category: "carb", defaultPortionLabel: "1 concha média (100g)", calories: 76, proteinG: 4.8, carbsG: 13.6, fatG: 0.5 },
  { id: "f_feijao_preto", name: "Feijão Preto Cozido", category: "carb", defaultPortionLabel: "1 concha média (100g)", calories: 77, proteinG: 4.5, carbsG: 14, fatG: 0.5 },
  { id: "f_grao_de_bico", name: "Grão de Bico Cozido", category: "carb", defaultPortionLabel: "1 concha (100g)", calories: 140, proteinG: 7.5, carbsG: 24, fatG: 2.2 },
  { id: "f_lentilha", name: "Lentilha Cozida", category: "carb", defaultPortionLabel: "1 concha (100g)", calories: 116, proteinG: 9.0, carbsG: 20, fatG: 0.4 },
  { id: "f_batata_inglesa", name: "Batata Inglesa Cozida / Assada", category: "carb", defaultPortionLabel: "1 unidade média (150g)", calories: 110, proteinG: 2.5, carbsG: 25, fatG: 0.1 },
  { id: "f_pure_batata", name: "Purê de Batata com Leite", category: "carb", defaultPortionLabel: "2 colheres de sopa (100g)", calories: 125, proteinG: 2.2, carbsG: 21, fatG: 3.5 },
  { id: "f_batata_doce", name: "Batata Doce Cozida", category: "carb", defaultPortionLabel: "1 unidade média (150g)", calories: 130, proteinG: 2, carbsG: 30, fatG: 0.2 },
  { id: "f_mandioca", name: "Mandioca / Aipim Cozido", category: "carb", defaultPortionLabel: "1 pedaço médio (100g)", calories: 160, proteinG: 1.4, carbsG: 38, fatG: 0.3 },
  { id: "f_macarrao", name: "Macarrão Tradicional Cozido", category: "carb", defaultPortionLabel: "1 prato raso (140g)", calories: 190, proteinG: 6, carbsG: 38, fatG: 1 },
  { id: "f_macarrao_integral", name: "Macarrão Integral Cozido", category: "carb", defaultPortionLabel: "1 prato raso (140g)", calories: 175, proteinG: 7.5, carbsG: 36, fatG: 1.2 },

  // OVOS & PROTEÍNAS
  { id: "f_ovo", name: "Ovo Cozido Inteiro", category: "protein", defaultPortionLabel: "1 unidade (50g)", calories: 74, proteinG: 6.5, carbsG: 0.5, fatG: 5.0 },
  { id: "f_ovo_mexido", name: "Ovo Mexido Simples", category: "protein", defaultPortionLabel: "1 unidade (50g)", calories: 85, proteinG: 6.5, carbsG: 0.6, fatG: 6.2 },
  { id: "f_ovo_frito", name: "Ovo Frito no Azeite/Margarina", category: "protein", defaultPortionLabel: "1 unidade (55g)", calories: 110, proteinG: 6.5, carbsG: 0.5, fatG: 9.0 },
  { id: "f_clara", name: "Clara de Ovo Cozida", category: "protein", defaultPortionLabel: "1 unidade (35g)", calories: 17, proteinG: 3.8, carbsG: 0.2, fatG: 0 },
  { id: "f_omelete_2ovos", name: "Omelete de 2 Ovos com Ervas", category: "protein", defaultPortionLabel: "1 porção (100g)", calories: 170, proteinG: 13.0, carbsG: 1.0, fatG: 12.5 },
  { id: "f_frango", name: "Peito de Frango Grelhado", category: "protein", defaultPortionLabel: "1 filé médio (120g)", calories: 195, proteinG: 36, carbsG: 0, fatG: 4.5 },
  { id: "f_frango_desfiado", name: "Frango Cozido Desfiado Temperado", category: "protein", defaultPortionLabel: "1 concha média (100g)", calories: 165, proteinG: 31, carbsG: 0.5, fatG: 3.8 },
  { id: "f_sobrecoxa_frango", name: "Sobrecoxa de Frango Assada (s/ pele)", category: "protein", defaultPortionLabel: "1 unidade média (100g)", calories: 180, proteinG: 24, carbsG: 0, fatG: 9.0 },
  { id: "f_patinho", name: "Carne Bovina Moída (Patinho)", category: "protein", defaultPortionLabel: "1 porção (100g)", calories: 185, proteinG: 28, carbsG: 0, fatG: 6.5 },
  { id: "f_alcatra", name: "Bife de Alcatra Grelhado", category: "protein", defaultPortionLabel: "1 bife médio (120g)", calories: 240, proteinG: 34, carbsG: 0, fatG: 10.5 },
  { id: "f_contrafile", name: "Bife de Contrafilé Grelhado (sem gordura)", category: "protein", defaultPortionLabel: "1 bife médio (120g)", calories: 260, proteinG: 32, carbsG: 0, fatG: 14.0 },
  { id: "f_peixe", name: "Tilápia / Peixe Branco Grelhado", category: "protein", defaultPortionLabel: "1 filé médio (120g)", calories: 130, proteinG: 26, carbsG: 0, fatG: 2.5 },
  { id: "f_salmao", name: "Salmão Grelhado", category: "protein", defaultPortionLabel: "1 posta média (120g)", calories: 250, proteinG: 26, carbsG: 0, fatG: 15.0 },
  { id: "f_atum", name: "Atum em Conserva ao Natural (em água)", category: "protein", defaultPortionLabel: "1/2 lata (60g)", calories: 70, proteinG: 16, carbsG: 0, fatG: 0.5 },
  { id: "f_sardinha", name: "Sardinha em Conserva", category: "protein", defaultPortionLabel: "2 unidades (60g)", calories: 120, proteinG: 14, carbsG: 0, fatG: 7.0 },

  // QUEIJOS & EMBUTIDOS
  { id: "f_queijo_mussarela", name: "Queijo Mussarela Fatiado", category: "protein", defaultPortionLabel: "1 fatia média (25g)", calories: 82, proteinG: 5.8, carbsG: 0.6, fatG: 6.5 },
  { id: "f_queijo_prato", name: "Queijo Prato Fatiado", category: "protein", defaultPortionLabel: "1 fatia média (25g)", calories: 85, proteinG: 6.0, carbsG: 0.5, fatG: 6.8 },
  { id: "f_queijo_minas", name: "Queijo Minas Frescal / Branco", category: "protein", defaultPortionLabel: "1 fatia média (30g)", calories: 68, proteinG: 5.5, carbsG: 1, fatG: 4.5 },
  { id: "f_queijo_cottage", name: "Queijo Cottage Magro", category: "protein", defaultPortionLabel: "2 colheres de sopa (50g)", calories: 48, proteinG: 6.0, carbsG: 1.5, fatG: 1.8 },
  { id: "f_presunto_cozido", name: "Presunto Cozido sem Capa", category: "protein", defaultPortionLabel: "1 fatia fina (20g)", calories: 25, proteinG: 3.5, carbsG: 0.5, fatG: 0.9 },
  { id: "f_peito_peru", name: "Peito de Peru Defumado Fatiado", category: "protein", defaultPortionLabel: "1 fatia fina (20g)", calories: 22, proteinG: 4.2, carbsG: 0.3, fatG: 0.4 },
  { id: "f_bacon", name: "Bacon Frito em Cubos/Fatia", category: "fat", defaultPortionLabel: "1 fatia média (15g)", calories: 78, proteinG: 4.5, carbsG: 0.2, fatG: 6.8 },
  { id: "f_linguica_calabresa", name: "Linguiça Calabresa Fatiada", category: "protein", defaultPortionLabel: "3 rodelas (30g)", calories: 95, proteinG: 5.0, carbsG: 0.8, fatG: 8.0 },

  // SUPLEMENTOS & LATICÍNIOS
  { id: "f_whey", name: "Whey Protein Concentrado 80%", category: "protein", defaultPortionLabel: "1 dosador / scoop (30g)", calories: 120, proteinG: 24, carbsG: 3, fatG: 1.5 },
  { id: "f_whey_isolado", name: "Whey Protein Isolado 90%", category: "protein", defaultPortionLabel: "1 scoop (30g)", calories: 110, proteinG: 27, carbsG: 0.5, fatG: 0.3 },
  { id: "f_creatina", name: "Creatina Monohidratada Pura", category: "protein", defaultPortionLabel: "1 dosador (5g)", calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  { id: "f_barra_proteina", name: "Barra de Proteína", category: "protein", defaultPortionLabel: "1 unidade (40g)", calories: 140, proteinG: 12, carbsG: 13, fatG: 4.5 },
  { id: "f_leite_desnatado", name: "Leite Desnatado Líquido", category: "protein", defaultPortionLabel: "1 copo (200ml)", calories: 70, proteinG: 6.4, carbsG: 10, fatG: 0.2 },
  { id: "f_leite_integral", name: "Leite Integral Líquido", category: "protein", defaultPortionLabel: "1 copo (200ml)", calories: 120, proteinG: 6.2, carbsG: 9.5, fatG: 6.5 },
  { id: "f_iogurte", name: "Iogurte Natural Desnatado", category: "protein", defaultPortionLabel: "1 pote (160g)", calories: 85, proteinG: 7, carbsG: 9, fatG: 2.5 },
  { id: "f_iogurte_grego", name: "Iogurte Grego Tradicional", category: "protein", defaultPortionLabel: "1 pote (100g)", calories: 115, proteinG: 6.5, carbsG: 8, fatG: 6.0 },

  // FRUTAS & VEGETAIS
  { id: "f_banana", name: "Banana Prata / Nanica", category: "vegetable", defaultPortionLabel: "1 unidade média (80g)", calories: 78, proteinG: 1, carbsG: 20, fatG: 0.2 },
  { id: "f_maca", name: "Maçã com Casca", category: "vegetable", defaultPortionLabel: "1 unidade média (130g)", calories: 72, proteinG: 0.4, carbsG: 19, fatG: 0.2 },
  { id: "f_mamao", name: "Mamão Papaia", category: "vegetable", defaultPortionLabel: "1/2 unidade (150g)", calories: 65, proteinG: 0.8, carbsG: 16, fatG: 0.2 },
  { id: "f_laranja", name: "Laranja Pera Fresca", category: "vegetable", defaultPortionLabel: "1 unidade média (130g)", calories: 60, proteinG: 1.2, carbsG: 15, fatG: 0.2 },
  { id: "f_melancia", name: "Melancia Fatiada", category: "vegetable", defaultPortionLabel: "1 fatia média (200g)", calories: 62, proteinG: 1.2, carbsG: 15, fatG: 0.3 },
  { id: "f_abacaxi", name: "Abacaxi em Rodelas", category: "vegetable", defaultPortionLabel: "2 fatias finas (100g)", calories: 50, proteinG: 0.5, carbsG: 13, fatG: 0.1 },
  { id: "f_morango", name: "Morangos Frescos", category: "vegetable", defaultPortionLabel: "6 unidades médias (100g)", calories: 33, proteinG: 0.7, carbsG: 7.7, fatG: 0.3 },
  { id: "f_uva", name: "Uva sem Semente", category: "vegetable", defaultPortionLabel: "1 cacho pequeno (100g)", calories: 69, proteinG: 0.7, carbsG: 18, fatG: 0.2 },
  { id: "f_salada_folhas", name: "Salada de Folhas Verdes (Alface, Rúcula)", category: "vegetable", defaultPortionLabel: "1 prato de sobremesa (50g)", calories: 12, proteinG: 1.0, carbsG: 1.8, fatG: 0.2 },
  { id: "f_tomate", name: "Tomate em Rodelas", category: "vegetable", defaultPortionLabel: "1 unidade média (100g)", calories: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2 },
  { id: "f_cenoura", name: "Cenoura Ralada / Cozida", category: "vegetable", defaultPortionLabel: "1/2 xícara (60g)", calories: 25, proteinG: 0.6, carbsG: 5.5, fatG: 0.1 },
  { id: "f_brocolis", name: "Brócolis no Vapor", category: "vegetable", defaultPortionLabel: "1 xícara (90g)", calories: 30, proteinG: 2.5, carbsG: 6, fatG: 0.4 },
  { id: "f_couve", name: "Couve Manteiga Refogada", category: "vegetable", defaultPortionLabel: "2 colheres de sopa (50g)", calories: 45, proteinG: 1.5, carbsG: 4.5, fatG: 2.5 },
  { id: "f_abobrinha", name: "Abobrinha Refogada", category: "vegetable", defaultPortionLabel: "1/2 xícara (80g)", calories: 20, proteinG: 1.0, carbsG: 3.8, fatG: 0.3 },

  // BEBIDAS & CONDIMENTOS DIÁRIOS
  { id: "f_cafe_puro", name: "Café Preto sem Açúcar", category: "vegetable", defaultPortionLabel: "1 xícara / dose (50ml)", calories: 2, proteinG: 0.1, carbsG: 0.3, fatG: 0 },
  { id: "f_cafe_com_leite", name: "Café com Leite (Pingado com 100ml leite)", category: "protein", defaultPortionLabel: "1 xícara média (150ml)", calories: 55, proteinG: 3.2, carbsG: 5.0, fatG: 2.0 },
  { id: "f_suco_laranja", name: "Suco de Laranja Natural (sem açúcar)", category: "carb", defaultPortionLabel: "1 copo (200ml)", calories: 95, proteinG: 1.5, carbsG: 22, fatG: 0.2 },
  { id: "f_suco_uva", name: "Suco de Uva Integral", category: "carb", defaultPortionLabel: "1 copo (200ml)", calories: 125, proteinG: 0.8, carbsG: 30, fatG: 0.1 },
  { id: "f_agua_coco", name: "Água de Coco Natural", category: "carb", defaultPortionLabel: "1 copo (200ml)", calories: 40, proteinG: 0.4, carbsG: 10, fatG: 0.1 },
  { id: "f_mel", name: "Mel de Abelha Puro", category: "carb", defaultPortionLabel: "1 colher de sopa (20g)", calories: 64, proteinG: 0.1, carbsG: 17, fatG: 0 },
  { id: "f_acucar", name: "Açúcar Refinado / Mascavo", category: "carb", defaultPortionLabel: "1 colher de chá (5g)", calories: 20, proteinG: 0, carbsG: 5.0, fatG: 0 },
  { id: "f_acucar_sopa", name: "Açúcar (1 colher de sopa)", category: "carb", defaultPortionLabel: "1 colher de sopa (15g)", calories: 60, proteinG: 0, carbsG: 15.0, fatG: 0 },
  { id: "f_adocante", name: "Adoçante Sucralose / Stevia", category: "vegetable", defaultPortionLabel: "5 a 8 gotas", calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  { id: "f_doce_leite", name: "Doce de Leite Pastoso", category: "carb", defaultPortionLabel: "1 colher de sopa (20g)", calories: 65, proteinG: 1.5, carbsG: 11, fatG: 1.6 },
  { id: "f_geleia_frutas", name: "Geleia de Frutas Tradicional", category: "carb", defaultPortionLabel: "1 colher de sopa (20g)", calories: 54, proteinG: 0.1, carbsG: 13.5, fatG: 0 },
  { id: "f_nutella", name: "Creme de Avelã / Nutella", category: "fat", defaultPortionLabel: "1 colher de sopa (20g)", calories: 107, proteinG: 1.2, carbsG: 11.5, fatG: 6.2 },
  { id: "f_chocolate_70", name: "Chocolate Amargo 70%", category: "fat", defaultPortionLabel: "2 quadradinhos (20g)", calories: 115, proteinG: 1.8, carbsG: 9.0, fatG: 8.5 },
  { id: "f_chocolate_leite", name: "Chocolate ao Leite", category: "fat", defaultPortionLabel: "2 quadradinhos (25g)", calories: 135, proteinG: 1.8, carbsG: 15.0, fatG: 7.8 },

  // GORDURAS ADICIONAIS, MOLHOS & PASTAS
  { id: "f_banha_porco", name: "Banha de Porco Caseira", category: "fat", defaultPortionLabel: "1 colher de sopa (10g)", calories: 90, proteinG: 0, carbsG: 0, fatG: 10.0 },
  { id: "f_creme_leite", name: "Creme de Leite Tradicional", category: "fat", defaultPortionLabel: "2 colheres de sopa (30g)", calories: 75, proteinG: 0.6, carbsG: 1.2, fatG: 7.5 },
  { id: "f_leite_condensado", name: "Leite Condensado Moça", category: "carb", defaultPortionLabel: "1 colher de sopa (20g)", calories: 65, proteinG: 1.5, carbsG: 11.0, fatG: 1.6 },
  { id: "f_ketchup", name: "Ketchup Tradicional", category: "carb", defaultPortionLabel: "1 colher de sopa (15g)", calories: 18, proteinG: 0.2, carbsG: 4.2, fatG: 0 },
  { id: "f_mostarda", name: "Mostarda Amarela", category: "vegetable", defaultPortionLabel: "1 colher de chá (10g)", calories: 9, proteinG: 0.5, carbsG: 0.8, fatG: 0.4 },
  { id: "f_molho_tomate", name: "Molho de Tomate Refogado", category: "vegetable", defaultPortionLabel: "2 colheres de sopa (40g)", calories: 20, proteinG: 0.6, carbsG: 3.5, fatG: 0.4 },
  { id: "f_molho_shoyu", name: "Molho Shoyu de Soja", category: "vegetable", defaultPortionLabel: "1 colher de sopa (15ml)", calories: 12, proteinG: 1.2, carbsG: 1.4, fatG: 0 },
  { id: "f_gergelim", name: "Sementes de Gergelim", category: "fat", defaultPortionLabel: "1 colher de chá (10g)", calories: 58, proteinG: 1.8, carbsG: 2.3, fatG: 5.0 },
  { id: "f_chia", name: "Sementes de Chia", category: "fat", defaultPortionLabel: "1 colher de sopa (15g)", calories: 73, proteinG: 2.5, carbsG: 6.3, fatG: 4.6 },
  { id: "f_linhaca", name: "Linhaça Dourada Moída", category: "fat", defaultPortionLabel: "1 colher de sopa (15g)", calories: 75, proteinG: 2.7, carbsG: 4.3, fatG: 5.5 },

  // CEREAIS, SNACKS & MASSAS CASEIRAS
  { id: "f_farinha_mandioca", name: "Farofa Temperada / Farinha Mandioca", category: "carb", defaultPortionLabel: "1 colher de sopa cheia (20g)", calories: 82, proteinG: 0.3, carbsG: 17.5, fatG: 1.2 },
  { id: "f_biscoito_salgado", name: "Biscoito Água e Sal / Cream Cracker", category: "carb", defaultPortionLabel: "3 unidades (24g)", calories: 105, proteinG: 2.2, carbsG: 16.5, fatG: 3.5 },
  { id: "f_biscoito_recheado", name: "Biscoito Recheado Chocolate", category: "carb", defaultPortionLabel: "2 unidades (25g)", calories: 120, proteinG: 1.5, carbsG: 18.0, fatG: 4.8 },
  { id: "f_bolo_cenoura", name: "Bolo de Cenoura Simples", category: "carb", defaultPortionLabel: "1 fatia média (60g)", calories: 190, proteinG: 3.2, carbsG: 28.0, fatG: 7.5 },
  { id: "f_pipoca_caseira", name: "Pipoca Caseira com Sal", category: "carb", defaultPortionLabel: "1 xícara cheia (25g)", calories: 95, proteinG: 2.5, carbsG: 15.0, fatG: 3.0 },
  { id: "f_wrap_tortilla", name: "Rap10 / Tortilha de Trigo", category: "carb", defaultPortionLabel: "1 unidade (40g)", calories: 110, proteinG: 3.0, carbsG: 20.0, fatG: 2.0 },
  { id: "f_panqueca_aveia", name: "Massa de Panqueca de Aveia & Ovo", category: "carb", defaultPortionLabel: "1 unidade média (80g)", calories: 140, proteinG: 8.5, carbsG: 16.0, fatG: 4.5 },

  // PROTEÍNAS DO COTIDIANO
  { id: "f_atum_oleo", name: "Atum Ralado em Óleo", category: "protein", defaultPortionLabel: "1/2 lata (60g)", calories: 125, proteinG: 14.0, carbsG: 0, fatG: 7.8 },
  { id: "f_hamburguer_bovino", name: "Hambúrguer de Carne Bovina Caseiro", category: "protein", defaultPortionLabel: "1 unidade (100g)", calories: 210, proteinG: 22.0, carbsG: 1.0, fatG: 13.0 },
  { id: "f_hamburguer_frango", name: "Hambúrguer de Peito de Frango", category: "protein", defaultPortionLabel: "1 unidade (100g)", calories: 150, proteinG: 24.0, carbsG: 1.5, fatG: 5.0 },
  { id: "f_costelinha_porco", name: "Lombo Suíno Assado Magro", category: "protein", defaultPortionLabel: "1 bife médio (100g)", calories: 175, proteinG: 27.0, carbsG: 0, fatG: 7.0 },
  { id: "f_tofu", name: "Tofu Firme Orgânico", category: "protein", defaultPortionLabel: "1 fatia média (80g)", calories: 65, proteinG: 7.5, carbsG: 1.5, fatG: 3.5 },
  { id: "f_soja_grao", name: "Proteína de Soja Texturizada (PTS)", category: "protein", defaultPortionLabel: "2 colheres de sopa hidratadas (50g)", calories: 70, proteinG: 11.0, carbsG: 5.0, fatG: 0.5 },

  // LEGUMES & VEGETAIS BRASILEIROS
  { id: "f_beterraba", name: "Beterraba Cozida em Cubos", category: "vegetable", defaultPortionLabel: "2 colheres de sopa (50g)", calories: 22, proteinG: 0.8, carbsG: 5.0, fatG: 0.1 },
  { id: "f_chuchu", name: "Chuchu Cozido Refogado", category: "vegetable", defaultPortionLabel: "1/2 xícara (80g)", calories: 16, proteinG: 0.6, carbsG: 3.4, fatG: 0.2 },
  { id: "f_repolho", name: "Repolho Branco / Roxo Picado", category: "vegetable", defaultPortionLabel: "1 xícara (60g)", calories: 15, proteinG: 0.8, carbsG: 3.5, fatG: 0.1 },
  { id: "f_abobora", name: "Abóbora Cabotiá Cozida", category: "vegetable", defaultPortionLabel: "2 pedaços médios (100g)", calories: 40, proteinG: 1.2, carbsG: 9.0, fatG: 0.2 },
  { id: "f_pepino", name: "Pepino Japonês Fatiado", category: "vegetable", defaultPortionLabel: "1/2 unidade (80g)", calories: 12, proteinG: 0.6, carbsG: 2.4, fatG: 0.1 },
  { id: "f_palmito", name: "Palmito Pupunha em Conserva", category: "vegetable", defaultPortionLabel: "2 toletes (60g)", calories: 18, proteinG: 1.3, carbsG: 3.2, fatG: 0.2 },
  { id: "f_cogumelos", name: "Cogumelos Champignon / Shimeji", category: "vegetable", defaultPortionLabel: "2 colheres de sopa (50g)", calories: 15, proteinG: 1.8, carbsG: 2.0, fatG: 0.2 },
];

export const PRESET_SAVED_DISHES: SavedDish[] = [
  {
    id: "preset_pao_margarina_ovo",
    name: "Pão Francês com Margarina e Ovo Mexido",
    mealSlot: "breakfast",
    totalCalories: 297,
    totalProteinG: 10.7,
    totalCarbsG: 28.6,
    totalFatG: 15.4,
    items: [
      { foodId: "f_pao_frances", foodName: "Pão Francês Tradicional", portionQty: 1, portionLabel: "1 unidade (50g)", calories: 140, proteinG: 4.2, carbsG: 28, fatG: 1.2 },
      { foodId: "f_margarina", foodName: "Margarina com Sal (Cremosa)", portionQty: 1, portionLabel: "1 ponta de faca (10g)", calories: 72, proteinG: 0, carbsG: 0.1, fatG: 8.0 },
      { foodId: "f_ovo_mexido", foodName: "Ovo Mexido Simples", portionQty: 1, portionLabel: "1 unidade (50g)", calories: 85, proteinG: 6.5, carbsG: 0.5, fatG: 6.2 },
    ],
  },
  {
    id: "preset_almoço_fit",
    name: "Prato Feito Fit (Frango, Arroz, Feijão & Salada)",
    mealSlot: "lunch",
    totalCalories: 416,
    totalProteinG: 44.5,
    totalCarbsG: 43.6,
    totalFatG: 5.4,
    items: [
      { foodId: "f_frango", foodName: "Peito de Frango Grelhado", portionQty: 1, portionLabel: "1 filé médio (120g)", calories: 195, proteinG: 36, carbsG: 0, fatG: 4.5 },
      { foodId: "f_arroz_branco", foodName: "Arroz Branco Cozido", portionQty: 1, portionLabel: "1 concha média (100g)", calories: 130, proteinG: 2.5, carbsG: 28, fatG: 0.2 },
      { foodId: "f_feijao", foodName: "Feijão Carioca Cozido", portionQty: 1, portionLabel: "1 concha média (100g)", calories: 76, proteinG: 4.8, carbsG: 13.6, fatG: 0.5 },
      { foodId: "f_salada_folhas", foodName: "Salada de Folhas Verdes", portionQty: 1, portionLabel: "1 prato de sobremesa", calories: 15, proteinG: 1.2, carbsG: 2, fatG: 0.2 },
    ],
  },
  {
    id: "preset_cafe_classico",
    name: "Café da Manhã Clássico (Ovos Mexidos + Pão Integral + Banana)",
    mealSlot: "breakfast",
    totalCalories: 346,
    totalProteinG: 18.5,
    totalCarbsG: 43,
    totalFatG: 12,
    items: [
      { foodId: "f_ovo", foodName: "Ovo Inteiro", portionQty: 2, portionLabel: "2 unidades (100g)", calories: 148, proteinG: 13, carbsG: 1, fatG: 10 },
      { foodId: "f_pao_integral", foodName: "Pão de Forma Integral", portionQty: 1, portionLabel: "2 fatias (50g)", calories: 120, proteinG: 4.5, carbsG: 22, fatG: 1.8 },
      { foodId: "f_banana", foodName: "Banana Prata", portionQty: 1, portionLabel: "1 unidade média (80g)", calories: 78, proteinG: 1, carbsG: 20, fatG: 0.2 },
    ],
  },
  {
    id: "preset_mingau_aveia",
    name: "Mingau de Aveia com Banana & Pasta de Amendoim",
    mealSlot: "snack",
    totalCalories: 273,
    totalProteinG: 9.3,
    totalCarbsG: 40,
    totalFatG: 9.9,
    items: [
      { foodId: "f_aveia", foodName: "Aveia em Flocos", portionQty: 1, portionLabel: "2 colheres de sopa (30g)", calories: 105, proteinG: 4.3, carbsG: 17, fatG: 2.2 },
      { foodId: "f_banana", foodName: "Banana Prata", portionQty: 1, portionLabel: "1 unidade média (80g)", calories: 78, proteinG: 1, carbsG: 20, fatG: 0.2 },
      { foodId: "f_pasta_amendoim", foodName: "Pasta de Amendoim", portionQty: 1, portionLabel: "1 colher de sopa (15g)", calories: 90, proteinG: 4, carbsG: 3, fatG: 7.5 },
    ],
  },
  {
    id: "preset_jantar_recompo",
    name: "Jantar Leve (Patinho Moído + Batata Doce + Brócolis + Azeite)",
    mealSlot: "dinner",
    totalCalories: 435,
    totalProteinG: 32.5,
    totalCarbsG: 36,
    totalFatG: 17.1,
    items: [
      { foodId: "f_patinho", foodName: "Carne Moída / Patinho", portionQty: 1, portionLabel: "1 porção (100g)", calories: 185, proteinG: 28, carbsG: 0, fatG: 6.5 },
      { foodId: "f_batata_doce", foodName: "Batata Doce Cozida", portionQty: 1, portionLabel: "1 unidade média (150g)", calories: 130, proteinG: 2, carbsG: 30, fatG: 0.2 },
      { foodId: "f_brocolis", foodName: "Brócolis no Vapor", portionQty: 1, portionLabel: "1 xícara (90g)", calories: 30, proteinG: 2.5, carbsG: 6, fatG: 0.4 },
      { foodId: "f_azeite", foodName: "Azeite de Oliva Extra Virgem", portionQty: 1, portionLabel: "1 colher de sopa (10ml)", calories: 90, proteinG: 0, carbsG: 0, fatG: 10 },
    ],
  },
];

export interface WorkoutTemplate {
  id: string;
  name: string;
  focus: string;
  category: "Strength" | "Hypertrophy" | "Cardio" | "Recovery";
  estimatedMinutes: number;
  exercises: {
    name: string;
    muscleGroup: string;
    equipment: string;
    sets: number;
    reps: string;
    suggestedWeightKg: number;
  }[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "wt_push",
    name: "Treino A // Peito, Ombros & Tríceps (Empurrar)",
    focus: "Peitoral, Deltoide Anterior/Lateral e Tríceps",
    category: "Hypertrophy",
    estimatedMinutes: 50,
    exercises: [
      { name: "Supino Reto com Barra", muscleGroup: "Peitoral", equipment: "Barra & Banco", sets: 3, reps: "8-10", suggestedWeightKg: 60 },
      { name: "Supino Inclinado com Halteres", muscleGroup: "Peitoral Superior", equipment: "Halteres", sets: 3, reps: "10-12", suggestedWeightKg: 20 },
      { name: "Desenvolvimento com Halteres", muscleGroup: "Ombros (Deltoides)", equipment: "Halteres", sets: 3, reps: "10-12", suggestedWeightKg: 16 },
      { name: "Elevação Lateral de Ombros", muscleGroup: "Ombros Lateral", equipment: "Halteres", sets: 3, reps: "12-15", suggestedWeightKg: 8 },
      { name: "Tríceps Corda na Polia", muscleGroup: "Tríceps", equipment: "Polia", sets: 3, reps: "12-15", suggestedWeightKg: 25 },
    ],
  },
  {
    id: "wt_pull",
    name: "Treino B // Costas, Bíceps & Posterior de Ombro (Puxar)",
    focus: "Dorsais, Trapézio, Bíceps e Romboides",
    category: "Hypertrophy",
    estimatedMinutes: 50,
    exercises: [
      { name: "Puxada Alta no Pulley (ou Barra Fixa)", muscleGroup: "Costas / Dorsais", equipment: "Polia", sets: 3, reps: "8-10", suggestedWeightKg: 50 },
      { name: "Remada Baixa com Triângulo", muscleGroup: "Costas / Densidade", equipment: "Polia", sets: 3, reps: "10-12", suggestedWeightKg: 45 },
      { name: "Crucifixo Invertido", muscleGroup: "Posterior de Ombro", equipment: "Halteres", sets: 3, reps: "12-15", suggestedWeightKg: 7 },
      { name: "Rosca Direta com Barra", muscleGroup: "Bíceps", equipment: "Barra W", sets: 3, reps: "10-12", suggestedWeightKg: 24 },
      { name: "Rosca Martelo com Halteres", muscleGroup: "Braquial & Bíceps", equipment: "Halteres", sets: 3, reps: "12-15", suggestedWeightKg: 12 },
    ],
  },
  {
    id: "wt_legs",
    name: "Treino C // Pernas Completas & Abdômen",
    focus: "Quadríceps, Posterior de Coxa, Glúteos e Panturrilha",
    category: "Hypertrophy",
    estimatedMinutes: 55,
    exercises: [
      { name: "Agachamento Livre com Barra", muscleGroup: "Quadríceps & Glúteos", equipment: "Barra Olímpica", sets: 3, reps: "8-10", suggestedWeightKg: 70 },
      { name: "Leg Press 45º", muscleGroup: "Pernas Completo", equipment: "Aparelho Leg Press", sets: 3, reps: "10-12", suggestedWeightKg: 140 },
      { name: "Cadeira Extensora", muscleGroup: "Quadríceps", equipment: "Aparelho", sets: 3, reps: "12-15", suggestedWeightKg: 40 },
      { name: "Mesa Flexora", muscleGroup: "Posterior de Coxa", equipment: "Aparelho", sets: 3, reps: "10-12", suggestedWeightKg: 35 },
      { name: "Elevação de Panturrilha em Pé", muscleGroup: "Panturrilhas", equipment: "Degrau / Halter", sets: 4, reps: "15-20", suggestedWeightKg: 20 },
      { name: "Prancha Abdominal", muscleGroup: "Abdômen Core", equipment: "Colchonete", sets: 3, reps: "45 seg", suggestedWeightKg: 0 },
    ],
  },
  {
    id: "wt_fullbody",
    name: "Treino Full Body // Corpo Inteiro Eficiente",
    focus: "Grandes Grupos em 1 Única Sessão (Ideal 2 a 3x por semana)",
    category: "Strength",
    estimatedMinutes: 45,
    exercises: [
      { name: "Agachamento com Halteres ou Barra", muscleGroup: "Pernas", equipment: "Halteres / Barra", sets: 3, reps: "10-12", suggestedWeightKg: 40 },
      { name: "Supino Reto ou Flexão de Braço", muscleGroup: "Peitoral", equipment: "Banco ou Solo", sets: 3, reps: "10-12", suggestedWeightKg: 50 },
      { name: "Remada Curvada com Halteres", muscleGroup: "Costas", equipment: "Halteres", sets: 3, reps: "10-12", suggestedWeightKg: 16 },
      { name: "Desenvolvimento de Ombros", muscleGroup: "Ombros", equipment: "Halteres", sets: 3, reps: "10-12", suggestedWeightKg: 12 },
      { name: "Prancha Abdominal Isométrica", muscleGroup: "Core", equipment: "Solo", sets: 3, reps: "40 seg", suggestedWeightKg: 0 },
    ],
  },
  {
    id: "wt_home",
    name: "Treino em Casa // Calistenia & Halteres",
    focus: "Sem Aparelhos Complexos (Peso do Corpo + Halteres)",
    category: "Strength",
    estimatedMinutes: 40,
    exercises: [
      { name: "Agachamento Livre (Peso Corporal ou Segurando Halter)", muscleGroup: "Pernas", equipment: "Peso do corpo", sets: 3, reps: "15-20", suggestedWeightKg: 0 },
      { name: "Flexão de Braços (Solo)", muscleGroup: "Peitoral & Tríceps", equipment: "Solo", sets: 3, reps: "10-15", suggestedWeightKg: 0 },
      { name: "Afundo / Passada com Halteres", muscleGroup: "Glúteos & Pernas", equipment: "Halteres", sets: 3, reps: "12 cada perna", suggestedWeightKg: 10 },
      { name: "Desenvolvimento de Ombros em Pé", muscleGroup: "Ombros", equipment: "Halteres ou Mochila", sets: 3, reps: "12-15", suggestedWeightKg: 8 },
      { name: "Abdominal Crunch no Solo", muscleGroup: "Abdômen", equipment: "Colchonete", sets: 3, reps: "20", suggestedWeightKg: 0 },
    ],
  },
];

export function calculateSuggestedPlans(
  questionnaire: Partial<HealthQuestionnaireData>,
  userBiometrics: { weightKg: number; heightCm: number; age: number; gender: "male" | "female" }
) {
  const weight = userBiometrics.weightKg || 75;
  const height = userBiometrics.heightCm || 175;
  const age = userBiometrics.age || 28;
  const isMale = userBiometrics.gender !== "female";

  // 1. TMB (Mifflin-St Jeor)
  let bmr = 10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161);

  // 2. Activity multiplier based on days available
  const days = questionnaire.daysAvailable || 3;
  let activityMultiplier = 1.2;
  if (days === 2) activityMultiplier = 1.25;
  else if (days === 3) activityMultiplier = 1.35;
  else if (days === 4) activityMultiplier = 1.45;
  else if (days >= 5) activityMultiplier = 1.55;

  let tdee = Math.round(bmr * activityMultiplier);

  // Adjust for primary goal
  const goal = questionnaire.primaryGoal || "recomposition";
  let targetCalories = tdee;
  let proteinRatio = 2.0;

  if (goal === "hypertrophy") {
    targetCalories = tdee + 250;
    proteinRatio = 2.0;
  } else if (goal === "fat_loss") {
    targetCalories = Math.max(1400, tdee - 450);
    proteinRatio = 2.2; // higher protein for muscle retention in deficit
  } else if (goal === "recomposition") {
    targetCalories = tdee - 150;
    proteinRatio = 2.1;
  } else {
    // conditioning
    targetCalories = tdee;
    proteinRatio = 1.8;
  }

  const targetProteinG = Math.round(weight * proteinRatio);
  const targetFatG = Math.round(weight * 0.85);
  const caloriesFromProteinAndFat = targetProteinG * 4 + targetFatG * 9;
  const remainingCaloriesForCarbs = Math.max(200, targetCalories - caloriesFromProteinAndFat);
  const targetCarbsG = Math.round(remainingCaloriesForCarbs / 4);
  const targetWaterMl = Math.round(weight * 38);

  // Suggested workout split
  let recommendedWorkoutIds: string[] = [];
  if (questionnaire.equipment === "bodyweight" || questionnaire.equipment === "home_dumbbells") {
    recommendedWorkoutIds = ["wt_home", "wt_fullbody"];
  } else if (days <= 3) {
    recommendedWorkoutIds = ["wt_fullbody", "wt_push", "wt_pull"];
  } else if (days === 4) {
    recommendedWorkoutIds = ["wt_push", "wt_pull", "wt_legs", "wt_fullbody"];
  } else {
    recommendedWorkoutIds = ["wt_push", "wt_pull", "wt_legs"];
  }

  return {
    targetCalories,
    targetProteinG,
    targetCarbsG,
    targetFatG,
    targetWaterMl,
    recommendedWorkoutIds,
  };
}
