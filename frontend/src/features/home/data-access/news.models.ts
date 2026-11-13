export const NewsItemStatus = {
  Draft: 0,
  Published: 1,
} as const;

export type NewsItemStatus = (typeof NewsItemStatus)[keyof typeof NewsItemStatus];

export interface NewsItemDto {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  displayOrder: number;
  status: NewsItemStatus;
  createdAt: string;
  updatedAt: string | null;
}
