// GL TRANSPARENT SCIENCE // METODOLOGIA CIENTÍFICA & EVIDÊNCIAS
// Displays formulas, academic references, clinical limits, and evidence levels.

import React, { useState } from "react";
import {
  X,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  Layers,
  Scale,
  Zap,
} from "lucide-react";
import {
  getAllEvidenceEntries,
  EvidenceEntry,
  ScientificCategory,
  EvidenceLevel,
} from "../domain/evidenceEngine";
import { ProvenanceBadge } from "../domain/provenance";

interface ScientificMethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormulaId?: string;
}

export const ScientificMethodologyModal: React.FC<ScientificMethodologyModalProps> = ({
  isOpen,
  onClose,
  initialFormulaId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(initialFormulaId || null);

  if (!isOpen) return null;

  const allEntries = getAllEvidenceEntries();

  const filteredEntries = allEntries.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clinicalContext.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain = selectedDomain === "all" || item.domain === selectedDomain;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesDomain && matchesCategory;
  });

  const getEvidenceLevelBadge = (level: EvidenceLevel) => {
    if (level === "A") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-black border border-white">
          NÍVEL A // META-ANÁLISES & RCTs
        </span>
      );
    }
    if (level === "B") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-600">
          NÍVEL B // COORTE & FISIOLOGIA CONTROLADA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-900 text-zinc-400 border border-zinc-700">
        NÍVEL C // REGRESSÃO POPULACIONAL / CONSENSO
      </span>
    );
  };

  const getCategoryBadge = (category: ScientificCategory) => {
    switch (category) {
      case "FACT":
        return <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-zinc-800 text-white border border-zinc-600">FATO [MEDIÇÃO DIRETA]</span>;
      case "CALCULATED":
        return <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-zinc-900 text-zinc-300 border border-zinc-700">CÁLCULO DETERMINÍSTICO</span>;
      case "ESTIMATE":
        return <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-zinc-900 text-zinc-400 border border-zinc-700">ESTIMATIVA MATEMÁTICA</span>;
      case "INTERPRETATION":
        return <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-zinc-950 text-zinc-400 border border-zinc-800">INTERPRETAÇÃO DE FAIXA</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-zinc-950 text-zinc-500 border border-zinc-800">HIPÓTESE</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-black border-2 border-zinc-700 max-w-4xl w-full flex flex-col max-h-[92vh] hud-corners shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-zinc-700 bg-black">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase block">
                LABCORE EVIDENCE DIRECTORY // CIÊNCIA TRANSPARENTE
              </span>
              <h2 className="font-hud font-bold text-lg sm:text-xl text-white tracking-wider">
                COMO CALCULAMOS? // FÓRMULAS & LIMITAÇÕES
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-banner: Scientific Principle */}
        <div className="bg-zinc-950 border-b border-zinc-800/80 px-5 py-3 text-xs font-mono text-zinc-400 flex items-start gap-2.5 shrink-0">
          <Shield className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
          <div>
            <span className="text-white font-bold uppercase block mb-0.5">
              COMPROMISSO DE TRANSPARÊNCIA METODOLÓGICA
            </span>
            <span>
              O Gym Labs não inventa números nem oculta margens de erro. Toda métrica apresentada no aplicativo é classificada entre <strong className="text-zinc-200">FATO</strong>, <strong className="text-zinc-200">CÁLCULO</strong> e <strong className="text-zinc-200">ESTIMATIVA</strong>, com citação dos artigos acadêmicos originais e delimitação explícita de quando NÃO deve ser utilizada.
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="border-b border-zinc-800 p-4 bg-zinc-900/40 flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, fórmula, autor ou citação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-zinc-800 pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              <option value="all">TODOS OS DOMÍNIOS</option>
              <option value="anthropometry">Antropometria & Composição</option>
              <option value="metabolism">Metabolismo & Gasto Energético</option>
              <option value="training">Carga & Treinamento</option>
              <option value="nutrition">Nutrição & Hidratação</option>
              <option value="cardiovascular">Fisiologia Cardiovascular</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              <option value="all">TODAS CATEGORIAS</option>
              <option value="FACT">Fatos (Medição Direta)</option>
              <option value="CALCULATED">Cálculos Determinísticos</option>
              <option value="ESTIMATE">Estimativas Matemáticas</option>
              <option value="INTERPRETATION">Interpretações de Faixa</option>
            </select>
          </div>
        </div>

        {/* Scrollable List of Evidence Entries */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800 text-zinc-500 font-mono text-xs">
              Nenhuma metodologia encontrada para os filtros selecionados.
            </div>
          ) : (
            filteredEntries.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`border transition-colors ${
                    isExpanded
                      ? "border-zinc-500 bg-zinc-950"
                      : "border-zinc-800 bg-[#080808] hover:border-zinc-700"
                  }`}
                >
                  {/* Item Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                          ID: {item.id}
                        </span>
                        {getCategoryBadge(item.category)}
                        {getEvidenceLevelBadge(item.evidenceLevel)}
                      </div>
                      <h3 className="font-hud font-bold text-base text-white tracking-wide">
                        {item.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-zinc-400">
                        {isExpanded ? "[ RECOLHER DETALHES - ]" : "[ VER EVIDÊNCIA COMPLETA + ]"}
                      </span>
                    </div>
                  </div>

                  {/* Formula Preview Always Visible */}
                  <div className="px-4 pb-3 border-t border-zinc-900 bg-black/60 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="text-zinc-300 flex items-center gap-2 overflow-x-auto">
                      <span className="text-zinc-500">FÓRMULA:</span>
                      <code className="text-white bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                        {item.formula}
                      </code>
                    </div>
                    <div className="text-zinc-500 text-[11px] shrink-0">
                      SAÍDA: <span className="text-zinc-300 font-bold">{item.outputUnit}</span>
                    </div>
                  </div>

                  {/* Expanded Academic & Clinical Deep Dive */}
                  {isExpanded && (
                    <div className="p-5 border-t border-zinc-800 space-y-4 bg-zinc-950 font-mono text-xs text-zinc-300">
                      {/* Insumos */}
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                          1. INSUMOS BIOLÓGICOS UTILIZADOS
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.inputs.map((inp, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]"
                            >
                              • {inp}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Referência Acadêmica */}
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                          2. REFERÊNCIA CIENTÍFICA & LITERATURA
                        </span>
                        <div className="bg-black border border-zinc-800 p-3 text-zinc-200 leading-relaxed text-[11px]">
                          {item.reference}
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-1">
                          Validação Metodológica: {item.evidenceDescription}
                        </span>
                      </div>

                      {/* Limitações Clínicas */}
                      <div>
                        <span className="text-[10px] text-amber-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          3. LIMITAÇÕES CLÍNICAS & MARGENS DE ERRO
                        </span>
                        <ul className="space-y-1.5 pl-2 border-l border-amber-500/40">
                          {item.limitations.map((lim, idx) => (
                            <li key={idx} className="text-zinc-400 text-[11px] leading-relaxed">
                              – {lim}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Contexto e Quando NÃO Utilizar */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="bg-zinc-900/60 border border-zinc-800 p-3">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                            CONTEXTO DE APLICAÇÃO
                          </span>
                          <p className="text-zinc-300 text-[11px] leading-relaxed">
                            {item.clinicalContext}
                          </p>
                        </div>

                        <div className="bg-zinc-900/60 border border-zinc-800 p-3">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1 font-bold">
                            QUANDO NÃO DEVE SER UTILIZADA
                          </span>
                          <p className="text-zinc-300 text-[11px] leading-relaxed">
                            {item.whenNotToUse}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-5 py-3 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 font-mono text-[11px] text-zinc-500">
          <span>GYM LABS SCIENTIFIC STANDARDS // REVISÃO 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white text-black font-bold uppercase hover:bg-zinc-200 transition-colors"
          >
            ENTENDIDO / FECHAR
          </button>
        </div>
      </div>
    </div>
  );
};
