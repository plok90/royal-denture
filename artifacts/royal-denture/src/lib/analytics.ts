import { initializeApp } from "firebase/app"
import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics"

let _analytics: Analytics | null = null
let _tried = false

export async function initAnalytics(): Promise<void> {
  if (_tried) return
  _tried = true
  try {
    if (!(await isSupported())) return
    const app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    })
    _analytics = getAnalytics(app)
  } catch {
    /* analytics optional */
  }
}

export function track(event: string, params?: Record<string, unknown>): void {
  if (!_analytics) return
  try {
    logEvent(_analytics, event as any, params as any)
  } catch {
    /* ignore */
  }
}
