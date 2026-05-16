// chatbot.js

import express from "express";
import cors from "cors";
import { SessionsClient } from "@google-cloud/dialogflow";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
router.use(cors());

// =========================================================
// 🔐 1. LOAD CREDENTIALS FROM ENV VARIABLE
// =========================================================

if (!process.env.DIALOGFLOW_KEY) {
    console.error("❌ DIALOGFLOW_KEY missing in environment variables");
}

const CREDENTIALS = JSON.parse(process.env.DIALOGFLOW_KEY);

const client = new SessionsClient({
    credentials: {
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key,
    },
    projectId: CREDENTIALS.project_id,
});

// =========================================================
// 🤖 2. INITIALIZE GEMINI CLIENT
// =========================================================

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ GEMINI_API_KEY missing! Please add it to Render env variables.");
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

    const systemPrompt = `
You are a friendly, informative, and cautious health assistant.

Answer clearly but concisely (under ${MAX_CHAR_LENGTH} characters total).

Always include a health disclaimer that you are not a doctor and users should consult professionals.

Start responses with a relevant emoji.
`;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
        });

        const result = await model.generateContent(
            `${systemPrompt}\n\n${userQuery}`
        );

        const text = result.response.text();

        if (text.length > MAX_CHAR_LENGTH) {
            console.warn(
                `[GEMINI] Response truncated to ${MAX_CHAR_LENGTH} chars.`
            );

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

    console.log(
        `\n[API] Received message: "${message}" for session: ${sessionId}`
    );

    try {
        const sessionPath = client.projectAgentSessionPath(
            CREDENTIALS.project_id,
            sessionId
        );

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

        // =========================================================
        // SIMPLE DETECTION LOGIC
        // =========================================================

        if (/\bhi\b|\bhello\b|\bnamaste\b|\bhey\b/.test(text)) {
            reply =
                "Namaste! I'm your DigiNurse Assistant. How can I help you today?";
        } else if (
            /\bnot feeling good\b|\bnot well\b|\bfeeling sick\b|\bunwell\b/.test(
                text
            )
        ) {
            reply =
                "😔 I’m sorry you’re not feeling well. Could you describe your symptoms? For example, fever, cough, or stomach pain?";
        } else if (/\bfever\b|\btemperature\b|\bhot\b/.test(text)) {
            reply =
                "🤒 You mentioned fever. Please stay hydrated, rest, and monitor your temperature. ⚠️ See a doctor if it lasts more than 3 days or exceeds 102°F.";
        } else if (/\bcough\b|\bcoughing\b/.test(text)) {
            reply =
                "😷 For cough: stay hydrated, avoid smoke, and use lozenges. ⚠️ See a doctor if it lasts 2+ weeks or causes breathing issues.";
        } else if (/\bheadache\b|\bhead pain\b/.test(text)) {
            reply =
                "🤕 Try resting, drinking water, and applying a cool compress. ⚠️ Seek care if it’s severe, persistent, or comes with fever.";
        } else if (
            /\bstomach\b|\bstomach ache\b|\bdiarrhea\b|\bnausea\b/.test(text)
        ) {
            reply =
                "🤢 Try bland foods (rice, toast), rest, and fluids. ⚠️ Seek help if symptoms last over 2 days or are severe.";
        } else if (/\bmedicine\b|\bmedication\b|\bpill\b/.test(text)) {
            reply =
                "💊 Always consult a doctor before starting or changing medicines. Follow the label and never double-dose.";
        } else if (/\bappointment\b|\bdoctor\b|\bvisit\b/.test(text)) {
            reply =
                "🏥 Preparing for a doctor visit? Note your symptoms, bring medications, and list your questions.";
        } else if (/\bemergency\b|\bsos\b|\bhelp\b/.test(text)) {
            reply =
                "🚨 For emergencies, call your local emergency number immediately. Don't rely on online advice for urgent conditions.";
        } else if (/\bcold\b|\bcommon cold\b/.test(text)) {
            reply =
                "🤧 The common cold is a viral infection. Symptoms include runny nose, sneezing, and mild fever. Rest, stay hydrated, and use OTC remedies. Most colds resolve in 7-10 days. ⚠️ See a doctor if symptoms worsen or persist.";
        } else if (/\btuberculosis\b|\btb\b/.test(text)) {
            reply =
                "🫁 Tuberculosis (TB) is a bacterial infection affecting the lungs. Symptoms: persistent cough, chest pain, fever, weight loss. TB is treatable with antibiotics over 6-9 months. ⚠️ If you suspect TB, see a doctor immediately for testing.";
        } else if (/\bcancer\b/.test(text)) {
            reply =
                "🩺 Cancer is a group of diseases where cells grow abnormally. Early detection improves outcomes. Common signs: unexplained weight loss, fatigue, lumps, skin changes. ⚠️ This is general info only - always consult healthcare professionals.";
        } else {
            // =========================================================
            // DIALOGFLOW → GEMINI FALLBACK
            // =========================================================

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

        res.status(500).json({
            reply: "Dialogflow request failed",
        });
    }
});

