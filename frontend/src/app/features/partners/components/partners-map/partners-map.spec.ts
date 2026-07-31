import { describe, expect, it } from 'vitest';
import { PartnerView } from '../../data-access/partners.models';
import { hasValidPartnerCoordinates } from './partners-map';

function partnerWithCoordinates(latitude: number | null, longitude: number | null): PartnerView {
  return { latitude, longitude } as PartnerView;
}

describe('hasValidPartnerCoordinates', () => {
  it('accepts a partner with coordinates inside valid ranges', () => {
    expect(hasValidPartnerCoordinates(partnerWithCoordinates(54.352, 18.6466))).toBe(true);
  });

  it('rejects missing or out-of-range coordinates', () => {
    expect(hasValidPartnerCoordinates(partnerWithCoordinates(null, 18.6466))).toBe(false);
    expect(hasValidPartnerCoordinates(partnerWithCoordinates(54.352, null))).toBe(false);
    expect(hasValidPartnerCoordinates(partnerWithCoordinates(91, 18.6466))).toBe(false);
    expect(hasValidPartnerCoordinates(partnerWithCoordinates(54.352, 181))).toBe(false);
  });
});
