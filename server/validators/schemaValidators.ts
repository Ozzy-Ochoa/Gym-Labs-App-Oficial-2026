// GL API SCHEMA VALIDATORS // LABCORE SAFETY LAYER
// Protects backend against malformed payloads, injection, NaN, and negative outliers.

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export function validateRegisterInput(body: any): ValidationResult<{
  handle: string;
  name: string;
  email: string;
  password: string;
  totpSecret?: string;
  role?: "admin" | "operator" | "user";
}> {
  const errors: string[] = [];

  if (!body || typeof body !== "object") {
    return { success: false, errors: ["Payload inválido ou vazio."] };
  }

  const handle = String(body.handle || "").trim();
  if (!handle || handle.length < 3 || handle.length > 32) {
    errors.push("Identificador (handle) deve conter entre 3 e 32 caracteres alfanuméricos.");
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
    errors.push("Handle contém caracteres inválidos. Utilize apenas letras, números, '_' e '-'.");
  }

  const name = String(body.name || handle).trim();
  if (name.length < 2 || name.length > 64) {
    errors.push("Nome deve conter entre 2 e 64 caracteres.");
  }

  const email = String(body.email || `${handle}@gymlabs.local`).trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Endereço de e-mail inválido.");
  }

  const password = String(body.password || "");
  if (password.length < 8) {
    errors.push("Senha deve conter no mínimo 8 caracteres.");
  }
  if (password.length > 128) {
    errors.push("Senha excede limite de segurança de 128 caracteres.");
  }

  const role = body.role === "admin" || body.role === "operator" ? body.role : "user";

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      handle,
      name,
      email,
      password,
      totpSecret: body.totpSecret ? String(body.totpSecret).trim() : undefined,
      role,
    },
  };
}

export function validateLoginInput(body: any): ValidationResult<{
  handleOrEmail: string;
  password: string;
  totpCode?: string;
  clientNonce?: string;
  deviceInfo?: string;
}> {
  const errors: string[] = [];

  if (!body || typeof body !== "object") {
    return { success: false, errors: ["Payload inválido."] };
  }

  const handleOrEmail = String(body.handleOrEmail || "").trim();
  if (!handleOrEmail) {
    errors.push("Identificador ou e-mail é obrigatório.");
  }

  const password = String(body.password || "");
  if (!password) {
    errors.push("Senha é obrigatória.");
  }

  const totpCode = body.totpCode ? String(body.totpCode).trim() : undefined;
  if (totpCode && !/^\d{6}$/.test(totpCode)) {
    errors.push("O código TOTP deve conter exatamente 6 dígitos numéricos.");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      handleOrEmail,
      password,
      totpCode,
      clientNonce: body.clientNonce ? String(body.clientNonce).trim() : undefined,
      deviceInfo: body.deviceInfo ? String(body.deviceInfo).trim() : undefined,
    },
  };
}

export function validateWorkoutSessionInput(body: any): ValidationResult<any> {
  const errors: string[] = [];

  if (!body || typeof body !== "object") {
    return { success: false, errors: ["Sessão de treino inválida."] };
  }

  const title = String(body.title || "").trim();
  if (!title) {
    errors.push("Título do treino é obrigatório.");
  }

  const date = String(body.date || "").trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) {
    errors.push("Data do treino inválida (formato ISO YYYY-MM-DD esperado).");
  }

  const exercises = Array.isArray(body.exercises) ? body.exercises : [];
  if (exercises.length === 0) {
    errors.push("O treino deve conter ao menos 1 exercício.");
  }

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (!ex.name || typeof ex.name !== "string") {
      errors.push(`Exercício na posição ${i + 1} necessita de um nome válido.`);
    }
    const sets = Array.isArray(ex.sets) ? ex.sets : [];
    for (let s = 0; s < sets.length; s++) {
      const set = sets[s];
      const weight = Number(set.weight);
      const reps = Number(set.reps);
      if (isNaN(weight) || weight < 0 || weight > 600) {
        errors.push(`Carga inválida no exercício "${ex.name}" (deve estar entre 0 e 600 kg).`);
      }
      if (isNaN(reps) || reps < 0 || reps > 200) {
        errors.push(`Repetições inválidas no exercício "${ex.name}" (deve estar entre 0 e 200).`);
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: body };
}

export function validateBodyMetricInput(body: any): ValidationResult<any> {
  const errors: string[] = [];

  if (!body || typeof body !== "object") {
    return { success: false, errors: ["Métricas corporais inválidas."] };
  }

  if (body.weight !== undefined) {
    const w = Number(body.weight);
    if (isNaN(w) || w < 20 || w > 400) {
      errors.push("Peso corporal deve estar entre 20 kg e 400 kg.");
    }
  }

  if (body.height !== undefined) {
    const h = Number(body.height);
    if (isNaN(h) || h < 80 || h > 260) {
      errors.push("Estatura deve estar entre 80 cm e 260 cm.");
    }
  }

  if (body.bodyFat !== undefined && body.bodyFat !== null) {
    const bf = Number(body.bodyFat);
    if (isNaN(bf) || bf < 2 || bf > 70) {
      errors.push("Percentual de gordura corporal deve estar entre 2% e 70%.");
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: body };
}

export function validateIntelligenceInput(body: any): ValidationResult<{
  query: string;
  telemetry?: any;
}> {
  const errors: string[] = [];

  if (!body || typeof body !== "object") {
    return { success: false, errors: ["Payload de inteligência inválido."] };
  }

  const query = String(body.query || "").trim();
  if (!query) {
    errors.push("A consulta científica (query) é obrigatória.");
  }
  if (query.length > 1000) {
    errors.push("A consulta excede o limite de 1.000 caracteres.");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { query, telemetry: body.telemetry } };
}
