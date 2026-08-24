import { Component, input } from '@angular/core';
import { EventDetailsView, EventDetailsViewModel } from '../../../events/components/event-details-view/event-details-view';
import { EventListItem } from '../../../events/components/event-list-item/event-list-item';
import { AdminPreviewPanel } from '../admin-preview-panel/admin-preview-panel';

@Component({
  selector: 'app-admin-event-preview',
  imports: [AdminPreviewPanel, EventDetailsView, EventListItem],
  templateUrl: './admin-event-preview.html',
})
export class AdminEventPreview {
  readonly event = input.required<EventDetailsViewModel>();
}
