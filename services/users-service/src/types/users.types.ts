export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  address: string;
  townshipId: number;
  businessName: string;
  tin: string;
  businessRegistrationNo: string;
  dealerVerified: boolean;
}

export interface DealerVerifyDto {
  businessRegistrationNo: string;
  tin: string;
}
