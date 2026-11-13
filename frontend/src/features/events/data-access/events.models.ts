export interface EventListItemDto {
  id: string;
  title: string;
  shortDescription: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  imagePath: string | null;
  currentParticipants: number | null;
  maximumParticipants: number | null;
  price: number;
  status: number;
}

export interface EventDetailsDto extends EventListItemDto {
  description: string;
  googleMapsUrl: string | null;
  registrationUrl: string | null;
  status: number;
  publishedAt: string | null;
  minimumParticipants: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
}

export interface EventsQuery {
  from: string;
  to: string;
  page?: number;
  pageSize?: number;
}
