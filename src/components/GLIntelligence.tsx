import React, { useState } from "react";
import { Bot, Send, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface GLIntelligenceProps {
  telemetryContext: any;
}

export const GLIntelligence: React.FC<GLIntelligenceProps> = ({ telemetryContext }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ query: string; answer: string; source: string; time: string }[]>([]);

  const sampleChips = [
    "Como foi meu último mês?",
    "Existe alguma relação entre meu sono e meu treinamento?",
    "Como meu peso e medidas evoluíram?",
    "Qual foi meu melhor período de consistência?",
    "Como está minha ingestão proteica média?",
  ];

  const handleSendQuery = async (customText?: string) => {
    const textToSend = customText || query;
    if (!textToSend.trim() || loading) return;

    setLoading(true);
    const newEntry = {
      query: textToSend,
      answer: "",
      source: "analyzing...",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setHistory((prev) => [newEntry, ...prev]);
    setQuery("");

    try {
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          telemetry: telemetryContext,
        }),
      });

      const data = await response.json();
      setHistory((prev) => [
        {
          query: textToSend,
          answer: data.answer || "Nenhum insight gerado para estes parâmetros.",
          source: data.source || "gemini-3.8-flash",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev.slice(1),
      ]);
    } catch (err: any) {
      setHistory((prev) => [
        {
          query: textToSend,
          answer:
            "Falha temporária de conexão com o núcleo de inteligência. Tente novamente em instantes.",
          source: "error",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev.slice(1),
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-3">
        <div>
          <span className="text-[10px] font-dot text-emerald-400 uppercase tracking-widest block mb-1">
            AI TELEMETRY SYNTHESIS // GEMINI 3.8 FLASH ENGINE
          </span>
          <h2 className="font-hud font-bold text-2xl text-white tracking-wider flex items-center gap-2">
            <Bot className="w-5 h-5 text-white" />
            05 // GYM LABS INTELLIGENCE
          </h2>
        </div>
        <span className="text-xs font-mono text-zinc-400 bg-black px-3 py-1 border border-zinc-800">
          [ BASEADO EM TELEMETRIA BIOMÉTRICA ]
        </span>
      </div>

      {/* Input Box */}
      <div className="bg-black border-2 border-zinc-800 p-4 space-y-3.5 hud-corners">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <input
            type="text"
            placeholder="INTERROGAR ECOSSISTEMA (EX: 'COMO FOI MEU ÚLTIMO MÊS?', 'COMPARE MEUS 90 DIAS')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendQuery();
            }}
            className="flex-1 bg-[#050505] border border-zinc-700 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white placeholder:text-zinc-500 focus:outline-none focus:border-white uppercase"
          />
          <button
            onClick={() => handleSendQuery()}
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-bold font-hud text-xs tracking-wider uppercase flex items-center justify-center gap-2 border border-white transition-all shadow-[2px_2px_0px_#27272a]"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>[ CONSULTAR ]</span>
          </button>
        </div>

        {/* Query Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[9px] font-hud text-zinc-500 uppercase mr-1 tracking-wider">
            PRESETS:
          </span>
          {sampleChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(chip)}
              className="text-[10px] font-mono bg-[#050505] hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-500 text-zinc-400 hover:text-white px-2 py-1 transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation / Intelligence Answers Feed */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="bg-black border border-zinc-800 p-8 text-center space-y-2">
            <div className="w-10 h-10 border border-zinc-800 bg-zinc-950 flex items-center justify-center mx-auto text-zinc-500">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-sm font-bold text-white uppercase">
              Nenhuma consulta recente realizada
            </h3>
            <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">
              Digite uma pergunta sobre seus treinos, sono, recuperação ou composição corporal para cruzamento analítico de dados reais.
            </p>
          </div>
        ) : (
          history.map((item, idx) => (
          <div
            key={idx}
            className="bg-black border-2 border-zinc-800 p-4 space-y-3 hud-corners"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-2.5">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                QUERY: "{item.query}"
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {item.time} • {item.source.toUpperCase()}
              </span>
            </div>

            {loading && idx === 0 && !item.answer ? (
              <div className="py-8 flex items-center justify-center gap-2.5 text-xs font-mono text-zinc-400">
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>PROCESSANDO TELEMETRIA CRUZADA VIA GYM LABS INTELLIGENCE ENGINE...</span>
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed bg-[#050505] p-3.5 border border-zinc-900">
                {item.answer}
              </div>
            )}
          </div>
        )))}
      </div>
    </div>
  );
};
