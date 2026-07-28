export type DevicePlatform = 'android' | 'ios';

/** Login may use email (mobile/web) or agentId (web Agent User). */
export interface AuthLoginDto {
  email?: string;
  agentId?: string;
  password: string;
  /** Mobile device id (stored as device_fingerprint). */
  deviceId?: string;
  /** @deprecated Prefer deviceId — accepted for older clients. */
  deviceFingerprint?: string;
  deviceName?: string;
  /** android | ios = mobile (device bind). web = admin console (no bind). */
  platform?: DevicePlatform | 'web';
  appVersion?: string;
}

export interface BindDeviceDto {
  deviceId?: string;
  deviceFingerprint?: string;
  deviceName?: string;
  platform?: DevicePlatform;
  appVersion?: string;
}

export interface UserRow {
  id: string;
  email: string;
  agent_id: string;
  password_hash: string;
  phone: string | null;
  full_name: string;
  nrc_no: string | null;
  address: string | null;
  township_id: string | null;
  business_name: string | null;
}

export interface BindingRow {
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  platform: DevicePlatform;
  app_version: string | null;
  bound_at: Date;
  last_seen_at: Date;
}

/** Public login/profile user — UI-visible fields only. */
export interface PublicUser {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  nrcNo: string | null;
  address: string | null;
}
