// // chatbot.js
// import express from "express";
// import { SessionsClient } from "@google-cloud/dialogflow";
// import { GoogleGenAI } from "@google/genai";
// import cors from "cors";
// import fs from "fs";
// import path from "path";

// const router = express.Router();
// router.use(cors());

// // Load Dialogflow service account credentials
// const CREDENTIALS = JSON.parse(
//     fs.readFileSync(path.join(process.cwd(), "credentials/dialogflow-key.json"))
// );

// // Initialize Gemini client
// const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAn7uIs6g2QoUhbe9XmesXWXf3ymlwEf90";
// const ai = new GoogleGenAI({ apiKey });
// console.log(`[INIT] Gemini API Key: ${apiKey ? "Set" : "Using Environment/Injected Key"}`);

// // Initialize Dialogflow client
// const client = new SessionsClient({
//     credentials: {
//         client_email: CREDENTIALS.client_email,
//         private_key: CREDENTIALS.private_key,
//     },
//     projectId: CREDENTIALS.project_id,
// });



// async function getGeminiResponseWithSearch(userQuery) {
//     console.log(`[GEMINI] Calling API for query: "${userQuery}"`);

//     if (!userQuery) {
//         return "❓ I need a specific question to search for health information.";
//     }

//     // Reduced max length to 600 characters for high compatibility
//     const MAX_CHAR_LENGTH = 600;
//     const systemPrompt = `You are a friendly, informative, and cautious health assistant. Provide a very concise, summary-style explanation (under ${MAX_CHAR_LENGTH} characters total) to the user's health query. Always remind the user that you are not a doctor and they must consult a healthcare professional for diagnosis or treatment. Start your response with an appropriate emoji (e.g., 💡).`;

//     try {
//         const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
//         const response = await model.generateContent([systemPrompt, userQuery].join("\n\n"));

//         let generatedText = response.response?.text() || "❓ I couldn't generate a clear answer.";

//         // --- HARD TRUNCATION LOGIC ---
//         if (generatedText.length > MAX_CHAR_LENGTH) {
//             generatedText = generatedText.substring(0, MAX_CHAR_LENGTH - 3) + '...';
//             console.warn(`[GEMINI] Warning: Response was truncated to ${MAX_CHAR_LENGTH} chars.`);
//         }
//         // ---------------------------

//         console.log(`[GEMINI] Success. Final response length: ${generatedText.length}`);

//         return generatedText;

//     } catch (err) {
//         console.error("!!! GEMINI API CALL FAILED !!!", err);
//         // This is the user-facing error message
//         return "⚠️ Sorry, I encountered an issue fetching real-time health information. Please try again or consult a reliable health website.";
//     }
// }




// router.post("/dialogflow", async (req, res) => {
//     const { message, sessionId } = req.body;
//     console.log(`\n[API] Received message: "${message}" for session: ${sessionId}`);

//     const sessionPath = client.projectAgentSessionPath(
//         CREDENTIALS.project_id,
//         sessionId
//     );

//     const request = {
//         session: sessionPath,
//         queryInput: {
//             text: {
//                 text: message,
//                 languageCode: "en-US",
//             },
//         },
//     };

//     try {
//         const responses = await client.detectIntent(request);
//         const result = responses[0].queryResult;
//         console.log(`[DIALOGFLOW] Intent Matched: ${result.intent.displayName}`);
//         console.log(`[DIALOGFLOW] Response text: ${result.fulfillmentText}`);
//         let reply = result.fulfillmentText || "";
//         const isFallback = result.intent?.isFallback === true;

//         // Simple symptom keyword fallback (helps when agent misses)
//         const text = (message || "").toLowerCase();
//         const symptomAdvice = () => {
//             return (
//                 "😌 General advice: stay well-hydrated, rest, and consider OTC paracetamol/ibuprofen if suitable. " +
//                 "Seek care if symptoms worsen, persist >48-72h, very high fever (>102°F), chest pain, or difficulty breathing."
//             );
//         };

//         if (!reply || isFallback) {
//             // Heuristic routing
//             if (/\bfever\b/.test(text)) {
//                 reply = `🤒 You mentioned fever. ${symptomAdvice()}`;
//             } else if (/\bcough\b/.test(text)) {
//                 reply = `😷 You mentioned cough. ${symptomAdvice()}`;
//             } else if (/what is (cancer|tuberculosis|tb)\b/.test(text)) {
//                 try {
//                     reply = await getGeminiResponseWithSearch(message);
//                 } catch (_) {
//                     reply = "💡 Cancer and tuberculosis are medical conditions best explained by reliable sources. Please consult your doctor for diagnosis.";
//                 }
//             } else {
//                 // Final fallback → Gemini grounded answer
//                 try {
//                     reply = await getGeminiResponseWithSearch(message);
//                 } catch (e) {
//                     console.warn('[GEMINI FALLBACK ERROR]', e?.message);
//                     reply = "I missed that, say that again?";
//                 }
//             }
//         }

//         res.json({ reply });
//     } catch (err) {
//         console.error("ERROR in /dialogflow route:", err);
//         res.status(500).json({ reply: "Dialogflow request failed" });
//     }
// });


// router.post("/webhook", async (req, res) => {
//     try {
//         const body = req.body;
//         const parameters = body.queryResult.parameters;
//         const intent = body.queryResult.intent.displayName;

//         console.log(`[WEBHOOK] Intent received: ${intent}`);
//         console.log(`[WEBHOOK] Parameters: ${JSON.stringify(parameters)}`);

//         // Shared variables for user input and response logic
//         const userQueryText = body.queryResult.queryText;
//         let responseText = "";

