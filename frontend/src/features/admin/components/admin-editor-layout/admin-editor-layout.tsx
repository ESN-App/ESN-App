import type { ReactNode } from 'react';
import { Host } from '../../../../shared/host';
import './admin-editor-layout.scss';

interface AdminEditorLayoutProps {
  previewVisible: boolean;
  form: ReactNode;
  preview: ReactNode;
}

/** Two-column editor: the form on the left, the live preview on the right. */
export function AdminEditorLayout({ previewVisible, form, preview }: AdminEditorLayoutProps) {
  return (
    <Host tag="app-admin-editor-layout" transparent>
      <div className={`editor-layout${previewVisible ? '' : ' editor-layout--preview-hidden'}`}>
        {form}
        <div className="preview-slot" inert={!previewVisible}>
          {preview}
        </div>
      </div>
    </Host>
  );
}
