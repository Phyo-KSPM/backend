export type DevicePlatform = 'android' | 'ios';

/** Login may use email (mobile/web) or agentId (web Agent User). */
export interface AuthLoginDto {
  email?: string;
  agentId?: string;
  password: string;
  deviceFingerprint?: string;
  deviceName?: string;
  /** android | ios = mobile (device bind). web = admin console (no bind). */
  platform?: DevicePlatform | 'web';
  appVersion?: string;
}

export interface BindDeviceDto {
  deviceFingerprint: string;
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
  address: string | null;
  township_id: string | null;
  business_name: string | null;
  tin: string | null;
  business_registration_no: string | null;
  dealer_verified: boolean;
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

export interface PublicUser {
  id: string;
  agentId: string;
  email: string;
  phone: string | null;
  fullName: string;
  address: string | null;
  townshipId: number | null;
  businessName: string | null;
  tin: string | null;
  businessRegistrationNo: string | null;
  dealerVerified: boolean;
}
