import { compareArticleOrder, OrderedArticle } from './article-order';

const article = (title: string, overrides: Partial<OrderedArticle> = {}): OrderedArticle => ({
  title,
  status: 1,
  displayOrder: 0,
  createdAt: '2026-11-06T10:00:00Z',
  ...overrides,
});

describe('compareArticleOrder', () => {
  it('orders by status, then display order, then newest first incl. time, then title', () => {
    const items = [
      article('B same'),
      article('draft', { status: 0, displayOrder: 5 }),
      article('older', { createdAt: '2026-11-06T09:59:00Z' }),
      article('manual', { displayOrder: -1, createdAt: '2020-01-01T00:00:00Z' }),
      article('A same'),
      article('newer', { createdAt: '2026-11-06T10:01:00Z' }),
    ];

    expect([...items].sort(compareArticleOrder).map((item) => item.title)).toEqual([
      'draft',
      'manual',
      'newer',
      'A same',
      'B same',
      'older',
    ]);
  });
});
