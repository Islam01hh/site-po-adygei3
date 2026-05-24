import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// JSON parser
app.use(express.json());

// Initialize Gemini Client safely
const initGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY variable is missing. AI Guide won't work correctly until configured in Settings > Secrets.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = initGemini();

// --- API ROUTES FIRST ---

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/**
 * AI Tourist Guide Endpoint
 */
app.post("/api/ai-guide", async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!ai) {
      return res.status(503).json({ 
        error: "AI Guide is currently offline. Please configure your GEMINI_API_KEY in Settings > Secrets." 
      });
    }

    // Format chat contents
    const contents: any[] = [];
    
    // Add past history if available
    if (history && Array.isArray(history)) {
      history.forEach((turn: any) => {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }]
        });
      });
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: `Вы — профессиональный, увлеченный и гостеприимный экскурсовод по Республике Адыгея (Адыгея, Кавказ).
Ваша цель — помочь туристам спланировать незабываемое путешествие в Адыгею. Вы отлично знаете:
- Природные объекты: плато Лаго-Наки, водопады Руфабго, Хаджохская теснина, гора Фишт, Большой Тхач, Гуамское ущелье, каньон реки Белой, Сахрайские водопады, термальные источники.
- Музеи, традиции и культуру адыгов (черкесов).
- Адыгейскую национальную кухню (адыгейский сыр, щипс, хэлибэ/халюжи, кояж).
- Туристические маршруты: активные походы (знаменитый 30-й маршрут "Через горы к морю"), рафтинг по реке Белой, конные прогулки, джиппинг.
- Безопасность в горах и правила экотуризма.

Отвечайте на русском языке. Ответы должны быть дружелюбными, конкретными, структурированными (используйте списки там, где это уместно, форматирование Markdown). Стимулируйте интерес к путешествию в Адыгею! Старайтесь отвечать емко, увлекательно и познавательно. Избегайте слишком длинных текстов, разбивайте на абзацы.`,
        temperature: 0.7,
      }
    });

    res.json({
      text: response.text || "Извините, я не смог сформулировать ответ. Попробуйте еще раз!",
    });
  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    res.status(500).json({ 
      error: "Произошла ошибка при обращении к искусственному интеллекту.", 
      details: error.message 
    });
  }
});

// --- VITE MIDDLEWAY SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve static frontend assets
    app.use(express.static(distPath));
    // Serve index.html for any remaining routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Adygea Tour Server] Application running at http://0.0.0.0:${PORT}`);
    console.log(`[Adygea Tour Server] Dev environment is ${process.env.NODE_ENV !== "production" ? "ACTIVE" : "PRODUCTION"}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
