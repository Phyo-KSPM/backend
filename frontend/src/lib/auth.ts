const STORAGE_KEY = 'ceir_admin_session';
const DEVICE_ID_KEY = 'ceir_admin_device_id';

export type AdminSession = {
  accessToken: string;
  expiresIn: number;
  savedAt: number;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    nrcNo?: string | null;
    address?: string | null;
  };
};

export type AdminLoginInput =
  | { mode: 'email'; email: string; password: string }
  | { mode: 'agent'; agentId: string; password: string };

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')
    || 'http://localhost:3000/openapi/v1';
}

export function getAdminDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      const generated =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      id = `ceir-admin-web-${generated}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `ceir-admin-web-fallback`;
  }
}

export function getSession(): AdminSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AdminSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Web admin login via gateway `/login` (not BFF). platform=web skips mobile device bind. */
export async function loginAdmin(input: AdminLoginInput): Promise<AdminSession> {
  const body =
    input.mode === 'email'
      ? {
          email: input.email,
          password: input.password,
          deviceId: getAdminDeviceId(),
          platform: 'web',
          deviceName: 'CEIR Admin Console',
          appVersion: '0.1.0',
        }
      : {
          agentId: input.agentId,
          password: input.password,
          deviceId: getAdminDeviceId(),
          platform: 'web',
          deviceName: 'CEIR Admin Console',
          appVersion: '0.1.0',
        };

  const res = await fetch(`${apiBase()}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Login failed (${res.status})`;
    const err = new Error(message) as Error & { code?: string };
    err.code = data?.error?.code;
    throw err;
  }

  const session: AdminSession = {
    accessToken: data.accessToken,
    expiresIn: data.expiresIn ?? 604800,
    savedAt: Date.now(),
    user: {
      id: data.user?.id,
      email: data.user?.email,
      fullName:
        data.user?.fullName ||
        data.user?.email ||
        (input.mode === 'email' ? input.email : input.agentId),
      phone: data.user?.phone,
      nrcNo: data.user?.nrcNo,
      address: data.user?.address,
    },
  };
  saveSession(session);
  return session;
}
