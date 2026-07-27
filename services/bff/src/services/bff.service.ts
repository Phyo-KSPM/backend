import { activitiesClient, authClient, usersClient } from './clients';

export const BffService = {
  async getDashboard() {
    const [profile, activities] = await Promise.all([
      usersClient.get('/profile').then((r) => r.data).catch(() => null),
      activitiesClient.get('/activities?limit=5').then((r) => r.data).catch(() => ({ items: [] })),
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
