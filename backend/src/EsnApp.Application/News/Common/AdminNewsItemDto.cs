using EsnApp.Domain.News;

namespace EsnApp.Application.News.Common;

/// <summary>Admin view of a news item: the public fields plus who created and last edited it.</summary>
public record AdminNewsItemDto : NewsItemDto
{
    public AdminNewsItemDto(NewsItemDto item, string? createdBy, string? updatedBy)
        : base(item)
    {
        CreatedBy = createdBy;
        UpdatedBy = updatedBy;
    }

    /// <summary>Creator display name ("Jan K."); null for rows created before tracking.</summary>
    public string? CreatedBy { get; init; }

    /// <summary>Display name of the last admin who saved it (create, edit, status change; not reorder).</summary>
    public string? UpdatedBy { get; init; }

    public static new AdminNewsItemDto FromEntity(NewsItem entity) =>
        new(NewsItemDto.FromEntity(entity), entity.CreatedByName, entity.UpdatedByName);
}
