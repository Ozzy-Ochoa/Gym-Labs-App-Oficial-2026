// GL DATA ARCHITECTURE // LABCORE PROVENANCE ENGINE
// Standards: Real vs Calculated vs Estimated vs Inferred vs Simulated vs Demo

import React from "react";

export type DataProvenance =
  | "REAL"
  | "CALCULATED"
  | "ESTIMATED"
  | "INFERRED"
  | "SIMULATED"
  | "DEMO";

export type DataAvailabilityState =
  | "NO_DATA"
  | "INSUFFICIENT_DATA"
  | "PROCESSING"
  | "AVAILABLE"
  | "ESTIMATED";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";

export interface ProvenanceMetric<T = number> {
  value: T;
  unit: string;
  provenance: DataProvenance;
  source: string;
  recordedAt?: string;
  confidence: number; // 0.0 to 1.0
  notes?: string;
}

export interface FormulaDocumentation {
  name: string;
  formula: string;
  inputs: string[];
  output: string;
  limitations: string;
  scientificReferences: string[];
}

export const PROVENANCE_BADGE_STYLES: Record<
  DataProvenance,
  { label: string; badgeClass: string; tooltip: string }
> = {
  REAL: {
    label: "REAL",
    badgeClass: "bg-white text-black border border-white font-bold",
    tooltip: "Dado medido ou registrado diretamente pelo usuário ou sensor verificado.",
  },
  CALCULATED: {
    label: "CALCULADO",
    badgeClass: "bg-zinc-900 text-zinc-200 border border-zinc-500 font-medium",
    tooltip: "Resultado determinístico derivado matematicamente de variáveis reais.",
  },
  ESTIMATED: {
    label: "ESTIMADO",
    badgeClass: "bg-zinc-950 text-zinc-400 border border-zinc-700 font-medium",
    tooltip: "Valor obtido via modelos de regressão ou aproximações científicas.",
  },
  INFERRED: {
    label: "INFERIDO",
    badgeClass: "bg-zinc-950 text-zinc-500 border border-zinc-800",
    tooltip: "Inferência estatística baseada em tendências agregadas.",
  },
  SIMULATED: {
    label: "SIMULADO",
    badgeClass: "bg-zinc-950 text-zinc-600 border border-dashed border-zinc-800",
    tooltip: "Cenário hipotético para projeção de metas.",
  },
  DEMO: {
    label: "DEMO",
    badgeClass: "bg-zinc-950 text-zinc-600 border border-dashed border-zinc-700",
    tooltip: "Dado demonstrativo referencial. Não reflete a biometria real do usuário.",
  },
};

export interface ProvenanceBadgeProps {
  provenance: DataProvenance;
  formula?: string;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  provenance,
  formula,
  className = "",
}) => {
  const config = PROVENANCE_BADGE_STYLES[provenance] || PROVENANCE_BADGE_STYLES.CALCULATED;
  return (
    <span
      title={formula ? `${config.tooltip} | Fórmula: ${formula}` : config.tooltip}
      className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-none ${config.badgeClass} ${className}`}
    >
      {config.label}
    </span>
  );
};
