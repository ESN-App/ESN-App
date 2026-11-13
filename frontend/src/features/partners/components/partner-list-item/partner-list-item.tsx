import { useState, type Ref } from 'react';
import { Link } from 'react-router';
import { PartnerStatusTitle } from '../../../../shared/components';
import { initials } from '../../../../shared/format';
import { Host } from '../../../../shared/host';
import { createPartnerSlug } from '../../utils/partner-url';
import './partner-list-item.scss';

export interface PartnerListItemView {
  id: string;
  slug?: string | null;
  name: string;
  logoPath: string | null;
  shortDescription: string;
  status: number;
  offersCount: number;
}

interface PartnerListItemProps {
  partner: PartnerListItemView;
  interactive?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelectPartner?: (partnerId: string) => void;
  id?: string;
  'data-partner-id'?: string;
  ref?: Ref<HTMLElement>;
}

export function PartnerListItem({
  partner: item,
  interactive = true,
  selectable = false,
  selected = false,
  onSelectPartner,
  ...hostAttributes
}: PartnerListItemProps) {
  const [logoBroken, setLogoBroken] = useState(false);
  const partnerLink = `/partners/${item.slug || createPartnerSlug(item.name)}`;
  const cardClasses = ['partner-card'];
  if (selected) cardClasses.push('partner-card--selected');
  if (item.status === 0) cardClasses.push('partner-card--draft');

  return (
    <Host tag="app-partner-list-item" {...hostAttributes}>
      <article className={cardClasses.join(' ')}>
        {selectable && (
          <button
            className="partner-select-button"
            type="button"
            aria-label={`Select ${item.name} on the map`}
            aria-pressed={selected}
            onClick={() => onSelectPartner?.(item.id)}
          ></button>
        )}

        {interactive && (
          <Link className="mobile-card-link" to={partnerLink} aria-label={`Open details for ${item.name}`}></Link>
        )}

        <div className="partner-logo">
          <span aria-hidden="true">{initials(item.name)}</span>
          {item.logoPath && !logoBroken && (
            <img src={item.logoPath} alt={`${item.name} logo`} loading="lazy" onError={() => setLogoBroken(true)} />
          )}
        </div>

        <div className="partner-identity">
          <div className="partner-title-row">
            <PartnerStatusTitle status={item.status}>
              <h2>{item.name}</h2>
            </PartnerStatusTitle>
            {selected && <span className="selection-status">Selected</span>}
          </div>
          <p className="partner-description">{item.shortDescription}</p>
        </div>

        <div className="partner-meta">
          <span className="discount-count">
            <span className="discount-icon" aria-hidden="true"></span>
            {item.offersCount} {item.offersCount === 1 ? 'discount' : 'discounts'}
          </span>
          {interactive ? (
            <Link className="details-link" to={partnerLink} aria-label={`Open details for ${item.name}`}>
              <span className="details-label">Read more</span>
              <span className="arrow-icon" aria-hidden="true"></span>
            </Link>
          ) : (
            <span className="details-link" aria-hidden="true">
              <span className="details-label">Read more</span>
              <span className="arrow-icon"></span>
            </span>
          )}
        </div>
      </article>
    </Host>
  );
}
