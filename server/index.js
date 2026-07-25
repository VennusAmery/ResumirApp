import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.use(cors({
  origin: "*" 
}));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/api/generate", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return res.status(400).json({ error: "Falta el texto de la transcripción." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 65536, 
      },
      contents: [`Aquí está la transcripción de la clase:\n\n${transcript}`],
    });

    res.json({ markdown: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando el resumen. Intenta de nuevo." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});