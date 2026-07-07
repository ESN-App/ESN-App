using EsnApp.Domain.Common;

namespace EsnApp.Domain.Discounts;

public class Discount : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public Guid PartnerId { get; set; }

    public Partner? Partner { get; set; }
}
