import { activitiesClient, authClient, usersClient } from './clients';

export const BffService = {
  async getDashboard(authorization: string) {
    const headers = { Authorization: authorization };
    const [profile, activities] = await Promise.all([
      usersClient.get('/profile', { headers }).then((r) => r.data),
      activitiesClient.get('/activities?limit=5', { headers }).then((r) => r.data),
    ]);
    return {
      profile,
      recentActivities: activities?.items ?? [],
    };
  },

  async login(payload: {
    email: string;
    password: string;
    deviceFingerprint: string;
    deviceName?: string;
    platform?: string;
    appVersion?: string;
  }) {
    const res = await authClient.post('/login', payload);
    return res.data;
  },
};
