export type PaymentBatchStatus = 'draft' | 'ready' | 'payment_pending' | 'paid' | 'failed';
export type PaymentMethod = 'mpu' | 'kbzpay' | 'wavepay';
export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface PaymentBatchItem {
  id: number;
  batchId: string;
  deviceId: number;
  imei1: string;
  imei2: string | null;
  brand: string;
  modelName: string;
  taxAmount: number;
}

export interface PaymentBatch {
  id: string;
  batchId: string;
  userId: string;
  taxApplicationId: string | null;
  status: PaymentBatchStatus;
  retryCount: number;
  lastPaymentError: string | null;
  expiresAt: string;
  createdAt: string;
  items: PaymentBatchItem[];
}

export interface Payment {
  id: number;
  paymentId: string;
  userId: string;
  deviceId: number | null;
  batchId: string | null;
  taxApplicationId: string | null;
  payerName: string;
  payerPhone: string;
  paymentMethod: PaymentMethod;
  gatewayRef: string | null;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  brand?: string;
  modelName?: string;
  imei1?: string;
  productName?: string;
  serialNumber?: string;
  imei2?: string | null;
}

export interface CreateBatchDto {
  items: Array<{ imei1: string; imei2?: string | null }>;
}

export interface PayBatchDto {
  paymentMethod: PaymentMethod;
}