//         // ===========================================
//         // 🚨 INTENT 1: MEDICINE MISSED LOGIC (Specific/High Priority)
//         // ===========================================
//         if (intent === "MedicineMissed") {
//             const medicineCanonical = parameters["MedicineType"];
//             const medicineToUseInResponse = medicineCanonical || userQueryText.toLowerCase().includes('missed my') ? 'your medicine' : 'a dose';

//             if (!medicineCanonical) {
//                 responseText = "💊 Oh dear! Which specific medicine did you miss taking? Knowing the drug is key.";
//             } else {
//                 const medLower = medicineCanonical.toLowerCase();

//                 const lowRiskMeds = [
//                     "paracetamol", "ibuprofen", "aspirin", "cetirizine", "loperamide"
//                 ];
//                 const highRiskMeds = [
//                     "rifampicin", "isoniazid", "tb", "tuberculosis", "metformin", "warfarin", "insulin"
//                 ];
//                 const mediumRiskMeds = [
//                     "amoxicillin", "omeprazole", "antibiotic", "birth control"
//                 ];

//                 if (highRiskMeds.some(med => medLower.includes(med))) {
//                     responseText = `🚨 **URGENT Action Required** for **${medicineCanonical}**: Missing this type of medication can seriously impact your treatment. **Please call your doctor or pharmacist right away** for specific instructions. Do not take a double dose.`;
//                 } else if (mediumRiskMeds.some(med => medLower.includes(med))) {
//                     responseText = `🔔 For **${medicineCanonical}**, the advice can vary greatly. Check the **patient leaflet** or call your healthcare provider. It’s always safest to get personalized advice on missed doses.`;
//                 } else if (lowRiskMeds.some(med => medLower.includes(med))) {
//                     responseText = `✅ It's usually fine if you missed a dose of **${medicineCanonical}**. Take it as soon as you remember, but skip it if it's almost time for your next dose. **Never double the dose.**`;
//                 }
//                 else {
//                     responseText = `🧐 I'm not familiar with **${medicineCanonical}**. For your safety, **consult your doctor or pharmacist** for the safest advice on the missed dose.`;
//                 }

//             }
//         }

//         // ===========================================
//         // 🚨 INTENT 2: REPORT SYMPTOMS LOGIC (Specific/High Priority)
//         // ===========================================
//         else if (intent === "ReportSymptoms") {
//             // FIX: Use the full query text if no parameter is found, to handle complex symptom names
//             const symptomCanonical = parameters["SymptomType"];
//             const symptomQuery = symptomCanonical || userQueryText;
//             const symptomLower = symptomQuery.toLowerCase();

//             if (!symptomCanonical && symptomLower.length < 5) {
//                 responseText = "🤔 What specific symptoms are you experiencing today? (e.g., severe headache, persistent fever)";
//             } else {

//                 const minorSymptoms = ["headache", "cold", "sore throat", "sneezing", "running nose", "migraine", "stuffy nose"];
//                 const cautionSymptoms = ["fever", "temperature", "stomach ache", "abdominal pain", "nausea", "vomiting", "diarrhea", "chest pain", "shortness of breath"];

//                 if (cautionSymptoms.some(symptom => symptomLower.includes(symptom))) {
//                     responseText = `🚨 **Please Monitor Closely** 🚨

// You mentioned **${symptomQuery}**. If this symptom is severe or sudden, seek immediate medical attention.

// **General Self-Care Tips:**
// * Stay **well-hydrated** (water, electrolyte drinks). 💧
// * Rest is essential. 🛌
// * Use over-the-counter pain relief (Paracetamol, Ibuprofen) as directed for pain/fever.

// **⚠️ Seek Immediate Help If:**
// * Symptoms rapidly worsen.
// * Fever persists beyond 72 hours or spikes above 102°F.
// * You have difficulty breathing or severe, unrelenting pain.

// **Always contact your primary care physician (PCP) if you are concerned.**`;

//                 } else if (minorSymptoms.some(symptom => symptomLower.includes(symptom))) {
//                     responseText = `😌 I hear you're feeling unwell with a ${symptomQuery}. Here are simple steps to help:

// **Home & OTC Suggestions:**
// 1.  **Hydration:** Keep sipping fluids.
// 2.  **Sore Throat:** Lozenges and warm salt water rinses can help.
// 3.  **Aches:** Simple pain relievers like Paracetamol or Ibuprofen.

// **Remember:** These are general suggestions. If your symptoms worsen or persist for more than 48 hours, please consult a medical professional.`;
//                 } else {
//                     // Fallback to General Health Query if the symptom is unrecognized or complex (e.g., "symptoms of tuberculosis")
//                     console.log(`[WEBHOOK] Unrecognized symptom: "${symptomQuery}". Routing to General Health Query (Gemini).`);
//                     responseText = await getGeminiResponseWithSearch(userQueryText);
//                 }
//             }

//         }

//         // ===========================================
//         // 🚨 CATCH-ALL: GENERAL HEALTH QUERY & FALLBACK LOGIC
//         // ===========================================
//         else {

//             console.log(`[WEBHOOK] Routing to General Health Query (Gemini).`);

//             // Use the full user query text for maximum context
//             const fullQuery = userQueryText;

//             // Use the Gemini API to get a grounded response (await here)
//             responseText = await getGeminiResponseWithSearch(fullQuery);
//         }

//         // Send fulfillment response to Dialogflow
//         return res.json({
//             fulfillmentText: responseText,
//         });

//     } catch (err) {
//         console.error("!!! FATAL WEBHOOK PROCESSING ERROR !!!", err);
//         return res.status(500).json({
//             fulfillmentText: "An internal server error occurred while processing your request."
//         });
//     }
// });


// export default router;
