using EsnApp.Domain.News;

namespace EsnApp.Application.News.Common;

public record NewsItemDto(
    Guid Id,
    string Title,
    string Description,
    string ImagePath,
    int DisplayOrder,
    NewsItemStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt)
{
    public static NewsItemDto FromEntity(NewsItem entity) => new(
        entity.Id,
        entity.Title,
        entity.Description,
        entity.ImagePath,
        entity.DisplayOrder,
        entity.Status,
        entity.CreatedAt,
        entity.UpdatedAt);
}
