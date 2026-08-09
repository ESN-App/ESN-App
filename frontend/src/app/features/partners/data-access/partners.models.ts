export enum PartnerStatus {
  Draft = 0,
  Active = 1,
  Inactive = 2,
}

export interface PartnerOffer {
  id: string;
  title: string;
  description: string;
  partnerId: string;
  partnerName: string | null;
  discountValue?: string | null;
  instructions?: string | null;
  terms?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  isFeatured?: boolean;
}

export interface PartnerDto {
  id: string;
  slug?: string;
  name: string;
  logoPath: string;
  shortDescription: string;
  description: string;
  category?: string | null;
  address: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  status: PartnerStatus;
  displayOrder: number;
  createdAt: string;
}

export interface PartnerView extends PartnerDto {
  offers: PartnerOffer[];
}
