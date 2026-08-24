import { Component, input } from '@angular/core';
import { NewsDetailsView, NewsDetailsViewModel } from '../../../home/components/news-details-view/news-details-view';
import { NewsListItem, NewsListItemView } from '../../../home/components/news-list-item/news-list-item';
import { AdminPreviewPanel } from '../admin-preview-panel/admin-preview-panel';

@Component({
  selector: 'app-admin-news-preview',
  imports: [AdminPreviewPanel, NewsDetailsView, NewsListItem],
  templateUrl: './admin-news-preview.html',
})
export class AdminNewsPreview {
  readonly listItem = input.required<NewsListItemView>();
  readonly details = input.required<NewsDetailsViewModel>();
}
