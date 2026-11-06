using EsnApp.Domain.Info;

namespace EsnApp.Application.Info;

/// <summary>Admin view of an info article: the public fields plus who created it.</summary>
public record AdminInfoArticleDto : InfoArticleDto
{
    public AdminInfoArticleDto(InfoArticleDto article, string? createdBy)
        : base(article) => CreatedBy = createdBy;

    /// <summary>Creator display name ("Jan K."); null for rows created before tracking.</summary>
    public string? CreatedBy { get; init; }

    public static new AdminInfoArticleDto FromEntity(InfoArticle entity) =>
        new(InfoArticleDto.FromEntity(entity), entity.CreatedByName);
}
