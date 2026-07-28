import { activitiesClient, authClient, usersClient } from './clients';

/** Mobile-facing login payload via gateway `/openapi/v1/bff/login`. */
export function shapeMobileLogin(raw: {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn: number;
  user: {
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
  };
  deviceBinding: {
    bound: boolean;
    deviceFingerprint: string;
    deviceName: string | null;
    platform: string;
    boundAt: string;
  } | null;
}) {
  return {
    success: true as const,
    accessToken: raw.accessToken,
    refreshToken: raw.refreshToken,
    tokenType: raw.tokenType || 'Bearer',
    expiresIn: raw.expiresIn,
    user: {
      id: raw.user.id,
      agentId: raw.user.agentId,
      email: raw.user.email,
      fullName: raw.user.fullName,
      phone: raw.user.phone,
      address: raw.user.address,
      townshipId: raw.user.townshipId,
      businessName: raw.user.businessName,
      tin: raw.user.tin,
      businessRegistrationNo: raw.user.businessRegistrationNo,
      dealerVerified: raw.user.dealerVerified,
    },
    device: raw.deviceBinding
      ? {
          bound: raw.deviceBinding.bound,
          fingerprint: raw.deviceBinding.deviceFingerprint,
          name: raw.deviceBinding.deviceName,
          platform: raw.deviceBinding.platform,
          boundAt: raw.deviceBinding.boundAt,
        }
      : null,
  };
}

export const BffService = {
  async getDashboard(authorization: string) {
    const headers = { Authorization: authorization };
    const [profile, activities] = await Promise.all([
      usersClient.get('/profile', { headers }).then((r) => r.data),
      activitiesClient.get('/activities?limit=5', { headers }).then((r) => r.data),
    ]);
    return {
      success: true as const,
      profile,
      recentActivities: activities?.items ?? [],
    };
  },

  async login(payload: {
    email?: string;
    agentId?: string;
    password: string;
    deviceFingerprint: string;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
  }) {
    const res = await authClient.post('/login', {
      ...payload,
      // Mobile path always binds device
      platform: payload.platform === 'ios' ? 'ios' : 'android',
    });
    return shapeMobileLogin(res.data);
  },
};
