export type ClaimStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';
export type ClaimDocType = 'nrc_front' | 'nrc_back' | 'device_photo';

export interface ClaimDocument {
  id: number;
  claimId: string;
  docType: ClaimDocType;
  fileUrl: string;
  uploadedAt: string;
}

export interface DeviceClaim {
  id: string;
  claimId: string;
  userId: string;
  claimantFullName: string;
  claimantNrcNumber: string;
  claimantPhone: string;
  address: string;
  townshipId: number;
  deviceId: number | null;
  imei1: string;
  imei2: string | null;
  brand: string;
  modelName: string;
  status: ClaimStatus;
  submittedAt: string;
  documents: ClaimDocument[];
}

export interface CreateClaimDto {
  fullName: string;
  nrcNumber: string;
  phone: string;
  address: string;
  townshipId: number;
  imei1: string;
  imei2?: string | null;
  nrcFrontUrl?: string;
  nrcBackUrl?: string;
  devicePhotoUrl?: string;
}
