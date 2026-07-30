using EsnApp.Domain.Common;

namespace EsnApp.Domain.Info;

public class InfoArticle : BaseEntity
{
    public required string Title { get; set; }

    public required string Slug { get; set; }

    public required string Content { get; set; }

    public required string Category { get; set; }

    public required Uri ImageUrl { get; set; }

    public List<string> ExternalLinks { get; set; } = [];

    public int DisplayOrder { get; set; }

    public InfoArticleStatus Status { get; set; } = InfoArticleStatus.Draft;
}
