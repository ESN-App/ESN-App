using EsnApp.Domain.Discounts;

namespace EsnApp.Application.Discounts.Common;

public static class PartnerMappings
{
    public static PartnerDto ToDto(this Partner entity) => new(
        entity.Id,
        entity.Name,
        entity.LogoPath,
        entity.ShortDescription,
        entity.Description,
        entity.Address,
        entity.WebsiteUrl?.ToString(),
        entity.GoogleMapsUrl?.ToString(),
        entity.Latitude,
        entity.Longitude,
        entity.Status,
        entity.DisplayOrder,
        entity.CreatedAt);
}
