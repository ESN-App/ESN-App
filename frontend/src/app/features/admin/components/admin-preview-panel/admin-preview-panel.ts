import { Component, input, signal } from '@angular/core';

export type AdminPreviewDevice = 'desktop' | 'mobile';

@Component({
  selector: 'app-admin-preview-panel',
  templateUrl: './admin-preview-panel.html',
  styleUrl: './admin-preview-panel.scss',
})
export class AdminPreviewPanel {
  readonly heading = input.required<string>();
  readonly primaryTitle = input.required<string>();
  readonly secondaryTitle = input.required<string>();
  readonly previewDevice = signal<AdminPreviewDevice>('desktop');

  setPreviewDevice(device: AdminPreviewDevice): void {
    this.previewDevice.set(device);
  }
}
