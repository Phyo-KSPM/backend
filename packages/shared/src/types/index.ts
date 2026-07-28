export interface AuthLoginDto {
  email: string;
  password: string;
  deviceId: string;
  deviceName?: string;
  platform?: 'android' | 'ios';
  appVersion?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  nrcNo: string | null;
  address: string | null;
}
