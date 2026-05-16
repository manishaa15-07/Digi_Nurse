import { NativeModules, Platform } from "react-native";

// ============================================================
// ✅ API Configuration — DigiNurse
// ============================================================
// Priority order:
//   1. EXPO_PUBLIC_API_URL  (set in .env for local dev overrides)
//   2. productionUrl        (deployed Render backend — always used in prod)
//   3. LAN detection        (Expo Go on a real device, dev only)
//   4. Platform emulator    (Android/iOS simulator, dev only)
// ============================================================

// 1️⃣ Env variable override — set EXPO_PUBLIC_API_URL=http://localhost:5000 for local dev
const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

// 2️⃣ Deployed backend on Render
const productionUrl = "https://digi-nurse.onrender.com";

// 3️⃣ LAN IP detection for Expo Go on a physical device (dev only)
function detectLanBaseUrl(): string | null {
  // Skip if we already have an explicit URL
  if (envUrl) return null;

  try {
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    if (!scriptURL) return null;

    const url = new URL(scriptURL);
    const host = url.hostname;

    // Ignore loopback — doesn't work on real devices
    if (!host || host === "localhost" || host === "127.0.0.1") return null;

    // Only accept LAN IPs (e.g. 192.168.x.x)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(host)) return null;

    return `http://${host}:5000`;
  } catch {
    return null;
  }
}

// 4️⃣ Emulator platform fallbacks (dev only, never used in production builds)
const emulatorDefault = Platform.select({
  android: "http://10.0.2.2:5000", // Android emulator → host machine
  ios:     "http://localhost:5000", // iOS simulator → host machine
  default: null,
});

// ✅ Resolve API_BASE_URL
export const API_BASE_URL = (() => {
  // Highest priority: explicit env variable (use for local dev)
  if (envUrl) {
    console.log("🔧 [API] Using env override:", envUrl);
    return envUrl;
  }

  // ✅ Default: always use the deployed Render backend
  console.log("🚀 [API] Using production Render URL:", productionUrl);
  return productionUrl;
})();

// ============================================================
// NOTE: For local development, create DigiNurse/.env with:
//   EXPO_PUBLIC_API_URL=http://localhost:5000          (iOS sim)
//   EXPO_PUBLIC_API_URL=http://10.0.2.2:5000           (Android emu)
//   EXPO_PUBLIC_API_URL=http://<your-lan-ip>:5000      (real device)
// ============================================================

