import { authStore } from '../../../core/auth-store';
import { http } from '../../../core/http';
import { createPartnerSlug } from '../utils/partner-url';
import type { PartnerDto, PartnerOffer, PartnerView } from './partners.models';

function withOffers(partner: PartnerDto, offers: PartnerOffer[]): PartnerView {
  return {
    ...partner,
    offers: offers
      .filter((offer) => offer.partnerId === partner.id)
      .sort((left, right) => Number(right.isFeatured ?? false) - Number(left.isFeatured ?? false)),
  };
}

export const partnersApi = {
  async getAll(): Promise<PartnerView[]> {
    const isAdmin = authStore.isAdmin;
    const [partners, offers] = await Promise.all([
      http.get<PartnerDto[]>(isAdmin ? '/api/admin/partners' : '/api/partners'),
      http.get<PartnerOffer[]>(isAdmin ? '/api/admin/discounts' : '/api/discounts'),
    ]);

    return partners
      .map((partner) => withOffers(partner, offers))
      .sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name));
  },

  async getBySlug(slug: string): Promise<PartnerView | null> {
    const partners = await partnersApi.getAll();
    return partners.find((partner) => (partner.slug || createPartnerSlug(partner.name)) === slug) ?? null;
  },
};
