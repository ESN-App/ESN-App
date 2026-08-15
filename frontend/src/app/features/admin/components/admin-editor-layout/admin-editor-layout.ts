import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-editor-layout',
  templateUrl: './admin-editor-layout.html',
  styleUrl: './admin-editor-layout.scss',
})
export class AdminEditorLayout {
  readonly previewVisible = input.required<boolean>();
}
