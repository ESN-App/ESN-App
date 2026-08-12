import { Component, input } from '@angular/core';
import { PartnerDetailsView, PartnerDetailsViewModel } from '../../../partners/components/partner-details-view/partner-details-view';
import { PartnerListItem } from '../../../partners/components/partner-list-item/partner-list-item';
import { AdminPreviewPanel } from '../admin-preview-panel/admin-preview-panel';

@Component({
  selector: 'app-admin-partner-preview',
  imports: [AdminPreviewPanel, PartnerDetailsView, PartnerListItem],
  templateUrl: './admin-partner-preview.html',
})
export class AdminPartnerPreview {
  readonly partner = input.required<PartnerDetailsViewModel>();
}
