import { activitiesClient, authClient, usersClient } from './clients';

/** Mobile-facing login payload via gateway `/openapi/v1/bff/login`. */
export function shapeMobileLogin(raw: {
  accessToken: string;
  tokenType?: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    phone: string | null;
    fullName: string;
    nrcNo: string | null;
    address: string | null;
  };
  deviceBinding: {
    deviceId: string;
    boundAt: string;
  } | null;
}) {
  return {
    success: true as const,
    accessToken: raw.accessToken,
    tokenType: raw.tokenType || 'Bearer',
    expiresIn: raw.expiresIn,
    deviceBinding: raw.deviceBinding,
    user: {
      id: raw.user.id,
      email: raw.user.email,
      phone: raw.user.phone,
      fullName: raw.user.fullName,
      nrcNo: raw.user.nrcNo,
      address: raw.user.address,
    },
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
    deviceId?: string;
    deviceFingerprint?: string;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
  }) {
    const deviceId = payload.deviceId || payload.deviceFingerprint;
    const res = await authClient.post('/login', {
      ...payload,
      deviceId,
      // Mobile path always binds device
      platform: payload.platform === 'ios' ? 'ios' : 'android',
    });
    return shapeMobileLogin(res.data);
  },
};
