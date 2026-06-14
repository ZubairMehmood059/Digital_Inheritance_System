/**
 * Gemini API utility
 * Single wrapper used by all AI features in myDigitalVault.
 * Model: gemini-2.0-flash (fast, free-tier friendly)
 */

// gemini.js — change this line
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

/**
 * callGemini — sends a prompt and returns the text response.
 * @param {string} prompt
 * @param {number} [maxTokens=300]
 * @returns {Promise<string|null>}
 */
export async function callGemini(prompt, maxTokens = 300) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.error("[Gemini] VITE_GEMINI_API_KEY is not set.");
    return null;
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Gemini] API error:", err?.error?.message || res.status);
      return null;
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    console.error("[Gemini] Network error:", err.message);
    return null;
  }
}
