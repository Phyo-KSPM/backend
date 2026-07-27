export type RegistrationStatus = 'registered' | 'partial' | 'not_registered';
export type PmcStatus = 'correct' | 'incorrect';
export type TaxPaymentStatus = 'paid' | 'unpaid' | 'pending';
export type BlockingStatus = 'allowed' | 'blocked';

export interface Device {
  id: number;
  imei1: string;
  imei2: string | null;
  brand: string;
  productName: string;
  modelName: string;
  serialNumber: string;
  manufacturer: string;
  operatingSystem: string;
  deviceType: string;
  allocationDate: string | null;
  registrationStatus: RegistrationStatus;
  pmcStatus: PmcStatus;
  taxPaymentStatus: TaxPaymentStatus;
  blockingStatus: BlockingStatus;
}

export interface ImeiCheckLog {
  id: number;
  userId: string;
  imei1: string;
  imei2: string | null;
  resultRegistrationStatus: RegistrationStatus | null;
  resultBlockingStatus: BlockingStatus | null;
  checkedAt: string;
}

export interface ImeiCheckDto {
  imei1: string;
  imei2?: string | null;
}

export interface ImeiBulkCheckDto {
  imeis: ImeiCheckDto[];
}

export interface ImeiCheckResult {
  deviceId?: number;
  brand?: string;
  productName?: string;
  modelName?: string;
  serialNumber?: string;
  imei1: string;
  imei2?: string | null;
  registrationStatus?: RegistrationStatus;
  pmcStatus?: PmcStatus;
  taxPaymentStatus?: TaxPaymentStatus;
  blockingStatus?: BlockingStatus;
  found?: boolean;
}
