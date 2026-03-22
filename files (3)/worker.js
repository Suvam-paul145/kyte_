/**
 * MedTriageSLM — Web Worker
 * Runs SmolLM2-360M inference via WebLLM off the main thread.
 * Receives symptom text, returns structured JSON triage assessment.
 *
 * Messages IN  (from main thread):
 *   { type: "load" }
 *   { type: "triage", symptom: "..." }
 *
 * Messages OUT (to main thread):
 *   { type: "loading", progress: 0-100, message: "..." }
 *   { type: "ready" }
 *   { type: "result", data: { urgency, confidence, esi_level, ... } }
 *   { type: "error", message: "..." }
 */

importScripts("https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.46/lib/index.js");

const MODEL_ID = "YOUR_USERNAME/medtriage-smollm2-360m";
// Fallback to a compatible base model during development:
const FALLBACK_MODEL = "SmolLM2-360M-Instruct-q4f16_1-MLC";

const SYSTEM_PROMPT = `You are a medical triage assistant deployed in an emergency department.
Classify the patient's symptom description into exactly one urgency tier.

Respond ONLY with a valid JSON object. No preamble, no markdown, no explanation outside the JSON.

Required schema:
{
  "urgency": "EMERGENCY" | "URGENT" | "SEMI_URGENT" | "NON_URGENT",
  "confidence": <float 0.0-1.0>,
  "esi_level": <integer 1-5>,
  "reasoning": "<1-2 sentence clinical reasoning>",
  "recommended_action": "<triage disposition instruction>",
  "red_flags": ["<flag1>", "<flag2>"],
  "do_not_send_home": <boolean>
}

ESI levels: 1=EMERGENCY, 2=URGENT, 3=SEMI_URGENT, 4-5=NON_URGENT`;

let engine = null;

/**
 * Parse model output — handles cases where model wraps JSON in markdown fences
 */
function extractJSON(text) {
  let t = text.trim();
  if (t.startsWith("```json")) t = t.slice(7);
  if (t.startsWith("```")) t = t.slice(3);
  if (t.endsWith("```")) t = t.slice(0, -3);
  t = t.trim();

  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}") + 1;
    if (start !== -1 && end > start) {
      return JSON.parse(t.slice(start, end));
    }
    throw new Error("Could not extract valid JSON from model output");
  }
}

/**
 * Validate the parsed output matches our required schema
 */
function validateOutput(obj) {
  const required = ["urgency", "confidence", "esi_level", "reasoning",
                    "recommended_action", "red_flags", "do_not_send_home"];
  const missing = required.filter(k => !(k in obj));
  if (missing.length > 0) throw new Error(`Missing fields: ${missing.join(", ")}`);

  const validUrgency = ["EMERGENCY", "URGENT", "SEMI_URGENT", "NON_URGENT"];
  if (!validUrgency.includes(obj.urgency))
    throw new Error(`Invalid urgency value: ${obj.urgency}`);

  return obj;
}

/**
 * Load the WebLLM engine
 */
async function loadModel() {
  self.postMessage({ type: "loading", progress: 0, message: "Initialising WebLLM runtime..." });

  const { CreateMLCEngine } = webllm;

  engine = await CreateMLCEngine(FALLBACK_MODEL, {
    initProgressCallback: (info) => {
      const progress = Math.round((info.progress || 0) * 100);
      self.postMessage({
        type: "loading",
        progress,
        message: info.text || `Loading model... ${progress}%`
      });
    }
  });

  self.postMessage({ type: "ready", message: "Model loaded. Ready for triage." });
}

/**
 * Run triage inference
 */
async function runTriage(symptom) {
  if (!engine) {
    self.postMessage({ type: "error", message: "Model not loaded yet." });
    return;
  }

  self.postMessage({ type: "thinking" });

  try {
    const response = await engine.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Patient symptoms: ${symptom}` }
      ],
      temperature: 0.1,
      max_tokens: 300,
      stop: ["}"]
    });

    let rawText = response.choices[0]?.message?.content || "";
    // Ensure closing brace if truncated by stop token
    if (!rawText.trim().endsWith("}")) rawText += "}";

    const parsed = extractJSON(rawText);
    const validated = validateOutput(parsed);

    self.postMessage({ type: "result", data: validated, raw: rawText });

  } catch (err) {
    self.postMessage({
      type: "error",
      message: `Inference failed: ${err.message}`,
      fallback: buildFallbackResponse(symptom)
    });
  }
}

/**
 * Rule-based fallback if model fails (never leaves user without a result)
 */
function buildFallbackResponse(symptom) {
  const text = symptom.toLowerCase();
  const emergencyKeywords = ["chest pain", "stroke", "unconscious", "not breathing",
                              "severe bleeding", "overdose", "anaphylaxis", "seizure"];
  const urgentKeywords = ["fever", "fracture", "broken", "vomiting", "high blood pressure",
                          "asthma", "suicidal", "abdominal pain"];

  let urgency = "NON_URGENT", esi = 5;
  if (emergencyKeywords.some(k => text.includes(k))) { urgency = "EMERGENCY"; esi = 1; }
  else if (urgentKeywords.some(k => text.includes(k))) { urgency = "URGENT"; esi = 2; }

  return {
    urgency,
    confidence: 0.5,
    esi_level: esi,
    reasoning: "Fallback rule-based classification (model inference failed). Clinical review required.",
    recommended_action: "Please seek immediate clinical assessment.",
    red_flags: [],
    do_not_send_home: urgency !== "NON_URGENT",
    _is_fallback: true
  };
}

// Message handler
self.addEventListener("message", async (e) => {
  const { type, symptom } = e.data;
  if (type === "load") await loadModel();
  else if (type === "triage") await runTriage(symptom);
});
