using EsnApp.Domain.Common;

namespace EsnApp.Domain.Info;

public class InfoArticle : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;
}
