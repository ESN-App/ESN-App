import type { ReactNode } from 'react';
import { Host } from './host';
import './components.scss';

export function MatIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Host tag="mat-icon" transparent className={`material-icons ${className ?? ''}`.trim()} aria-hidden="true">
      {children}
    </Host>
  );
}

export function MatSpinner({ diameter = 48, label }: { diameter?: number; label?: string }) {
  return (
    <Host
      tag="mat-spinner"
      transparent
      role="progressbar"
      aria-label={label}
      style={{ width: diameter, height: diameter }}
    >
      <svg viewBox="0 0 100 100" focusable="false" aria-hidden="true">
        <circle cx="50" cy="50" r="45" strokeWidth="10" />
      </svg>
    </Host>
  );
}

export function LoadingSpinner() {
  return (
    <Host tag="app-loading-spinner">
      <div className="loading-spinner">
        <MatSpinner diameter={48} />
      </div>
    </Host>
  );
}

export function EmptyState({ message = 'Nothing here yet.' }: { message?: string }) {
  return (
    <Host tag="app-empty-state">
      <div className="empty-state">
        <MatIcon>inbox</MatIcon>
        <p>{message}</p>
      </div>
    </Host>
  );
}

export function CancelledBadge() {
  return (
    <Host tag="app-cancelled-badge">
      <span>Cancelled</span>
    </Host>
  );
}

export function DraftBadge() {
  return (
    <Host tag="app-draft-badge">
      <span>Draft</span>
    </Host>
  );
}

export function InactiveBadge() {
  return (
    <Host tag="app-inactive-badge">
      <span>Inactive</span>
    </Host>
  );
}

export function PublishedBadge() {
  return (
    <Host tag="app-published-badge">
      <span>Published</span>
    </Host>
  );
}

/**
 * Shown at the top of a details page when the item is still a draft. Details pages use
 * this instead of the grey card treatment that list items get: on a full page a grey
 * background reads as a broken layout rather than as a status, so the state is stated
 * in words instead.
 */
export function DraftPreviewBanner() {
  return (
    <Host tag="app-draft-preview-banner">
      <p className="draft-preview-banner" role="status">
        <span className="draft-preview-banner__badge">Draft</span>
        <span className="draft-preview-banner__text">
          Only administrators can see this page. It is not visible to visitors yet.
        </span>
      </p>
    </Host>
  );
}

export function EventStatusTitle({ status, children }: { status: number; children: ReactNode }) {
  return (
    <Host tag="app-event-status-title" transparent>
      <div className="title-row">
        {children}
        {status === 0 ? <DraftBadge /> : status === 2 ? <CancelledBadge /> : null}
      </div>
    </Host>
  );
}

export function PartnerStatusTitle({ status, children }: { status: number; children: ReactNode }) {
  return (
    <Host tag="app-partner-status-title" transparent>
      <div className="title-row">
        {children}
        {status === 0 ? <DraftBadge /> : status === 2 ? <InactiveBadge /> : null}
      </div>
    </Host>
  );
}
