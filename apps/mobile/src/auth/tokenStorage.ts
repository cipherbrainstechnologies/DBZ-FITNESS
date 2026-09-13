import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'saiyan.accessToken';
const REFRESH_KEY = 'saiyan.refreshToken';

/**
 * expo-secure-store is unavailable on web; fall back to sessionStorage for local web checks only.
 * Native builds use SecureStore.
 */
async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(key);
    }
    return null;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await setItem(ACCESS_KEY, accessToken);
  await setItem(REFRESH_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_KEY);
}

export async function clearTokens(): Promise<void> {
  await deleteItem(ACCESS_KEY);
  await deleteItem(REFRESH_KEY);
}
