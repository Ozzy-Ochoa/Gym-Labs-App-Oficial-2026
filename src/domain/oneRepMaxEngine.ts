// GL 1RM ENGINE // LABCORE SUBMAXIMAL STRENGTH ESTIMATION
// Evidence-based formulas: Epley (1985), Brzycki (1993), Lombardi (1989), Wathan (1994).
// Principle: Submaximal repetitions yield an ESTIMATED 1RM. NEVER call this "1RM real" (which requires laboratory gold-standard 1RM testing protocol).

export interface OneRepMaxEstimate {
  estimated1RmKg: number;
  weightUsedKg: number;
  repsPerformed: number;
  primaryFormula: "Epley" | "Brzycki" | "Lombardi" | "Wathan";
  formulaEquation: string;
  reliability: "HIGH" | "MODERATE" | "LOW";
  statusLabel: string;
  alternatives: {
    formulaName: string;
    valueKg: number;
    equation: string;
  }[];
  disclaimer: string;
  scientificNotes: string[];
}

export function estimateOneRepMax(
  weightKg: number,
  reps: number,
  preferredFormula: "Epley" | "Brzycki" = "Epley"
): OneRepMaxEstimate | null {
  if (!weightKg || weightKg <= 0 || !reps || reps <= 0) {
    return null;
  }

  // If 1 rep, it's the exact load lifted for that single rep (still technically an achievement, but 1RM protocol has specific rest and attempt rules)
  if (reps === 1) {
    return {
      estimated1RmKg: weightKg,
      weightUsedKg: weightKg,
      repsPerformed: 1,
      primaryFormula: "Epley",
      formulaEquation: "1RM = Carga levantada (1 repetição)",
      reliability: "HIGH",
      statusLabel: "1RM ESTIMADO (1 REP)",
      alternatives: [],
      disclaimer:
        "1RM estimado a partir de 1 repetição máxima registrada. Não substitui teste formal sob supervisão técnica.",
      scientificNotes: [
        "A execução de 1 repetição com carga máxima exige aquecimento progressivo e suporte de segurança (spotter).",
      ],
    };
  }

  // 1. Epley Formula: 1RM = Weight * (1 + 0.0333 * Reps) = Weight * (1 + Reps / 30)
  const epleyVal = Math.round(weightKg * (1 + reps / 30));

  // 2. Brzycki Formula: 1RM = Weight / (1.0278 - 0.0278 * Reps)
  let brzyckiVal = 0;
  if (reps < 36) {
    brzyckiVal = Math.round(weightKg / (1.0278 - 0.0278 * reps));
  } else {
    brzyckiVal = epleyVal;
  }

  // 3. Lombardi Formula: 1RM = Weight * Reps^0.10
  const lombardiVal = Math.round(weightKg * Math.pow(reps, 0.1));

  // 4. Wathan Formula: 100 * Weight / (48.8 + 53.8 * e^(-0.075 * Reps))
  const wathanVal = Math.round(
    (100 * weightKg) / (48.8 + 53.8 * Math.exp(-0.075 * reps))
  );

  // Reliability assessment (Reynolds et al. 2006: Submaximal equations are accurate within 1-5 reps, moderately reliable at 6-10 reps, and lose validity beyond 10 reps due to muscle endurance bias)
  let reliability: "HIGH" | "MODERATE" | "LOW" = "HIGH";
  if (reps <= 5) {
    reliability = "HIGH";
  } else if (reps <= 10) {
    reliability = "MODERATE";
  } else {
    reliability = "LOW";
  }

  const primaryValue = preferredFormula === "Brzycki" ? brzyckiVal : epleyVal;
  const primaryEquation =
    preferredFormula === "Brzycki"
      ? "Brzycki (1993): Carga / (1.0278 - 0.0278 × Reps)"
      : "Epley (1985): Carga × (1 + Reps / 30)";

  return {
    estimated1RmKg: primaryValue,
    weightUsedKg: weightKg,
    repsPerformed: reps,
    primaryFormula: preferredFormula,
    formulaEquation: primaryEquation,
    reliability,
    statusLabel: "1RM ESTIMADO (SUBMÁXIMO)",
    alternatives: [
      {
        formulaName: "Epley",
        valueKg: epleyVal,
        equation: "Carga × (1 + Reps / 30)",
      },
      {
        formulaName: "Brzycki",
        valueKg: brzyckiVal,
        equation: "Carga / (1.0278 - 0.0278 × Reps)",
      },
      {
        formulaName: "Wathan",
        valueKg: wathanVal,
        equation: "100 × Carga / (48.8 + 53.8 × e^(-0.075 × Reps))",
      },
      {
        formulaName: "Lombardi",
        valueKg: lombardiVal,
        equation: "Carga × Reps^0.10",
      },
    ],
    disclaimer:
      "1RM ESTIMADO: Este valor é uma projeção submáxima matemática. NUNCA deve ser interpretado como '1RM Real' testado fisicamente.",
    scientificNotes: [
      "A precisão é maior entre 1 e 5 repetições (erro médio < 3%).",
      "Séries acima de 10 repetições sofrem influência expressiva da resistência muscular localizada e capacidade aeróbica, reduzindo a precisão da projeção de força máxima.",
      "A fadiga acumulada em séries anteriores pode subestimar o 1RM.",
    ],
  };
}
