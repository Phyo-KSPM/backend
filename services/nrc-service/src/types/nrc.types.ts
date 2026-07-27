export interface NrcRegion {
  id: number;
  code: string;
  name: string;
}

export interface NrcTownship {
  id: number;
  regionId: number;
  code: string;
  nameEn: string;
  nameMm: string;
}
