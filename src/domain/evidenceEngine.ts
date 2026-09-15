// GL EVIDENCE ENGINE // LABCORE SCIENTIFIC INTEGRITY
// Structured repository of scientific formulas, evidence levels, clinical limitations, and academic citations.
// Standards: Real vs Calculated vs Estimated vs Inferred vs Simulated vs Demo

export type ScientificCategory = "FACT" | "CALCULATED" | "ESTIMATE" | "INTERPRETATION" | "HYPOTHESIS";
export type EvidenceLevel = "A" | "B" | "C";
export type ConfidenceTier = "HIGH" | "MODERATE" | "LOW";

export interface EvidenceEntry {
  id: string;
  name: string;
  domain: "anthropometry" | "metabolism" | "training" | "nutrition" | "recovery" | "cardiovascular";
  category: ScientificCategory;
  categoryLabel: string;
  formula: string;
  inputs: string[];
  outputUnit: string;
  reference: string;
  evidenceLevel: EvidenceLevel;
  evidenceDescription: string;
  confidence: ConfidenceTier;
  limitations: string[];
  clinicalContext: string;
  whenNotToUse: string;
}

export const EVIDENCE_DATABASE: Record<string, EvidenceEntry> = {
  BMI: {
    id: "BMI",
    name: "Índice de Massa Corporal (IMC / Quetelet)",
    domain: "anthropometry",
    category: "ESTIMATE",
    categoryLabel: "Estimativa Antropométrica",
    formula: "IMC = Peso (kg) / [Altura (m)]²",
    inputs: ["Peso Corporal (kg)", "Altura (m)"],
    outputUnit: "kg/m²",
    reference: "Quetelet, A. (1835). Sur l'homme et le développement de ses facultés. Adolphe Quetelet; World Health Organization (WHO) Technical Report Series 854.",
    evidenceLevel: "A",
    evidenceDescription: "Padrão epidemiológico de larga escala validado mundialmente para triagem populacional de risco ponderal.",
    confidence: "MODERATE",
    limitations: [
      "Não diferencia massa muscular metabolicamente ativa de tecido adiposo.",
      "Não reflete a distribuição regional de gordura (visceral vs subcutânea).",
      "Indivíduos hipertrofiados ou praticantes de musculação frequentemente são classificados falsamente como sobrepeso ou obesidade.",
      "Idosos com sarcopenia podem apresentar IMC normal apesar de excesso adiposo relativo.",
    ],
    clinicalContext: "Triagem epidemiológica inicial de massa ponderal em relação à estatura. Deve ser combinado com circunferência de cintura e percentual de gordura.",
    whenNotToUse: "Não deve ser utilizado isoladamente para avaliar progresso estético, hipertrofia ou sarcopenia em praticantes de treinamento de força.",
  },

  DEURENBERG_BF: {
    id: "DEURENBERG_BF",
    name: "Percentual de Gordura por Regressão Antropométrica (Deurenberg)",
    domain: "anthropometry",
    category: "ESTIMATE",
    categoryLabel: "Estimativa por Regressão Populacional",
    formula: "Gordura (%) = (1.20 × IMC) + (0.23 × Idade) - (10.8 × Sexo) - 5.4 [Sexo: Masculino = 1, Feminino = 0]",
    inputs: ["IMC (kg/m²)", "Idade (anos)", "Sexo Biológico"],
    outputUnit: "%",
    reference: "Deurenberg, P., Weststrate, J. A., & Seidell, J. C. (1991). Body mass index as a measure of body fatness: age- and sex-specific prediction formulas. British Journal of Nutrition, 65(2), 105-114.",
    evidenceLevel: "B",
    evidenceDescription: "Regressão matemática validada em amostras populacionais holandesas para predição indireta de adiposidade quando métodos diretos inexistem.",
    confidence: "LOW",
    limitations: [
      "Erro padrão de estimativa (SEE) de aproximadamente ±4.1% de gordura corporal.",
      "Superestima adiposidade em indivíduos com elevada densidade muscular (atletas de musculação).",
      "Subestima gordura em indivíduos descondicionados e sedentários com pouca massa muscular.",
      "Não substitui DEXA (Absorciometria por Raio-X de Dupla Energia), pletismografia ou plicometria com protocolo Pollock/Faulkner.",
    ],
    clinicalContext: "Apenas para contexto de referência inicial quando o usuário ainda não possui avaliação física profissional ou exame de bioimpedância/DEXA.",
    whenNotToUse: "Nunca utilize como indicador de perda de gordura milimétrica em fase de corte ou preparação para competição.",
  },

  BMR_MIFFLIN: {
    id: "BMR_MIFFLIN",
    name: "Taxa Metabólica Basal (Mifflin-St Jeor)",
    domain: "metabolism",
    category: "ESTIMATE",
    categoryLabel: "Estimativa Metabólica Indireta",
    formula: "Homem: 10×Peso(kg) + 6.25×Altura(cm) - 5×Idade + 5 | Mulher: 10×Peso(kg) + 6.25×Altura(cm) - 5×Idade - 161",
    inputs: ["Peso (kg)", "Altura (cm)", "Idade (anos)", "Sexo Biológico"],
    outputUnit: "kcal/dia",
    reference: "Mifflin, M. D., St Jeor, S. T., Hill, L. A., Scott, B. J., Daugherty, S. A., & Koh, Y. O. (1990). A new predictive equation for resting energy expenditure in healthy individuals. The American Journal of Clinical Nutrition, 51(2), 241-247.",
    evidenceLevel: "A",
    evidenceDescription: "Considerada pela American Dietetic Association (ADA) como a fórmula preditiva mais precisa para adultos não hospitalizados.",
    confidence: "HIGH",
    limitations: [
      "Precisão dentro de ±10% do gasto basal real aferido por calorimetria indireta em aproximadamente 70% da população.",
      "Não leva em consideração direta a massa livre de gordura (massa magra).",
      "Pode subestimar o gasto basal em indivíduos com massa muscular expressivamente acima da média populacional.",
    ],
    clinicalContext: "Determinação da base calórica mínima necessária para manutenção dos órgãos vitais em repouso absoluto.",
    whenNotToUse: "Não representa o gasto energético total do dia (TDEE). Não deve ser prescrito como meta de consumo diário sem adicionar o fator de atividade.",
  },

  BMR_KATCH: {
    id: "BMR_KATCH",
    name: "Taxa Metabólica Basal Baseada em Massa Magra (Katch-McArdle)",
    domain: "metabolism",
    category: "ESTIMATE",
    categoryLabel: "Estimativa Metabólica Alométrica",
    formula: "TMB = 370 + [21.6 × Massa Livre de Gordura (kg)]",
    inputs: ["Massa Livre de Gordura (kg) = Peso × (1 - Gordura%/100)"],
    outputUnit: "kcal/dia",
    reference: "McArdle, W. D., Katch, F. I., & Katch, V. L. (2006). Essentials of Exercise Physiology. Lippincott Williams & Wilkins.",
    evidenceLevel: "B",
    evidenceDescription: "Superior à fórmula de Harris-Benedict e Mifflin quando a massa livre de gordura é mensurada com alta precisão (DEXA ou hidrostática).",
    confidence: "HIGH",
    limitations: [
      "A confiabilidade do resultado é estritamente condicionada à precisão do percentual de gordura informado.",
      "Se o percentual de gordura foi estimado por fórmula rudimentar, a precisão da TMB cai significativamente.",
    ],
    clinicalContext: "Preferencial para atletas, bodybuilders e praticantes avançados de força com composição corporal atípica.",
    whenNotToUse: "Não utilize se o percentual de gordura for desconhecido ou baseado em estimativa visual aleatória.",
  },

  TDEE_COMPONENTS: {
    id: "TDEE_COMPONENTS",
    name: "Gasto Energético Diário Total (TDEE por Componentes Fisiológicos)",
    domain: "metabolism",
    category: "ESTIMATE",
    categoryLabel: "Modelo Multifatorial de Gasto Energético",
    formula: "TDEE = TMB (Basal ~60-70%) + NEAT (Atividade Espontânea ~15-20%) + EAT (Exercício Físico ~5-15%) + TEF (Efeito Térmico dos Alimentos ~10%)",
    inputs: ["TMB (kcal)", "Nível de Atividade Ocupacional", "Volume e Frequência de Treino"],
    outputUnit: "kcal/dia (faixa aproximada)",
    reference: "Westerterp, K. R. (2013). Physical activity and energy expenditure. British Journal of Nutrition; FAO/WHO/UNU Expert Consultation (2004).",
    evidenceLevel: "A",
    evidenceDescription: "Modelo fisiológico estabelecido da partição energética humana.",
    confidence: "MODERATE",
    limitations: [
      "O NEAT (termogênese sem exercício) apresenta variação interindividual espontânea de até 800 kcal/dia.",
      "Relógios inteligentes e esteiras superestimam o gasto do exercício (EAT) em até 20-40%.",
      "Qualquer valor numérico de TDEE é uma estimativa de partida e deve ser ajustado semanalmente conforme a variação de peso na balança.",
    ],
    clinicalContext: "Definição de superávit ou déficit calórico para objetivos de hipertrofia ou queima de gordura.",
    whenNotToUse: "Nunca trate o número como valor fixo ou absoluto imutável.",
  },

  SRPE_TRAINING_LOAD: {
    id: "SRPE_TRAINING_LOAD",
    name: "Carga Interna de Treinamento por Sessão (sRPE / Foster)",
    domain: "training",
    category: "CALCULATED",
    categoryLabel: "Cálculo de Carga Interna Subjetiva",
    formula: "Carga da Sessão (UA) = Duração do Treino (min) × RPE da Sessão (Escala Borg CR-10 / 1-10)",
    inputs: ["Duração da Sessão em Minutos", "Percepção Subjetiva de Esforço da Sessão (RPE 1-10)"],
    outputUnit: "UA (Unidades Arbitrárias)",
    reference: "Foster, C., Florhaug, J. A., Franklin, J., Gottschall, L., Hrovatin, L. A., Parker, S., Doleshal, P., & Dodge, C. (2001). A new approach to monitoring exercise training. Journal of Strength and Conditioning Research, 15(1), 109-115.",
    evidenceLevel: "A",
    evidenceDescription: "Método amplamente validado no esporte de alto rendimento com forte correlação com frequência cardíaca, lactato sanguíneo e dano muscular.",
    confidence: "HIGH",
    limitations: [
      "O RPE deve ser registrado entre 15 e 30 minutos após a conclusão do treino para refletir o esforço da sessão inteira e não apenas a última série.",
      "Sujeito a modulação emocional, sono deficiente ou estresse psicossocial do dia.",
    ],
    clinicalContext: "Monitoramento de sobrecarga interna psicofisiológica para evitar estagnação e guiar deloads programados.",
    whenNotToUse: "Não utilize se a sessão de treino foi interrompida ou durou menos de 10 minutos.",
  },

  ACWR_RATIO: {
    id: "ACWR_RATIO",
    name: "Relação de Carga Aguda para Crônica (ACWR Desacoplado)",
    domain: "training",
    category: "INTERPRETATION",
    categoryLabel: "Indicador Tendencial de Sobrecarga",
    formula: "ACWR = Carga Aguda (Soma 7 dias) / [Média Semanal Crônica das 4 semanas anteriores (dias 8 a 35)]",
    inputs: ["Histórico diário contínuo de carga de treino (mínimo de 28 a 35 dias)"],
    outputUnit: "Razão Adimensional (ex: 1.15)",
    reference: "Gabbett, T. J. (2016). The training—injury prevention paradox: should athletes be training smarter and harder? British Journal of Sports Medicine, 50(5), 273-280; Windt, J., & Gabbett, T. J. (2019). How do training and competition workloads relate to injury?",
    evidenceLevel: "B",
    evidenceDescription: "Modelo de controle de carga esportiva concebido para monitorar progressão sustentável de volume de esforço.",
    confidence: "MODERATE",
    limitations: [
      "CRÍTICO: O ACWR NÃO prevê lesões de forma determinística individual. Lesões esportivas são multifatoriais (biomecânica, fadiga tecidual, histórico prévio, sono, estresse).",
      "Exige no mínimo 28 dias ininterruptos de telemetria; com menos dados, qualquer cálculo é matematicamente inválido.",
      "Modelos desacoplados evitam artefatos espúrios presentes na versão clássica que incluía a semana aguda dentro da crônica.",
    ],
    clinicalContext: "Acompanhar a suavidade ou agressividade da progressão de volume de treinamento ao longo dos mesociclos.",
    whenNotToUse: "PROIBIDO utilizar com menos de 14 a 28 dias de histórico. NUNCA utilizar frases como 'prevenção de lesão garantida' ou 'risco elevado de lesão'.",
  },

  ONE_REP_MAX_EPLEY: {
    id: "ONE_REP_MAX_EPLEY",
    name: "Estimativa de Força Máxima 1RM (Epley)",
    domain: "training",
    category: "ESTIMATE",
    categoryLabel: "Estimativa Submáxima de Força",
    formula: "1RM Estimado (kg) = Peso Levantado × [1 + (Repetições / 30)]",
    inputs: ["Carga levantada (kg)", "Repetições completadas com técnica válida (1 a 10)"],
    outputUnit: "kg",
    reference: "Epley, B. (1985). Poundage chart. Boyd Epley Workout, Lincoln, NE; LeSuer, D. A., et al. (1997). The accuracy of prediction equations for estimating 1-RM in the bench press, squat, and deadlift. Journal of Strength and Conditioning Research.",
    evidenceLevel: "B",
    evidenceDescription: "Uma das fórmulas submáximas mais replicadas e precisas na literatura de fisiologia neuromuscular.",
    confidence: "HIGH",
    limitations: [
      "Excelente acurácia entre 2 e 8 repetições realizadas até a falha técnica.",
      "A margem de erro cresce exponencialmente em séries com mais de 10-12 repetições devido ao fator de resistência à fadiga.",
      "Não considera velocidade concêntrica da barra.",
    ],
    clinicalContext: "Prescrição de percentuais de carga para blocos de força ou hipertrofia sem necessidade de teste de 1RM com carga real máxima (reduzindo risco articular).",
    whenNotToUse: "Não utilize para séries submáximas distantes da falha muscular (RIR > 3) ou séries com mais de 12 repetições.",
  },

  KARVONEN_HR: {
    id: "KARVONEN_HR",
    name: "Zonas de Frequência Cardíaca por Frequência Cardíaca de Reserva (Karvonen)",
    domain: "cardiovascular",
    category: "CALCULATED",
    categoryLabel: "Cálculo Fisiológico Individualizado",
    formula: "FC Alvo = FC Repouso + [% Intensidade × (FC Máxima - FC Repouso)]",
    inputs: ["FC de Repouso (aferida pela manhã)", "Idade (ou FC Máxima de teste ergoespirométrico)"],
    outputUnit: "bpm",
    reference: "Karvonen, M. J., Kentala, E., & Mustala, O. (1957). The effects of training on heart rate; a longitudinal study. Annales Medicinae Experimentalis et Biologiae Fenniae, 35(3), 307-315.",
    evidenceLevel: "A",
    evidenceDescription: "Significativamente superior ao percentual bruto de FCmax porque ajusta as zonas de treino ao condicionamento cardiovascular de base do indivíduo.",
    confidence: "HIGH",
    limitations: [
      "Se a FC de repouso for digitada de forma incorreta ou após consumo de café/estimulantes, as zonas serão distorcidas.",
      "A FC Máxima baseada em idade (Gellish 207 - 0.7×Idade) tem variabilidade individual de ±10 bpm.",
    ],
    clinicalContext: "Prescrição precisa de treinos em Zona 2 (metabolismo oxidativo/mitocondrial) e Zona 4/5 (limiar de lactato e VO2max).",
    whenNotToUse: "Não utilize se o usuário faz uso de medicamentos cronotrópicos (ex: betabloqueadores).",
  },

  PROTEIN_RANGE_HYPERTROPHY: {
    id: "PROTEIN_RANGE_HYPERTROPHY",
    name: "Faixa Ótima de Proteína Diária para Hipertrofia",
    domain: "nutrition",
    category: "INTERPRETATION",
    categoryLabel: "Faixa de Recomendação por Evidência Científica",
    formula: "Faixa Inicial: 1.6 a 2.2 g de proteína por kg de peso corporal ao dia (podendo chegar a 2.4 g/kg em déficit calórico pronunciado)",
    inputs: ["Peso Corporal (kg)", "Objetivo Nutricional (Hipertrofia vs Déficit)", "Massa Magra"],
    outputUnit: "g/dia",
    reference: "Morton, R. W., et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training. British Journal of Sports Medicine, 52(6), 376-384; Jäger, R., et al. (2017). International Society of Sports Nutrition Position Stand: protein and exercise.",
    evidenceLevel: "A",
    evidenceDescription: "Meta-análise de referência com mais de 1.800 participantes demonstrando que a retenção e ganho de massa muscular atinge platô próximo de 1.62 g/kg/dia, com intervalo de confiança até 2.2 g/kg/dia.",
    confidence: "HIGH",
    limitations: [
      "Em indivíduos com obesidade expressiva (IMC > 30), a prescrição baseada no peso corporal total superestima as necessidades de proteína; deve-se utilizar massa magra ou peso ideal corrigido.",
      "A distribuição da proteína ao longo do dia em 3 a 5 refeições (0.4g/kg por refeição) otimiza a síntese proteica muscular (MPS).",
    ],
    clinicalContext: "Metas de ingestão de macronutrientes para sustentação da síntese proteica e preservação muscular.",
    whenNotToUse: "Não prescrever valores fixos inflexíveis como 'exatamente 160g'. Não substitui orientação de nutricionista clínico em caso de doença renal crônica preexistente.",
  },

  HYDRATION_BASELINE: {
    id: "HYDRATION_BASELINE",
    name: "Faixa de Hidratação Basal Diária",
    domain: "nutrition",
    category: "ESTIMATE",
    categoryLabel: "Estimativa Basal Adaptativa",
    formula: "Faixa Basal = 35 a 45 ml por kg de peso corporal + [400 a 800 ml por hora de exercício extenuante dependendo da taxa de suor]",
    inputs: ["Peso Corporal (kg)", "Duração do Treino (min)", "Temperatura Ambiente e Perda por Sudorese"],
    outputUnit: "ml/dia",
    reference: "American College of Sports Medicine (ACSM) Position Stand (2007). Exercise and Fluid Replacement. Medicine & Science in Sports & Exercise, 39(2), 377-390; EFSA Panel on Dietetic Products (2010). Scientific Opinion on Dietary Reference Values for water.",
    evidenceLevel: "A",
    evidenceDescription: "Recomendação consensual de órgãos internacionais de saúde e fisiologia esportiva.",
    confidence: "MODERATE",
    limitations: [
      "A taxa de sudorese varia entre 0.5 e 2.0 litros por hora entre indivíduos no mesmo ambiente.",
      "A ingestão hídrica deve ser acompanhada da cor da urina (Escala de Armstrong) e sensação de sede.",
      "Ingestão excessiva sem reposição de sódio em eventos de ultra-resistência pode provocar hiponatremia.",
    ],
    clinicalContext: "Ponto de partida seguro para hidratação diária de atletas e praticantes de musculação.",
    whenNotToUse: "Não trate como necessidade fisiológica milimétrica imutável.",
  },
};

export function getEvidenceEntry(formulaId: string): EvidenceEntry | undefined {
  return EVIDENCE_DATABASE[formulaId];
}

export function getAllEvidenceEntries(): EvidenceEntry[] {
  return Object.values(EVIDENCE_DATABASE);
}

export function getEvidenceByDomain(domain: EvidenceEntry["domain"]): EvidenceEntry[] {
  return Object.values(EVIDENCE_DATABASE).filter((item) => item.domain === domain);
}
