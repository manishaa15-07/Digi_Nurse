// // chatbot.js
// import express from "express";
// import { SessionsClient } from "@google-cloud/dialogflow";
// import { GoogleGenerativeAI } from "@google/generative-ai";
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
// const genAI = new GoogleGenerativeAI(apiKey);
// console.log(`[INIT] Gemini API Key: ${apiKey ? "Set" : "Using Environment/Injected Key"}`);

// // Initialize Dialogflow client with updated authentication
// const client = new SessionsClient({
//     keyFilename: path.join(process.cwd(), "credentials/dialogflow-key.json"),
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
//         const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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

//     try {
//         // Try Dialogflow first
//         const sessionPath = client.projectAgentSessionPath(
//             CREDENTIALS.project_id,
//             sessionId
//         );

//         const request = {
//             session: sessionPath,
//             queryInput: {
//                 text: {
//                     text: message,
//                     languageCode: "en-US",
//                 },
//             },
//         };

//         let reply = "";
//         const text = (message || "").toLowerCase();

//         // Enhanced intelligent response logic
//         if (/\bhi\b|\bhello\b|\bnamaste\b|\bhey\b/.test(text)) {
//             reply = "Namaste! I'm your DigiNurse Assistant. How can I help you today?";
//         } else if (/\bnot feeling good\b|\bnot well\b|\bfeeling sick\b|\bunwell\b/.test(text)) {
//             reply = "😔 I understand you're not feeling well. Can you tell me more about your symptoms? For example, do you have fever, headache, cough, or any other specific symptoms?";
//         } else if (/\bfever\b|\btemperature\b|\bhot\b/.test(text)) {
//             reply = "🤒 You mentioned fever. Here's what you should know:\n\n• Take your temperature to confirm\n• Stay hydrated with water and electrolyte drinks\n• Rest and avoid physical exertion\n• Consider paracetamol/ibuprofen if suitable\n\n⚠️ Seek immediate medical help if:\n• Fever is above 102°F (39°C)\n• Fever persists for more than 3 days\n• You have difficulty breathing or severe headache";
//         } else if (/\bcough\b|\bcoughing\b/.test(text)) {
//             reply = "😷 You mentioned cough. Here are some helpful tips:\n\n• Stay hydrated with warm liquids\n• Use a humidifier or steam inhalation\n• Avoid irritants like smoke\n• Consider honey or throat lozenges\n\n⚠️ See a doctor if:\n• Cough persists for more than 2 weeks\n• You cough up blood\n• You have difficulty breathing";
//         } else if (/\bheadache\b|\bhead pain\b/.test(text)) {
//             reply = "🤕 You mentioned headache. Try these remedies:\n\n• Rest in a quiet, dark room\n• Apply a cold compress to your forehead\n• Stay hydrated\n• Consider paracetamol if suitable\n\n⚠️ Seek immediate help if:\n• Sudden, severe headache\n• Headache with fever and neck stiffness\n• Headache after head injury";
//         } else if (/\bstomach\b|\bstomach ache\b|\bdiarrhea\b|\bnausea\b/.test(text)) {
//             reply = "🤢 You mentioned stomach issues. Here's what might help:\n\n• Stay hydrated with clear fluids\n• Eat bland foods (rice, bananas, toast)\n• Avoid dairy and spicy foods\n• Rest and avoid stress\n\n⚠️ See a doctor if:\n• Symptoms persist for more than 2 days\n• You have severe pain or vomiting\n• Signs of dehydration";
//         } else if (/\bmedicine\b|\bmedication\b|\bpill\b/.test(text)) {
//             reply = "💊 You asked about medicine. I can help with general information, but remember:\n\n• Always consult your doctor before taking new medications\n• Follow dosage instructions carefully\n• Check for drug interactions\n• Store medicines properly\n\nWhat specific medicine information do you need?";
//         } else if (/\bappointment\b|\bdoctor\b|\bvisit\b/.test(text)) {
//             reply = "🏥 You mentioned seeing a doctor. Here's what you should know:\n\n• Prepare a list of your symptoms\n• Note when symptoms started\n• Bring your current medications\n• Write down any questions you have\n\nWould you like help scheduling an appointment or preparing for your visit?";
//         } else if (/\bemergency\b|\bemergency\b|\bsos\b|\bhelp\b/.test(text)) {
//             reply = "🚨 For medical emergencies, please:\n\n• Call emergency services immediately\n• Go to the nearest emergency room\n• Don't wait for online advice\n\nFor urgent but non-emergency issues, contact your doctor or visit an urgent care center.";
//         } else if (/\btuberculosis\b|\btb\b/.test(text)) {
//             reply = "🫁 Tuberculosis (TB) is a bacterial infection that primarily affects the lungs. Here's what you should know:\n\n**Symptoms:**\n• Persistent cough (lasting 3+ weeks)\n• Chest pain\n• Coughing up blood\n• Fatigue and weight loss\n• Night sweats and fever\n\n**Important:**\n• TB is treatable with antibiotics\n• Treatment usually takes 6-9 months\n• It's important to complete the full course\n• TB can be prevented with proper vaccination\n\n⚠️ If you suspect TB, see a doctor immediately for proper testing and treatment.";
//         } else if (/\bcancer\b/.test(text)) {
//             reply = "🩺 Cancer is a complex group of diseases. Here's general information:\n\n**Key Points:**\n• Early detection improves treatment outcomes\n• Many cancers are treatable when caught early\n• Symptoms vary widely by cancer type\n• Regular screenings are important\n\n**Common Warning Signs:**\n• Unexplained weight loss\n• Persistent fatigue\n• Changes in skin or moles\n• Unusual lumps or swelling\n\n⚠️ This is general information only. Always consult healthcare professionals for proper diagnosis and treatment.";
//         } else {
//             // Try Dialogflow first for complex queries
//             try {
//                 const responses = await client.detectIntent(request);
//                 const result = responses[0].queryResult;
//                 console.log(`[DIALOGFLOW] Intent Matched: ${result.intent.displayName}`);
//                 console.log(`[DIALOGFLOW] Response text: ${result.fulfillmentText}`);
//                 reply = result.fulfillmentText || "";

