import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  authenticateUser,
  registerUser,
  validateSession,
  revokeSession,
  refreshSession,
} from "./server/authService";
import {
  buildAIContext,
  generateDeterministicResponse,
} from "./src/domain/aiContextBuilder";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Security Headers Middleware
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

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

// -------------------------------------------------------------------
// 1. HEALTH & AUDIT
// -------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    system: "GL — GYM LABS // LABCORE",
    version: "2.0.0",
    architecture: "Multi-Tier Server Auth & Deterministic Scientific Engine",
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------------
// 2. PRODUCTION AUTH SERVICE API (Requirement 36)
// -------------------------------------------------------------------

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { handle, name, email, password, totpSecret, role } = req.body;
    if (!handle || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
    }

    const result = await registerUser({
      handle,
      name: name || handle,
      email: email || `${handle}@gymlabs.local`,
      password,
      totpSecret,
      role,
    });

    return res.status(201).json({
      success: true,
      user: result.user,
      token: result.token,
      message: "Operador registrado com sucesso no enclave de segurança.",
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Erro no registro de usuário." });
  }
});

// POST /api/auth/login (with brute-force protection and rate-limiting)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { handleOrEmail, password, totpCode, clientNonce, deviceInfo } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";

    if (!handleOrEmail || !password) {
      return res.status(400).json({ error: "Identificador e senha são obrigatórios." });
    }

    const result = await authenticateUser({
      handleOrEmail,
      password,
      totpCode,
      clientNonce,
      deviceInfo: deviceInfo || req.headers["user-agent"] || "Terminal Desktop",
      ip,
    });

    return res.json({
      success: true,
      user: result.user,
      token: result.token,
      expiresAt: result.session.expiresAt,
      nonce: result.session.nonce,
    });
  } catch (err: any) {
    const status = err.message === "TOTP_REQUIRED" ? 403 : 401;
    return res.status(status).json({
      error: err.message || "Falha na autenticação.",
      totpRequired: err.message === "TOTP_REQUIRED",
    });
  }
});

// GET /api/auth/session (Validates token and returns session user)
app.get("/api/auth/session", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de sessão ausente." });
  }

  const token = authHeader.substring(7);
  const validated = validateSession(token);

  if (!validated) {
    return res.status(401).json({ error: "Sessão expirada ou revogada." });
  }

  return res.json({
    authenticated: true,
    user: validated.user,
    session: {
      expiresAt: validated.session.expiresAt,
      lastActiveAt: validated.session.lastActiveAt,
      deviceInfo: validated.session.deviceInfo,
    },
  });
});

// POST /api/auth/refresh (Session extension)
app.post("/api/auth/refresh", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente." });
  }

  const token = authHeader.substring(7);
  const newSession = refreshSession(token);

  if (!newSession) {
    return res.status(401).json({ error: "Impossível renovar sessão expirada." });
  }

  return res.json({
    success: true,
    token: newSession.token,
    expiresAt: newSession.expiresAt,
  });
});

// POST /api/auth/logout (Revocation)
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    revokeSession(token);
  }
  return res.json({ success: true, message: "Sessão revogada com sucesso." });
});

// -------------------------------------------------------------------
// 3. GL INTELLIGENCE PIPELINE (Requirements 30, 31, 32, 33, 34, 35)
// -------------------------------------------------------------------
app.post("/api/intelligence", async (req, res) => {
  try {
    const { query, telemetry } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query is required" });
    }

    // Step 1: Execute scientific context pipeline (Minimal context & Anti-hallucination precomputations)
    const structuredPayload = buildAIContext(query, telemetry);

    const ai = getGeminiClient();

    // If Gemini client is active with valid API key
    if (ai) {
      try {
        const minimalPrompt = `USER INQUIRY: "${query}"

DETECTED INTENT: ${structuredPayload.intent} (${structuredPayload.intentDescription})

PRECOMPUTED SCIENTIFIC METRICS (Validated by GL Scientific Engine):
${JSON.stringify(structuredPayload.precomputedMetrics, null, 2)}

ACADEMIC CITATIONS & STANDARDS (Validated by GL Evidence Engine):
${JSON.stringify(structuredPayload.academicEvidence, null, 2)}

DATA COMPLETENESS & LIMITATIONS:
${
  structuredPayload.missingDataNotes.length > 0
    ? structuredPayload.missingDataNotes.map((n) => `• ${n}`).join("\n")
    : "Biometria e telemetria completas para os parâmetros analisados."
}

MINIMAL ANONYMIZED CONTEXT:
${JSON.stringify(structuredPayload.minimalContext, null, 2)}

INSTRUCTIONS FOR SYNTHESIS:
1. Base your answer STRICTLY on the precalculated metrics and scientific evidence provided above.
2. DO NOT invent unmeasured numbers, studies, or clinical diagnoses.
3. If data is insufficient or missing, state so directly and objectively.
4. Cite the provided scientific sources (e.g., ACSM, Schoenfeld, Morton, Tanaka, AASM) where appropriate.
5. Maintain the GL // LABCORE tone: clean, objective, technical, encouraging without cheerleading clichés.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: minimalPrompt,
          config: {
            systemInstruction:
              "You are GL INTELLIGENCE, the scientific analytical core of GL — GYM LABS (Personal Health Operating System). Design language: GL // LABCORE. Tone: objective, laboratory-grade, mathematically sound. Never invent numbers. Always reference the precomputed metrics and evidence engine provided.",
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
          },
        });

        return res.json({
          source: "gemini-3.8-flash",
          answer: response.text,
          intent: structuredPayload.intent,
          intentDescription: structuredPayload.intentDescription,
          missingDataNotes: structuredPayload.missingDataNotes,
          academicEvidence: structuredPayload.academicEvidence,
          timestamp: new Date().toISOString(),
        });
      } catch (geminiError: any) {
        console.warn(
          "Gemini API call returned error or timed out, activating high-fidelity deterministic fallback:",
          geminiError?.message
        );
      }
    }

    // Step 2: High-Fidelity Deterministic Scientific Fallback (Zero Hallucination)
    const deterministicAnswer = generateDeterministicResponse(structuredPayload);

    return res.json({
      source: "gl-deterministic-scientific-core",
      answer: deterministicAnswer,
      intent: structuredPayload.intent,
      intentDescription: structuredPayload.intentDescription,
      missingDataNotes: structuredPayload.missingDataNotes,
      academicEvidence: structuredPayload.academicEvidence,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process telemetry inquiry" });
  }
});

// -------------------------------------------------------------------
// 4. VITE MIDDLEWARE & SERVER BOOT
// -------------------------------------------------------------------
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
