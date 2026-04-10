// services/aiService.js

require("dotenv").config();
const axios = require("axios");

const API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.AI_MODEL || "llama-3.1-8b-instant";

const getAIAnalysis = async (records, weather) => {
  try {
    if (!records || records.length === 0) {
      return {
        riskFactor: 0.6,
        mainDisease: "unknown",
      };
    }

    const prompt = `
You are a disease outbreak prediction engine.

Return ONLY valid JSON:
{"riskFactor": number, "mainDisease": "string"}

RULES:
- riskFactor MUST be between 0.3 and 0.9
- NEVER return 0 or 1
- Increase riskFactor if cases are rising
- Choose mainDisease based on highest + increasing cases

DATA:
${records.map(r => {
  const cases = Number(r.no_of_cases || r.cases) || 0;
  return `${r.disease}: ${cases}`;
}).join(", ")}

WEATHER:
Temp: ${weather?.temp}
Humidity: ${weather?.humidity}

ONLY RETURN JSON.
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let text = response.data.choices[0].message.content;

    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error("No JSON");

    let parsed = JSON.parse(match[0]);

    let risk = Number(parsed.riskFactor);

    // fallback
    if (isNaN(risk) || risk <= 0 || risk > 1) {
      const values = records.map(r => Number(r.no_of_cases || r.cases) || 0);

      const first = values[0] || 1;
      const last = values[values.length - 1] || 1;

      const growth = Math.log((last + 1) / (first + 1));
      risk = 0.5 + Math.min(Math.max(growth, 0), 0.4);
    }

    risk = Math.min(Math.max(risk, 0.3), 0.9);

    return {
      riskFactor: risk,
      mainDisease: parsed.mainDisease || "unknown",
    };

  } catch (err) {
    console.log("❌ AI failed:", err.message);

    return {
      riskFactor: 0.6,
      mainDisease: "unknown",
    };
  }
};

module.exports = { getAIAnalysis };