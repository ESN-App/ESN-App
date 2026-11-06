using EsnApp.Domain.News;

namespace EsnApp.Application.News.Common;

/// <summary>Admin view of a news item: the public fields plus who created it.</summary>
public record AdminNewsItemDto : NewsItemDto
{
    public AdminNewsItemDto(NewsItemDto item, string? createdBy)
        : base(item) => CreatedBy = createdBy;

    /// <summary>Creator display name ("Jan K."); null for rows created before tracking.</summary>
    public string? CreatedBy { get; init; }

    public static new AdminNewsItemDto FromEntity(NewsItem entity) =>
        new(NewsItemDto.FromEntity(entity), entity.CreatedByName);
}