//                 if (!reply || result.intent?.isFallback === true) {
//                     // Try Gemini for complex health queries
//                     try {
//                         reply = await getGeminiResponseWithSearch(message);
//                     } catch (e) {
//                         console.warn('[GEMINI FALLBACK ERROR]', e?.message);
//                         reply = "I'm here to help with health questions. Could you please provide more details about what you're experiencing? For example, you can tell me about specific symptoms, medications, or health concerns.";
//                     }
//                 }
//             } catch (dialogflowError) {
//                 console.error("Dialogflow error:", dialogflowError);
//                 // Try Gemini as fallback
//                 try {
//                     reply = await getGeminiResponseWithSearch(message);
//                 } catch (e) {
//                     console.warn('[GEMINI FALLBACK ERROR]', e?.message);
//                     reply = "I'm here to help with health questions. Could you please provide more details about what you're experiencing? For example, you can tell me about specific symptoms, medications, or health concerns.";
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




// chatbot.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { SessionsClient } from "@google-cloud/dialogflow";
import { JWT } from "google-auth-library";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
router.use(cors());

// =========================================================
// 🔐 1. LOAD CREDENTIALS & INITIALIZE DIALOGFLOW CLIENT
// =========================================================
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials/dialogflow-key.json");
const CREDENTIALS = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));

// Initialize Dialogflow client with keyFilename (simpler approach)
const client = new SessionsClient({
    keyFilename: CREDENTIALS_PATH,
    projectId: CREDENTIALS.project_id,
});

// =========================================================
// 🤖 2. INITIALIZE GEMINI CLIENT
// =========================================================
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAKI1MIaN2UTg7H5gnkTYgbrz1XKeRK5Hg";
if (!apiKey) {
    console.error("❌ GEMINI_API_KEY missing! Please add it to your .env file.");
}

const genAI = new GoogleGenerativeAI(apiKey);
console.log(`[INIT] Gemini API Key: ${apiKey ? "Loaded" : "Not Set"}`);

