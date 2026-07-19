using EsnApp.Domain.Info;

namespace EsnApp.Application.Info;

public record InfoArticleDto(
    Guid Id,
    string Title,
    string Content)
{
    public static InfoArticleDto FromEntity(InfoArticle entity) => new(
        entity.Id,
        entity.Title,
        entity.Content);
}
