import { NativeModules, Platform } from "react-native";

// 1️⃣ Environment variable (optional override)
const envUrl = process.env.EXPO_PUBLIC_API_URL;

// 2️⃣ Production URL - Use this for deployed backend
// const productionUrl = "https://digi-nurse.vercel.app";

const productionUrl = "http://localhost:5000"

// 3️⃣ Try to detect LAN IP when running in Expo Go
function detectLanBaseUrl(): string | null {
  try {
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    if (!scriptURL) return null;

    const url = new URL(scriptURL);
    const host = url.hostname;

    // Ignore localhost on real device
    if (!host || host === "localhost" || host === "127.0.0.1") return null;

    // Simple IP check
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(host)) return null;

    // Your backend port is 5000
    return `http://${host}:5000`;
  } catch {
    return null;
  }
}

// 2️⃣ Platform fallback for simulator/emulator
const platformDefault = Platform.select({
  android: "http://10.0.2.2:5000", // Android emulator → host machine
  ios: "http://localhost:5000",    // iOS simulator → host machine
  default: null,
});

// 3️⃣ Always connect to local backend
export const API_BASE_URL = (() => {
  // Detect LAN for real devices
  const lanUrl = detectLanBaseUrl();
  if (lanUrl) {
    console.log("🏠 Using LAN API URL:", lanUrl);
    return lanUrl;
  }

  // Use platform default for simulator/emulator
  if (platformDefault) {
    console.log("📱 Using platform default API URL (emulator):", platformDefault);
    return platformDefault;
  }

  // As fallback, just use localhost (useful if running Node on same machine)
  const fallback = "http://localhost:5000";
  console.log("⚠️ Falling back to localhost:", fallback);
  return fallback;
})();
