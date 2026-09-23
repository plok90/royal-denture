import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "./supabase";

interface SessionData {
  token: string;
  name: string;
  username: string;
  device: string;
  created_at: string;
}

const SESSIONS_KEY = "admin_sessions";
const CREDENTIALS_KEY = "admin_credentials";
const LOCAL_SESSION_KEY = "rd_admin_session";

async function readSessions(supabase: NonNullable<ReturnType<typeof createClient>>): Promise<SessionData[]> {
  try {
    const { data } = await supabase.from("admin_settings").select("value").eq("key", SESSIONS_KEY).maybeSingle();
    return data?.value ? JSON.parse(data.value) : [];
  } catch {
    return [];
  }
}

async function writeSessions(supabase: NonNullable<ReturnType<typeof createClient>>, sessions: SessionData[]) {
  try {
    await supabase
      .from("admin_settings")
      .upsert({ key: SESSIONS_KEY, value: JSON.stringify(sessions) }, { onConflict: "key", ignoreDuplicates: false });
  } catch {
    /* ignore */
  }
}

export async function restoreSession(): Promise<{ name: string; username: string } | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const stored = await AsyncStorage.getItem(LOCAL_SESSION_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.token) return null;
    const sessions = await readSessions(supabase);
    const match = sessions.find((s) => s.token === parsed.token);
    if (match) return { name: match.name, username: match.username };
  } catch {
    /* ignore */
  }
  return null;
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string; name?: string }> {
  const supabase = createClient();
  if (!supabase) return { success: false, error: "تعذر الاتصال بالخادم" };
  let credentials: { name: string; username: string; password: string }[] = [];
  try {
    const { data } = await supabase.from("admin_settings").select("value").eq("key", CREDENTIALS_KEY).maybeSingle();
    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length) credentials = parsed;
    }
  } catch {
    /* ignore */
  }
  const match = credentials.find((c) => c.username === username && c.password === password);
  if (!match) return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const session: SessionData = {
    token,
    name: match.name,
    username: match.username,
    device: "Mobile App",
    created_at: new Date().toISOString(),
  };
  if (supabase) {
    const sessions = await readSessions(supabase);
    sessions.unshift(session);
    await writeSessions(supabase, sessions);
  }
  await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify({ token, name: match.name }));
  return { success: true, name: match.name };
}

export async function logout(): Promise<void> {
  const supabase = createClient();
  const stored = await AsyncStorage.getItem(LOCAL_SESSION_KEY);
  if (supabase && stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.token) {
        const sessions = await readSessions(supabase);
        await writeSessions(supabase, sessions.filter((s) => s.token !== parsed.token));
      }
    } catch {
      /* ignore */
    }
  }
  await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
}

export interface AdminOrder {
  id: string;
  case_id?: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  total: number;
  created_at: string;
  items: { name: string; name_ar: string; quantity: number }[];
}

export async function fetchAllOrders(): Promise<AdminOrder[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as AdminOrder[];
}

export async function updateOrderStatus(id: string, status: string): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) return false;
  const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  return !error;
}
