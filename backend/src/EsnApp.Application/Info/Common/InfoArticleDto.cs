using EsnApp.Domain.Info;

namespace EsnApp.Application.Info;

public record InfoArticleDto(
    Guid Id,
    string Title,
    string Slug,
    string Content,
    string Category,
    string ImagePath,
    IReadOnlyList<string> ExternalLinks,
    int DisplayOrder,
    InfoArticleStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt)
{
    public static InfoArticleDto FromEntity(InfoArticle entity) => new(
        entity.Id,
        entity.Title,
        entity.Slug,
        entity.Content,
        entity.Category,
        entity.ImagePath,
        entity.ExternalLinks,
        entity.DisplayOrder,
        entity.Status,
        entity.CreatedAt,
        entity.UpdatedAt);
}
