// api/gemini.js
// Proxy seguro para Gemini API — la clave NUNCA sale del servidor

const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ─── Rate Limiting simple en memoria ───────────────────────────────────────
// En producción real usa Upstash Redis o Vercel KV
const rateLimitMap = new Map();
const RATE_LIMIT = 10;        // máx peticiones por IP
const RATE_WINDOW = 60_000;  // en 60 segundos

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - entry.start > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

// ─── Orígenes permitidos (tu dominio en producción) ─────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5500",        // Live Server de VS Code
  process.env.FRONTEND_URL,       // tu dominio en producción, ej: https://orientame.app
].filter(Boolean);

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

// ─── Tipos de prompt permitidos (whitelist) ───────────────────────────────
const ALLOWED_TYPES = ["quiz_report", "critical_analysis", "character_chat", "career_chat", "company_chat"];

// ─── Handler principal ────────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const corsHeaders = getCorsHeaders(origin);

  // Preflight CORS
  if (req.method === "OPTIONS") {
    return res.status(200).set(corsHeaders).end();
  }

  // Solo POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Rate limit por IP
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).set(corsHeaders).json({
      error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
    });
  }

  // Validar body
  const { type, payload } = req.body || {};

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return res.status(400).set(corsHeaders).json({ error: "Tipo de solicitud inválido." });
  }

  if (!payload) {
    return res.status(400).set(corsHeaders).json({ error: "Payload vacío." });
  }

  // API Key del servidor (nunca en el cliente)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY no está configurada en las variables de entorno.");
    return res.status(500).set(corsHeaders).json({ error: "Error de configuración del servidor." });
  }

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return res.status(geminiRes.status).set(corsHeaders).json({
        error: "Error al contactar la IA. Intenta de nuevo.",
      });
    }

    const data = await geminiRes.json();
    return res.status(200).set(corsHeaders).json(data);

  } catch (err) {
    console.error("Error en proxy Gemini:", err);
    return res.status(500).set(corsHeaders).json({ error: "Error interno del servidor." });
  }
}
