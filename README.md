<div align="center">

<img src="DigiNurse/assets/images/icon.png" alt="DigiNurse Logo" width="120" height="120" />

# 🏥 DigiNurse

### AI-Powered Healthcare Assistant Mobile Application

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://cloud.google.com/)

[![Backend](https://img.shields.io/badge/Backend-Live_on_Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://digi-nurse.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

<br/>

> **DigiNurse** is an intelligent, mobile-first healthcare companion that brings AI-powered medical guidance to your fingertips. Built for patients, caretakers, and doctors — it bridges the gap between everyday health queries and professional medical advice through a seamless, intuitive interface.

<br/>

[🚀 Live Backend](https://digi-nurse.onrender.com) · [📱 Download APK](#-expo-eas-build--apk-generation) · [🐛 Report Bug](../../issues) · [✨ Request Feature](../../issues)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [🏗 Architecture](#-architecture)
- [📁 Folder Structure](#-folder-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [🔑 Environment Variables](#-environment-variables)
- [📡 API Endpoints](#-api-endpoints)
- [📱 Expo EAS Build & APK Generation](#-expo-eas-build--apk-generation)
- [☁️ Backend Deployment on Render](#️-backend-deployment-on-render)
- [🖼 Screenshots](#-screenshots)
- [🔧 Troubleshooting](#-troubleshooting)
- [🚧 Future Improvements](#-future-improvements)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👩‍💻 Author](#-author)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Medical Chatbot** | Intelligent symptom-based responses powered by Dialogflow + Gemini AI |
| 💊 **Medicine Guidance** | Advises users on missed doses, drug interactions, and medication schedules |
| 🩺 **Symptom Reporting** | Structured intent detection for common symptoms with severity classification |
| 👨‍👩‍👧 **Multi-Role System** | Separate flows for Patients, Caretakers, and Doctors |
| 🔗 **Caretaker Linking** | Patients can link/unlink caretakers and manage care relationships |
| 📅 **Appointment Calendar** | Visual scheduling interface for doctor appointments |
| 🚨 **SOS Alerts** | One-tap emergency alert system with caretaker notification |
| 💬 **Real-time Chat** | Socket.IO powered messaging between patients and caretakers |
| 🔔 **Push Notifications** | Real-time alert delivery for health events |
| 🌐 **Health FAQ Engine** | Curated responses for common health questions |
| 🔐 **Secure Auth** | JWT-based authentication with role-based access control |
| 📦 **Offline-Aware** | Graceful degradation with meaningful error messages on network failure |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React Native 0.81** | Cross-platform mobile UI framework |
| **Expo SDK 54** | Development toolchain and native APIs |
| **Expo Router v6** | File-based navigation |
| **Axios** | HTTP client with centralized interceptors |
| **Socket.IO Client** | Real-time WebSocket communication |
| **NativeWind** | Tailwind CSS for React Native |
| **Expo SecureStore** | Encrypted token storage |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express.js** | REST API server |
| **MongoDB + Mongoose** | NoSQL database and ODM |
| **Socket.IO** | Real-time bidirectional event-based communication |
| **Dialogflow ES** | NLP intent detection engine |
| **Gemini 2.0 Flash** | AI fallback for unrecognized queries |
| **JWT** | Stateless authentication tokens |
| **dotenv** | Environment variable management |

### DevOps & Cloud
| Technology | Purpose |
|------------|---------|
| **Render** | Backend hosting (auto-deploy from GitHub) |
| **MongoDB Atlas** | Cloud database |
| **Expo EAS Build** | Cloud APK/IPA builds |
| **Google Cloud** | Dialogflow + Gemini AI credentials |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DIGINURSE SYSTEM                         │
│                                                                  │
│  ┌─────────────────────────────┐                                │
│  │      React Native App        │                                │
│  │   (Expo SDK 54 + Router)    │                                │
│  │                              │                                │
│  │  Patient │ Caretaker │ Doctor│                                │
│  └──────────┬──────────────────┘                                │
│             │  HTTPS / WSS                                       │
│             ▼                                                    │
│  ┌──────────────────────────────┐                               │
│  │   Express.js REST API        │ ◄── JWT Auth Middleware        │
│  │   (Render — Node.js)         │                                │
│  │                              │                                │
│  │  /api/patient                │                                │
│  │  /api/caretaker              │                                │
│  │  /api/doctor                 │                                │
│  │  /api/alerts                 │                                │
│  │  /dialogflow  ──────────────►│──► Dialogflow ES              │
│  │               (fallback) ───►│──► Gemini 2.0 Flash           │
│  │                              │                                │
│  │  Socket.IO Server            │                                │
│  └──────────────┬───────────────┘                               │
│                 │                                                │
│                 ▼                                                │
│  ┌──────────────────────────────┐                               │
│  │        MongoDB Atlas          │                               │
│  └──────────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### 🤖 AI Chatbot Flow

```
User Message
    │
    ▼
Rule-based matching (greetings, symptoms, emergencies)
    │ no match
    ▼
Dialogflow Intent Detection
    │ fallback / low confidence
    ▼
Gemini 2.0 Flash (AI response with health disclaimer)
    │
    ▼
Response → User
```

---

## 📁 Folder Structure

```
DigiNurse/
│
├── DigiNurse/                    # 📱 Expo React Native Frontend
│   ├── app/
│   │   ├── (tabs)/               # Patient tab screens
│   │   │   ├── ai-chatbot.tsx    # AI chatbot UI
│   │   │   ├── appointment-calendar.tsx
│   │   │   ├── my-caregivers.tsx
│   │   │   └── sos.tsx
│   │   ├── (caretaker-tabs)/     # Caretaker screens
│   │   │   ├── alerts.tsx
│   │   │   ├── chats.tsx
│   │   │   ├── link.tsx
│   │   │   └── my-patients.tsx
│   │   ├── screens/              # Shared screens
│   │   ├── patient/              # Patient auth + dashboard
│   │   ├── caretaker/            # Caretaker auth + dashboard
│   │   └── doctor/               # Doctor auth + dashboard
│   ├── config/
│   │   ├── api.ts                # ✅ Centralized API base URL (Render)
│   │   ├── axiosInstance.ts      # ✅ Axios with interceptors + timeout
│   │   └── storage.ts            # SecureStore + AsyncStorage wrapper
│   ├── contexts/
│   │   ├── ChatContext.tsx        # Socket.IO real-time chat state
│   │   └── NotificationContext.tsx
│   ├── components/               # Reusable UI components
│   ├── utils/
│   │   └── socket-client.ts      # Singleton Socket.IO connection
│   ├── assets/                   # Images, fonts, icons
│   ├── .env                      # 🔒 Local env overrides (gitignored)
│   ├── .env.example              # 📄 Template (safe to commit)
│   ├── app.json                  # Expo app configuration
│   └── package.json
│
├── backend/                      # ⚙️ Node.js + Express API
│   ├── routes/
│   │   ├── patientRoutes.js
│   │   ├── caretakerRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── alertRoutes.js
│   │   └── ai-chatbotRoutes.js   # Dialogflow + Gemini AI
│   ├── chat/
│   │   └── socket.js             # Socket.IO server logic
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/               # Auth middleware
│   ├── models/                   # Mongoose schemas
│   ├── server.js                 # Express app entry point
│   └── .env                      # 🔒 Backend secrets (gitignored)
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **npm** v9+ or **yarn**
- **Expo CLI** — `npm install -g expo-cli`
- **EAS CLI** — `npm install -g eas-cli`
- **MongoDB Atlas** account — [Create free cluster](https://cloud.mongodb.com/)
- **Google Cloud** account (for Dialogflow + Gemini)

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/manishaa1507/DigiNurse.git
cd DigiNurse/backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Fill in your values (see Environment Variables section)

# 4. Start the development server
npm run dev

# ✅ Server running at http://localhost:5000
```

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd DigiNurse/DigiNurse

# 2. Install dependencies
npm install

# 3. Create environment file (optional — uses Render backend by default)
cp .env.example .env

# 4. Start Expo development server
npx expo start

# Then choose your target:
#   Press i → iOS Simulator
#   Press a → Android Emulator
#   Scan QR → Expo Go on physical device
```

> **Note:** The app is pre-configured to use the deployed Render backend (`https://digi-nurse.onrender.com`) by default. No `.env` changes are needed for production testing.

---

## 🔑 Environment Variables

### Backend — `backend/.env`

```env
# ── Database ──────────────────────────────────────────────
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/diginurse

# ── Server ────────────────────────────────────────────────
PORT=5000

# ── Authentication ────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_here

# ── AI Services ───────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio

# Google Cloud Dialogflow Service Account (paste full JSON as string)
DIALOGFLOW_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# ── CORS (add your Vercel/frontend URL after deployment) ──
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-preview.vercel.app
```

### Frontend — `DigiNurse/.env`

```env
# Leave blank to use the deployed Render backend (recommended for production)
EXPO_PUBLIC_API_URL=

# ── Local Development Overrides ───────────────────────────
# iOS Simulator:
# EXPO_PUBLIC_API_URL=http://localhost:5000

# Android Emulator:
# EXPO_PUBLIC_API_URL=http://10.0.2.2:5000

# Physical Device (use your machine's LAN IP):
# EXPO_PUBLIC_API_URL=http://192.168.x.x:5000
```

> ⚠️ **Never commit `.env` files.** Both are gitignored. Use `.env.example` files as templates.

---

## 📡 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/patient/signup` | Register a new patient |
| `POST` | `/api/patient/login` | Patient login |
| `POST` | `/api/caretaker/signup` | Register a new caretaker |
| `POST` | `/api/caretaker/login` | Caretaker login |
| `POST` | `/api/doctor/signup` | Register a new doctor |
| `POST` | `/api/doctor/login` | Doctor login |

### 👤 Patient

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/patient/dashboard` | Get patient dashboard data |
| `GET` | `/api/patient/profile` | Get patient profile |
| `GET` | `/api/patient/caretakers` | List linked caretakers |
| `GET` | `/api/patient/medication-records` | Get medication history |
| `POST` | `/api/patient/change-password` | Update password |

### 👨‍⚕️ Caretaker

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/caretaker/profile` | Get caretaker profile |
| `GET` | `/api/caretaker/pending-patients` | List pending patient requests |
| `POST` | `/api/caretaker/add-patient` | Link a patient |
| `POST` | `/api/caretaker/approve-patient` | Approve a patient link request |
| `POST` | `/api/caretaker/unlink-patient` | Remove a linked patient |

### 🤖 AI Chatbot

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/dialogflow` | Send a message to the AI chatbot |
| `POST` | `/webhook` | Dialogflow fulfillment webhook |

**Sample Request — AI Chatbot:**

```bash
curl -X POST https://digi-nurse.onrender.com/dialogflow \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a headache", "sessionId": "user-123"}'
```

**Sample Response:**

```json
{
  "reply": "🤕 Try resting, drinking water, and applying a cool compress. ⚠️ Seek care if it's severe, persistent, or comes with fever."
}
```

### 🚨 Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts` | Get all alerts for caretaker |
| `PUT` | `/api/alerts/:id/acknowledge` | Acknowledge an alert |
| `PUT` | `/api/alerts/:id/read` | Mark alert as read |

---

## 📱 Expo EAS Build & APK Generation

### One-time Setup

```bash
cd DigiNurse/DigiNurse

# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure EAS project (first time only)
eas build:configure
```

### Build Android APK (Preview)

```bash
# Build a preview APK installable on any Android device
eas build -p android --profile preview

# ✅ Download link provided after build (~10–15 minutes)
```

### Build Android AAB (Production — for Play Store)

```bash
eas build -p android --profile production
```

### Build iOS (requires Apple Developer Account)

```bash
eas build -p ios --profile production
```

### Run locally without EAS

```bash
# Android emulator
npx expo start --android

# iOS simulator (macOS only)
npx expo start --ios

# Web browser
npx expo start --web
```

---

## ☁️ Backend Deployment on Render

### Deploy from GitHub

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free (or Starter for always-on) |

4. Add **Environment Variables** in Render dashboard:

```
MONGO_URI         = mongodb+srv://...
JWT_SECRET        = your_secret
GEMINI_API_KEY    = your_gemini_key
DIALOGFLOW_KEY    = {"type":"service_account",...}
ALLOWED_ORIGINS   = https://your-app.vercel.app
```

5. Click **Deploy** → Your backend is live at `https://digi-nurse.onrender.com`

> 💡 **Tip:** Free tier services sleep after 15 min of inactivity. Use [UptimeRobot](https://uptimerobot.com/) to ping your backend every 14 minutes for free.

---

## 🖼 Screenshots

<div align="center">

| Login Screen | Patient Dashboard | AI Chatbot |
|:---:|:---:|:---:|
| *(screenshot)* | *(screenshot)* | *(screenshot)* |

| Caretaker Dashboard | Alerts | Appointment Calendar |
|:---:|:---:|:---:|
| *(screenshot)* | *(screenshot)* | *(screenshot)* |

</div>

> 📸 Add screenshots to an `assets/screenshots/` folder and update the paths above.

---

## 🔧 Troubleshooting

### ❌ Network request failed on Android emulator

Android emulators cannot reach `localhost`. Use the Android-specific address:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
```

### ❌ Network request failed on physical device

Your device and computer must be on the **same Wi-Fi network**. Find your LAN IP:

```bash
# macOS / Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

Then set:
```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000
```

### ❌ Request timed out (30s+ delay)

Render's free tier spins down after inactivity. The first request after sleep takes ~30 seconds. Use [UptimeRobot](https://uptimerobot.com/) to keep it alive, or upgrade to a paid plan.

### ❌ CORS error in browser / Expo Web

Add your frontend URL to `ALLOWED_ORIGINS` in your Render environment variables:

```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

Then redeploy the backend.

### ❌ `Cannot find name 'AxiosError'` TypeScript error

Remove the conflicting legacy types package:

```bash
cd DigiNurse
npm uninstall @types/axios
```

Axios v1.x ships its own TypeScript definitions — `@types/axios` is not needed.

### ❌ Dialogflow server crash on startup

Ensure `DIALOGFLOW_KEY` in your backend `.env` is a valid JSON string. If you don't use Dialogflow, leave it empty — the server now gracefully falls back to Gemini AI.

### ❌ Metro bundler not recognizing `.env` changes

Restart the Expo server completely after editing `.env`:

```bash
npx expo start --clear
```

---

## 🚧 Future Improvements

- [ ] 🌍 Multi-language support (Hindi, Tamil, etc.)
- [ ] 📊 Patient health analytics dashboard with charts
- [ ] 🧪 Medication reminder push notifications (Expo Notifications)
- [ ] 🔊 Voice input for chatbot queries
- [ ] 🧠 Fine-tuned Gemini model for Indian healthcare context
- [ ] 📱 iOS App Store + Google Play Store release
- [ ] 🏥 Doctor prescription upload and management
- [ ] 🔒 Two-factor authentication (OTP via SMS)
- [ ] 📍 Nearby hospital/pharmacy locator (Google Maps API)
- [ ] 🌐 Progressive Web App (PWA) support

---

## 🤝 Contributing

Contributions are what make open source amazing. Any contributions you make are **greatly appreciated**.

1. **Fork** the repository
2. **Create** your feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit** your changes
   ```bash
   git commit -m 'feat: add AmazingFeature'
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open** a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|--------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation changes |
| `style:` | Formatting, no logic change |
| `refactor:` | Code restructuring |
| `chore:` | Dependency updates, config |

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 👩‍💻 Author

<div align="center">

**Manisha**

[![GitHub](https://img.shields.io/badge/GitHub-manishaa1507-181717?style=for-the-badge&logo=github)](https://github.com/manishaa1507)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/manishaa1507)

*Built with ❤️ for Infotsav Hackatron 2025*

</div>

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with 🩺 by [Manisha](https://github.com/manishaa1507)

</div>
