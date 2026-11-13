import type { PartnerView } from '../../data-access/partners.models';

export function hasValidPartnerCoordinates(
  partner: Pick<PartnerView, 'latitude' | 'longitude'>,
): partner is PartnerView & { latitude: number; longitude: number } {
  return (
    partner.latitude !== null &&
    partner.longitude !== null &&
    Number.isFinite(partner.latitude) &&
    Number.isFinite(partner.longitude) &&
    partner.latitude >= -90 &&
    partner.latitude <= 90 &&
    partner.longitude >= -180 &&
    partner.longitude <= 180
  );
}
