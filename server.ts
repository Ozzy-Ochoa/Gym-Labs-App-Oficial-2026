import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    system: "GL — GYM LABS // LABCORE",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// GL INTELLIGENCE AI Endpoint
app.post("/api/intelligence", async (req, res) => {
  try {
    const { query, telemetry } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const ai = getGeminiClient();

    // If Gemini client is configured with active API Key:
    if (ai) {
      try {
        const prompt = `User Query: "${query}"\n\nUser Health & Performance Telemetry (GL Data Core):\n${JSON.stringify(
          telemetry,
          null,
          2
        )}\n\nProvide an objective, scientific laboratory assessment. Address the question directly based on their metrics. State clear metrics, observable patterns, and actionable adjustments. Remember: correlation is not causation.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction:
              "You are GL INTELLIGENCE, the analytical AI core of GL — GYM LABS (Personal Health Operating System). Design language: GL // LABCORE. Tone: objective, technical, modern, scientific, direct. No childish cheerleader clichés. Always relate findings to specific telemetry (volume, sleep consistency, protein intake, HRV, recovery status). Point out when data is insufficient or when correlation does not imply causality.",
            temperature: 0.3,
          },
        });

        return res.json({
          source: "gemini-3.8-flash",
          answer: response.text,
          timestamp: new Date().toISOString(),
        });
      } catch (geminiError: any) {
        console.warn("Gemini API call failed, generating deterministic fallback:", geminiError?.message);
      }
    }

    // High-precision deterministic analytical engine fallback
    // Real-data analytical engine (deterministic calculations using the incoming telemetry)
    const qLower = (query || "").toLowerCase();
    let answer = "";

    const workouts = Array.isArray(telemetry?.workouts) ? telemetry.workouts : [];
    const sleep = telemetry?.sleep || {};
    const nutrition = telemetry?.nutrition || {};
    const body = telemetry?.bodyMetrics || {};
    const profile = telemetry?.userProfile || {};

    const workoutsCount = workouts.length;
    const totalVolume = workouts.reduce((acc: number, w: any) => acc + (Number(w.totalVolumeKg) || 0), 0);
    const avgSleep = sleep.durationHours ? `${sleep.durationHours}h` : "Sem registros recentes";
    const hrvVal = sleep.hrvMs ? `${sleep.hrvMs} ms` : "Não informado";
    const recoveryScore = sleep.recoveryScore !== undefined ? `${sleep.recoveryScore}/100` : "Não calculado";

    if (qLower.includes("sono") || qLower.includes("sleep") || qLower.includes("recupera")) {
      if (!sleep.durationHours && workoutsCount === 0) {
        answer = `**ANÁLISE DE SONO & RECUPERAÇÃO // GL LABCORE**\n\n- **Status:** Dados insuficientes de sono no período ativo.\n- **Orientação:** Registre ao menos 3 noites de sono no módulo 'SAÚDE' para permitir o cruzamento de dados com seu volume de treino.\n\n*Nota analítica:* O sistema só emite correlações após acúmulo de dados biométricos reais.`;
      } else {
        answer = `**ANÁLISE DE SONO & RECUPERAÇÃO // GL LABCORE**\n\n- **Duração do Último Registro:** ${avgSleep}\n- **Variabilidade da Frequência Cardíaca (HRV):** ${hrvVal}\n- **Índice de Prontidão / Recuperação:** ${recoveryScore}\n- **Sessões de Treino Registradas:** ${workoutsCount} sessões (Volume acumulado: ${totalVolume.toLocaleString("pt-BR")} kg)\n\n*Diretriz Determinística:* Sessões de alta intensidade exigem prontidão adequada. Manter consistência de horários de dormir reduz a variabilidade do SNC (Sistema Nervoso Central).`;
      }
    } else if (qLower.includes("peso") || qLower.includes("weight") || qLower.includes("medidas") || qLower.includes("composição") || qLower.includes("gordura")) {
      const weight = body.weightKg || profile.weightKg || "Não registrado";
      const fat = body.bodyFatPercent ? `${body.bodyFatPercent}%` : "Aguardando bioimpedância ou dobras";
      answer = `**ANÁLISE DE COMPOSIÇÃO CORPORAL & ANTROPOMETRIA**\n\n- **Peso Atual Registrado:** ${weight} kg\n- **Percentual de Gordura:** ${fat}\n- **Massa Magra Estimada:** ${body.leanMassKg ? `${body.leanMassKg} kg` : "Calculado após inserção de dados"}\n\n*Recomendação Científica:* Para avaliação precisa da composição corporal, utilize medições de dobras cutâneas (Jackson-Pollock) ou DEXA. Balanças de bioimpedância simples sofrem influência de hidratação.`;
    } else if (qLower.includes("mês") || qLower.includes("mes") || qLower.includes("treino") || qLower.includes("volume")) {
      answer = `**RELATÓRIO DE CARGA DE TREINO (DADOS REAIS)**\n\n- **Sessões Concluídas:** ${workoutsCount} sessões\n- **Volume Total Levantado:** ${totalVolume.toLocaleString("pt-BR")} kg\n- **Média de Volume por Treino:** ${workoutsCount > 0 ? Math.round(totalVolume / workoutsCount).toLocaleString("pt-BR") : 0} kg\n- **Ingestão Hídrica Registrada:** ${nutrition.waterCurrentMl || 0} ml (Meta: ${nutrition.waterTargetMl || 3000} ml)\n\n*Conclusão Técnica:* A progressão de sobrecarga deve priorizar técnica e proximidade da falha (RIR 1-3). Evite aumentos de volume superiores a 10% semanais para prevenção de tendinopatias.`;
    } else {
      answer = `**DIAGNÓSTICO GL LABCORE // TELEMETRIA INTEGRADA**\n\n- **Usuário:** @${profile.handle || "operador"} (${profile.name || "Não identificado"})\n- **Sessões de Treino Ativas:** ${workoutsCount}\n- **Volume de Treinamento Acumulado:** ${totalVolume.toLocaleString("pt-BR")} kg\n- **Prontidão / Recuperação:** ${recoveryScore}\n- **Meta Calórica Diária:** ${nutrition.calorieTargetKcal || "Não definida"} kcal\n\n*Diretriz:* Faça perguntas específicas como 'Como está meu volume de treino?' ou 'Analise meu sono' para obter relatórios detalhados com base no seu histórico real.`;
    }

    return res.json({
      source: "gl-deterministic-core",
      answer,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process telemetry inquiry" });
  }
});

// Server boot with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GL — Gym Labs server running on port ${PORT}`);
  });
}

startServer();
