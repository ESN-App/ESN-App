using EsnApp.Domain.Info;

namespace EsnApp.Application.Info;

/// <summary>Admin view of an info article: the public fields plus who created and last edited it.</summary>
public record AdminInfoArticleDto : InfoArticleDto
{
    public AdminInfoArticleDto(InfoArticleDto article, string? createdBy, string? updatedBy)
        : base(article)
    {
        CreatedBy = createdBy;
        UpdatedBy = updatedBy;
    }

    /// <summary>Creator display name ("Jan K."); null for rows created before tracking.</summary>
    public string? CreatedBy { get; init; }

    /// <summary>Display name of the last admin who saved it (create, edit, status change; not reorder).</summary>
    public string? UpdatedBy { get; init; }

    public static new AdminInfoArticleDto FromEntity(InfoArticle entity) =>
        new(InfoArticleDto.FromEntity(entity), entity.CreatedByName, entity.UpdatedByName);
}
