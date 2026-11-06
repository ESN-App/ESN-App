using EsnApp.Domain.Common;

namespace EsnApp.Domain.News;

public class NewsItem : CreatorTrackedEntity
{
    public required string Title { get; set; }

    public required string Description { get; set; }

    public string? ImagePath { get; set; }

    public int DisplayOrder { get; set; }

    public NewsItemStatus Status { get; set; } = NewsItemStatus.Draft;
}
