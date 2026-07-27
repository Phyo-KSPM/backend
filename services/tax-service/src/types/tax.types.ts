export type TaxApplicationStatus = 'draft' | 'calculated' | 'paid' | 'expired';

export interface TaxApplicationItem {
  id: number;
  taxApplicationId: string;
  deviceId: number;
  brand: string;
  productName: string;
  modelName: string;
  imei1: string;
  imei2: string | null;
  customValue: number;
  customsDuty: number;
  commercialTax: number;
  redemptionFine: number;
  totalTax: number;
}

export interface TaxApplication {
  id: string;
  userId: string;
  status: TaxApplicationStatus;
  totalTax: number;
  createdAt: string;
  expiresAt: string;
  items: TaxApplicationItem[];
}

export interface CreateTaxApplicationDto {
  devices: Array<{ imei1: string; imei2?: string | null }>;
}
