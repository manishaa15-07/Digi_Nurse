/**
 * config/axiosInstance.ts
 *
 * Centralized Axios instance for DigiNurse.
 *
 * ✅ Auto-injects Authorization header from secure storage
 * ✅ 15-second timeout to prevent hanging requests
 * ✅ Meaningful error messages for network failures
 * ✅ Works on Android emulator, iOS simulator, physical devices, and web
 */

// axios v1.x ships its own types; @types/axios (legacy 0.x package) conflicts with them.
// We import only the default export to avoid the type clash.
import axios from "axios";
import { API_BASE_URL } from "./api";
import { storage } from "./storage";

// ── Create instance ──────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 s — covers Render cold-start (free tier spins down after inactivity)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request interceptor: inject auth token automatically ─────────────────────
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      // Try each role token in priority order
      const token =
        (await storage.getItem("doctorToken")) ||
        (await storage.getItem("caretakerToken")) ||
        (await storage.getItem("patientToken"));

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Storage read failure — proceed without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalize error messages ───────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: any) => {
    if (error.code === "ECONNABORTED") {
      // Timeout — typically Render cold start on free tier
      return Promise.reject(
        new Error(
          "Request timed out. The server may be waking up — please try again in a few seconds."
        )
      );
    }

    if (!error.response) {
      // No response at all — no network, DNS failure, etc.
      return Promise.reject(
        new Error(
          "Cannot reach the server. Please check your internet connection."
        )
      );
    }

    // Server responded with an error status — pass it through as-is
    return Promise.reject(error);
  }
);

export default apiClient;
