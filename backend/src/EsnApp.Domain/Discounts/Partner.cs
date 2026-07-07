using EsnApp.Domain.Common;

namespace EsnApp.Domain.Discounts;

public class Partner : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? WebsiteUrl { get; set; }
}