// =========================================================
// 🧠 3. GEMINI HELPER FUNCTION
// =========================================================
async function getGeminiResponseWithSearch(userQuery) {
    console.log(`[GEMINI] Calling API for query: "${userQuery}"`);

    if (!userQuery) {
        return "❓ Please ask a specific health-related question.";
    }

    const MAX_CHAR_LENGTH = 600;
    const systemPrompt = `You are a friendly, informative, and cautious health assistant. 
Answer clearly but concisely (under ${MAX_CHAR_LENGTH} characters total). 
Always include a health disclaimer that you are not a doctor and users should consult professionals. 
Start responses with a relevant emoji.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\n${userQuery}`);
        const text = result.response.text();

        if (text.length > MAX_CHAR_LENGTH) {
            console.warn(`[GEMINI] Response truncated to ${MAX_CHAR_LENGTH} chars.`);
            return text.slice(0, MAX_CHAR_LENGTH - 3) + "...";
        }
        return text;
    } catch (err) {
        console.error("!!! GEMINI API CALL FAILED !!!", err);
        return "⚠️ Sorry, I had trouble fetching the health information. Please try again later.";
    }
}

// =========================================================
// 💬 4. MAIN DIALOGFLOW ROUTE
// =========================================================
router.post("/dialogflow", async (req, res) => {
    const { message, sessionId } = req.body;
    console.log(`\n[API] Received message: "${message}" for session: ${sessionId}`);

    try {
        const sessionPath = client.projectAgentSessionPath(CREDENTIALS.project_id, sessionId);
        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: message,
                    languageCode: "en-US",
                },
            },
        };

        let reply = "";
        const text = (message || "").toLowerCase();

        // === SIMPLE DETECTION LOGIC ===
        if (/\bhi\b|\bhello\b|\bnamaste\b|\bhey\b/.test(text)) {
            reply = "Namaste! I'm your DigiNurse Assistant. How can I help you today?";
        } else if (/\bnot feeling good\b|\bnot well\b|\bfeeling sick\b|\bunwell\b/.test(text)) {
            reply = "😔 I’m sorry you’re not feeling well. Could you describe your symptoms? For example, fever, cough, or stomach pain?";
        } else if (/\bfever\b|\btemperature\b|\bhot\b/.test(text)) {
            reply = "🤒 You mentioned fever. Please stay hydrated, rest, and monitor your temperature. ⚠️ See a doctor if it lasts more than 3 days or exceeds 102°F.";
        } else if (/\bcough\b|\bcoughing\b/.test(text)) {
            reply = "😷 For cough: stay hydrated, avoid smoke, and use lozenges. ⚠️ See a doctor if it lasts 2+ weeks or causes breathing issues.";
        } else if (/\bheadache\b|\bhead pain\b/.test(text)) {
            reply = "🤕 Try resting, drinking water, and applying a cool compress. ⚠️ Seek care if it’s severe, persistent, or comes with fever.";
        } else if (/\bstomach\b|\bstomach ache\b|\bdiarrhea\b|\bnausea\b/.test(text)) {
            reply = "🤢 Try bland foods (rice, toast), rest, and fluids. ⚠️ Seek help if symptoms last over 2 days or are severe.";
        } else if (/\bmedicine\b|\bmedication\b|\bpill\b/.test(text)) {
            reply = "💊 Always consult a doctor before starting or changing medicines. Follow the label and never double-dose.";
        } else if (/\bappointment\b|\bdoctor\b|\bvisit\b/.test(text)) {
            reply = "🏥 Preparing for a doctor visit? Note your symptoms, bring medications, and list your questions.";
        } else if (/\bemergency\b|\bsos\b|\bhelp\b/.test(text)) {
            reply = "🚨 For emergencies, call your local emergency number immediately. Don't rely on online advice for urgent conditions.";
        } else if (/\bcold\b|\bcommon cold\b/.test(text)) {
            reply = "🤧 The common cold is a viral infection. Symptoms include runny nose, sneezing, and mild fever. Rest, stay hydrated, and use OTC remedies. Most colds resolve in 7-10 days. ⚠️ See a doctor if symptoms worsen or persist.";
        } else if (/\btuberculosis\b|\btb\b/.test(text)) {
            reply = "🫁 Tuberculosis (TB) is a bacterial infection affecting the lungs. Symptoms: persistent cough, chest pain, fever, weight loss. TB is treatable with antibiotics over 6-9 months. ⚠️ If you suspect TB, see a doctor immediately for testing.";
        } else if (/\bcancer\b/.test(text)) {
            reply = "🩺 Cancer is a group of diseases where cells grow abnormally. Early detection improves outcomes. Common signs: unexplained weight loss, fatigue, lumps, skin changes. ⚠️ This is general info only - always consult healthcare professionals.";
        } else {
            // Try Dialogflow → Gemini fallback
            try {
                const responses = await client.detectIntent(request);
                const result = responses[0].queryResult;
                reply = result.fulfillmentText || "";

                if (!reply || result.intent?.isFallback) {
                    reply = await getGeminiResponseWithSearch(message);
                }
            } catch (dialogflowError) {
                console.error("Dialogflow error:", dialogflowError);
                reply = await getGeminiResponseWithSearch(message);
            }
        }

        res.json({ reply });
    } catch (err) {
        console.error("ERROR in /dialogflow route:", err);
        res.status(500).json({ reply: "Dialogflow request failed" });
    }
});

