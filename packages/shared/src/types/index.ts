export interface AuthLoginDto {
  email: string;
  password: string;
  deviceFingerprint: string;
  deviceName?: string;
  platform?: 'android' | 'ios';
  appVersion?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  address: string;
  townshipId: number;
  businessName: string;
  tin: string;
  businessRegistrationNo: string;
  dealerVerified: boolean;
}
