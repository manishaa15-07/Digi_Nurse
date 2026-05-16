import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

async function secureAvailable(): Promise<boolean> {
  try {
    const available = await SecureStore.isAvailableAsync();
    return Boolean(available) && typeof SecureStore.setItemAsync === "function";
  } catch {
    return false;
  }
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (await secureAvailable()) {
        return await SecureStore.getItemAsync(key);
      }
    } catch {}
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (await secureAvailable()) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
    } catch {}
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (await secureAvailable()) {
        await SecureStore.deleteItemAsync(key);
        return;
      }
    } catch {}
    await AsyncStorage.removeItem(key);
  },
};
