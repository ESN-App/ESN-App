using EsnApp.Domain.Common;

namespace EsnApp.Domain.Discounts;

public class Partner : BaseEntity
{
    public required string Name { get; set; }

    public required string Description { get; set; }

    public required string ShortDescription { get; set; }

    public required string LogoPath { get; set; }

    public string? Address { get; set; }

    public Uri? WebsiteUrl { get; set; }

    public Uri? GoogleMapsUrl { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public PartnerStatus Status { get; set; } = PartnerStatus.Draft;

    public int DisplayOrder { get; set; }

    public ICollection<Discount> Discounts { get; set; } = [];
}
