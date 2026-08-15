import { Component, input } from '@angular/core';
import { InfoDetailsView, InfoDetailsViewModel } from '../../../info/components/info-details-view/info-details-view';
import { InfoListItem, InfoListItemView } from '../../../info/components/info-list-item/info-list-item';
import { AdminPreviewPanel } from '../admin-preview-panel/admin-preview-panel';

@Component({
  selector: 'app-admin-info-preview',
  imports: [AdminPreviewPanel, InfoDetailsView, InfoListItem],
  templateUrl: './admin-info-preview.html',
})
export class AdminInfoPreview {
  readonly listItem = input.required<InfoListItemView>();
  readonly details = input.required<InfoDetailsViewModel>();
}