// =========================================================
// 🩺 5. DIALOGFLOW WEBHOOK (FOR INTENTS)
// =========================================================
router.post("/webhook", async (req, res) => {
    try {
        const body = req.body;
        const parameters = body.queryResult.parameters;
        const intent = body.queryResult.intent.displayName;

        console.log(`[WEBHOOK] Intent: ${intent}`);
        console.log(`[WEBHOOK] Parameters: ${JSON.stringify(parameters)}`);

        const userQueryText = body.queryResult.queryText;
        let responseText = "";

        if (intent === "MedicineMissed") {
            const medicineCanonical = parameters["MedicineType"];
            if (!medicineCanonical) {
                responseText = "💊 Which specific medicine did you miss taking?";
            } else {
                const medLower = medicineCanonical.toLowerCase();
                const lowRisk = ["paracetamol", "ibuprofen", "aspirin", "cetirizine", "loperamide"];
                const mediumRisk = ["amoxicillin", "omeprazole", "antibiotic", "birth control"];
                const highRisk = ["rifampicin", "isoniazid", "tb", "metformin", "warfarin", "insulin"];

                if (highRisk.some(m => medLower.includes(m))) {
                    responseText = `🚨 Missing **${medicineCanonical}** can be serious. Contact your doctor or pharmacist immediately. Never double the dose.`;
                } else if (mediumRisk.some(m => medLower.includes(m))) {
                    responseText = `🔔 For **${medicineCanonical}**, check the leaflet or consult your provider before taking the next dose.`;
                } else if (lowRisk.some(m => medLower.includes(m))) {
                    responseText = `✅ If you missed **${medicineCanonical}**, take it as soon as you remember — unless it’s almost time for your next dose. Never double-dose.`;
                } else {
                    responseText = `🧐 I’m not familiar with **${medicineCanonical}**. Please consult your pharmacist or doctor for accurate advice.`;
                }
            }
        } else if (intent === "ReportSymptoms") {
            const symptomCanonical = parameters["SymptomType"];
            const symptomQuery = symptomCanonical || userQueryText;
            const symptomLower = symptomQuery.toLowerCase();

            const minor = ["headache", "cold", "sore throat", "sneezing", "runny nose", "migraine"];
            const caution = ["fever", "stomach ache", "vomiting", "chest pain", "shortness of breath"];

            if (caution.some(s => symptomLower.includes(s))) {
                responseText = `🚨 Please monitor your **${symptomQuery}** carefully. Stay hydrated, rest, and seek medical attention if it worsens or lasts more than 3 days.`;
            } else if (minor.some(s => symptomLower.includes(s))) {
                responseText = `😌 For **${symptomQuery}**, rest, hydration, and OTC remedies can help. See a doctor if symptoms persist beyond 2 days.`;
            } else {
                console.log(`[WEBHOOK] Unrecognized symptom: ${symptomQuery}. Using Gemini.`);
                responseText = await getGeminiResponseWithSearch(userQueryText);
            }
        } else {
            console.log(`[WEBHOOK] Fallback to Gemini`);
            responseText = await getGeminiResponseWithSearch(userQueryText);
        }

        return res.json({ fulfillmentText: responseText });
    } catch (err) {
        console.error("!!! WEBHOOK ERROR !!!", err);
        res.status(500).json({
            fulfillmentText: "⚠️ Internal server error while processing your request.",
        });
    }
});

export default router;
