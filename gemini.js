// api/gemini.js
// Proxy seguro para Gemini API — la clave NUNCA sale del servidor

const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const rateLimitMap = new Map();
const RATE_LIMIT = 15;
const RATE_WINDOW = 60_000;

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

const ALLOWED_TYPES = ["quiz_report", "critical_analysis", "character_chat", "career_chat", "company_chat"];

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });

  const { type, payload } = req.body || {};
  if (!type || !ALLOWED_TYPES.includes(type)) return res.status(400).json({ error: "Tipo inválido." });
  if (!payload) return res.status(400).json({ error: "Payload vacío." });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Error de configuración del servidor." });

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", errText);
      return res.status(geminiRes.status).json({ error: "Error al contactar la IA." });
    }

    return res.status(200).json(await geminiRes.json());

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
