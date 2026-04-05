# 🔐 OrientaMe — Backend Seguro

Proxy serverless para proteger tu API Key de Gemini.
Tu clave **nunca** viaja al navegador del usuario.

---

## 📁 Estructura del proyecto

```
orientame-backend/
├── api/
│   └── gemini.js        ← Función serverless (el proxy seguro)
├── Vocacional_IA.html   ← Tu frontend actualizado
├── vercel.json          ← Configuración de Vercel
├── package.json
├── .env.example         ← Copia esto como .env
└── .gitignore
```

---

## 🚀 Despliegue en Vercel (gratis, 5 minutos)

### Paso 1 — Instalar herramientas

```bash
# Instala Node.js desde https://nodejs.org (versión LTS)
# Luego instala Vercel CLI:
npm install -g vercel
```

### Paso 2 — Obtener tu API Key de Gemini

1. Ve a: https://aistudio.google.com/app/apikey
2. Haz click en **"Create API key"**
3. Cópiala (empieza con `AIza...`)

### Paso 3 — Configurar variables de entorno locales

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env y pega tu API Key
# GEMINI_API_KEY=AIzaSy...tu_key_aqui
```

### Paso 4 — Probar en local

```bash
vercel dev
# El servidor corre en http://localhost:3000
# Abre Vocacional_IA.html en tu navegador — ya funciona con el backend local
```

### Paso 5 — Subir a producción

```bash
# Primera vez: te pedirá hacer login con tu cuenta de Vercel (gratis)
vercel

# Cuando pregunte "Link to existing project?" → N (nuevo proyecto)
# Project name → orientame-backend
# Directory → ./  (enter)

# Cuando termine, copia la URL que te da:
# ej: https://orientame-backend-xyz.vercel.app
```

### Paso 6 — Agregar la API Key en Vercel (¡IMPORTANTE!)

```bash
# Agrega la variable de entorno de forma segura en Vercel:
vercel env add GEMINI_API_KEY
# Pega tu API Key cuando te la pida

vercel env add FRONTEND_URL
# Pega la URL de donde servirás tu HTML
# ej: https://orientame.app  o  https://orientame-backend-xyz.vercel.app

# Redespliega para que tome efecto:
vercel --prod
```

### Paso 7 — Actualizar la URL en tu HTML

Abre `Vocacional_IA.html` y busca esta línea (~línea 75):

```javascript
const BACKEND_URL = "http://localhost:3000"; // en prod: "https://tu-proyecto.vercel.app"
```

Cámbiala por tu URL de producción:

```javascript
const BACKEND_URL = "https://orientame-backend-xyz.vercel.app";
```

---

## ✅ Verificar que funciona

Abre en tu navegador:
```
https://orientame-backend-xyz.vercel.app/api/gemini
```
Debes ver: `{"error":"Método no permitido"}` — eso significa que el servidor está activo.

---

## 🔒 ¿Qué protege este backend?

| Sin backend (antes) | Con backend (ahora) |
|---|---|
| API Key visible en el HTML | API Key solo en el servidor |
| Cualquiera podía robarla | Nadie puede verla |
| Sin límite de uso | Rate limit: 10 req/min por IP |
| Sin control de origen | Solo tu dominio puede llamarlo |

---

## 💡 Siguiente paso: Convertir a App iOS

Con el backend funcionando, sigue la guía de Capacitor para envolver
tu HTML como app nativa de iOS y subirla al App Store.

```bash
npm install -g @ionic/cli
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init OrientaMe com.tuempresa.orientame
npx cap add ios
npx cap open ios   # Abre Xcode
```
