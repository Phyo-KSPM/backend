export type ActivityType = 'tax_paid' | 'imei_checked' | 'device_claimed';

export interface Activity {
  id: number;
  userId: string;
  type: ActivityType;
  detail: string;
  occurredAt: string;
}