// =========================================================
// 🩺 5. DIALOGFLOW WEBHOOK
// =========================================================

router.post("/webhook", async (req, res) => {
    try {
        const body = req.body;

        const parameters = body.queryResult.parameters;

        const intent = body.queryResult.intent.displayName;

        console.log(`[WEBHOOK] Intent: ${intent}`);

        console.log(
            `[WEBHOOK] Parameters: ${JSON.stringify(parameters)}`
        );

        const userQueryText = body.queryResult.queryText;

        let responseText = "";

        // =========================================================
        // MEDICINE MISSED
        // =========================================================

        if (intent === "MedicineMissed") {
            const medicineCanonical = parameters["MedicineType"];

            if (!medicineCanonical) {
                responseText =
                    "💊 Which specific medicine did you miss taking?";
            } else {
                const medLower = medicineCanonical.toLowerCase();

                const lowRisk = [
                    "paracetamol",
                    "ibuprofen",
                    "aspirin",
                    "cetirizine",
                    "loperamide",
                ];

                const mediumRisk = [
                    "amoxicillin",
                    "omeprazole",
                    "antibiotic",
                    "birth control",
                ];

                const highRisk = [
                    "rifampicin",
                    "isoniazid",
                    "tb",
                    "metformin",
                    "warfarin",
                    "insulin",
                ];

                if (highRisk.some((m) => medLower.includes(m))) {
                    responseText = `🚨 Missing ${medicineCanonical} can be serious. Contact your doctor or pharmacist immediately. Never double the dose.`;
                } else if (
                    mediumRisk.some((m) => medLower.includes(m))
                ) {
                    responseText = `🔔 For ${medicineCanonical}, check the leaflet or consult your provider before taking the next dose.`;
                } else if (
                    lowRisk.some((m) => medLower.includes(m))
                ) {
                    responseText = `✅ If you missed ${medicineCanonical}, take it as soon as you remember — unless it’s almost time for your next dose. Never double-dose.`;
                } else {
                    responseText = `🧐 I’m not familiar with ${medicineCanonical}. Please consult your pharmacist or doctor for accurate advice.`;
                }
            }
        }

        // =========================================================
        // REPORT SYMPTOMS
        // =========================================================

        else if (intent === "ReportSymptoms") {
            const symptomCanonical = parameters["SymptomType"];

            const symptomQuery =
                symptomCanonical || userQueryText;

            const symptomLower = symptomQuery.toLowerCase();

            const minor = [
                "headache",
                "cold",
                "sore throat",
                "sneezing",
                "runny nose",
                "migraine",
            ];

            const caution = [
                "fever",
                "stomach ache",
                "vomiting",
                "chest pain",
                "shortness of breath",
            ];

            if (
                caution.some((s) => symptomLower.includes(s))
            ) {
                responseText = `🚨 Please monitor your ${symptomQuery} carefully. Stay hydrated, rest, and seek medical attention if it worsens or lasts more than 3 days.`;
            } else if (
                minor.some((s) => symptomLower.includes(s))
            ) {
                responseText = `😌 For ${symptomQuery}, rest, hydration, and OTC remedies can help. See a doctor if symptoms persist beyond 2 days.`;
            } else {
                console.log(
                    `[WEBHOOK] Unrecognized symptom: ${symptomQuery}. Using Gemini.`
                );

                responseText =
                    await getGeminiResponseWithSearch(
                        userQueryText
                    );
            }
        }

        // =========================================================
        // FALLBACK
        // =========================================================

        else {
            console.log(`[WEBHOOK] Fallback to Gemini`);

            responseText =
                await getGeminiResponseWithSearch(
                    userQueryText
                );
        }

        return res.json({
            fulfillmentText: responseText,
        });
    } catch (err) {
        console.error("!!! WEBHOOK ERROR !!!", err);

        res.status(500).json({
            fulfillmentText:
                "⚠️ Internal server error while processing your request.",
        });
    }
});

export default router;