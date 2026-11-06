export interface OrderedArticle {
  status: number;
  displayOrder: number;
  createdAt: string;
  title: string;
}

/**
 * Mirrors the backend admin order for News/Info (status, manual display order,
 * newest first, title) so local edits such as reorder or publish stay in place.
 */
export function compareArticleOrder(left: OrderedArticle, right: OrderedArticle): number {
  return (
    left.status - right.status ||
    left.displayOrder - right.displayOrder ||
    Date.parse(right.createdAt) - Date.parse(left.createdAt) ||
    left.title.localeCompare(right.title)
  );
}
