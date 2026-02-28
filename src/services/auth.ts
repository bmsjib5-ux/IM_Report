import { getSupabaseConfig, callRpc } from './supabase';

export interface UserSession {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
}

const USER_SESSION_KEY = 'im-dashboard-user';

// --- Password hashing (SHA-256 via Web Crypto API) ---

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// --- Session management (localStorage) ---

export function getCurrentUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function saveUserSession(user: UserSession): void {
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
}

export function logout(): void {
  localStorage.removeItem(USER_SESSION_KEY);
}

export function isAdmin(user: UserSession | null): boolean {
  return user?.role === 'admin';
}

// --- Login via Supabase RPC ---

interface VerifyLoginResult {
  id: string;
  username: string;
  display_name: string;
  role: string;
}

// --- User management types ---

export interface UserInfo {
  id: string;
  username: string;
  display_name: string;
  role: string;
  created_at: string;
}

// --- User CRUD via Supabase RPC ---

export async function listUsers(): Promise<UserInfo[]> {
  const config = getSupabaseConfig();
  if (!config) return [];
  const result = await callRpc<UserInfo[]>(config, 'list_users', {});
  return result ?? [];
}

export async function addUser(username: string, password: string, displayName: string, role: 'admin' | 'user'): Promise<string | null> {
  const config = getSupabaseConfig();
  if (!config) return null;
  const passwordHash = await hashPassword(password);
  const result = await callRpc<string>(config, 'add_user', {
    p_username: username,
    p_password_hash: passwordHash,
    p_display_name: displayName,
    p_role: role,
  });
  return result;
}

export async function updateUser(id: string, displayName: string, role: 'admin' | 'user', password?: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config) return false;
  const params: Record<string, unknown> = {
    p_id: id,
    p_display_name: displayName,
    p_role: role,
  };
  if (password) {
    params.p_password_hash = await hashPassword(password);
  }
  const result = await callRpc<boolean>(config, 'update_user', params);
  return result ?? false;
}

export async function deleteUser(id: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config) return false;
  const result = await callRpc<boolean>(config, 'delete_user', { p_id: id });
  return result ?? false;
}

// --- Login via Supabase RPC ---

export async function login(username: string, password: string): Promise<UserSession | null> {
  const config = getSupabaseConfig();
  if (!config) return null;

  const passwordHash = await hashPassword(password);

  const result = await callRpc<VerifyLoginResult[]>(config, 'verify_login', {
    p_username: username,
    p_password_hash: passwordHash,
  });

  if (!result || result.length === 0) return null;

  const row = result[0];
  const session: UserSession = {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role as 'admin' | 'user',
  };

  saveUserSession(session);
  return session;
}
