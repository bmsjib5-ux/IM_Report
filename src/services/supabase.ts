import type { AppSettings } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const SUPABASE_CONFIG_KEY = 'im-dashboard-supabase-config';
const SETTINGS_ROW_ID = 'default';

// --- Default Supabase config ---
const DEFAULT_CONFIG: SupabaseConfig = {
  url: 'https://vexpkzmlnbudsbtjmglk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZleHBrem1sbmJ1ZHNidGptZ2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDE3NTAsImV4cCI6MjA4NzgxNzc1MH0.kTtwibpoKn8RIOQXmvt7-hHt3hAAnCkjEYsIvKjYdl4',
};

// --- Config management (localStorage) ---

export function getSupabaseConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (!raw) {
      // ใช้ default config ถ้ายังไม่เคยตั้งค่า
      saveSupabaseConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    const config = JSON.parse(raw) as SupabaseConfig;
    if (config.url && config.anonKey) return config;
    return null;
  } catch {
    return null;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

// --- Helper: build headers ---

function buildHeaders(anonKey: string, extra?: Record<string, string>): Record<string, string> {
  return {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// --- Connection testing ---

export type ConnectionResult = { ok: boolean; tableExists: boolean; message: string };

export async function testSupabaseConnection(config: SupabaseConfig): Promise<ConnectionResult> {
  try {
    // Step 1: Test basic connectivity via root REST API
    const baseUrl = config.url.replace(/\/$/, '');
    const rootRes = await fetch(`${baseUrl}/rest/v1/`, {
      headers: buildHeaders(config.anonKey),
    });
    if (!rootRes.ok) {
      return { ok: false, tableExists: false, message: 'ไม่สามารถเชื่อมต่อ Supabase ได้ ตรวจสอบ URL และ Key' };
    }

    // Step 2: Check if app_settings table exists
    const tableRes = await fetch(`${baseUrl}/rest/v1/app_settings?select=id&limit=1`, {
      headers: buildHeaders(config.anonKey),
    });
    if (!tableRes.ok) {
      return { ok: true, tableExists: false, message: 'เชื่อมต่อ Supabase สำเร็จ แต่ยังไม่พบตาราง app_settings กรุณาสร้างตารางก่อน (ดู SQL ด้านล่าง)' };
    }

    return { ok: true, tableExists: true, message: 'เชื่อมต่อสำเร็จ พร้อมใช้งาน' };
  } catch {
    return { ok: false, tableExists: false, message: 'ไม่สามารถเชื่อมต่อได้ ตรวจสอบ URL และ Key' };
  }
}

// --- Settings CRUD ---

export async function loadSettingsFromSupabase(config: SupabaseConfig): Promise<AppSettings | null> {
  try {
    const url = `${config.url.replace(/\/$/, '')}/rest/v1/app_settings?id=eq.${SETTINGS_ROW_ID}&select=settings`;
    const res = await fetch(url, {
      headers: buildHeaders(config.anonKey),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return data[0].settings as AppSettings;
  } catch {
    return null;
  }
}

// --- RPC helper ---

export async function callRpc<T>(config: SupabaseConfig, fnName: string, params: Record<string, unknown>): Promise<T | null> {
  try {
    const url = `${config.url.replace(/\/$/, '')}/rest/v1/rpc/${fnName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(config.anonKey),
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export async function saveSettingsToSupabase(config: SupabaseConfig, settings: AppSettings): Promise<boolean> {
  try {
    const url = `${config.url.replace(/\/$/, '')}/rest/v1/app_settings`;
    const res = await fetch(url, {
      method: 'POST',
      headers: buildHeaders(config.anonKey, {
        'Prefer': 'resolution=merge-duplicates',
      }),
      body: JSON.stringify({ id: SETTINGS_ROW_ID, settings }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
