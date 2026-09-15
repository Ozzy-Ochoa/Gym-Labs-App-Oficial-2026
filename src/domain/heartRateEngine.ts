// GL HEART RATE ENGINE // LABCORE CARDIOVASCULAR TELEMETRY
// Separates measured physiological values from population-based equations.
// Tanaka et al. (2001); Gellish et al. (2007); Karvonen Heart Rate Reserve (HRR).

export interface HeartRateZone {
  zoneNumber: 1 | 2 | 3 | 4 | 5;
  zoneName: string;
  intensityPercentRange: string;
  minBpm: number;
  maxBpm: number;
  physiologicalFocus: string;
  primaryEnergySystem: string;
}

export interface HeartRateProfile {
  age: number;
  hrMaxMeasured: number | null; // e.g. 195 bpm from CPET or maximal stress test
  hrMaxEstimated: number; // e.g. 208 - 0.7 * age (Tanaka 2001)
  hrMaxUsed: number;
  hrMaxProvenance: "MEASURED_CPET" | "ESTIMATED_TANAKA";
  hrRestMeasured: number | null; // e.g. 52 bpm morning resting heart rate
  methodUsed: "Karvonen_Heart_Rate_Reserve" | "Percent_HRMax";
  zones: HeartRateZone[];
  disclaimer: string;
  limitations: string[];
}

export function calculateHeartRateProfile(params: {
  age?: number | null;
  hrMaxMeasured?: number | null;
  hrRestMeasured?: number | null;
}): HeartRateProfile | null {
  const { age, hrMaxMeasured, hrRestMeasured } = params;

  if (!age || age <= 0) {
    return null;
  }

  // 1. Tanaka Equation (2001): HRmax = 208 - (0.7 * age)
  // More accurate across ages than Fox (220 - age)
  const tanakaEstimated = Math.round(208 - 0.7 * age);

  // Determine which HR max to use for zones
  const isMeasured = Boolean(hrMaxMeasured && hrMaxMeasured > 100 && hrMaxMeasured < 240);
  const hrMaxUsed = isMeasured ? (hrMaxMeasured as number) : tanakaEstimated;
  const hrMaxProvenance = isMeasured ? "MEASURED_CPET" : "ESTIMATED_TANAKA";

  // Check if Karvonen (HRR) can be used (requires resting heart rate)
  const canUseKarvonen = Boolean(
    hrRestMeasured && hrRestMeasured >= 35 && hrRestMeasured < hrMaxUsed - 40
  );
  const hrRest = canUseKarvonen ? (hrRestMeasured as number) : 0;
  const methodUsed = canUseKarvonen
    ? "Karvonen_Heart_Rate_Reserve"
    : "Percent_HRMax";

  // Zones 1 to 5 calculation
  // Z1: 50-60% | Z2: 60-70% | Z3: 70-80% | Z4: 80-90% | Z5: 90-100%
  const zoneBounds = [
    { z: 1 as const, name: "Recuperação Ativa", pctMin: 0.5, pctMax: 0.6, focus: "Oxidação lipídica basal, regeneração metabólica", energy: "Oxidativo / Ácidos graxos livres" },
    { z: 2 as const, name: "Base Aeróbica (Zona 2)", pctMin: 0.6, pctMax: 0.7, focus: "Densidade mitocondrial, capilarização, clearance de lactato", energy: "Oxidativo lipídico e glicolítico leve" },
    { z: 3 as const, name: "Tempo / Ritmo", pctMin: 0.7, pctMax: 0.8, focus: "Capacidade aeróbica submáxima, sustentação de ritmo", energy: "Glicólise aeróbica com queima mista" },
    { z: 4 as const, name: "Limiar Anaeróbico", pctMin: 0.8, pctMax: 0.9, focus: "Tolerância ao acúmulo de íons H+, limiar de lactato (OBLA)", energy: "Glicólise anaeróbica / alta taxa de carboidratos" },
    { z: 5 as const, name: "VO2 Máximo / Potência", pctMin: 0.9, pctMax: 1.0, focus: "Potência aeróbica máxima, recrutamento de fibras tipo IIx", energy: "Glicolítico rápido e fosfagênio" },
  ];

  const zones: HeartRateZone[] = zoneBounds.map((b) => {
    let minBpm = 0;
    let maxBpm = 0;
    if (canUseKarvonen) {
      // Karvonen: Target = Rest + (HRmax - Rest) * Pct
      const hrr = hrMaxUsed - hrRest;
      minBpm = Math.round(hrRest + hrr * b.pctMin);
      maxBpm = Math.round(hrRest + hrr * b.pctMax);
    } else {
      // Standard % HRmax
      minBpm = Math.round(hrMaxUsed * b.pctMin);
      maxBpm = Math.round(hrMaxUsed * b.pctMax);
    }

    return {
      zoneNumber: b.z,
      zoneName: b.name,
      intensityPercentRange: `${Math.round(b.pctMin * 100)}% - ${Math.round(b.pctMax * 100)}%`,
      minBpm,
      maxBpm,
      physiologicalFocus: b.focus,
      primaryEnergySystem: b.energy,
    };
  });

  return {
    age,
    hrMaxMeasured: isMeasured ? hrMaxMeasured! : null,
    hrMaxEstimated: tanakaEstimated,
    hrMaxUsed,
    hrMaxProvenance,
    hrRestMeasured: canUseKarvonen ? hrRestMeasured! : null,
    methodUsed,
    zones,
    disclaimer: isMeasured
      ? "Zonas calculadas a partir de FC Máxima MEDIDA em teste de esforço com validação biomecânica."
      : `Zonas calculadas a partir de FC Máxima ESTIMADA (Tanaka 2001: 208 - 0.7 × ${age} = ${tanakaEstimated} bpm). Valores individuais podem variar ±10 bpm do desvio-padrão populacional.`,
    limitations: [
      "Fórmulas etárias possuem desvio padrão de ±8 a ±12 bpm na população em geral.",
      "A ingestão de estimulantes (cafeína), privação de sono e desidratação aumentam a FC basal e em esforço para a mesma potência mecânica.",
      "Para prescrição atlética de precisão, recomenda-se ergoespirometria laboratorial direta com analisador de gases.",
    ],
  };
}
