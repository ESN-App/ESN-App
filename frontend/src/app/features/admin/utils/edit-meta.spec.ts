import { formatDate } from '@angular/common';
import { editMeta, lastChangedAt } from './edit-meta';

const created = '2026-11-06T20:34:00Z';
const updated = '2026-11-06T20:40:00Z';
const fmt = (iso: string) => formatDate(iso, 'd MMM y, HH:mm', 'en-US');

describe('editMeta', () => {
  it('shows creation only when never edited', () => {
    const meta = editMeta({ createdAt: created, createdBy: 'Jan K.', updatedAt: null, updatedBy: 'Jan K.' });
    expect(meta).toEqual({
      at: created,
      verb: 'Created',
      date: fmt(created),
      by: 'Jan K.',
      line: `Created ${fmt(created)} by Jan K.`,
      createdLine: null,
      label: `Created ${fmt(created)} by Jan K.`,
    });
  });

  it('shows the last edit and the creator when edited', () => {
    const meta = editMeta({ createdAt: created, createdBy: 'Maria K.', updatedAt: updated, updatedBy: 'Jan K.' });
    expect(meta.at).toBe(updated);
    expect(meta.line).toBe(`Edited ${fmt(updated)} by Jan K.`);
    expect(meta.createdLine).toBe('Created by Maria K.');
    expect(meta.label).toBe(`Edited ${fmt(updated)} by Jan K., created by Maria K.`);
  });

  it('falls back to the creator, then to a dash, when names are missing', () => {
    expect(editMeta({ createdAt: created, createdBy: 'Maria K.', updatedAt: updated, updatedBy: null }).line)
      .toBe(`Edited ${fmt(updated)} by Maria K.`);
    const meta = editMeta({ createdAt: created, createdBy: null, updatedAt: updated, updatedBy: null });
    expect(meta.line).toBe(`Edited ${fmt(updated)} by —`);
    expect(meta.createdLine).toBe('Created by —');
    expect(meta.label).toBe(`Edited ${fmt(updated)} by unknown, created by unknown`);
  });

  it('sorts by the edit time, falling back to creation', () => {
    expect(lastChangedAt({ createdAt: created, createdBy: null, updatedAt: null, updatedBy: null })).toBe(Date.parse(created));
    expect(lastChangedAt({ createdAt: created, createdBy: null, updatedAt: updated, updatedBy: null })).toBe(Date.parse(updated));
  });
});
