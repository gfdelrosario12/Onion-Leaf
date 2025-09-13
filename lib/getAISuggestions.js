import fetch from "node-fetch";
import dotenv from "dotenv";
import { cache } from "./cache.js";
dotenv.config();

const MODEL = "openai/gpt-oss-120b"; // ✅ Updated model

export async function getAISuggestions({ disease, confidence, imageUrl }) {
  const cacheKey = `ai_${disease.toLowerCase().replace(/\s+/g, "_")}_${confidence}`;

  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const prompt = `
You are an expert plant pathologist specialized in onion diseases.

You must return your answer strictly as a JSON object with the following keys:
{
  "summary": "Short explanation of the disease and its effects",
  "prescription": "Recommended treatment steps and fungicides",
  "mitigation": "Best practices to prevent recurrence"
}

Do not include any commentary, markdown, or additional text — only valid JSON.
`;

  const question = `Detected onion disease: ${disease}\nConfidence: ${confidence}%${imageUrl ? `\nImage: ${imageUrl}` : ""}`;

  try {
    const res = await fetch(process.env.GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: question },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("❌ Groq API request failed:", error);
      return {
        summary: "Unable to fetch AI suggestion right now.",
        prescription: "Please retry later or consult a human expert.",
        mitigation: "Ensure stable network connection and correct API key.",
      };
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";

    console.log("📝 Raw Groq response:", raw);

    try {
      const parsed = JSON.parse(raw);
      const result = {
        summary: parsed.summary?.trim() || "",
        prescription: parsed.prescription?.trim() || "",
        mitigation: parsed.mitigation?.trim() || "",
      };

      cache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.error("⚠️ Failed to parse JSON:", err.message);
      console.error("Raw response:", raw);
      return {
        summary: "AI response could not be parsed.",
        prescription: "Fallback: manual treatment may be required.",
        mitigation: "Retry when the AI service is stable.",
      };
    }
  } catch (err) {
    console.error("❌ getAISuggestions error:", err);
    return {
      summary: "An unexpected error occurred.",
      prescription: "Please retry later.",
      mitigation: "Check server logs for details.",
    };
  }
}
