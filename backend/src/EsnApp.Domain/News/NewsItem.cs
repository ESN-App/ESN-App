using EsnApp.Domain.Common;

namespace EsnApp.Domain.News;

public class NewsItem : BaseEntity
{
    public required string Title { get; set; }

    public required string Description { get; set; }

    public required string ImagePath { get; set; }

    public int DisplayOrder { get; set; }

    public NewsItemStatus Status { get; set; } = NewsItemStatus.Draft;
}
