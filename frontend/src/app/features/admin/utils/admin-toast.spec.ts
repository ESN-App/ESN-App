import { countMessage } from './admin-toast';

describe('countMessage', () => {
  it('uses the capitalised singular for one item and the count for more', () => {
    expect(countMessage(1, 'news article', 'news articles', 'deleted')).toBe('News article deleted');
    expect(countMessage(3, 'event', 'events', 'deleted')).toBe('3 events deleted');
  });
});
