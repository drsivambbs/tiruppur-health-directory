export interface Zone {
  id: string;
  name: string;
}

export interface Ward {
  id: string;
  name: string;
  zoneId: string;
}

export interface Facility {
  id: string;
  type: 'UPHC' | 'HWC';
  name: string;
  wardId: string;
  parentUphcId?: string; // Only for HWC
  medicalOfficerName: string;
  phone: string;
  email: string;
  whatsapp: string;
  latitude: number;
  longitude: number;
  address?: string;
}
