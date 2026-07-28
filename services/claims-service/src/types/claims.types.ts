export type ClaimStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';
export type ClaimDocType = 'device_photo';

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
  townshipId: number | null;
  deviceId: number | null;
  imei1: string;
  imei2: string | null;
  brand: string;
  modelName: string;
  status: ClaimStatus;
  submittedAt: string;
  documents: ClaimDocument[];
}

/** UI-minimal claim payload; profile fields are enriched server-side. */
export interface CreateClaimDto {
  imei1: string;
  imei2?: string | null;
  reason?: string | null;
  devicePhotoUrl?: string;
  /** Multipart field alias accepted from controllers. */
  devicePhoto?: string;
}
