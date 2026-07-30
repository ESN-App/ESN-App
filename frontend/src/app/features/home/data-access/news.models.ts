export enum NewsItemStatus {
  Draft = 0,
  Published = 1,
}

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
